'use strict';

const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'server.js');
const runtimePath = path.join(__dirname, 'server.runtime.js');
let code = fs.readFileSync(sourcePath, 'utf8');

function replaceText(oldText, newText, label) {
  if (!code.includes(oldText)) {
    throw new Error(`Patch não aplicado (${label}): trecho original não encontrado.`);
  }
  code = code.replace(oldText, newText);
  console.log(`✓ ${label}`);
}

function replaceRegex(regex, newText, label) {
  if (!regex.test(code)) {
    throw new Error(`Patch não aplicado (${label}): padrão original não encontrado.`);
  }
  code = code.replace(regex, newText);
  console.log(`✓ ${label}`);
}

// 1) Limite configurável de jogadores por sala.
replaceText(
  "const REVEAL_MS = 4_000;",
  "const REVEAL_MS = 4_000;\nconst MAX_PLAYERS = Math.max(2, Number(process.env.MAX_PLAYERS || 50));",
  'limite configurável de jogadores'
);

// 2) Estado da sala passa a informar anfitrião e limite.
replaceRegex(
  /function roomSummary\(room, forPlayerId=null\) \{[\s\S]*?\n\}/,
`function roomSummary(room, forPlayerId=null) {
  return {
    code: room.code,
    category: room.category,
    status: room.status,
    hostId: room.hostId,
    maxPlayers: MAX_PLAYERS,
    questionIndex: room.questionIndex,
    total: room.questions.length,
    players: room.players.map(publicPlayer),
    you: forPlayerId
  };
}`,
  'resumo multiplayer da sala'
);

// 3) Criador vira anfitrião.
replaceText(
  "    status: 'waiting',\n    players: [player],",
  "    status: 'waiting',\n    hostId: player.id,\n    players: [player],",
  'anfitrião da sala'
);

// 4) Sala deixa de ser limitada a duas pessoas.
replaceText(
  "  if (room.players.length >= 2) throw new Error('ROOM_FULL');",
  "  if (room.players.length >= MAX_PLAYERS) throw new Error('ROOM_FULL');",
  'limite multiplayer na entrada'
);

// 5) Helpers multiplayer antes de resetMatch.
replaceText(
  "function resetMatch(room) {",
`function broadcastRoomState(room) {
  broadcast(room, 'room-updated', {room: roomSummary(room)});
}
function startByHost(room, player) {
  if (player.id !== room.hostId) return {ok:false,error:'NOT_HOST'};
  if (room.players.length < 2) return {ok:false,error:'NEED_PLAYERS'};
  if (room.status !== 'waiting' && room.status !== 'finished') {
    return {ok:false,error:'ALREADY_STARTED'};
  }
  startCountdown(room);
  return {ok:true};
}
function leaveRoom(room, player) {
  const index = room.players.findIndex(p=>p.id===player.id);
  if (index < 0) return {ok:false,error:'PLAYER_NOT_FOUND'};
  const wasHost = room.hostId === player.id;

  room.players.splice(index, 1);
  try { if (player.sse) player.sse.end(); } catch (_) {}
  player.sse = null;
  player.connected = false;

  if (room.players.length === 0) {
    clearTimeout(room.questionTimer);
    clearTimeout(room.revealTimer);
    rooms.delete(room.code);
    return {ok:true};
  }

  if (wasHost) room.hostId = room.players[0].id;

  if (room.status === 'countdown' && room.players.length < 2) {
    room.status = 'waiting';
  }

  touch(room);
  broadcastRoomState(room);

  if (room.status === 'playing' && room.players.every(p=>p.answer)) {
    clearTimeout(room.questionTimer);
    room.questionTimer = setTimeout(()=>endQuestion(room, 'all-answered'), 250);
  }
  return {ok:true};
}
function resetMatch(room) {`,
  'funções de anfitrião e saída'
);

// 6) Contagem regressiva aceita 2 ou mais jogadores.
replaceText(
  "  if (room.players.length !== 2) return;",
  "  if (room.players.length < 2) return;",
  'início com múltiplos jogadores'
);

// 7) Quando alguém responde, todos recebem a contagem.
replaceText(
`  const other = opponent(room, player);
  sendPlayer(player, 'answer-accepted', {
    index: room.questionIndex,
    answered: true,
    heartUsed,
    score: player.score
  });
  if (other) sendPlayer(other, 'opponent-answered', {
    index: room.questionIndex,
    opponentId: player.id
  });

  if (room.players.every(p=>p.answer)) {
    clearTimeout(room.questionTimer);
    room.questionTimer = setTimeout(()=>endQuestion(room, 'both-answered'), 550);
  }`,
`  sendPlayer(player, 'answer-accepted', {
    index: room.questionIndex,
    answered: true,
    heartUsed,
    score: player.score
  });

  const answeredCount = room.players.filter(p=>p.answer).length;
  broadcast(room, 'player-answered', {
    index: room.questionIndex,
    playerId: player.id,
    answeredCount,
    totalPlayers: room.players.length
  });

  if (room.players.every(p=>p.answer)) {
    clearTimeout(room.questionTimer);
    room.questionTimer = setTimeout(()=>endQuestion(room, 'all-answered'), 550);
  }`,
  'respostas de todos os jogadores'
);

// 8) Resultado vira ranking completo.
replaceRegex(
  /function finishMatch\(room\) \{[\s\S]*?function requestRematch\(room, player\) \{[\s\S]*?\n\}/,
`function finishMatch(room) {
  clearTimeout(room.questionTimer);
  clearTimeout(room.revealTimer);
  room.status = 'finished';
  touch(room);

  const ranking = [...room.players].sort((a,b)=>
    b.score - a.score || a.name.localeCompare(b.name, 'pt-BR')
  );
  const topScore = ranking.length ? ranking[0].score : 0;
  const winnerIds = ranking.filter(p=>p.score===topScore).map(p=>p.id);
  const winnerId = winnerIds.length === 1 ? winnerIds[0] : null;

  broadcast(room, 'match-finished', {
    winnerId,
    winnerIds,
    tie: winnerIds.length > 1,
    players: ranking.map(publicPlayer),
    room: roomSummary(room)
  });
}
function requestRematch(room, player) {
  if (room.status !== 'finished') return {ok:false,error:'NOT_FINISHED'};
  player.rematch = true;
  touch(room);
  broadcast(room, 'rematch-state', {players:room.players.map(publicPlayer)});
  return {ok:true};
}`,
  'ranking final multiplayer'
);

// 9) O servidor passa a usar o app.js externo (mantém fallback para o antigo).
replaceText(
`  if (urlObj.pathname === '/app.js') {
    return sendText(res,200,'application/javascript; charset=utf-8',APP_JS,'public, max-age=3600');
  }`,
`  if (urlObj.pathname === '/app.js') {
    try {
      const appJs = require('fs').readFileSync(require('path').join(__dirname, 'app.js'), 'utf8');
      return sendText(res,200,'application/javascript; charset=utf-8',appJs,'no-store');
    } catch (e) {
      console.error('Falha ao carregar app.js externo:', e);
      return sendText(res,200,'application/javascript; charset=utf-8',APP_JS,'no-store');
    }
  }`,
  'interface multiplayer externa'
);

// 10) Entrada não inicia automaticamente e respeita MAX_PLAYERS.
replaceText(
`      if(room.status!=='waiting' || room.players.length>=2) {
        return json(res,409,{ok:false,error:'ROOM_UNAVAILABLE'});
      }
      const player=addPlayer(room,body.name);
      json(res,200,{
        ok:true, code, playerId:player.id, token:player.token,
        room:roomSummary(room,player.id)
      });
      // Let response reach client before countdown event.
      setTimeout(()=>startCountdown(room),400);
      return;`,
`      if(room.status!=='waiting' || room.players.length>=MAX_PLAYERS) {
        return json(res,409,{ok:false,error:'ROOM_UNAVAILABLE'});
      }
      const player=addPlayer(room,body.name);
      json(res,200,{
        ok:true, code, playerId:player.id, token:player.token,
        room:roomSummary(room,player.id)
      });
      setTimeout(()=>broadcastRoomState(room),50);
      return;`,
  'entrada de vários jogadores sem início automático'
);

// 11) Novas ações: iniciar e sair.
replaceText(
`      if(body.action==='answer') result=registerAnswer(room,player,Number(body.choice));
      else if(body.action==='rematch') result=requestRematch(room,player);
      else return json(res,400,{ok:false,error:'BAD_ACTION'});`,
`      if(body.action==='answer') result=registerAnswer(room,player,Number(body.choice));
      else if(body.action==='start') result=startByHost(room,player);
      else if(body.action==='leave') result=leaveRoom(room,player);
      else if(body.action==='rematch') result=requestRematch(room,player);
      else return json(res,400,{ok:false,error:'BAD_ACTION'});`,
  'ações de anfitrião e saída'
);

// 12) Conexão/desconexão atualiza a lista para todos.
replaceText(
`      const other=opponent(room,player);
      if(other) sendPlayer(other,'opponent-connection',{connected:true,opponent:publicPlayer(player)});`,
`      broadcastRoomState(room);`,
  'entrada online atualizada para todos'
);

replaceText(
`        const op=opponent(room,player);
        if(op) sendPlayer(op,'opponent-connection',{connected:false,opponent:publicPlayer(player)});`,
`        broadcastRoomState(room);`,
  'desconexão atualizada para todos'
);

fs.writeFileSync(runtimePath, code, 'utf8');
console.log('✓ Multiplayer preparado. Iniciando servidor...');
require(runtimePath);
