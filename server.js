/**
 * AirGames by WorksBeyond — Multiplayer Tic Tac Toe Server
 * Node.js + Express + WebSocket (ws)
 */

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ─── In-Memory Room Store ────────────────────────────────────────────────────
const rooms = new Map(); // roomCode → RoomState

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? generateRoomCode() : code;
}

function createRoom(code) {
  return {
    code,
    players: {}, // { X: ws, O: ws }
    board: Array(9).fill(null),
    currentTurn: "X",
    gameOver: false,
    winner: null,
    cleanupTimer: null,
  };
}

function getBoardStatus(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line: [a, b, c] };
  }
  if (board.every(Boolean)) return { winner: "draw", line: [] };
  return null;
}

function broadcast(room, message) {
  const data = JSON.stringify(message);
  Object.values(room.players).forEach((ws) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(data);
  });
}

function sendTo(ws, message) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
}

function scheduleCleanup(room) {
  if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
  const activePlayers = Object.values(room.players).filter(
    (ws) => ws && ws.readyState === WebSocket.OPEN
  ).length;
  if (activePlayers === 0) {
    room.cleanupTimer = setTimeout(() => {
      rooms.delete(room.code);
      console.log(`[Room ${room.code}] Deleted after inactivity.`);
    }, 60_000);
  }
}

// ─── WebSocket Handler ────────────────────────────────────────────────────────
wss.on("connection", (ws) => {
  ws.roomCode = null;
  ws.role = null;

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    const { type, roomCode, index } = msg;

    // ── CREATE ROOM ──────────────────────────────────────────────────────────
    if (type === "create") {
      const code = generateRoomCode();
      const room = createRoom(code);
      room.players["X"] = ws;
      ws.roomCode = code;
      ws.role = "X";
      rooms.set(code, room);
      console.log(`[Room ${code}] Created.`);
      sendTo(ws, { type: "created", roomCode: code, role: "X" });
      return;
    }

    // ── JOIN ROOM ────────────────────────────────────────────────────────────
    if (type === "join") {
      const code = (roomCode || "").toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        sendTo(ws, { type: "error", message: "Room not found. Check the code." });
        return;
      }

      // Reconnection logic
      const xAlive = room.players["X"] && room.players["X"].readyState === WebSocket.OPEN;
      const oAlive = room.players["O"] && room.players["O"].readyState === WebSocket.OPEN;

      let role = null;
      if (!xAlive) role = "X";
      else if (!oAlive) role = "O";
      else {
        sendTo(ws, { type: "error", message: "Room is full." });
        return;
      }

      room.players[role] = ws;
      ws.roomCode = code;
      ws.role = role;

      if (room.cleanupTimer) { clearTimeout(room.cleanupTimer); room.cleanupTimer = null; }

      console.log(`[Room ${code}] Player ${role} joined.`);

      sendTo(ws, {
        type: "joined",
        roomCode: code,
        role,
        board: room.board,
        currentTurn: room.currentTurn,
        gameOver: room.gameOver,
        winner: room.winner,
      });

      const bothOnline =
        room.players["X"] && room.players["X"].readyState === WebSocket.OPEN &&
        room.players["O"] && room.players["O"].readyState === WebSocket.OPEN;

      if (bothOnline) {
        broadcast(room, { type: "start", message: "Both players connected. Game on!" });
      } else {
        sendTo(ws, { type: "waiting", message: "Waiting for opponent…" });
      }
      return;
    }

    // ── MOVE ─────────────────────────────────────────────────────────────────
    if (type === "move") {
      const room = rooms.get(ws.roomCode);
      if (!room) return;
      if (room.gameOver) return;
      if (ws.role !== room.currentTurn) {
        sendTo(ws, { type: "error", message: "Not your turn." });
        return;
      }
      if (typeof index !== "number" || index < 0 || index > 8 || room.board[index]) {
        sendTo(ws, { type: "error", message: "Invalid move." });
        return;
      }

      room.board[index] = ws.role;
      const result = getBoardStatus(room.board);

      if (result) {
        room.gameOver = true;
        room.winner = result.winner;
        broadcast(room, {
          type: "gameOver",
          board: room.board,
          winner: result.winner,
          line: result.line,
          move: { index, role: ws.role },
        });
      } else {
        room.currentTurn = room.currentTurn === "X" ? "O" : "X";
        broadcast(room, {
          type: "move",
          board: room.board,
          currentTurn: room.currentTurn,
          move: { index, role: ws.role },
        });
      }
      return;
    }

    // ── REMATCH ───────────────────────────────────────────────────────────────
    if (type === "rematch") {
      const room = rooms.get(ws.roomCode);
      if (!room) return;
      room.board = Array(9).fill(null);
      room.currentTurn = "X";
      room.gameOver = false;
      room.winner = null;
      broadcast(room, { type: "rematch", board: room.board, currentTurn: "X" });
      return;
    }
  });

  ws.on("close", () => {
    const room = rooms.get(ws.roomCode);
    if (!room) return;
    console.log(`[Room ${ws.roomCode}] Player ${ws.role} disconnected.`);
    broadcast(room, { type: "opponentLeft", role: ws.role });
    scheduleCleanup(room);
  });
});

// ─── HTTP Routes ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// Health check for UptimeRobot / Render
app.get("/health", (_req, res) => res.send("AirGames server running"));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// Room deep-link — SPA fallback
app.get("/room/:code", (_req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

// ─── Periodic room cleanup (every 5 min) ─────────────────────────────────────
setInterval(() => {
  for (const [code, room] of rooms) {
    const alive = Object.values(room.players).filter(
      (ws) => ws && ws.readyState === WebSocket.OPEN
    ).length;
    if (alive === 0 && !room.cleanupTimer) {
      rooms.delete(code);
      console.log(`[Room ${code}] Cleaned up by sweep.`);
    }
  }
}, 5 * 60_000);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`AirGames listening on port ${PORT}`));
