/**
 * AirGames by WorksBeyond — Frontend Game Script
 * Handles WebSocket connection, room management, and all game UI
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const WS_URL = (() => {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}`;
})();

const WIN_LINE_COORDS = {
  // [x1, y1, x2, y2] in SVG units (3x3 grid, center of each cell)
  "0,1,2": [0.5, 0.5, 2.5, 0.5],
  "3,4,5": [0.5, 1.5, 2.5, 1.5],
  "6,7,8": [0.5, 2.5, 2.5, 2.5],
  "0,3,6": [0.5, 0.5, 0.5, 2.5],
  "1,4,7": [1.5, 0.5, 1.5, 2.5],
  "2,5,8": [2.5, 0.5, 2.5, 2.5],
  "0,4,8": [0.5, 0.5, 2.5, 2.5],
  "2,4,6": [2.5, 0.5, 0.5, 2.5],
};

// ─── State ────────────────────────────────────────────────────────────────────

let ws = null;
let myRole = null;      // "X" or "O"
let roomCode = null;
let board = Array(9).fill(null);
let currentTurn = "X";
let gameOver = false;
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;

// ─── DOM Refs ─────────────────────────────────────────────────────────────────

const screens = {
  lobby:   document.getElementById("screen-lobby"),
  waiting: document.getElementById("screen-waiting"),
  game:    document.getElementById("screen-game"),
};

const $ = id => document.getElementById(id);

// Lobby
const btnCreate   = $("btn-create");
const btnJoin     = $("btn-join");
const inputCode   = $("input-code");
const lobbyError  = $("lobby-error");

// Waiting
const displayCode = $("display-code");
const shareLink   = $("share-link");
const btnCopyCode = $("btn-copy-code");
const btnCopyLink = $("btn-copy-link");

// Game
const gameRoomCode  = $("game-room-code");
const btnCopyIngame = $("btn-copy-ingame");
const dotX          = $("dot-x");
const dotO          = $("dot-o");
const turnIndicator = $("turn-indicator");
const boardEl       = $("board");
const cells         = document.querySelectorAll(".cell");
const gameResult    = $("game-result");
const resultText    = $("result-text");
const btnRematch    = $("btn-rematch");
const gameError     = $("game-error");
const winLineSvg    = $("win-line-svg");
const winLineEl     = $("win-line");

const toast         = $("toast");

// ─── Screen Manager ───────────────────────────────────────────────────────────

function showScreen(name) {
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle("active", k === name));
}

// ─── Toast ────────────────────────────────────────────────────────────────────

let toastTimer;
function showToast(msg = "Copied!") {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2000);
}

// ─── Copy Helper ──────────────────────────────────────────────────────────────

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied!");
  } catch {
    // Fallback
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    showToast("Copied!");
  }
}

// ─── WebSocket Setup ──────────────────────────────────────────────────────────

function connectWS(onOpen) {
  ws = new WebSocket(WS_URL);
  ws.onopen = () => {
    reconnectAttempts = 0;
    if (onOpen) onOpen();
  };
  ws.onmessage = e => handleMessage(JSON.parse(e.data));
  ws.onclose = handleDisconnect;
  ws.onerror = () => { /* onclose fires after */ };
}

function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function handleDisconnect() {
  if (reconnectAttempts >= MAX_RECONNECT) {
    showGameError("Connection lost. Please refresh.");
    return;
  }
  reconnectAttempts++;
  const delay = Math.min(1000 * reconnectAttempts, 8000);
  setTimeout(() => {
    connectWS(() => {
      // Rejoin room if we had one
      if (roomCode) {
        send({ type: "join", roomCode });
      }
    });
  }, delay);
}

// ─── Message Handler ──────────────────────────────────────────────────────────

function handleMessage(msg) {
  switch (msg.type) {
    case "created":
      myRole = msg.role;
      roomCode = msg.roomCode;
      setWaitingScreen(roomCode);
      break;

    case "joined":
      myRole = msg.role;
      roomCode = msg.roomCode;
      // If game was already in progress, restore state
      if (msg.board) {
        board = msg.board;
        currentTurn = msg.currentTurn;
        gameOver = msg.gameOver;
        renderBoard(board);
        if (msg.gameOver) {
          // Show result without re-triggering win line (simplified)
          showResult(msg.winner === "draw" ? "draw" : msg.winner);
        }
      }
      // If joining as O into fresh room, go to game
      if (msg.gameOver || (msg.board && msg.board.some(Boolean))) {
        setGameScreen();
      } else {
        // Wait for start message or show game screen
        setGameScreen();
        setTurnUI(currentTurn);
        setOnlineStatus("O", false);
        setOnlineStatus("X", false);
      }
      break;

    case "start":
      setGameScreen();
      setOnlineStatus("X", true);
      setOnlineStatus("O", true);
      showTurnIndicator();
      break;

    case "waiting":
      showScreen("waiting");
      break;

    case "move":
      board = msg.board;
      currentTurn = msg.currentTurn;
      animateMove(msg.move.index, msg.move.role);
      setTurnUI(currentTurn);
      clearGameError();
      playSound("move");
      break;

    case "gameOver":
      board = msg.board;
      gameOver = true;
      animateMove(msg.move.index, msg.move.role);
      setTimeout(() => {
        showWinLine(msg.line);
        showResult(msg.winner);
        btnRematch.classList.remove("hidden");
        playSound("win");
      }, 220);
      break;

    case "rematch":
      board = msg.board;
      currentTurn = msg.currentTurn;
      gameOver = false;
      resetBoardUI();
      setTurnUI(currentTurn);
      gameResult.classList.add("hidden");
      btnRematch.classList.add("hidden");
      clearGameError();
      break;

    case "opponentLeft":
      setOnlineStatus(msg.role, false);
      showGameError(`Opponent disconnected. Waiting for reconnect…`);
      break;

    case "error":
      if (screens.lobby.classList.contains("active")) {
        showLobbyError(msg.message);
      } else {
        showGameError(msg.message);
      }
      break;
  }
}

// ─── Lobby Logic ──────────────────────────────────────────────────────────────

function showLobbyError(msg) {
  lobbyError.textContent = msg;
  lobbyError.classList.remove("hidden");
}
function clearLobbyError() { lobbyError.classList.add("hidden"); }

btnCreate.addEventListener("click", () => {
  clearLobbyError();
  connectWS(() => send({ type: "create" }));
});

btnJoin.addEventListener("click", () => doJoin());
inputCode.addEventListener("keydown", e => e.key === "Enter" && doJoin());
inputCode.addEventListener("input", () => {
  inputCode.value = inputCode.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  clearLobbyError();
});

function doJoin() {
  const code = inputCode.value.trim().toUpperCase();
  if (code.length !== 6) { showLobbyError("Enter a valid 6-character room code."); return; }
  clearLobbyError();
  connectWS(() => send({ type: "join", roomCode: code }));
}

// ─── Waiting Screen ───────────────────────────────────────────────────────────

function setWaitingScreen(code) {
  displayCode.textContent = code;
  const link = `${location.origin}/room/${code}`;
  shareLink.value = link;
  showScreen("waiting");
}

btnCopyCode.addEventListener("click", () => copyText(roomCode));
btnCopyLink.addEventListener("click", () => copyText(shareLink.value));

// ─── Game Screen ──────────────────────────────────────────────────────────────

function setGameScreen() {
  gameRoomCode.textContent = roomCode || "——";
  showScreen("game");
  updatePlayerLabels();
  setTurnUI(currentTurn);
}

function updatePlayerLabels() {
  const badgeX = document.querySelector("#badge-x .badge-name");
  const badgeO = document.querySelector("#badge-o .badge-name");
  if (myRole === "X") {
    badgeX.textContent = "You";
    badgeO.textContent = "Opponent";
  } else {
    badgeX.textContent = "Opponent";
    badgeO.textContent = "You";
  }
}

function setOnlineStatus(role, online) {
  const dot = role === "X" ? dotX : dotO;
  dot.classList.toggle("online", online);
}

function setTurnUI(turn) {
  const myTurn = turn === myRole;
  turnIndicator.textContent = myTurn ? "YOUR TURN" : "THEIR TURN";
  turnIndicator.classList.toggle("your-turn", myTurn);
  cells.forEach(cell => {
    const idx = parseInt(cell.dataset.index);
    const occupied = !!board[idx];
    cell.classList.toggle("disabled", !myTurn || occupied || gameOver);
  });
}

function showTurnIndicator() {
  setTurnUI(currentTurn);
}

// ─── Board Rendering ──────────────────────────────────────────────────────────

function renderBoard(b) {
  cells.forEach((cell, i) => {
    cell.innerHTML = "";
    if (b[i]) {
      const span = document.createElement("span");
      span.className = `cell-mark ${b[i].toLowerCase()}-mark`;
      span.textContent = b[i];
      cell.appendChild(span);
      cell.classList.add("taken");
    } else {
      cell.classList.remove("taken");
    }
  });
}

function animateMove(index, role) {
  const cell = cells[index];
  cell.innerHTML = "";
  const span = document.createElement("span");
  span.className = `cell-mark ${role.toLowerCase()}-mark`;
  span.textContent = role;
  cell.appendChild(span);
  cell.classList.add("taken");
  board[index] = role;
}

function resetBoardUI() {
  cells.forEach(cell => {
    cell.innerHTML = "";
    cell.classList.remove("taken", "winning", "disabled");
  });
  winLineEl.classList.remove("drawn");
  winLineEl.setAttribute("x1", "0"); winLineEl.setAttribute("y1", "0");
  winLineEl.setAttribute("x2", "0"); winLineEl.setAttribute("y2", "0");
}

function showWinLine(line) {
  if (!line || line.length !== 3) return;
  const key = line.join(",");
  const coords = WIN_LINE_COORDS[key];
  if (!coords) return;
  const [x1, y1, x2, y2] = coords;
  winLineEl.setAttribute("x1", x1);
  winLineEl.setAttribute("y1", y1);
  winLineEl.setAttribute("x2", x2);
  winLineEl.setAttribute("y2", y2);
  // Mark winning cells
  line.forEach(i => cells[i].classList.add("winning"));
  // Trigger animation
  requestAnimationFrame(() => winLineEl.classList.add("drawn"));
}

function showResult(winner) {
  let msg = "";
  if (winner === "draw") {
    msg = "It's a draw.";
  } else if (winner === myRole) {
    msg = "You win! 🎉";
  } else {
    msg = "You lose.";
  }
  resultText.textContent = msg;
  gameResult.classList.remove("hidden");
  // Disable board
  cells.forEach(cell => cell.classList.add("disabled"));
}

// ─── Cell Click ───────────────────────────────────────────────────────────────

cells.forEach(cell => {
  cell.addEventListener("click", () => {
    if (gameOver || currentTurn !== myRole) return;
    const index = parseInt(cell.dataset.index);
    if (board[index]) return;
    send({ type: "move", index });
  });
});

// ─── Rematch ──────────────────────────────────────────────────────────────────

btnRematch.addEventListener("click", () => {
  send({ type: "rematch" });
});

// ─── In-game copy ─────────────────────────────────────────────────────────────

btnCopyIngame.addEventListener("click", () => copyText(roomCode));

// ─── Error helpers ────────────────────────────────────────────────────────────

function showGameError(msg) {
  gameError.textContent = msg;
  gameError.classList.remove("hidden");
}
function clearGameError() { gameError.classList.add("hidden"); }

// ─── Sound (soft beep via Web Audio) ─────────────────────────────────────────

let audioCtx;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    if (type === "move") {
      o.frequency.value = 520;
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      o.start(); o.stop(ctx.currentTime + 0.12);
    } else {
      o.frequency.value = 660;
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.start(); o.stop(ctx.currentTime + 0.3);
    }
  } catch (_) { /* silence */ }
}

// ─── Deep link: /room/XXXXXX ──────────────────────────────────────────────────

(function handleDeepLink() {
  const match = location.pathname.match(/^\/room\/([A-Z0-9]{6})$/i);
  if (match) {
    const code = match[1].toUpperCase();
    inputCode.value = code;
    // Auto-join after WS connects
    connectWS(() => send({ type: "join", roomCode: code }));
  }
})();
