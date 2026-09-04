'use strict';

const $ = id => document.getElementById(id);
let session = null;
let eventSource = null;
let roomState = null;
let currentQuestion = null;
let timerRAF = null;
let soundOn = localStorage.getItem('dbo_sound') !== '0';
let audioCtx = null;
let lastResult = null;

function show(id) {
  document.querySelectorAll('.screen').forEach(s => {
    const active = s.id === id;
    s.classList.toggle('active', active);
    s.setAttribute('aria-hidden', active ? 'false' : 'true');
  });
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._to);
  t._to = setTimeout(() => t.classList.remove('show'), 2200);
}

function saveName() {
  localStorage.setItem('dbo_name', $('nameInput').value.trim());
}

function loadName() {
  $('nameInput').value = localStorage.getItem('dbo_name') || '';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function ensureAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function tone(freq, dur = .18, vol = .045, type = 'sine', delay = 0) {
  if (!soundOn) return;
  const c = ensureAudio();
  if (!c) return;
  const n = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, n);
  g.gain.setValueAtTime(.0001, n);
  g.gain.exponentialRampToValueAtTime(Math.max(.001, vol), n + .012);
  g.gain.exponentialRampToValueAtTime(.0001, n + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(n);
  o.stop(n + dur + .02);
}

function sound(k) {
  if (k === 'start') {
    tone(294, .22, .06, 'triangle');
    tone(370, .25, .06, 'triangle', .12);
    tone(440, .35, .06, 'triangle', .23);
  }
  if (k === 'correct') {
    tone(523, .2, .06);
    tone(659, .25, .06, 'sine', .1);
    tone(784, .32, .065, 'sine', .2);
  }
  if (k === 'wrong') {
    tone(180, .35, .06, 'sawtooth');
    tone(105, .42, .04, 'square', .08);
  }
  if (k === 'heart') {
    tone(70, .1, .075);
    tone(70, .12, .065, 'sine', .2);
    tone(440, .4, .05, 'triangle', .48);
  }
  if (k === 'victory') {
    [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, .5, .06, 'triangle', i * .13));
  }
}

function setSound(v) {
  soundOn = !!v;
  localStorage.setItem('dbo_sound', soundOn ? '1' : '0');
  $('soundBtn').textContent = soundOn ? '🔊' : '🔇';
}

async function api(path, body) {
  const r = await fetch(path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'ERROR'), {code: j.error, status: r.status});
  return j;
}

function sessionBody(extra = {}) {
  return {
    code: session.code,
    playerId: session.playerId,
    token: session.token,
    ...extra
  };
}

function closeEvents() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

function connectEvents() {
  closeEvents();
  setConnectionStatus('connecting');
  const q = new URLSearchParams({
    code: session.code,
    playerId: session.playerId,
    token: session.token
  });
  eventSource = new EventSource('/events?' + q);
  eventSource.onmessage = e => {
    try {
      handleEvent(JSON.parse(e.data));
    } catch (_) {}
  };
  eventSource.onopen = () => setConnectionStatus('online');
  eventSource.onerror = () => setConnectionStatus('connecting');
}

function isHost(room = roomState) {
  return !!room && !!session && room.hostId === session.playerId;
}

function sortedPlayers(players) {
  return [...(players || [])].sort((a, b) => (b.score || 0) - (a.score || 0) || a.name.localeCompare(b.name, 'pt-BR'));
}

function installMultiplayerUI() {
  document.documentElement.lang = 'pt-BR';
  document.title = 'Desafio Bíblico Online — Multiplayer';

  const topbar = document.querySelector('.topbar');
  if (topbar && !$('connectionStatus')) {
    const status = document.createElement('div');
    status.id = 'connectionStatus';
    status.className = 'connectionStatus offline';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.innerHTML = '<i></i><span>Pronto</span>';
    topbar.insertBefore(status, $('soundBtn'));
  }

  const tag = document.querySelector('.onlineTag');
  if (tag) tag.textContent = 'MULTIPLAYER ONLINE';

  const heroP = document.querySelector('#homeScreen .hero p');
  if (heroP) heroP.textContent = 'Escolha o nível, crie uma sala e desafie seus amigos em 15 perguntas bíblicas.';

  const categorySelect = $('categorySelect');
  if (categorySelect && !$('difficultySelect')) {
    categorySelect.insertAdjacentHTML('afterend', `
      <label for="difficultySelect">Nível da partida</label>
      <select id="difficultySelect" aria-label="Nível da partida">
        <option value="1">Fácil</option>
        <option value="2">Médio</option>
        <option value="3">Difícil</option>
      </select>`);
  }

  const features = document.querySelectorAll('#homeScreen .features > div');
  if (features[0]) features[0].innerHTML = '<b>15</b><span>PERGUNTAS</span>';
  if (features[1]) features[1].innerHTML = '<b>15s</b><span>POR PERGUNTA</span>';

  const waitingTitle = document.querySelector('#waitingScreen h2');
  if (waitingTitle) waitingTitle.textContent = 'Sala criada!';
  const waitingP = document.querySelector('#waitingScreen > p');
  if (waitingP) waitingP.textContent = 'Compartilhe o código ou o link. O anfitrião inicia quando todos estiverem na sala.';

  const playersBox = document.querySelector('#waitingScreen .playersBox');
  if (playersBox) {
    playersBox.innerHTML = `
      <div class="multiPlayersHeader">
        <b id="playersCount">1 jogador</b>
        <span id="hostLabel">👑 Anfitrião</span>
      </div>
      <div id="playersList" class="multiPlayersList"></div>
    `;
  }

  const roomCode = $('roomCodeBig');
  if (roomCode && !$('roomSettings')) {
    const settings = document.createElement('div');
    settings.id = 'roomSettings';
    settings.className = 'roomSettings';
    roomCode.insertAdjacentElement('afterend', settings);
  }

  const leaveBtn = $('leaveWaitingBtn');
  if (leaveBtn && !$('startMatchBtn')) {
    const btn = document.createElement('button');
    btn.id = 'startMatchBtn';
    btn.className = 'primary';
    btn.textContent = '▶️ INICIAR PARTIDA';
    btn.onclick = startMatch;
    leaveBtn.parentNode.insertBefore(btn, leaveBtn);
  }

  const scoreBoard = document.querySelector('#gameScreen .scoreboard');
  if (scoreBoard && !$('liveRanking')) {
    const ranking = document.createElement('div');
    ranking.id = 'liveRanking';
    ranking.className = 'liveRanking';
    scoreBoard.insertAdjacentElement('afterend', ranking);
  }

  const finalScore = document.querySelector('#resultScreen .finalScore');
  if (finalScore) finalScore.innerHTML = '<div id="finalRanking" class="finalRanking"></div>';

  const style = document.createElement('style');
  style.textContent = `
    .playersBox{display:block!important}
    .multiPlayersHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
    .multiPlayersHeader span{font-size:12px;opacity:.78}
    .roomSettings{margin:10px auto 16px;display:flex;justify-content:center;flex-wrap:wrap;gap:7px;color:#aebed2;font-size:10px;font-weight:800;letter-spacing:.035em}
    .roomSettings span{padding:7px 10px;border:1px solid rgba(255,255,255,.11);border-radius:999px;background:rgba(255,255,255,.04)}
    .multiPlayersList{display:grid;gap:8px;max-height:310px;overflow:auto;padding-right:2px}
    .multiPlayerRow{display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:10px;padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.04)}
    .multiPlayerRow.me{border-color:rgba(91,224,154,.55);background:rgba(91,224,154,.08)}
    .multiPlayerRow .avatar{font-size:22px;text-align:center}
    .multiPlayerRow .name{font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .multiPlayerRow .status{font-size:11px;font-weight:800;opacity:.8}
    #startMatchBtn{margin-top:16px;width:100%}
    #startMatchBtn[disabled]{opacity:.45;cursor:not-allowed}
    .liveRanking{margin:10px 0 12px;padding:10px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.035);display:grid;gap:5px;max-height:135px;overflow:auto}
    .rankRow{display:grid;grid-template-columns:32px 1fr auto;gap:8px;align-items:center;font-size:12px;padding:4px 2px}
    .rankRow.me{font-weight:900}
    .rankRow .rankScore{font-weight:900}
    .finalScore{display:block!important}
    .finalRanking{width:100%;display:grid;gap:8px}
    .finalRankRow{display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:10px;padding:12px;border-radius:14px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.1)}
    .finalRankRow.me{border-color:rgba(91,224,154,.55)}
    .finalRankRow .pos{font-size:20px;font-weight:900;text-align:center}
    .finalRankRow .fname{font-weight:850;text-align:left}
    .finalRankRow .fscore{font-weight:950;font-size:18px}
  `;
  document.head.appendChild(style);

  const opName = $('opName');
  if (opName) opName.textContent = 'Líder';
  const opStatus = $('opAnswerStatus');
  if (opStatus) opStatus.textContent = 'Aguardando respostas…';

  const gameMeta = document.querySelector('.gameMeta');
  if (gameMeta && !$('difficultyText')) {
    const difficulty = document.createElement('span');
    difficulty.id = 'difficultyText';
    difficulty.className = 'difficultyText';
    gameMeta.insertBefore(difficulty, $('timerText'));
  }

  const testSound = $('testSoundBtn');
  if (testSound && !$('helpBtn')) {
    const help = document.createElement('button');
    help.id = 'helpBtn';
    help.className = 'textBtn helpBtn';
    help.textContent = '❔ Como jogar';
    help.onclick = openHelp;
    testSound.insertAdjacentElement('afterend', help);
  }

  if (!$('helpDialog')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="helpDialog" class="helpDialog hidden" role="dialog" aria-modal="true" aria-labelledby="helpTitle">
        <div class="helpCard">
          <button id="closeHelpBtn" class="closeHelp" aria-label="Fechar instruções">×</button>
          <span class="helpIcon">📖</span>
          <h2 id="helpTitle">Como jogar</h2>
          <ol>
            <li><b>Crie uma sala</b> e compartilhe o link ou código.</li>
            <li>Espere seus amigos entrarem e toque em <b>Iniciar</b>.</li>
            <li>Responda antes do tempo acabar. Quanto mais rápido, mais pontos.</li>
            <li>A Segunda Chance protege você do primeiro erro.</li>
          </ol>
          <button id="understoodBtn" class="primary">ENTENDI, VAMOS JOGAR!</button>
        </div>
      </div>`);
    $('closeHelpBtn').onclick = closeHelp;
    $('understoodBtn').onclick = closeHelp;
    $('helpDialog').onclick = e => { if (e.target === $('helpDialog')) closeHelp(); };
  }

  $('toast').setAttribute('role', 'status');
  $('toast').setAttribute('aria-live', 'polite');

  style.textContent += `
    .connectionStatus{margin-left:auto;margin-right:10px;display:flex;align-items:center;gap:6px;padding:6px 9px;border:1px solid rgba(255,255,255,.12);border-radius:999px;font-size:10px;font-weight:850;color:#aab9cd;background:rgba(255,255,255,.04)}
    .connectionStatus i{width:7px;height:7px;border-radius:50%;background:#8290a3;box-shadow:0 0 0 3px rgba(130,144,163,.12)}
    .connectionStatus.online i{background:#5be09a;box-shadow:0 0 0 3px rgba(91,224,154,.13)}
    .connectionStatus.connecting i{background:#f5bb43;box-shadow:0 0 0 3px rgba(245,187,67,.13);animation:pulse 1.1s infinite}
    .difficultyText{color:#aab9cd!important;font-size:9px!important;letter-spacing:.08em}
    .timerBar.urgent #timerFill{background:#ff667a!important;box-shadow:0 0 12px rgba(255,102,122,.55)}
    .helpBtn{margin-left:8px}
    .helpDialog{position:fixed;inset:0;z-index:200;background:rgba(1,6,14,.86);backdrop-filter:blur(8px);display:grid;place-items:center;padding:20px}
    .helpDialog.hidden{display:none}
    .helpCard{position:relative;width:min(460px,100%);padding:28px 24px 24px;border-radius:22px;background:#0a1a2b;border:1px solid rgba(245,187,67,.35);box-shadow:0 24px 80px rgba(0,0,0,.55)}
    .helpCard h2{text-align:center;margin:4px 0 18px;color:#fff}
    .helpIcon{display:block;text-align:center;font-size:42px}
    .helpCard ol{margin:0 0 22px;padding-left:22px;color:#bdc9d8;line-height:1.55}
    .helpCard li{margin:9px 0;padding-left:4px}.helpCard b{color:#f5d27a}
    .closeHelp{position:absolute;right:12px;top:10px;border:0;background:transparent;color:#aab9cd;font-size:30px;cursor:pointer}
    .answer:focus-visible,.primary:focus-visible,.secondary:focus-visible,.textBtn:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #65b4ff;outline-offset:3px}
    @keyframes pulse{50%{opacity:.45}}
    @media(max-width:520px){.connectionStatus span{display:none}.connectionStatus{padding:7px;margin-right:6px}.helpBtn{display:block;margin:3px auto 0}.gameMeta{gap:8px}.difficultyText{flex:1;text-align:center}}
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
  `;
}

function setConnectionStatus(state) {
  const el = $('connectionStatus');
  if (!el) return;
  el.className = `connectionStatus ${state}`;
  const label = state === 'online' ? 'Conectado' : state === 'connecting' ? 'Reconectando' : 'Pronto';
  el.querySelector('span').textContent = label;
}

function openHelp() {
  $('helpDialog').classList.remove('hidden');
  $('understoodBtn').focus();
}

function closeHelp() {
  $('helpDialog').classList.add('hidden');
  $('helpBtn').focus();
}

function updateWaiting(room) {
  roomState = room;
  $('roomCodeBig').textContent = room.code;
  const levelLabels = {1: 'Fácil', 2: 'Médio', 3: 'Difícil'};
  if ($('roomSettings')) {
    $('roomSettings').innerHTML = `
      <span>📚 ${escapeHtml(room.category)}</span>
      <span>🎯 ${levelLabels[room.difficulty] || 'Fácil'}</span>
      <span>❓ 15 perguntas</span>
      <span>⏱️ 15 segundos</span>`;
  }

  const list = $('playersList');
  const count = $('playersCount');
  if (!list || !count) return;

  count.textContent = `${room.players.length} ${room.players.length === 1 ? 'jogador' : 'jogadores'}${room.maxPlayers ? ` / ${room.maxPlayers}` : ''}`;
  list.innerHTML = room.players.map((p, i) => {
    const host = p.id === room.hostId;
    const me = p.id === session.playerId;
    return `
      <div class="multiPlayerRow ${me ? 'me' : ''}">
        <div class="avatar">${host ? '👑' : '🙂'}</div>
        <div class="name">${escapeHtml(p.name)}${me ? ' (você)' : ''}</div>
        <div class="status">${p.connected ? '🟢 ONLINE' : '⚪ ENTRANDO'}</div>
      </div>`;
  }).join('');

  const startBtn = $('startMatchBtn');
  if (startBtn) {
    if (isHost(room)) {
      startBtn.style.display = '';
      startBtn.disabled = room.players.length < 2 || room.status !== 'waiting';
      startBtn.textContent = room.players.length < 2 ? 'AGUARDANDO MAIS 1 JOGADOR' : `▶️ INICIAR COM ${room.players.length} JOGADORES`;
    } else {
      startBtn.style.display = '';
      startBtn.disabled = true;
      startBtn.textContent = '⏳ AGUARDANDO O ANFITRIÃO';
    }
  }

  const host = room.players.find(p => p.id === room.hostId);
  if ($('hostLabel')) $('hostLabel').textContent = host ? `👑 ${host.name}` : '👑 Anfitrião';
}

function renderLiveRanking(players) {
  const box = $('liveRanking');
  if (!box) return;
  const ranked = sortedPlayers(players);
  box.innerHTML = ranked.map((p, i) => `
    <div class="rankRow ${p.id === session.playerId ? 'me' : ''}">
      <span>${i + 1}º</span>
      <span>${escapeHtml(p.name)}${p.id === session.playerId ? ' (você)' : ''}</span>
      <span class="rankScore">${p.score || 0}</span>
    </div>`).join('');

  const me = ranked.find(p => p.id === session.playerId);
  const leader = ranked[0];
  const leaders = leader ? ranked.filter(p => (p.score || 0) === (leader.score || 0)) : [];
  if (me) {
    $('youName').textContent = me.name;
    $('youScore').textContent = me.score || 0;
    $('youHeart').textContent = me.heart ? '❤️ 1' : '♡ 0';
  }
  if (leader) {
    $('opName').textContent = leaders.length > 1
      ? 'Empate na liderança'
      : leader.id === session.playerId ? 'Você lidera' : leader.name;
    $('opScore').textContent = leader.score || 0;
    $('opHeart').textContent = `${ranked.length} 👥`;
  }
}

function handleEvent(msg) {
  if (msg.type === 'connected') {
    applySyncState(msg);
    return;
  }

  if (msg.type === 'room-updated') {
    roomState = msg.room;
    if (msg.room.status === 'waiting') {
      if (!$('waitingScreen').classList.contains('active')) show('waitingScreen');
      updateWaiting(msg.room);
    } else if (msg.room.status === 'finished' && $('resultScreen').classList.contains('active')) {
      configureRestartButton(msg.room);
    }
    return;
  }

  if (msg.type === 'match-starting') {
    roomState = msg.room;
    renderLiveRanking(msg.room.players);
    showCountdown(msg.startsAt);
    return;
  }

  if (msg.type === 'question') {
    renderQuestion(msg);
    return;
  }

  if (msg.type === 'answer-accepted') {
    $('yourAnswerStatus').textContent = msg.heartUsed ? '❤️ Segunda Chance utilizada' : '✓ Resposta enviada';
    if (msg.heartUsed) sound('heart');
    return;
  }

  if (msg.type === 'player-answered') {
    $('opAnswerStatus').textContent = `✓ ${msg.answeredCount}/${msg.totalPlayers} responderam`;
    return;
  }

  if (msg.type === 'reveal') {
    renderReveal(msg);
    return;
  }

  if (msg.type === 'match-finished') {
    renderResult(msg);
    return;
  }

  if (msg.type === 'rematch-state') {
    roomState.players = msg.players;
    return;
  }
}

function applySyncState(state) {
  if (!state || !state.room) return;
  roomState = state.room;
  if (state.room.status === 'waiting') {
    show('waitingScreen');
    updateWaiting(state.room);
  } else if (state.room.status === 'countdown') {
    renderLiveRanking(state.room.players);
    showCountdown(state.startsAt || Date.now());
  } else if (state.room.status === 'playing' && state.question) {
    renderQuestion(state.question);
    if (state.yourAnswer) {
      const buttons = [...document.querySelectorAll('.answer')];
      buttons.forEach(b => b.disabled = true);
      if (buttons[state.yourAnswer.choice]) buttons[state.yourAnswer.choice].classList.add('selected');
      $('yourAnswerStatus').textContent = '✓ Resposta já enviada';
      const answered = state.room.players.filter(p => p.answered).length;
      $('opAnswerStatus').textContent = `${answered}/${state.room.players.length} responderam`;
    }
  } else if (state.room.status === 'reveal' && state.question && state.reveal) {
    renderQuestion(state.question);
    renderReveal(state.reveal);
  } else if (state.room.status === 'finished' && state.result) {
    renderResult(state.result);
  }
}

function showCountdown(startsAt) {
  show('gameScreen');
  $('countdown').classList.remove('hidden');
  sound('start');
  const run = () => {
    const n = Math.ceil((startsAt - Date.now()) / 1000);
    $('countNum').textContent = n > 0 ? n : 'VALENDO!';
    if (n > 0) setTimeout(run, 180);
    else setTimeout(() => $('countdown').classList.add('hidden'), 450);
  };
  run();
}

function renderQuestion(msg) {
  currentQuestion = msg;
  show('gameScreen');
  $('countdown').classList.add('hidden');
  $('questionCount').textContent = `${msg.index + 1}/${msg.total}`;
  $('categoryText').textContent = msg.category.toUpperCase();
  if ($('difficultyText')) {
    const labels = {1: 'FÁCIL', 2: 'MÉDIA', 3: 'DIFÍCIL'};
    $('difficultyText').textContent = labels[msg.difficulty] || '';
  }
  $('questionText').textContent = msg.text;
  $('yourAnswerStatus').textContent = 'Escolha uma resposta';
  $('opAnswerStatus').textContent = `0/${msg.players.length} responderam`;
  $('revealBox').classList.add('hidden');
  renderLiveRanking(msg.players);

  const box = $('answers');
  box.innerHTML = '';
  ['A', 'B', 'C', 'D'].forEach((letter, i) => {
    const b = document.createElement('button');
    b.className = 'answer';
    b.innerHTML = `<span class="letter">${letter}</span><span>${escapeHtml(msg.answers[i])}</span>`;
    b.onclick = () => submitAnswer(i, b);
    box.appendChild(b);
  });
  startTimer(msg.startedAt, msg.timeLimitMs);
}

async function submitAnswer(i, button) {
  document.querySelectorAll('.answer').forEach(b => b.disabled = true);
  button.classList.add('selected');
  $('yourAnswerStatus').textContent = 'Enviando resposta…';
  try {
    await api('/api/action', sessionBody({action: 'answer', choice: i}));
  } catch (e) {
    toast('Não foi possível enviar a resposta.');
    document.querySelectorAll('.answer').forEach(b => b.disabled = false);
    button.classList.remove('selected');
    $('yourAnswerStatus').textContent = 'Tente novamente';
  }
}

function startTimer(startedAt, limit) {
  cancelAnimationFrame(timerRAF);
  const timerBar = document.querySelector('.timerBar');
  timerBar?.classList.remove('urgent');
  const run = () => {
    const remaining = Math.max(0, limit - (Date.now() - startedAt));
    $('timerFill').style.width = (remaining / limit * 100) + '%';
    $('timerText').textContent = Math.ceil(remaining / 1000) + 's';
    timerBar?.classList.toggle('urgent', remaining > 0 && remaining <= 5000);
    if (remaining > 0) timerRAF = requestAnimationFrame(run);
  };
  run();
}

function renderReveal(msg) {
  cancelAnimationFrame(timerRAF);
  $('timerFill').style.width = '0%';
  $('timerText').textContent = '—';
  document.querySelector('.timerBar')?.classList.remove('urgent');
  const mine = msg.players.find(p => p.id === session.playerId);
  renderLiveRanking(msg.players.map(p => ({id: p.id, name: p.name, score: p.score, heart: p.heart})));

  document.querySelectorAll('.answer').forEach((b, i) => {
    b.disabled = true;
    if (i === msg.correctIndex) b.classList.add('correct');
    if (mine?.answer?.choice === i && !mine.answer.correct) b.classList.add('wrong');
  });

  const title = $('revealTitle');
  if (mine?.answer?.correct) {
    title.textContent = `✅ +${mine.answer.points} pontos`;
    title.style.color = '#5be09a';
    sound('correct');
  } else if (mine?.answer?.heartUsed) {
    title.textContent = '❤️ Segunda Chance! Você continua.';
    title.style.color = '#ffb4c2';
    sound('heart');
  } else if (mine?.answer?.timedOut) {
    title.textContent = '⌛ Tempo esgotado';
    title.style.color = '#ff9aab';
    sound('wrong');
  } else {
    title.textContent = '❌ Resposta incorreta';
    title.style.color = '#ff7b8e';
    sound('wrong');
  }

  $('correctAnswerText').textContent = 'Resposta: ' + msg.correctText;
  $('referenceText').textContent = '📖 ' + msg.reference;
  $('explanationText').textContent = msg.explanation;
  $('revealBox').classList.remove('hidden');
  $('yourAnswerStatus').textContent = mine?.answer?.correct ? 'Você acertou!' : mine?.answer?.heartUsed ? 'Sua Segunda Chance foi usada' : 'Você não pontuou';

  const correctCount = msg.players.filter(p => p.answer?.correct).length;
  $('opAnswerStatus').textContent = `${correctCount} de ${msg.players.length} acertaram`;
}

function renderResult(msg) {
  cancelAnimationFrame(timerRAF);
  roomState = msg.room;
  const ranking = sortedPlayers(msg.players);
  const me = ranking.find(p => p.id === session.playerId);
  lastResult = {ranking, winnerIds: msg.winnerIds || [], tie: msg.tie};
  show('resultScreen');

  const final = $('finalRanking');
  let previousScore = null;
  let previousPosition = 0;
  final.innerHTML = ranking.map((p, i) => {
    const position = p.score === previousScore ? previousPosition : i + 1;
    previousScore = p.score;
    previousPosition = position;
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}º`;
    return `
      <div class="finalRankRow ${p.id === session.playerId ? 'me' : ''}">
        <div class="pos">${medal}</div>
        <div class="fname">${escapeHtml(p.name)}${p.id === session.playerId ? ' (você)' : ''}</div>
        <div class="fscore">${p.score}</div>
      </div>`;
  }).join('');

  const winnerIds = msg.winnerIds || (msg.winnerId ? [msg.winnerId] : []);
  const iWon = winnerIds.includes(session.playerId);

  if (msg.tie) {
    $('resultIcon').textContent = '🤝';
    $('resultTitle').textContent = iWon ? 'Você empatou em 1º!' : 'Empate na liderança!';
    $('resultSubtitle').textContent = 'Dois ou mais jogadores terminaram com a maior pontuação.';
    if (iWon) sound('victory');
  } else if (msg.winnerId === session.playerId) {
    $('resultIcon').textContent = '🏆';
    $('resultTitle').textContent = 'Você venceu!';
    $('resultSubtitle').textContent = `Parabéns! Você ficou em 1º entre ${ranking.length} jogadores.`;
    sound('victory');
  } else {
    const winner = ranking[0];
    $('resultIcon').textContent = '📖';
    $('resultTitle').textContent = `${winner?.name || 'O vencedor'} venceu`;
    $('resultSubtitle').textContent = me ? `Você ficou em ${ranking.findIndex(p => p.id === me.id) + 1}º lugar.` : '';
  }

  configureRestartButton(msg.room);
}

function configureRestartButton(room) {
  roomState = room;
  const btn = $('rematchBtn');
  $('rematchStatus').textContent = '';
  if (isHost(room)) {
    btn.disabled = false;
    btn.textContent = '🔄 JOGAR NOVAMENTE';
    btn.onclick = startMatch;
  } else {
    btn.disabled = true;
    btn.textContent = '⏳ AGUARDANDO O ANFITRIÃO';
    $('rematchStatus').textContent = 'O anfitrião pode iniciar uma nova partida com o mesmo grupo.';
  }
}

async function createRoom() {
  const name = $('nameInput').value.trim();
  if (!name) {
    toast('Digite seu nome.');
    return;
  }
  saveName();
  ensureAudio();
  sound('start');
  const button = $('createBtn');
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'CRIANDO SALA…';
  try {
    const j = await api('/api/create-room', {
      name,
      category: $('categorySelect').value,
      difficulty: Number($('difficultySelect').value)
    });
    session = {code: j.code, playerId: j.playerId, token: j.token};
    sessionStorage.setItem('dbo_session', JSON.stringify(session));
    history.replaceState(null, '', `/?room=${j.code}`);
    show('waitingScreen');
    updateWaiting(j.room);
    connectEvents();
  } catch (e) {
    toast('Não foi possível criar a sala.');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function joinRoom() {
  const name = $('nameInput').value.trim();
  const code = $('roomCodeInput').value.trim().toUpperCase();
  if (!name) {
    toast('Digite seu nome.');
    return;
  }
  if (code.length < 4) {
    toast('Digite o código da sala.');
    return;
  }
  saveName();
  ensureAudio();
  sound('start');
  const button = $('joinBtn');
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'ENTRANDO…';
  try {
    const j = await api('/api/join-room', {name, code});
    session = {code: j.code, playerId: j.playerId, token: j.token};
    sessionStorage.setItem('dbo_session', JSON.stringify(session));
    history.replaceState(null, '', `/?room=${j.code}`);
    show('waitingScreen');
    updateWaiting(j.room);
    connectEvents();
  } catch (e) {
    if (e.code === 'ROOM_NOT_FOUND') toast('Sala não encontrada.');
    else if (e.code === 'ROOM_UNAVAILABLE') toast('Essa sala já começou ou atingiu o limite de jogadores.');
    else toast('Não foi possível entrar.');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function startMatch() {
  if (!session || !roomState) return;
  if (!isHost()) {
    toast('Somente o anfitrião pode iniciar.');
    return;
  }
  if (roomState.players.length < 2) {
    toast('É preciso pelo menos 2 jogadores.');
    return;
  }
  const btn = $('startMatchBtn');
  if (btn) btn.disabled = true;
  try {
    await api('/api/action', sessionBody({action: 'start'}));
  } catch (e) {
    if (e.code === 'NOT_HOST') toast('Somente o anfitrião pode iniciar.');
    else if (e.code === 'NEED_PLAYERS') toast('É preciso pelo menos 2 jogadores.');
    else toast('Não foi possível iniciar a partida.');
    if (btn) btn.disabled = false;
  }
}

function inviteUrl() {
  const u = new URL(location.href);
  u.search = '';
  u.searchParams.set('room', session.code);
  return u.toString();
}

async function shareRoom() {
  const text = `⚔️ Entre no meu Desafio Bíblico!\nSala: ${session.code}\n${inviteUrl()}`;
  try {
    if (navigator.share) await navigator.share({title: 'Desafio Bíblico Online', text, url: inviteUrl()});
    else {
      await navigator.clipboard.writeText(text);
      toast('Convite copiado!');
    }
  } catch (_) {}
}

async function copyRoom() {
  try {
    await navigator.clipboard.writeText(inviteUrl());
    toast('Link copiado!');
  } catch (_) {
    toast('Código da sala: ' + session.code);
  }
}

async function shareResult() {
  if (!lastResult) return;
  const lines = lastResult.ranking.slice(0, 10).map((p, i) => `${i + 1}º ${p.name} — ${p.score} pts`);
  const text = `📖 Desafio Bíblico Online\n🏆 Ranking final\n${lines.join('\n')}`;
  try {
    if (navigator.share) await navigator.share({title: 'Desafio Bíblico', text});
    else {
      await navigator.clipboard.writeText(text);
      toast('Resultado copiado!');
    }
  } catch (_) {}
}

async function goHome() {
  const old = session;
  closeEvents();
  if (old) {
    try {
      await api('/api/action', {
        code: old.code,
        playerId: old.playerId,
        token: old.token,
        action: 'leave'
      });
    } catch (_) {}
  }
  session = null;
  roomState = null;
  sessionStorage.removeItem('dbo_session');
  history.replaceState(null, '', '/');
  show('homeScreen');
  setConnectionStatus('offline');
}

async function tryRestore() {
  const saved = sessionStorage.getItem('dbo_session');
  if (!saved) return false;
  try {
    session = JSON.parse(saved);
    const q = new URLSearchParams({code: session.code, playerId: session.playerId, token: session.token});
    const r = await fetch('/api/state?' + q);
    if (!r.ok) throw new Error('RESTORE');
    const j = await r.json();
    connectEvents();
    applySyncState(j);
    return true;
  } catch (_) {
    session = null;
    sessionStorage.removeItem('dbo_session');
    return false;
  }
}

installMultiplayerUI();

$('createBtn').onclick = createRoom;
$('joinBtn').onclick = joinRoom;
$('shareRoomBtn').onclick = shareRoom;
$('copyRoomBtn').onclick = copyRoom;
$('leaveWaitingBtn').onclick = goHome;
$('backHomeBtn').onclick = goHome;
$('shareResultBtn').onclick = shareResult;
$('soundBtn').onclick = () => setSound(!soundOn);
$('testSoundBtn').onclick = () => {
  ensureAudio();
  sound('start');
  setTimeout(() => sound('correct'), 500);
};
$('roomCodeInput').addEventListener('input', e => {
  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
});
$('nameInput').addEventListener('change', saveName);
$('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') createRoom();
});
$('roomCodeInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') joinRoom();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('helpDialog').classList.contains('hidden')) closeHelp();
});
window.addEventListener('online', () => setConnectionStatus(session ? 'connecting' : 'offline'));
window.addEventListener('offline', () => setConnectionStatus('connecting'));
window.addEventListener('beforeunload', closeEvents);

(async function init() {
  loadName();
  setSound(soundOn);
  const room = new URL(location.href).searchParams.get('room');
  if (room) $('roomCodeInput').value = room.toUpperCase().slice(0, 6);
  const restored = await tryRestore();
  if (!restored) show('homeScreen');
})();
