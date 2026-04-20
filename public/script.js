/**
 * AirGames by WorksBeyond
 * Full game script: Local | Bot | Online + Icon Picker + Stats
 */

// ══════════════════════════════════════════════════════
// ICON CATALOGUE
// ══════════════════════════════════════════════════════
const ICON_SECTIONS = [
  {
    title: "Classic X & O",
    grad: false,
    icons: [
      { id:"x-classic",  render:"✕", label:"Cross X" },
      { id:"o-classic",  render:"○", label:"Circle O" },
      { id:"x-bold",     render:"✗", label:"Bold X" },
      { id:"o-dot",      render:"⊙", label:"Dot O" },
      { id:"x-double",   render:"⊠", label:"Box X" },
      { id:"o-double",   render:"◎", label:"Double O" },
    ]
  },
  {
    title: "✨ Neon & Styled",
    grad: true,
    icons: [
      { id:"x-blue",   render:"<span style='color:#4361ee;font-weight:900;font-family:Baloo 2'>✕</span>",  label:"Blue X" },
      { id:"o-pink",   render:"<span style='color:#f72585;font-weight:900;font-family:Baloo 2'>○</span>",  label:"Pink O" },
      { id:"x-green",  render:"<span style='color:#2ed573;font-weight:900;font-family:Baloo 2'>✕</span>", label:"Green X" },
      { id:"o-gold",   render:"<span style='color:#f5a623;font-weight:900;font-family:Baloo 2'>○</span>", label:"Gold O" },
      { id:"x-red",    render:"<span style='color:#ff4757;font-weight:900;font-family:Baloo 2'>✕</span>", label:"Red X" },
      { id:"o-teal",   render:"<span style='color:#00c9b1;font-weight:900;font-family:Baloo 2'>○</span>", label:"Teal O" },
      { id:"x-purple", render:"<span style='color:#b44fe8;font-weight:900;font-family:Baloo 2'>✕</span>",label:"Purple X" },
      { id:"o-coral",  render:"<span style='color:#ff6b6b;font-weight:900;font-family:Baloo 2'>○</span>", label:"Coral O" },
      { id:"x-cyan",   render:"<span style='color:#00d2ff;font-weight:900;font-family:Baloo 2'>✕</span>", label:"Cyan X" },
      { id:"o-lime",   render:"<span style='color:#adff2f;font-weight:900;font-family:Baloo 2'>○</span>", label:"Lime O" },
      { id:"x-magenta",render:"<span style='color:#ff00ff;font-weight:900;font-family:Baloo 2'>✕</span>",label:"Magenta X" },
      { id:"o-sky",    render:"<span style='color:#87ceeb;font-weight:900;font-family:Baloo 2'>○</span>", label:"Sky O" },
    ]
  },
  {
    title: "⭐ Shapes & Symbols",
    grad: true,
    icons: [
      { id:"star",    render:"⭐" }, { id:"heart",  render:"❤️" },
      { id:"diamond", render:"💎" }, { id:"fire",   render:"🔥" },
      { id:"bolt",    render:"⚡" }, { id:"crown",  render:"👑" },
      { id:"moon",    render:"🌙" }, { id:"sun",    render:"☀️" },
      { id:"snowflake",render:"❄️"},{ id:"flower", render:"🌸" },
      { id:"skull",   render:"💀" }, { id:"ghost",  render:"👻" },
      { id:"target",  render:"🎯" }, { id:"gem",    render:"💠" },
      { id:"music",   render:"🎵" }, { id:"shield", render:"🛡️" },
      { id:"sword",   render:"⚔️" }, { id:"bomb",   render:"💣" },
    ]
  },
  {
    title: "🐾 Animals",
    grad: false,
    icons: [
      { id:"cat",   render:"🐱" }, { id:"dog",   render:"🐶" },
      { id:"fox",   render:"🦊" }, { id:"wolf",  render:"🐺" },
      { id:"bear",  render:"🐻" }, { id:"tiger", render:"🐯" },
      { id:"lion",  render:"🦁" }, { id:"panda", render:"🐼" },
      { id:"frog",  render:"🐸" }, { id:"owl",   render:"🦉" },
      { id:"shark", render:"🦈" }, { id:"eagle", render:"🦅" },
    ]
  },
  {
    title: "🚀 Symbols & Objects",
    grad: false,
    icons: [
      { id:"rocket",  render:"🚀" }, { id:"alien",  render:"👽" },
      { id:"robot",   render:"🤖" }, { id:"ninja",  render:"🥷" },
      { id:"wizard",  render:"🧙" }, { id:"unicorn",render:"🦄" },
      { id:"dragon",  render:"🐉" }, { id:"sword2", render:"🗡️" },
      { id:"trophy",  render:"🏆" }, { id:"dice",   render:"🎲" },
      { id:"chess",   render:"♟️" }, { id:"joker",  render:"🃏" },
    ]
  },
  {
    title: "🎨 Geometric",
    grad: false,
    icons: [
      { id:"sq-blue",  render:"<span style='color:#4361ee;font-size:28px'>■</span>" },
      { id:"sq-pink",  render:"<span style='color:#f72585;font-size:28px'>■</span>" },
      { id:"sq-green", render:"<span style='color:#2ed573;font-size:28px'>■</span>" },
      { id:"ci-blue",  render:"<span style='color:#4361ee;font-size:28px'>●</span>" },
      { id:"ci-gold",  render:"<span style='color:#f5a623;font-size:28px'>●</span>" },
      { id:"ci-teal",  render:"<span style='color:#00c9b1;font-size:28px'>●</span>" },
      { id:"tri-pur",  render:"<span style='color:#b44fe8;font-size:22px'>▲</span>" },
      { id:"tri-red",  render:"<span style='color:#ff4757;font-size:22px'>▲</span>" },
      { id:"dia-gold", render:"<span style='color:#f5a623;font-size:22px'>◆</span>" },
      { id:"dia-blue", render:"<span style='color:#4361ee;font-size:22px'>◆</span>" },
      { id:"hex-pink", render:"<span style='color:#f72585;font-size:22px'>⬡</span>" },
      { id:"hex-grn",  render:"<span style='color:#2ed573;font-size:22px'>⬡</span>" },
    ]
  }
];

// Get raw render string by id
function iconRenderById(id) {
  for (const sec of ICON_SECTIONS) {
    const found = sec.icons.find(i => i.id === id);
    if (found) return found.render;
  }
  return id.startsWith("x") ? "✕" : "○";
}

// ══════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════
const state = {
  mode: null,            // 'local' | 'bot' | 'online'
  botDifficulty: 'medium',
  board: Array(9).fill(null),
  currentTurn: 'X',
  gameOver: false,
  // Scores (session)
  scoreX: 0,
  scoreO: 0,
  // Online
  ws: null,
  myRole: null,
  roomCode: null,
  reconnectAttempts: 0,
  // Settings
  p1Name: 'Player 1',
  p2Name: 'Player 2',
  soundOn: true,
  animOn: true,
  iconX: 'x-classic',
  iconO: 'o-classic',
  iconPickerFor: 'X',
  // Persistent stats
  stats: { wins:0, losses:0, draws:0 },
};

// ══════════════════════════════════════════════════════
// PERSISTENT STATS
// ══════════════════════════════════════════════════════
function loadStats() {
  try {
    const s = JSON.parse(localStorage.getItem('ag_stats') || '{}');
    state.stats = { wins: s.wins||0, losses: s.losses||0, draws: s.draws||0 };
  } catch(_) {}
}
function saveStats() {
  try { localStorage.setItem('ag_stats', JSON.stringify(state.stats)); } catch(_){}
}
function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem('ag_prefs') || '{}');
    if (p.p1Name) state.p1Name = p.p1Name;
    if (p.p2Name) state.p2Name = p.p2Name;
    if (p.iconX)  state.iconX  = p.iconX;
    if (p.iconO)  state.iconO  = p.iconO;
    if (typeof p.soundOn === 'boolean') state.soundOn = p.soundOn;
    if (typeof p.animOn  === 'boolean') state.animOn  = p.animOn;
  } catch(_) {}
}
function savePrefs() {
  try {
    localStorage.setItem('ag_prefs', JSON.stringify({
      p1Name: state.p1Name, p2Name: state.p2Name,
      iconX: state.iconX, iconO: state.iconO,
      soundOn: state.soundOn, animOn: state.animOn
    }));
  } catch(_){}
}

// ══════════════════════════════════════════════════════
// SCREEN MANAGER
// ══════════════════════════════════════════════════════
const SCREENS = ['lobby','bot','online','waiting','game'];
function showScreen(name) {
  SCREENS.forEach(s => {
    const el = $(`screen-${s}`);
    if (el) el.classList.toggle('active', s === name);
  });
}

const $ = id => document.getElementById(id);

// ══════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════
let toastTimer;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch(_) { const t=document.createElement('textarea'); t.value=text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
  toast('Copied! ✓');
}

// ══════════════════════════════════════════════════════
// SOUND
// ══════════════════════════════════════════════════════
let audioCtx;
function playSound(type) {
  if (!state.soundOn) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    if (type === 'move') {
      o.frequency.setValueAtTime(480, t);
      o.frequency.exponentialRampToValueAtTime(600, t+0.08);
      g.gain.setValueAtTime(0.10, t);
      g.gain.exponentialRampToValueAtTime(0.001, t+0.15);
      o.start(t); o.stop(t+0.15);
    } else if (type === 'win') {
      // Victory chime
      [523,659,784,1047].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        const start = t + i*0.12;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.12, start+0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start+0.3);
        osc.start(start); osc.stop(start+0.3);
      });
    } else if (type === 'draw') {
      o.frequency.setValueAtTime(400, t);
      o.frequency.exponentialRampToValueAtTime(250, t+0.25);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t+0.28);
      o.start(t); o.stop(t+0.28);
    }
  } catch(_) {}
}

// ══════════════════════════════════════════════════════
// WIN CHECK
// ══════════════════════════════════════════════════════
const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function checkWinner(board) {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a]===board[b] && board[a]===board[c])
      return { winner: board[a], line: [a,b,c] };
  }
  if (board.every(Boolean)) return { winner:'draw', line:[] };
  return null;
}

// ══════════════════════════════════════════════════════
// WIN LINE CANVAS DRAW
// ══════════════════════════════════════════════════════
const WIN_LINE_POINTS = {
  '0,1,2':[0.17,0.17,0.83,0.17], '3,4,5':[0.17,0.50,0.83,0.50],
  '6,7,8':[0.17,0.83,0.83,0.83], '0,3,6':[0.17,0.17,0.17,0.83],
  '1,4,7':[0.50,0.17,0.50,0.83], '2,5,8':[0.83,0.17,0.83,0.83],
  '0,4,8':[0.17,0.17,0.83,0.83], '2,4,6':[0.83,0.17,0.17,0.83],
};

function drawWinLine(line) {
  const canvas = $('win-canvas');
  if (!canvas) return;
  const key = line.join(',');
  const pts = WIN_LINE_POINTS[key];
  if (!pts) return;
  const w = canvas.offsetWidth, h = canvas.offsetHeight;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,w,h);

  const x1=pts[0]*w, y1=pts[1]*h, x2=pts[2]*w, y2=pts[3]*h;
  const total = Math.hypot(x2-x1, y2-y1);
  let progress = 0;
  const DURATION = 350;
  const start = performance.now();

  // Gradient stroke
  const grad = ctx.createLinearGradient(x1,y1,x2,y2);
  grad.addColorStop(0,'#6c3be8');
  grad.addColorStop(0.5,'#f72585');
  grad.addColorStop(1,'#f5a623');

  function step(now) {
    const elapsed = now - start;
    progress = Math.min(elapsed / DURATION, 1);
    const eased = 1 - Math.pow(1-progress,3);
    ctx.clearRect(0,0,w,h);
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x1+(x2-x1)*eased, y1+(y2-y1)*eased);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function clearWinCanvas() {
  const canvas = $('win-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

// ══════════════════════════════════════════════════════
// BOARD UI
// ══════════════════════════════════════════════════════
const cells = document.querySelectorAll('.cell');

function renderCell(index, role, animate=true) {
  const cell = cells[index];
  cell.innerHTML = '';
  if (!role) { cell.classList.remove('taken'); return; }
  const icon = role === 'X' ? state.iconX : state.iconO;
  const render = iconRenderById(icon);
  const inner = document.createElement('span');
  inner.className = animate && state.animOn ? 'cell-inner' : '';
  inner.innerHTML = render;
  cell.appendChild(inner);
  cell.classList.add('taken');
}

function renderBoard(board) {
  board.forEach((v, i) => renderCell(i, v, false));
}

function resetBoardUI() {
  cells.forEach(cell => {
    cell.innerHTML = '';
    cell.classList.remove('taken','highlight','no-hover');
  });
  clearWinCanvas();
}

function setBoardInteractive(on, myTurn=true) {
  cells.forEach(cell => {
    const idx = parseInt(cell.dataset.index);
    const taken = !!state.board[idx];
    if (on && myTurn && !taken && !state.gameOver) {
      cell.classList.remove('no-hover');
    } else {
      cell.classList.add('no-hover');
    }
  });
}

// ══════════════════════════════════════════════════════
// SCOREBOARD + TURN
// ══════════════════════════════════════════════════════
function updateScoreboard() {
  $('sb-name-x').textContent = state.p1Name;
  $('sb-name-o').textContent = state.mode === 'bot' ? state.p2Name : state.p2Name;
  $('sb-score-x').textContent = state.scoreX;
  $('sb-score-o').textContent = state.scoreO;
  $('sb-icon-x').innerHTML = iconRenderById(state.iconX);
  $('sb-icon-o').innerHTML = iconRenderById(state.iconO);
}

function setTurnBadge(turn) {
  const badge = $('turn-badge');
  const name = turn === 'X' ? state.p1Name : state.p2Name;
  badge.textContent = `${name}'s Turn`;
  badge.classList.toggle('o-turn', turn === 'O');
}

function showResult(winner, myRoleOnline=null) {
  const banner = $('result-banner');
  const emoji = $('result-emoji');
  const text = $('result-text');
  banner.classList.remove('hidden');

  if (winner === 'draw') {
    emoji.textContent = '🤝';
    text.textContent = "It's a Draw!";
    if (state.mode !== 'online') state.stats.draws++;
  } else {
    // Determine display
    const winnerName = winner === 'X' ? state.p1Name : state.p2Name;
    text.textContent = `${winnerName} Wins!`;
    if (state.mode === 'online') {
      if (winner === myRoleOnline) {
        emoji.textContent = '🎉'; text.textContent = 'You Win! 🎉';
        state.stats.wins++;
      } else {
        emoji.textContent = '😔'; text.textContent = 'You Lose.';
        state.stats.losses++;
      }
    } else {
      emoji.textContent = '🏆';
      if (state.mode === 'bot' && winner === 'O') {
        emoji.textContent = '🤖'; text.textContent = 'Bot Wins! 😤';
        state.stats.losses++;
      } else {
        state.stats.wins++;
      }
    }
  }
  saveStats();
  updateLobbyStats();
}

function updateLobbyStats() {
  const { wins, losses, draws } = state.stats;
  const total = wins + losses + draws;
  $('st-wins').textContent = wins;
  $('st-losses').textContent = losses;
  $('st-draws').textContent = draws;
  $('st-wr').textContent = total ? Math.round(wins/total*100)+'%' : '0%';
}

// ══════════════════════════════════════════════════════
// GAME INIT (LOCAL / BOT)
// ══════════════════════════════════════════════════════
function startLocalGame(mode) {
  state.mode = mode;
  state.board = Array(9).fill(null);
  state.currentTurn = 'X';
  state.gameOver = false;
  state.scoreX = 0;
  state.scoreO = 0;
  resetBoardUI();

  $('game-mode-chip').textContent = mode === 'bot' ? `vs Bot (${state.botDifficulty})` : 'Local Play';
  $('online-status').classList.add('hidden');
  $('result-banner').classList.add('hidden');
  $('game-error').classList.add('hidden');
  updateScoreboard();
  setTurnBadge('X');
  setBoardInteractive(true, true);
  showScreen('game');
}

function doLocalMove(index) {
  if (state.gameOver || state.board[index]) return;
  if (state.mode === 'online') return;

  state.board[index] = state.currentTurn;
  renderCell(index, state.currentTurn);
  playSound('move');

  const result = checkWinner(state.board);
  if (result) {
    state.gameOver = true;
    setBoardInteractive(false);
    if (result.line.length) {
      drawWinLine(result.line);
      if (result.winner === 'X') state.scoreX++;
      else state.scoreO++;
    }
    setTimeout(() => {
      showResult(result.winner);
      playSound(result.winner === 'draw' ? 'draw' : 'win');
    }, 400);
    updateScoreboard();
    return;
  }

  state.currentTurn = state.currentTurn === 'X' ? 'O' : 'X';
  setTurnBadge(state.currentTurn);

  if (state.mode === 'bot' && state.currentTurn === 'O') {
    setBoardInteractive(false);
    setTimeout(doBotMove, 500);
  } else {
    setBoardInteractive(true, true);
  }
}

// ══════════════════════════════════════════════════════
// BOT AI
// ══════════════════════════════════════════════════════
function doBotMove() {
  if (state.gameOver) return;
  let idx;
  if (state.botDifficulty === 'easy')  idx = botEasy();
  else if (state.botDifficulty === 'medium') idx = botMedium();
  else idx = botHard();

  state.board[idx] = 'O';
  renderCell(idx, 'O');
  playSound('move');

  const result = checkWinner(state.board);
  if (result) {
    state.gameOver = true;
    setBoardInteractive(false);
    if (result.line.length) {
      drawWinLine(result.line);
      if (result.winner === 'X') state.scoreX++;
      else state.scoreO++;
    }
    setTimeout(() => {
      showResult(result.winner);
      playSound(result.winner === 'draw' ? 'draw' : 'win');
    }, 400);
    updateScoreboard();
    return;
  }

  state.currentTurn = 'X';
  setTurnBadge('X');
  setBoardInteractive(true, true);
}

function botEasy() {
  const empty = state.board.map((v,i)=>v?null:i).filter(v=>v!==null);
  return empty[Math.floor(Math.random()*empty.length)];
}

function botMedium() {
  if (Math.random() < 0.5) return botHard();
  return botEasy();
}

function botHard() {
  // Minimax
  const result = minimax([...state.board], 'O');
  return result.index;
}

function minimax(board, player) {
  const res = checkWinner(board);
  if (res) {
    if (res.winner === 'O') return { score: 10 };
    if (res.winner === 'X') return { score: -10 };
    return { score: 0 };
  }
  const empty = board.map((v,i)=>v?null:i).filter(v=>v!==null);
  const moves = [];
  for (const idx of empty) {
    const nb = [...board];
    nb[idx] = player;
    const r = minimax(nb, player === 'O' ? 'X' : 'O');
    moves.push({ index: idx, score: r.score });
  }
  if (player === 'O') return moves.reduce((a,b)=>b.score>a.score?b:a);
  return moves.reduce((a,b)=>b.score<a.score?b:a);
}

// ══════════════════════════════════════════════════════
// REMATCH
// ══════════════════════════════════════════════════════
function doRematch() {
  if (state.mode === 'online') {
    sendWS({ type: 'rematch' });
    return;
  }
  state.board = Array(9).fill(null);
  state.currentTurn = 'X';
  state.gameOver = false;
  resetBoardUI();
  $('result-banner').classList.add('hidden');
  setTurnBadge('X');
  setBoardInteractive(true, true);
}

// ══════════════════════════════════════════════════════
// ONLINE — WebSocket
// ══════════════════════════════════════════════════════
const WS_URL = (() => {
  const proto = location.protocol==='https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}`;
})();

function connectWS(onOpen) {
  if (state.ws) { try { state.ws.close(); } catch(_){} }
  state.ws = new WebSocket(WS_URL);
  state.ws.onopen = () => { state.reconnectAttempts=0; if(onOpen) onOpen(); };
  state.ws.onmessage = e => handleWSMessage(JSON.parse(e.data));
  state.ws.onclose = handleWSClose;
}
function sendWS(obj) {
  if (state.ws && state.ws.readyState === WebSocket.OPEN)
    state.ws.send(JSON.stringify(obj));
}
function handleWSClose() {
  if (state.mode !== 'online') return;
  state.reconnectAttempts++;
  if (state.reconnectAttempts > 5) { showGameError('Connection lost. Please refresh.'); return; }
  setTimeout(() => connectWS(() => {
    if (state.roomCode) sendWS({ type:'join', roomCode: state.roomCode });
  }), Math.min(state.reconnectAttempts*1200, 8000));
}

function handleWSMessage(msg) {
  switch(msg.type) {
    case 'created':
      state.myRole = msg.role;
      state.roomCode = msg.roomCode;
      showWaitingScreen(msg.roomCode);
      break;
    case 'joined':
      state.myRole = msg.role;
      state.roomCode = msg.roomCode;
      if (msg.board) {
        state.board = msg.board;
        state.currentTurn = msg.currentTurn;
        state.gameOver = msg.gameOver;
      }
      startOnlineGame();
      if (!msg.gameOver) {
        if (state.board.some(Boolean)) {
          renderBoard(state.board);
          setTurnBadge(state.currentTurn);
          setBoardInteractive(true, state.currentTurn === state.myRole);
        }
      } else {
        renderBoard(state.board);
        showResult(msg.winner, state.myRole);
      }
      break;
    case 'start':
      setOnlineDots(true, true);
      showGameError(''); $('game-error').classList.add('hidden');
      setTurnBadge(state.currentTurn);
      setBoardInteractive(true, state.currentTurn===state.myRole);
      break;
    case 'waiting':
      showWaitingScreen(state.roomCode);
      break;
    case 'move':
      state.board = msg.board;
      state.currentTurn = msg.currentTurn;
      renderCell(msg.move.index, msg.move.role);
      setTurnBadge(state.currentTurn);
      setBoardInteractive(true, state.currentTurn===state.myRole);
      playSound('move');
      clearGameError();
      break;
    case 'gameOver':
      state.board = msg.board;
      state.gameOver = true;
      renderCell(msg.move.index, msg.move.role);
      setBoardInteractive(false);
      setTimeout(() => {
        if (msg.line && msg.line.length) drawWinLine(msg.line);
        if (msg.winner !== 'draw') {
          if (msg.winner==='X') state.scoreX++;
          else state.scoreO++;
          updateScoreboard();
        }
        showResult(msg.winner, state.myRole);
        playSound(msg.winner==='draw'?'draw':'win');
        $('btn-rematch').style.display='inline-flex';
      }, 300);
      break;
    case 'rematch':
      state.board = msg.board;
      state.currentTurn = msg.currentTurn;
      state.gameOver = false;
      resetBoardUI();
      $('result-banner').classList.add('hidden');
      setTurnBadge(state.currentTurn);
      setBoardInteractive(true, state.currentTurn===state.myRole);
      break;
    case 'opponentLeft':
      setOnlineDots(msg.role!=='X', msg.role!=='O');
      showGameError('Opponent disconnected. Waiting 60s for reconnect…');
      break;
    case 'error':
      if (screens_online_visible()) showOnlineError(msg.message);
      else showGameError(msg.message);
      break;
  }
}

function screens_online_visible() {
  return $('screen-online').classList.contains('active');
}

function startOnlineGame() {
  state.mode = 'online';
  state.board = state.board.length ? state.board : Array(9).fill(null);
  state.gameOver = false;
  state.scoreX = 0; state.scoreO = 0;

  // Names
  if (state.myRole === 'X') {
    state.p1Name = state.p1Name || 'You';
    state.p2Name = state.p2Name || 'Opponent';
  } else {
    state.p1Name = state.p1Name || 'Opponent';
    state.p2Name = state.p2Name || 'You';
  }

  $('game-mode-chip').textContent = `Online · ${state.roomCode}`;
  $('result-banner').classList.add('hidden');
  $('game-error').classList.add('hidden');
  $('online-status').classList.remove('hidden');
  setOnlineDots(false, false);
  resetBoardUI();
  updateScoreboard();
  setTurnBadge(state.currentTurn);
  setBoardInteractive(false);
  showScreen('game');
}

function setOnlineDots(xOn, oOn) {
  const dx = $('ostatus-x'), dy = $('ostatus-o');
  dx.classList.toggle('on', xOn);
  dy.classList.toggle('on', oOn);
}

function showWaitingScreen(code) {
  $('display-code').textContent = code;
  const link = `${location.origin}/room/${code}`;
  $('share-link').value = link;
  showScreen('waiting');
}

// ══════════════════════════════════════════════════════
// ICON PICKER
// ══════════════════════════════════════════════════════
function buildIconPicker() {
  const container = $('icon-picker');
  container.innerHTML = '';
  const forRole = state.iconPickerFor;
  const selected = forRole === 'X' ? state.iconX : state.iconO;

  ICON_SECTIONS.forEach(section => {
    const sec = document.createElement('div');
    sec.className = 'icon-section';

    const title = document.createElement('div');
    title.className = 'icon-section-title' + (section.grad ? ' grad' : '');
    title.textContent = section.title;
    sec.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'icon-grid';

    section.icons.forEach(icon => {
      const tile = document.createElement('div');
      tile.className = 'icon-tile' + (icon.id === selected ? ' selected' : '');
      tile.innerHTML = icon.render;
      tile.title = icon.label || icon.id;
      tile.addEventListener('click', () => {
        if (forRole === 'X') state.iconX = icon.id;
        else state.iconO = icon.id;
        savePrefs();
        buildIconPicker();
        updateScoreboard();
        // Re-render board if in game
        if ($('screen-game').classList.contains('active')) renderBoard(state.board);
      });
      grid.appendChild(tile);
    });

    sec.appendChild(grid);
    container.appendChild(sec);
  });
}

// ══════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════
function openSettings() {
  $('p1-name').value = state.p1Name;
  $('p2-name').value = state.p2Name;
  $('tog-sound').checked = state.soundOn;
  $('tog-anim').checked = state.animOn;
  // Activate game tab
  activateModalTab('game');
  buildIconPicker();
  $('modal-settings').classList.remove('hidden');
}

function activateModalTab(name) {
  document.querySelectorAll('.mtab').forEach(t => t.classList.toggle('active', t.dataset.tab===name));
  document.querySelectorAll('.mtab-body').forEach(b => b.classList.toggle('active', b.id===`tab-${name}`));
}

// ══════════════════════════════════════════════════════
// ERROR HELPERS
// ══════════════════════════════════════════════════════
function showGameError(msg) { if (!msg) return; const el=$('game-error'); el.textContent=msg; el.classList.remove('hidden'); }
function clearGameError() { $('game-error').classList.add('hidden'); }
function showOnlineError(msg) { const el=$('online-error'); el.textContent=msg; el.classList.remove('hidden'); }
function clearOnlineError() { $('online-error').classList.add('hidden'); }

// ══════════════════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════════════════

// Lobby mode cards
$('card-local').addEventListener('click', () => startLocalGame('local'));
$('card-bot').addEventListener('click', () => showScreen('bot'));
$('card-online').addEventListener('click', () => { clearOnlineError(); showScreen('online'); });

// Bot difficulty
document.querySelectorAll('.diff-card').forEach(card => {
  card.addEventListener('click', () => {
    state.botDifficulty = card.dataset.diff;
    state.p2Name = `Bot (${state.botDifficulty})`;
    startLocalGame('bot');
  });
});

// Back buttons
$('back-bot').addEventListener('click', () => showScreen('lobby'));
$('back-online').addEventListener('click', () => showScreen('lobby'));

// Online create/join
$('btn-create').addEventListener('click', () => {
  clearOnlineError();
  connectWS(() => sendWS({ type:'create' }));
});
$('btn-join').addEventListener('click', doOnlineJoin);
$('input-code').addEventListener('keydown', e => e.key==='Enter' && doOnlineJoin());
$('input-code').addEventListener('input', () => {
  $('input-code').value = $('input-code').value.toUpperCase().replace(/[^A-Z0-9]/g,'');
  clearOnlineError();
});

function doOnlineJoin() {
  const code = $('input-code').value.trim().toUpperCase();
  if (code.length !== 6) { showOnlineError('Enter a valid 6-character code.'); return; }
  clearOnlineError();
  connectWS(() => sendWS({ type:'join', roomCode: code }));
}

// Waiting screen copy
$('btn-copy-code').addEventListener('click', () => copyText(state.roomCode||''));
$('btn-copy-link').addEventListener('click', () => copyText($('share-link').value));

// Board cells
cells.forEach(cell => {
  cell.addEventListener('click', () => {
    const idx = parseInt(cell.dataset.index);
    if (state.gameOver || state.board[idx] || cell.classList.contains('no-hover')) return;
    if (state.mode === 'online') {
      if (state.currentTurn !== state.myRole) { showGameError("Not your turn!"); setTimeout(clearGameError,1500); return; }
      sendWS({ type:'move', index: idx });
    } else {
      doLocalMove(idx);
    }
  });
});

// Rematch / Menu
$('btn-rematch').addEventListener('click', doRematch);
$('btn-to-lobby').addEventListener('click', () => {
  if (state.ws) { try { state.ws.close(); } catch(_){} state.ws=null; }
  state.mode=null; state.roomCode=null; state.myRole=null;
  showScreen('lobby');
  updateLobbyStats();
});

// Quit
$('btn-quit').addEventListener('click', () => {
  if (state.ws) { try { state.ws.close(); } catch(_){} state.ws=null; }
  state.mode=null; state.roomCode=null;
  showScreen('lobby');
  updateLobbyStats();
});

// Settings open/close
$('btn-open-settings').addEventListener('click', openSettings);
$('btn-close-settings').addEventListener('click', () => $('modal-settings').classList.add('hidden'));
$('modal-settings').addEventListener('click', e => { if(e.target===$('modal-settings')) $('modal-settings').classList.add('hidden'); });

// Modal tabs
document.querySelectorAll('.mtab').forEach(tab => {
  tab.addEventListener('click', () => activateModalTab(tab.dataset.tab));
});

// Icon picker "for" toggle
document.querySelectorAll('.icon-for-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.icon-for-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    state.iconPickerFor = btn.dataset.for;
    buildIconPicker();
  });
});

// Settings save on input
$('p1-name').addEventListener('input', () => { state.p1Name=$('p1-name').value||'Player 1'; savePrefs(); updateScoreboard(); });
$('p2-name').addEventListener('input', () => { state.p2Name=$('p2-name').value||'Player 2'; savePrefs(); updateScoreboard(); });
$('tog-sound').addEventListener('change', () => { state.soundOn=$('tog-sound').checked; savePrefs(); });
$('tog-anim').addEventListener('change',  () => { state.animOn=$('tog-anim').checked; savePrefs(); });
$('btn-reset-stats').addEventListener('click', () => {
  if (confirm('Reset all stats?')) {
    state.stats = {wins:0,losses:0,draws:0};
    saveStats(); updateLobbyStats();
    toast('Stats reset!');
  }
});

// ══════════════════════════════════════════════════════
// DEEP LINK  /room/XXXXXX
// ══════════════════════════════════════════════════════
(function checkDeepLink() {
  const m = location.pathname.match(/^\/room\/([A-Z0-9]{6})$/i);
  if (m) {
    const code = m[1].toUpperCase();
    $('input-code').value = code;
    showScreen('online');
    connectWS(() => sendWS({ type:'join', roomCode: code }));
  }
})();

// ══════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════
loadStats();
loadPrefs();
updateLobbyStats();
