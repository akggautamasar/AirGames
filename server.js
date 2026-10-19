/**
 * AirGames by WorksBeyond — Multiplayer Tic Tac Toe Server
 * Node.js + Express + WebSocket (ws)
 * Fixed: clean join/start flow, proper reconnect, static asset serving
 */

const express = require("express");
const http    = require("http");
const WebSocket = require("ws");
const path    = require("path");
const crypto = require("crypto");

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

// ── Static files (public/) ────────────────────────────────────────────────────
// MUST be before any route so CSS/JS are served correctly even from /room/* URLs
app.use(express.static(path.join(__dirname, "public")));

// ── In-Memory Room Store ──────────────────────────────────────────────────────
const rooms = new Map(); // code → RoomState

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[crypto.randomInt(chars.length)];
  return rooms.has(code) ? generateCode() : code;
}

function newRoom(code) {
  return {
    code,
    players: { X: null, O: null },   // ws references
    board: Array(9).fill(null),
    turn: "X",
    over: false,
    winner: null,
    killTimer: null,
    rematchVotes: new Set(),
  };
}

function winCheck(board) {
  const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of L) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line: [a,b,c] };
  }
  if (board.every(Boolean)) return { winner: "draw", line: [] };
  return null;
}

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function broadcast(room, obj) {
  const raw = JSON.stringify(obj);
  ["X","O"].forEach(r => {
    const ws = room.players[r];
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(raw);
  });
}

function cancelKill(room) {
  if (room.killTimer) { clearTimeout(room.killTimer); room.killTimer = null; }
}

function scheduleKill(room) {
  cancelKill(room);
  const xAlive = room.players.X && room.players.X.readyState === WebSocket.OPEN;
  const oAlive = room.players.O && room.players.O.readyState === WebSocket.OPEN;
  if (!xAlive && !oAlive) {
    room.killTimer = setTimeout(() => {
      rooms.delete(room.code);
      console.log(`[${room.code}] Room deleted.`);
    }, 60_000);
  }
}

// ── WebSocket Handler ─────────────────────────────────────────────────────────
wss.on("connection", ws => {
  ws.roomCode = null;
  ws.role     = null;

  ws.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const { type, roomCode, index } = msg;

    // ── CREATE ────────────────────────────────────────────────────────────────
    if (type === "create") {
      if (ws.roomCode) return send(ws, { type: "error", message: "Leave your current room first." });
      const code = generateCode();
      const room = newRoom(code);
      room.players.X = ws;
      ws.roomCode = code;
      ws.role     = "X";
      rooms.set(code, room);
      console.log(`[${code}] Created by X.`);
      send(ws, { type: "created", roomCode: code, role: "X" });
      return;
    }

    // ── JOIN ──────────────────────────────────────────────────────────────────
    if (type === "join") {
      if (ws.roomCode) return send(ws, { type: "error", message: "Already in a room." });
      const code = typeof roomCode === "string" ? roomCode.toUpperCase().trim() : "";
      const room = rooms.get(code);

      if (!room) {
        send(ws, { type: "error", message: "Room not found. Double-check the code." });
        return;
      }

      // Figure out which slot to assign (supports reconnect)
      const xAlive = room.players.X && room.players.X.readyState === WebSocket.OPEN;
      const oAlive = room.players.O && room.players.O.readyState === WebSocket.OPEN;

      let role;
      if      (!xAlive) role = "X";
      else if (!oAlive) role = "O";
      else {
        send(ws, { type: "error", message: "Room is full." });
        return;
      }

      room.players[role] = ws;
      ws.roomCode = code;
      ws.role     = role;
      cancelKill(room);

      console.log(`[${code}] ${role} joined.`);

      // Send current game state to the joining player
      send(ws, {
        type:    "joined",
        roomCode: code,
        role,
        board:   room.board,
        turn:    room.turn,
        over:    room.over,
        winner:  room.winner,
      });

      // Check if both seats are now filled
      const xNow = room.players.X && room.players.X.readyState === WebSocket.OPEN;
      const oNow = room.players.O && room.players.O.readyState === WebSocket.OPEN;

      if (xNow && oNow) {
        // Broadcast "start" to BOTH players
        broadcast(room, {
          type:  "start",
          board: room.board,
          turn:  room.turn,
        });
        console.log(`[${code}] Game started.`);
      }
      return;
    }

    // ── MOVE ──────────────────────────────────────────────────────────────────
    if (type === "move") {
      const room = rooms.get(ws.roomCode);
      if (!room || room.over) return;
      if (room.players.X?.readyState !== WebSocket.OPEN || room.players.O?.readyState !== WebSocket.OPEN) { send(ws, { type: "error", message: "Wait for your opponent to reconnect." }); return; }
      if (room.players[ws.role] !== ws) return;
      if (ws.role !== room.turn) { send(ws, { type: "error", message: "Not your turn." }); return; }
      if (!Number.isInteger(index) || index < 0 || index > 8 || room.board[index]) {
        send(ws, { type: "error", message: "Invalid move." }); return;
      }

      room.rematchVotes.clear();
      room.board[index] = ws.role;
      const result = winCheck(room.board);

      if (result) {
        room.over   = true;
        room.winner = result.winner;
        broadcast(room, { type: "gameOver", board: room.board, winner: result.winner, line: result.line, move: { index, role: ws.role } });
      } else {
        room.turn = room.turn === "X" ? "O" : "X";
        broadcast(room, { type: "move", board: room.board, turn: room.turn, move: { index, role: ws.role } });
      }
      return;
    }

    // ── REMATCH ───────────────────────────────────────────────────────────────
    if (type === "rematch") {
      const room = rooms.get(ws.roomCode);
      if (!room || room.players[ws.role] !== ws || !room.over) return;
      if (room.players.X?.readyState !== WebSocket.OPEN || room.players.O?.readyState !== WebSocket.OPEN) return;
      room.rematchVotes.add(ws.role);
      if (room.rematchVotes.size < 2) {
        send(ws, { type: "rematchPending", message: "Waiting for opponent to accept rematch." });
        return;
      }
      room.rematchVotes.clear();
      room.board = Array(9).fill(null);
      room.turn = "X";
      room.over = false;
      room.winner = null;
      broadcast(room, { type: "rematch", board: room.board, turn: "X" });
      return;
    }

  });

  ws.on("close", () => {
    const room = rooms.get(ws.roomCode);
    if (!room) return;
    console.log(`[${ws.roomCode}] ${ws.role} disconnected.`);
    if (room.players[ws.role] !== ws) return;
    room.players[ws.role] = null;
    room.rematchVotes.clear();
    broadcast(room, { type: "opponentLeft", role: ws.role });
    scheduleKill(room);
  });
});

// ── HTTP Routes ───────────────────────────────────────────────────────────────
// Health check — fast, no game logic
app.get("/health", (_req, res) => res.send("AirGames server running"));

// Game discovery hub and individual game routes
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "games.html")));
app.get("/tic-tac-toe", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/2048", (_req, res) => res.sendFile(path.join(__dirname, "public", "2048.html")));

// SPA fallback — any /room/* deep link returns index.html
// CSS/JS are found because express.static() runs first
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Periodic cleanup (sweep every 5 min) ──────────────────────────────────────
setInterval(() => {
  for (const [code, room] of rooms) {
    const alive = ["X","O"].filter(r => room.players[r] && room.players[r].readyState === WebSocket.OPEN).length;
    if (alive === 0 && !room.killTimer) {
      rooms.delete(code);
      console.log(`[${code}] Swept.`);
    }
  }
}, 5 * 60_000);

// ── Listen ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`AirGames running on port ${PORT}`));
