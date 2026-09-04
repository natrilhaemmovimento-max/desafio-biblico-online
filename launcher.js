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

// 1) Regras da partida e limite configurável de jogadores por sala.
replaceText(
  "const QUESTION_MS = 20_000;",
  "const QUESTION_MS = Math.max(100, Number(process.env.QUESTION_MS || 15_000));",
  'quinze segundos por pergunta'
);

replaceText(
  "const REVEAL_MS = 4_000;",
  "const REVEAL_MS = Math.max(50, Number(process.env.REVEAL_MS || 4_000));\nconst COUNTDOWN_MS = Math.max(50, Number(process.env.COUNTDOWN_MS || 3_000));\nconst ANSWER_REVEAL_DELAY_MS = Math.max(10, Number(process.env.ANSWER_REVEAL_DELAY_MS || 550));\nconst QUESTIONS_PER_MATCH = Math.max(1, Math.min(30, Number(process.env.QUESTIONS_PER_MATCH || 15)));\nconst MAX_PLAYERS = Math.max(2, Number(process.env.MAX_PLAYERS || 50));",
  'quinze perguntas e limite de jogadores'
);

// 1b) Seleção por nível, priorizando a categoria escolhida.
replaceText(
`function selectQuestions(category) {
  const cat = cleanCategory(category);
  function pool(d) {
    const filtered = QUESTIONS.filter(q => q.d === d && (cat === 'Todas' || q.cat === cat));
    return filtered.length >= 4 ? filtered : QUESTIONS.filter(q => q.d === d);
  }
  const raw = [
    ...shuffle(pool(1)).slice(0,3),
    ...shuffle(pool(2)).slice(0,3),
    ...shuffle(pool(3)).slice(0,4)
  ];
  const positions = balancedPositions(raw.length);
  return raw.map((q,i)=>prepareQuestion(q,positions[i]));
}`,
`function cleanDifficulty(v) {
  const n = Number(v);
  return n === 1 || n === 2 || n === 3 ? n : 1;
}
function selectQuestions(category, difficulty, excludedKeys=new Set()) {
  const cat = cleanCategory(category);
  const level = cleanDifficulty(difficulty);
  const available = QUESTIONS.filter(q => q.d === level && !excludedKeys.has(q.q));
  const preferred = cat === 'Todas' ? available : available.filter(q => q.cat === cat);
  const fallback = cat === 'Todas' ? [] : available.filter(q => q.cat !== cat);
  const raw = [...shuffle(preferred), ...shuffle(fallback)].slice(0, QUESTIONS_PER_MATCH);
  const positions = balancedPositions(raw.length);
  return raw.map((q,i)=>prepareQuestion(q,positions[i]));
}`,
  'escolha de nível'
);

// 2) Estado da sala passa a informar anfitrião e limite.
replaceRegex(
  /function roomSummary\(room, forPlayerId=null\) \{[\s\S]*?\n\}/,
`function roomSummary(room, forPlayerId=null) {
  return {
    code: room.code,
    category: room.category,
    difficulty: room.difficulty,
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
  "function createRoom(name, category) {",
  "function createRoom(name, category, difficulty) {",
  'nível definido pelo criador'
);

replaceText(
  "    code, category: cleanCategory(category),",
  "    code, category: cleanCategory(category), difficulty: cleanDifficulty(difficulty),",
  'nível salvo na sala'
);

replaceText(
  "    status: 'waiting',\n    players: [player],",
  "    status: 'waiting',\n    hostId: player.id,\n    players: [player],\n    usedQuestionKeys: new Set(),\n    lastQuestionKeys: [],\n    countdownStartsAt: 0,\n    lastReveal: null,\n    lastResult: null,",
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

// 5a) Cada revanche recebe perguntas diferentes da rodada anterior.
replaceText(
  "  room.questions = selectQuestions(room.category);",
`  let nextQuestions = selectQuestions(room.category, room.difficulty, room.usedQuestionKeys);
  if (nextQuestions.length < QUESTIONS_PER_MATCH) {
    room.usedQuestionKeys = new Set(room.lastQuestionKeys);
    nextQuestions = selectQuestions(room.category, room.difficulty, room.usedQuestionKeys);
  }
  room.questions = nextQuestions;
  room.lastQuestionKeys = nextQuestions.map(q=>q.q);
  for (const q of nextQuestions) room.usedQuestionKeys.add(q.q);`,
  'perguntas novas na revanche'
);

// 5b) Limpa estados usados para reconexão ao iniciar outra partida.
replaceText(
`  room.questionIndex = -1;
  room.matchNumber++;`,
`  room.questionIndex = -1;
  room.countdownStartsAt = 0;
  room.lastReveal = null;
  room.lastResult = null;
  room.matchNumber++;`,
  'limpeza do estado de reconexão'
);

// 6) Contagem regressiva aceita 2 ou mais jogadores.
replaceText(
  "  if (room.players.length !== 2) return;",
  "  if (room.players.length < 2) return;",
  'início com múltiplos jogadores'
);

replaceText(
`  const startsAt = now() + 3000;
  broadcast(room, 'match-starting', {`,
`  const startsAt = now() + COUNTDOWN_MS;
  room.countdownStartsAt = startsAt;
  broadcast(room, 'match-starting', {`,
  'contagem regressiva recuperável'
);

replaceText(
`  }, 3000);
}

function questionPayload(room) {`,
`  }, COUNTDOWN_MS);
}

function questionPayload(room) {`,
  'duração da contagem regressiva'
);

replaceText(
`  room.status = 'playing';
  room.questionStartedAt = now();
  for (const p of room.players) p.answer = null;`,
`  room.status = 'playing';
  room.questionStartedAt = now();
  room.lastReveal = null;
  for (const p of room.players) p.answer = null;`,
  'estado da pergunta recuperável'
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
    room.questionTimer = setTimeout(()=>endQuestion(room, 'all-answered'), ANSWER_REVEAL_DELAY_MS);
  }`,
  'respostas de todos os jogadores'
);

// 7b) Guarda a última revelação para restaurar a tela após recarregar.
replaceText(
`  room.status = 'reveal';
  touch(room);
  broadcast(room, 'reveal', {
    index: room.questionIndex,
    correctIndex: q.c,
    correctText: q.a[q.c],
    reference: q.ref,
    explanation: q.exp,
    reason,
    players: room.players.map(p=>({
      id:p.id, name:p.name, score:p.score, heart:p.heart,
      answer:p.answer
    }))
  });`,
`  room.status = 'reveal';
  touch(room);
  const reveal = {
    index: room.questionIndex,
    correctIndex: q.c,
    correctText: q.a[q.c],
    reference: q.ref,
    explanation: q.exp,
    reason,
    players: room.players.map(p=>({
      id:p.id, name:p.name, score:p.score, heart:p.heart,
      answer:p.answer
    }))
  };
  room.lastReveal = reveal;
  broadcast(room, 'reveal', reveal);`,
  'revelação recuperável'
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

  const result = {
    winnerId,
    winnerIds,
    tie: winnerIds.length > 1,
    players: ranking.map(publicPlayer),
    room: roomSummary(room)
  };
  room.lastResult = result;
  broadcast(room, 'match-finished', result);
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

// 8b) Monta um retrato seguro da partida para recarregamentos e reconexões.
replaceText(
`// ------------------------------------------------------------
// HTTP helpers
// ------------------------------------------------------------`,
`function syncState(room, player) {
  const state = {
    room: roomSummary(room, player.id),
    serverNow: now()
  };
  if (room.status === 'countdown') state.startsAt = room.countdownStartsAt;
  if ((room.status === 'playing' || room.status === 'reveal') && room.questionIndex >= 0) {
    state.question = questionPayload(room);
    state.yourAnswer = player.answer ? {choice: player.answer.choice} : null;
  }
  if (room.status === 'reveal') state.reveal = room.lastReveal;
  if (room.status === 'finished') state.result = room.lastResult;
  return state;
}

// ------------------------------------------------------------
// HTTP helpers
// ------------------------------------------------------------`,
  'sincronização após recarregar'
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
  "      const {room,player}=createRoom(body.name,body.category);",
  "      const {room,player}=createRoom(body.name,body.category,body.difficulty);",
  'nível recebido ao criar a sala'
);

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
`      sendPlayer(player,'connected',{
        room:roomSummary(room,player.id)
      });`,
`      sendPlayer(player,'connected',syncState(room,player));`,
  'reconexão envia a tela atual'
);

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

// 13) A consulta de estado também devolve a tela atual da partida.
replaceText(
`      return json(res,200,{ok:true,room:roomSummary(room,player.id)});`,
`      return json(res,200,{ok:true,...syncState(room,player)});`,
  'estado completo da partida'
);

// 14) Endpoint de saúde para o Render.
replaceText(
`  try {
    if (req.method==='POST' && urlObj.pathname==='/api/create-room') {`,
`  try {
    if (req.method==='GET' && urlObj.pathname==='/api/health') {
      return json(res,200,{ok:true,service:'desafio-biblico-online',rooms:rooms.size});
    }

    if (req.method==='POST' && urlObj.pathname==='/api/create-room') {`,
  'verificação de saúde'
);

fs.writeFileSync(runtimePath, code, 'utf8');
console.log('✓ Multiplayer preparado. Iniciando servidor...');
require(runtimePath);
