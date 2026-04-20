/**
 * AirGames by WorksBeyond
 * script.js — complete rewrite fixing all online multiplayer bugs
 *
 * BUGS FIXED:
 * 1. $ helper defined before use (was hoisting issue with const)
 * 2. Online flow: 'created' → show waiting. 'joined' → show game (board may have state).
 *    'start' → unlock board for both players. Previously creator was never getting 'start' handled.
 * 3. Server now sends field 'turn' (not 'currentTurn') — all refs updated to match.
 * 4. Deep link: HTML/CSS/JS use absolute paths (/style.css, /script.js) — no 404s from /room/*.
 * 5. Board interactivity: online players correctly blocked until 'start' received.
 * 6. Waiting screen shown to creator; opponent gets game screen after joining.
 */

// ── $ helper — MUST be first ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ══════════════════════════════════════════════════════
// ICON CATALOGUE
// ══════════════════════════════════════════════════════
const ICON_SECTIONS = [
  {
    title: "Classic X & O", grad: false,
    icons: [
      { id:"x-classic", render:"✕" },
      { id:"o-classic", render:"○" },
      { id:"x-bold",    render:"✗" },
      { id:"o-dot",     render:"⊙" },
      { id:"x-box",     render:"⊠" },
      { id:"o-dbl",     render:"◎" },
    ]
  },
  {
    title: "✨ Neon & Styled", grad: true,
    icons: [
      { id:"x-blue",    render:"<span style='color:#4361ee;font-weight:900;font-family:Baloo 2,sans-serif'>✕</span>" },
      { id:"o-pink",    render:"<span style='color:#f72585;font-weight:900;font-family:Baloo 2,sans-serif'>○</span>" },
      { id:"x-green",   render:"<span style='color:#2ed573;font-weight:900;font-family:Baloo 2,sans-serif'>✕</span>" },
      { id:"o-gold",    render:"<span style='color:#f5a623;font-weight:900;font-family:Baloo 2,sans-serif'>○</span>" },
      { id:"x-red",     render:"<span style='color:#ff4757;font-weight:900;font-family:Baloo 2,sans-serif'>✕</span>" },
      { id:"o-teal",    render:"<span style='color:#00c9b1;font-weight:900;font-family:Baloo 2,sans-serif'>○</span>" },
      { id:"x-purple",  render:"<span style='color:#b44fe8;font-weight:900;font-family:Baloo 2,sans-serif'>✕</span>" },
      { id:"o-coral",   render:"<span style='color:#ff6b6b;font-weight:900;font-family:Baloo 2,sans-serif'>○</span>" },
      { id:"x-cyan",    render:"<span style='color:#00d2ff;font-weight:900;font-family:Baloo 2,sans-serif'>✕</span>" },
      { id:"o-lime",    render:"<span style='color:#adff2f;font-weight:900;font-family:Baloo 2,sans-serif'>○</span>" },
      { id:"x-mag",     render:"<span style='color:#ff00ff;font-weight:900;font-family:Baloo 2,sans-serif'>✕</span>" },
      { id:"o-sky",     render:"<span style='color:#87ceeb;font-weight:900;font-family:Baloo 2,sans-serif'>○</span>" },
    ]
  },
  {
    title: "⭐ Shapes & Symbols", grad: true,
    icons: [
      { id:"star",      render:"⭐" }, { id:"heart",    render:"❤️" },
      { id:"diamond",   render:"💎" }, { id:"fire",     render:"🔥" },
      { id:"bolt",      render:"⚡" }, { id:"crown",    render:"👑" },
      { id:"moon",      render:"🌙" }, { id:"sun",      render:"☀️" },
      { id:"snowflake", render:"❄️" }, { id:"flower",   render:"🌸" },
      { id:"skull",     render:"💀" }, { id:"ghost",    render:"👻" },
      { id:"target",    render:"🎯" }, { id:"gem",      render:"💠" },
      { id:"music",     render:"🎵" }, { id:"shield",   render:"🛡️" },
      { id:"swords",    render:"⚔️" }, { id:"bomb",     render:"💣" },
    ]
  },
  {
    title: "🐾 Animals", grad: false,
    icons: [
      { id:"cat",    render:"🐱" }, { id:"dog",    render:"🐶" },
      { id:"fox",    render:"🦊" }, { id:"wolf",   render:"🐺" },
      { id:"bear",   render:"🐻" }, { id:"tiger",  render:"🐯" },
      { id:"lion",   render:"🦁" }, { id:"panda",  render:"🐼" },
      { id:"frog",   render:"🐸" }, { id:"owl",    render:"🦉" },
      { id:"shark",  render:"🦈" }, { id:"eagle",  render:"🦅" },
    ]
  },
  {
    title: "🚀 Symbols & Objects", grad: false,
    icons: [
      { id:"rocket",  render:"🚀" }, { id:"alien",   render:"👽" },
      { id:"robot",   render:"🤖" }, { id:"ninja",   render:"🥷" },
      { id:"wizard",  render:"🧙" }, { id:"unicorn", render:"🦄" },
      { id:"dragon",  render:"🐉" }, { id:"dagger",  render:"🗡️" },
      { id:"trophy",  render:"🏆" }, { id:"dice",    render:"🎲" },
      { id:"chess",   render:"♟️" }, { id:"joker",   render:"🃏" },
    ]
  },
  {
    title: "🎨 Geometric", grad: false,
    icons: [
      { id:"sq-blue",  render:"<span style='color:#4361ee;font-size:26px'>■</span>" },
      { id:"sq-pink",  render:"<span style='color:#f72585;font-size:26px'>■</span>" },
      { id:"sq-green", render:"<span style='color:#2ed573;font-size:26px'>■</span>" },
      { id:"ci-blue",  render:"<span style='color:#4361ee;font-size:26px'>●</span>" },
      { id:"ci-gold",  render:"<span style='color:#f5a623;font-size:26px'>●</span>" },
      { id:"ci-teal",  render:"<span style='color:#00c9b1;font-size:26px'>●</span>" },
      { id:"tr-pur",   render:"<span style='color:#b44fe8;font-size:22px'>▲</span>" },
      { id:"tr-red",   render:"<span style='color:#ff4757;font-size:22px'>▲</span>" },
      { id:"dia-gld",  render:"<span style='color:#f5a623;font-size:22px'>◆</span>" },
      { id:"dia-blu",  render:"<span style='color:#4361ee;font-size:22px'>◆</span>" },
      { id:"hex-pnk",  render:"<span style='color:#f72585;font-size:22px'>⬡</span>" },
      { id:"hex-grn",  render:"<span style='color:#2ed573;font-size:22px'>⬡</span>" },
    ]
  }
];

function iconById(id) {
  for (const sec of ICON_SECTIONS) {
    const found = sec.icons.find(i => i.id === id);
    if (found) return found.render;
  }
  return id.startsWith("x") ? "✕" : "○";
}

// ══════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════
const S = {
  mode:     null,       // 'local' | 'bot' | 'online'
  board:    Array(9).fill(null),
  turn:     'X',        // whose turn it is
  over:     false,
  scoreX:   0,
  scoreO:   0,
  botDiff:  'medium',
  // Online
  ws:       null,
  myRole:   null,       // 'X' or 'O'
  roomCode: null,
  reconnTries: 0,
  // Prefs
  p1Name:   'Player 1',
  p2Name:   'Player 2',
  soundOn:  true,
  animOn:   true,
  iconX:    'x-classic',
  iconO:    'o-classic',
  pickerFor:'X',
  // Persistent
  stats: { wins:0, losses:0, draws:0 },
};

// ══════════════════════════════════════════════════════
// PERSISTENCE
// ══════════════════════════════════════════════════════
function loadAll() {
  try {
    const st = JSON.parse(localStorage.getItem('ag_stats')||'{}');
    S.stats = { wins:st.wins||0, losses:st.losses||0, draws:st.draws||0 };
    const pr = JSON.parse(localStorage.getItem('ag_prefs')||'{}');
    if (pr.p1Name) S.p1Name = pr.p1Name;
    if (pr.p2Name) S.p2Name = pr.p2Name;
    if (pr.iconX)  S.iconX  = pr.iconX;
    if (pr.iconO)  S.iconO  = pr.iconO;
    if (typeof pr.soundOn==='boolean') S.soundOn = pr.soundOn;
    if (typeof pr.animOn ==='boolean') S.animOn  = pr.animOn;
  } catch(_){}
}
function saveStats() { try { localStorage.setItem('ag_stats', JSON.stringify(S.stats)); } catch(_){} }
function savePrefs() {
  try {
    localStorage.setItem('ag_prefs', JSON.stringify({
      p1Name:S.p1Name, p2Name:S.p2Name,
      iconX:S.iconX, iconO:S.iconO,
      soundOn:S.soundOn, animOn:S.animOn
    }));
  } catch(_){}
}

// ══════════════════════════════════════════════════════
// SCREEN MANAGER
// ══════════════════════════════════════════════════════
const SCREEN_IDS = ['lobby','bot','online','waiting','game'];
function showScreen(name) {
  SCREEN_IDS.forEach(id => {
    const el = $('screen-'+id);
    if (el) el.classList.toggle('active', id===name);
  });
}

// ══════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════
let toastTimer;
function showToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.add('hidden'), 2200);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch(_) {
    const t = document.createElement('textarea');
    t.value = text; document.body.appendChild(t); t.select();
    document.execCommand('copy'); document.body.removeChild(t);
  }
  showToast('Copied! ✓');
}

// ══════════════════════════════════════════════════════
// SOUND  (Web Audio — no files needed)
// ══════════════════════════════════════════════════════
let actx;
function playSound(type) {
  if (!S.soundOn) return;
  try {
    if (!actx) actx = new (window.AudioContext||window.webkitAudioContext)();
    const t = actx.currentTime;
    if (type==='move') {
      const o=actx.createOscillator(), g=actx.createGain();
      o.connect(g); g.connect(actx.destination);
      o.frequency.setValueAtTime(480,t);
      o.frequency.exponentialRampToValueAtTime(620,t+0.08);
      g.gain.setValueAtTime(0.10,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.15);
      o.start(t); o.stop(t+0.15);
    } else if (type==='win') {
      [523,659,784,1047].forEach((f,i)=>{
        const o=actx.createOscillator(),g=actx.createGain();
        o.connect(g); g.connect(actx.destination);
        o.frequency.value=f;
        const s=t+i*0.13;
        g.gain.setValueAtTime(0,s);
        g.gain.linearRampToValueAtTime(0.12,s+0.05);
        g.gain.exponentialRampToValueAtTime(0.001,s+0.32);
        o.start(s); o.stop(s+0.32);
      });
    } else if (type==='draw') {
      const o=actx.createOscillator(),g=actx.createGain();
      o.connect(g); g.connect(actx.destination);
      o.frequency.setValueAtTime(400,t);
      o.frequency.exponentialRampToValueAtTime(260,t+0.28);
      g.gain.setValueAtTime(0.08,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.30);
      o.start(t); o.stop(t+0.30);
    }
  } catch(_){}
}

// ══════════════════════════════════════════════════════
// WIN CHECK
// ══════════════════════════════════════════════════════
const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function checkWin(board) {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a]===board[b] && board[a]===board[c])
      return { winner:board[a], line:[a,b,c] };
  }
  if (board.every(Boolean)) return { winner:'draw', line:[] };
  return null;
}

// ══════════════════════════════════════════════════════
// WIN LINE CANVAS
// ══════════════════════════════════════════════════════
const WIN_PTS = {
  '0,1,2':[.17,.17,.83,.17], '3,4,5':[.17,.50,.83,.50],
  '6,7,8':[.17,.83,.83,.83], '0,3,6':[.17,.17,.17,.83],
  '1,4,7':[.50,.17,.50,.83], '2,5,8':[.83,.17,.83,.83],
  '0,4,8':[.17,.17,.83,.83], '2,4,6':[.83,.17,.17,.83],
};
function drawWinLine(line) {
  const cv = $('win-canvas'); if(!cv) return;
  const key = line.join(','), pts = WIN_PTS[key]; if(!pts) return;
  const w=cv.offsetWidth, h=cv.offsetHeight;
  cv.width=w; cv.height=h;
  const ctx=cv.getContext('2d');
  const [rx1,ry1,rx2,ry2]=pts;
  const x1=rx1*w,y1=ry1*h,x2=rx2*w,y2=ry2*h;
  const grad=ctx.createLinearGradient(x1,y1,x2,y2);
  grad.addColorStop(0,'#6c3be8');
  grad.addColorStop(.5,'#f72585');
  grad.addColorStop(1,'#f5a623');
  const DURATION=360, t0=performance.now();
  function step(now) {
    const p=Math.min((now-t0)/DURATION,1);
    const e=1-Math.pow(1-p,3);
    ctx.clearRect(0,0,w,h);
    ctx.beginPath(); ctx.moveTo(x1,y1);
    ctx.lineTo(x1+(x2-x1)*e, y1+(y2-y1)*e);
    ctx.strokeStyle=grad; ctx.lineWidth=6; ctx.lineCap='round'; ctx.stroke();
    if(p<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function clearCanvas() {
  const cv=$('win-canvas'); if(!cv) return;
  cv.getContext('2d').clearRect(0,0,cv.width,cv.height);
}

// ══════════════════════════════════════════════════════
// BOARD UI
// ══════════════════════════════════════════════════════
const CELLS = document.querySelectorAll('.cell');

function renderCell(idx, role, animate=true) {
  const cell = CELLS[idx];
  cell.innerHTML = '';
  if (!role) { cell.classList.remove('taken'); return; }
  const span = document.createElement('span');
  span.className = (animate && S.animOn) ? 'cell-inner' : '';
  span.innerHTML = iconById(role==='X' ? S.iconX : S.iconO);
  cell.appendChild(span);
  cell.classList.add('taken');
}

function renderBoard(board) {
  board.forEach((v,i) => renderCell(i, v, false));
}

function resetBoard() {
  CELLS.forEach(c => { c.innerHTML=''; c.classList.remove('taken','no-click'); });
  clearCanvas();
}

// Enable/disable clicking on cells
function setClickable(canClick) {
  CELLS.forEach(c => {
    if (canClick && !c.classList.contains('taken')) {
      c.classList.remove('no-click');
    } else if (!canClick) {
      c.classList.add('no-click');
    }
  });
}

// For online: only cells valid for myRole and current turn
function setOnlineClickable() {
  const myTurn = !S.over && S.turn === S.myRole;
  CELLS.forEach(c => {
    const taken = c.classList.contains('taken');
    if (myTurn && !taken) c.classList.remove('no-click');
    else c.classList.add('no-click');
  });
}

// ══════════════════════════════════════════════════════
// SCOREBOARD / TURN BADGE
// ══════════════════════════════════════════════════════
function refreshScoreboard() {
  $('sb-name-x').textContent  = S.p1Name;
  $('sb-name-o').textContent  = S.p2Name;
  $('sb-score-x').textContent = S.scoreX;
  $('sb-score-o').textContent = S.scoreO;
  $('sb-icon-x').innerHTML    = iconById(S.iconX);
  $('sb-icon-o').innerHTML    = iconById(S.iconO);
}

function setTurnBadge(turn) {
  const badge = $('turn-badge');
  const name  = (turn==='X') ? S.p1Name : S.p2Name;
  badge.textContent = `${name}'s Turn`;
  badge.classList.toggle('o-turn', turn==='O');
}

// ══════════════════════════════════════════════════════
// RESULT BANNER
// ══════════════════════════════════════════════════════
function showResult(winner, onlineRole=null) {
  const emoji = $('result-emoji');
  const text  = $('result-text');
  $('result-banner').classList.remove('hidden');

  if (winner==='draw') {
    emoji.textContent='🤝'; text.textContent="It's a Draw!";
    if (S.mode!=='online') S.stats.draws++;
  } else if (S.mode==='online') {
    if (winner===onlineRole) {
      emoji.textContent='🎉'; text.textContent='You Win! 🎉'; S.stats.wins++;
    } else {
      emoji.textContent='😔'; text.textContent='You Lose.'; S.stats.losses++;
    }
  } else {
    emoji.textContent='🏆';
    const winnerName = (winner==='X') ? S.p1Name : S.p2Name;
    text.textContent = `${winnerName} Wins!`;
    if (S.mode==='bot' && winner==='O') {
      emoji.textContent='🤖'; text.textContent='Bot Wins! 😤'; S.stats.losses++;
    } else {
      S.stats.wins++;
    }
  }
  saveStats(); updateLobbyStats();
}

function updateLobbyStats() {
  const {wins,losses,draws}=S.stats, tot=wins+losses+draws;
  $('st-wins').textContent   = wins;
  $('st-losses').textContent = losses;
  $('st-draws').textContent  = draws;
  $('st-wr').textContent     = tot ? Math.round(wins/tot*100)+'%' : '0%';
}

// ══════════════════════════════════════════════════════
// LOCAL / BOT GAME
// ══════════════════════════════════════════════════════
function startLocalGame(mode) {
  S.mode   = mode;
  S.board  = Array(9).fill(null);
  S.turn   = 'X';
  S.over   = false;
  S.scoreX = 0; S.scoreO = 0;

  $('game-mode-chip').textContent = mode==='bot' ? `vs Bot · ${S.botDiff}` : 'Local Play';
  $('online-status').classList.add('hidden');
  $('result-banner').classList.add('hidden');
  $('game-error').classList.add('hidden');
  resetBoard();
  refreshScoreboard();
  setTurnBadge('X');
  setClickable(true);
  showScreen('game');
}

function doLocalMove(idx) {
  if (S.over || S.board[idx]) return;

  S.board[idx] = S.turn;
  renderCell(idx, S.turn);
  playSound('move');

  const res = checkWin(S.board);
  if (res) {
    S.over = true;
    setClickable(false);
    if (res.line.length) {
      drawWinLine(res.line);
      if (res.winner==='X') S.scoreX++; else S.scoreO++;
    }
    setTimeout(()=>{ showResult(res.winner); playSound(res.winner==='draw'?'draw':'win'); }, 400);
    refreshScoreboard();
    return;
  }

  S.turn = S.turn==='X' ? 'O' : 'X';
  setTurnBadge(S.turn);

  if (S.mode==='bot' && S.turn==='O') {
    setClickable(false);
    setTimeout(doBotMove, 480);
  }
}

// ── BOT AI ────────────────────────────────────────────
function doBotMove() {
  if (S.over) return;
  const idx = S.botDiff==='easy' ? botEasy()
            : S.botDiff==='medium' ? botMed()
            : botHard();

  S.board[idx] = 'O';
  renderCell(idx, 'O');
  playSound('move');

  const res = checkWin(S.board);
  if (res) {
    S.over = true;
    setClickable(false);
    if (res.line.length) {
      drawWinLine(res.line);
      if (res.winner==='X') S.scoreX++; else S.scoreO++;
    }
    setTimeout(()=>{ showResult(res.winner); playSound(res.winner==='draw'?'draw':'win'); }, 400);
    refreshScoreboard();
    return;
  }

  S.turn = 'X';
  setTurnBadge('X');
  setClickable(true);
}

function empty(board) { return board.map((v,i)=>v?null:i).filter(v=>v!==null); }
function botEasy() { const e=empty(S.board); return e[Math.floor(Math.random()*e.length)]; }
function botMed()  { return Math.random()<.5 ? botHard() : botEasy(); }
function botHard() { return minimax([...S.board],'O').index; }
function minimax(board, player) {
  const r=checkWin(board);
  if (r) return { score: r.winner==='O'?10 : r.winner==='X'?-10 : 0 };
  const moves=empty(board).map(idx=>{
    const b=[...board]; b[idx]=player;
    return { index:idx, score:minimax(b, player==='O'?'X':'O').score };
  });
  return player==='O' ? moves.reduce((a,b)=>b.score>a.score?b:a)
                      : moves.reduce((a,b)=>b.score<a.score?b:a);
}

// ── REMATCH ───────────────────────────────────────────
function doRematch() {
  if (S.mode==='online') { sendWS({type:'rematch'}); return; }
  S.board=Array(9).fill(null); S.turn='X'; S.over=false;
  resetBoard();
  $('result-banner').classList.add('hidden');
  setTurnBadge('X');
  setClickable(true);
}

// ══════════════════════════════════════════════════════
// ONLINE — WebSocket
// ══════════════════════════════════════════════════════
function wsURL() {
  const proto = location.protocol==='https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}`;
}

function connectWS(onOpen) {
  if (S.ws) { try { S.ws.close(); } catch(_){} S.ws=null; }
  const ws = new WebSocket(wsURL());
  ws.onopen    = () => { S.reconnTries=0; onOpen && onOpen(); };
  ws.onmessage = e => handleWS(JSON.parse(e.data));
  ws.onclose   = handleWSClose;
  ws.onerror   = () => {}; // onclose fires after
  S.ws = ws;
}

function sendWS(obj) {
  if (S.ws && S.ws.readyState===WebSocket.OPEN) S.ws.send(JSON.stringify(obj));
}

function handleWSClose() {
  if (S.mode!=='online') return;
  S.reconnTries++;
  if (S.reconnTries>5) { showGameErr('Connection lost. Please refresh the page.'); return; }
  const delay = Math.min(S.reconnTries*1000, 8000);
  setTimeout(()=>{
    connectWS(()=>{
      if (S.roomCode) sendWS({type:'join', roomCode:S.roomCode});
    });
  }, delay);
}

// ── HANDLE INCOMING MESSAGES ──────────────────────────
function handleWS(msg) {
  console.log('[WS RX]', msg); // DEBUG — visible in browser console

  switch (msg.type) {

    // ── CREATED: You are X, show waiting screen ───────
    case 'created':
      S.myRole   = msg.role;       // 'X'
      S.roomCode = msg.roomCode;
      showWaiting(msg.roomCode);
      break;

    // ── JOINED: You joined as X or O, go to game screen
    // Server sends 'joined' only to the joiner, then broadcasts 'start' to both.
    // So here we just set up state and go to game screen.
    // Board interactivity is OFF until 'start' is received.
    case 'joined':
      S.myRole   = msg.role;
      S.roomCode = msg.roomCode;
      S.board    = msg.board  || Array(9).fill(null);
      S.turn     = msg.turn   || 'X';
      S.over     = msg.over   || false;

      setupOnlineGameScreen();

      if (S.over) {
        renderBoard(S.board);
        showResult(msg.winner, S.myRole);
      } else if (S.board.some(Boolean)) {
        // Reconnecting mid-game
        renderBoard(S.board);
        setTurnBadge(S.turn);
        setOnlineClickable();
      }
      break;

    // ── START: Both players connected — unlock board ──
    case 'start':
      S.board = msg.board || S.board;
      S.turn  = msg.turn  || 'X';

      setConnLabel('Both connected · Playing!');
      setDot('x', true); setDot('o', true);
      hideGameErr();
      setTurnBadge(S.turn);
      setOnlineClickable();
      break;

    // ── MOVE: Opponent moved ──────────────────────────
    case 'move':
      S.board = msg.board;
      S.turn  = msg.turn;
      renderCell(msg.move.index, msg.move.role);
      setTurnBadge(S.turn);
      setOnlineClickable();
      playSound('move');
      hideGameErr();
      break;

    // ── GAME OVER ─────────────────────────────────────
    case 'gameOver':
      S.board = msg.board;
      S.over  = true;
      renderCell(msg.move.index, msg.move.role);
      setClickable(false);
      setTimeout(()=>{
        if (msg.line && msg.line.length) drawWinLine(msg.line);
        if (msg.winner!=='draw') {
          if (msg.winner==='X') S.scoreX++; else S.scoreO++;
          refreshScoreboard();
        }
        showResult(msg.winner, S.myRole);
        playSound(msg.winner==='draw'?'draw':'win');
      }, 300);
      break;

    // ── REMATCH ───────────────────────────────────────
    case 'rematch':
      S.board = msg.board || Array(9).fill(null);
      S.turn  = msg.turn  || 'X';
      S.over  = false;
      resetBoard();
      $('result-banner').classList.add('hidden');
      setTurnBadge(S.turn);
      setOnlineClickable();
      break;

    // ── OPPONENT LEFT ─────────────────────────────────
    case 'opponentLeft':
      const leftRole = msg.role;
      setDot(leftRole.toLowerCase(), false);
      setConnLabel('Opponent disconnected…');
      showGameErr('Opponent disconnected. Waiting up to 60s for them to rejoin…');
      setClickable(false);
      break;

    // ── ERROR ─────────────────────────────────────────
    case 'error':
      if ($('screen-online').classList.contains('active')) showOnlineErr(msg.message);
      else showGameErr(msg.message);
      break;
  }
}

function setupOnlineGameScreen() {
  S.mode   = 'online';
  S.scoreX = 0; S.scoreO = 0;
  S.over   = false;

  $('game-mode-chip').textContent = `Online · ${S.roomCode}`;
  $('result-banner').classList.add('hidden');
  $('game-error').classList.add('hidden');
  $('online-status').classList.remove('hidden');

  setDot('x', false); setDot('o', false);
  setConnLabel('waiting for opponent…');
  resetBoard();
  refreshScoreboard();
  setTurnBadge(S.turn);
  setClickable(false); // locked until 'start'
  showScreen('game');
}

function showWaiting(code) {
  $('display-code').textContent = code;
  $('share-link').value = `${location.origin}/room/${code}`;
  showScreen('waiting');
}

function setDot(role, on) {
  const el = $('ostatus-'+role); // ostatus-x or ostatus-o
  if (el) el.classList.toggle('on', on);
}

function setConnLabel(text) {
  const el = $('conn-label');
  if (el) el.textContent = text;
}

// ══════════════════════════════════════════════════════
// ERROR HELPERS
// ══════════════════════════════════════════════════════
function showGameErr(msg) {
  if (!msg) return;
  const el = $('game-error');
  el.textContent = msg; el.classList.remove('hidden');
}
function hideGameErr() { $('game-error').classList.add('hidden'); }
function showOnlineErr(msg) {
  const el = $('online-error');
  el.textContent = msg; el.classList.remove('hidden');
}
function clearOnlineErr() { $('online-error').classList.add('hidden'); }

// ══════════════════════════════════════════════════════
// SETTINGS MODAL + ICON PICKER
// ══════════════════════════════════════════════════════
function openSettings() {
  $('p1-name').value      = S.p1Name;
  $('p2-name').value      = S.p2Name;
  $('tog-sound').checked  = S.soundOn;
  $('tog-anim').checked   = S.animOn;
  activateTab('game');
  buildPicker();
  $('modal-settings').classList.remove('hidden');
}

function activateTab(name) {
  document.querySelectorAll('.mtab').forEach(t => t.classList.toggle('active', t.dataset.tab===name));
  document.querySelectorAll('.mtab-body').forEach(b => b.classList.toggle('active', b.id===`tab-${name}`));
}

function buildPicker() {
  const container = $('icon-picker');
  container.innerHTML = '';
  const forRole  = S.pickerFor;
  const selected = forRole==='X' ? S.iconX : S.iconO;

  ICON_SECTIONS.forEach(section => {
    const div  = document.createElement('div'); div.className='icon-section';
    const ttl  = document.createElement('div');
    ttl.className = 'icon-section-title' + (section.grad?' grad':'');
    ttl.textContent = section.title;
    div.appendChild(ttl);
    const grid = document.createElement('div'); grid.className='icon-grid';

    section.icons.forEach(icon => {
      const tile = document.createElement('div');
      tile.className = 'icon-tile' + (icon.id===selected?' selected':'');
      tile.innerHTML = icon.render;
      tile.title     = icon.id;
      tile.addEventListener('click', ()=>{
        if (forRole==='X') S.iconX=icon.id; else S.iconO=icon.id;
        savePrefs(); buildPicker(); refreshScoreboard();
        if ($('screen-game').classList.contains('active')) renderBoard(S.board);
      });
      grid.appendChild(tile);
    });

    div.appendChild(grid);
    container.appendChild(div);
  });
}

// ══════════════════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════════════════

// Lobby
$('card-local').addEventListener('click',   ()=>startLocalGame('local'));
$('card-bot').addEventListener('click',     ()=>showScreen('bot'));
$('card-online').addEventListener('click',  ()=>{ clearOnlineErr(); showScreen('online'); });

// Bot difficulty
document.querySelectorAll('.diff-card').forEach(card=>{
  card.addEventListener('click', ()=>{
    S.botDiff  = card.dataset.diff;
    S.p2Name   = `Bot (${S.botDiff})`;
    startLocalGame('bot');
  });
});

// Back buttons
$('back-bot').addEventListener('click',    ()=>showScreen('lobby'));
$('back-online').addEventListener('click', ()=>showScreen('lobby'));
$('waiting-back').addEventListener('click',()=>{
  if (S.ws) { try{S.ws.close();}catch(_){} S.ws=null; }
  S.roomCode=null; S.myRole=null;
  showScreen('online');
});

// Online create
$('btn-create').addEventListener('click', ()=>{
  clearOnlineErr();
  connectWS(()=>sendWS({type:'create'}));
});

// Online join
$('btn-join').addEventListener('click', tryJoin);
$('input-code').addEventListener('keydown', e=>e.key==='Enter'&&tryJoin());
$('input-code').addEventListener('input', ()=>{
  $('input-code').value = $('input-code').value.toUpperCase().replace(/[^A-Z0-9]/g,'');
  clearOnlineErr();
});
function tryJoin() {
  const code = $('input-code').value.trim().toUpperCase();
  if (code.length!==6) { showOnlineErr('Enter a valid 6-character room code.'); return; }
  clearOnlineErr();
  connectWS(()=>sendWS({type:'join', roomCode:code}));
}

// Waiting screen copy
$('btn-copy-code').addEventListener('click', ()=>copyText(S.roomCode||''));
$('btn-copy-link').addEventListener('click', ()=>copyText($('share-link').value));

// Board cells
CELLS.forEach(cell=>{
  cell.addEventListener('click', ()=>{
    const idx = parseInt(cell.dataset.index);
    if (S.over || cell.classList.contains('taken') || cell.classList.contains('no-click')) return;

    if (S.mode==='online') {
      if (S.turn!==S.myRole) {
        showGameErr("Not your turn!"); setTimeout(hideGameErr, 1500);
        return;
      }
      sendWS({type:'move', index:idx});
    } else {
      doLocalMove(idx);
    }
  });
});

// Result buttons
$('btn-rematch').addEventListener('click',  doRematch);
$('btn-to-lobby').addEventListener('click', goToLobby);
$('btn-quit').addEventListener('click',     goToLobby);

function goToLobby() {
  if (S.ws) { try{S.ws.close();}catch(_){} S.ws=null; }
  S.mode=null; S.roomCode=null; S.myRole=null;
  showScreen('lobby'); updateLobbyStats();
}

// Settings
$('btn-open-settings').addEventListener('click',  openSettings);
$('btn-close-settings').addEventListener('click', ()=>$('modal-settings').classList.add('hidden'));
$('modal-settings').addEventListener('click', e=>{
  if (e.target===$('modal-settings')) $('modal-settings').classList.add('hidden');
});
document.querySelectorAll('.mtab').forEach(t=>t.addEventListener('click',()=>activateTab(t.dataset.tab)));

document.querySelectorAll('.icon-for-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.icon-for-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    S.pickerFor=btn.dataset.for;
    buildPicker();
  });
});

$('p1-name').addEventListener('input', ()=>{ S.p1Name=$('p1-name').value||'Player 1'; savePrefs(); refreshScoreboard(); });
$('p2-name').addEventListener('input', ()=>{ S.p2Name=$('p2-name').value||'Player 2'; savePrefs(); refreshScoreboard(); });
$('tog-sound').addEventListener('change', ()=>{ S.soundOn=$('tog-sound').checked; savePrefs(); });
$('tog-anim').addEventListener('change',  ()=>{ S.animOn=$('tog-anim').checked;  savePrefs(); });
$('btn-reset-stats').addEventListener('click', ()=>{
  if (confirm('Reset all stats?')) {
    S.stats={wins:0,losses:0,draws:0};
    saveStats(); updateLobbyStats(); showToast('Stats reset!');
  }
});

// ══════════════════════════════════════════════════════
// DEEP LINK  /room/XXXXXX
// Auto-join when opened via shared link
// ══════════════════════════════════════════════════════
(function checkDeepLink() {
  const m = location.pathname.match(/^\/room\/([A-Z0-9]{6})$/i);
  if (!m) return;
  const code = m[1].toUpperCase();
  $('input-code').value = code;
  // Go to online screen visually, then connect
  showScreen('online');
  connectWS(()=>sendWS({type:'join', roomCode:code}));
})();

// ══════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════
loadAll();
updateLobbyStats();
