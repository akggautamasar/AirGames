# AirGames by WorksBeyond
**Real-time Multiplayer Tic Tac Toe — No signup. Just play.**

---

## 📁 Project Structure

```
airgames/
├── server.js          ← Node.js + Express + WebSocket backend
├── package.json
├── render.yaml        ← Render deployment config
└── public/
    ├── index.html
    ├── style.css
    └── script.js
```

---

## 🚀 Run Locally

### Prerequisites
- Node.js 18+
- npm

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start
# → Server running at http://localhost:3000
```

Open http://localhost:3000 in two browser tabs to test multiplayer.

---

## ☁️ Deploy on Render (Free Tier)

### Step-by-step

1. **Push to GitHub**
   - Create a new GitHub repository
   - Push the entire `airgames/` folder to the repo root

2. **Create a Render Web Service**
   - Go to https://render.com → New → Web Service
   - Connect your GitHub repo
   - Configure:
     | Field          | Value             |
     |----------------|-------------------|
     | Environment    | Node              |
     | Build Command  | `npm install`     |
     | Start Command  | `npm start`       |
     | Plan           | Free              |

3. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Your URL: `https://airgames.onrender.com` (or your chosen name)

4. **WebSocket Note**
   - Render free tier supports WebSocket connections natively
   - No extra configuration needed

---

## 🕐 UptimeRobot Setup (Keep Server Alive)

Render free tier spins down after 15 minutes of inactivity.
UptimeRobot pings your server every 5 minutes to keep it awake.

### Steps

1. Go to https://uptimerobot.com → Sign up (free)
2. Click **"Add New Monitor"**
3. Configure:
   | Field            | Value                                      |
   |------------------|--------------------------------------------|
   | Monitor Type     | HTTP(s)                                    |
   | Friendly Name    | AirGames                                   |
   | URL              | `https://your-app.onrender.com/health`     |
   | Monitoring Interval | Every 5 minutes                        |
4. Click **"Create Monitor"**

The `/health` endpoint returns `"AirGames server running"` instantly with no WebSocket overhead — perfect for pings.

---

## 🎮 How to Play

1. **Player 1** opens the app → clicks **Create Room**
2. A 6-character room code and shareable link are generated
3. **Player 2** enters the code or opens the link → game starts automatically
4. Take turns placing X and O — first to 3 in a row wins!
5. Click **Rematch** to play again in the same room

---

## ⚙️ Architecture Notes

- **In-memory storage** — rooms stored in a `Map`, no database needed
- **Reconnect logic** — room stays alive for 60 seconds after disconnect
- **Auto-cleanup** — inactive rooms swept every 5 minutes
- **Health endpoint** — `GET /health` for UptimeRobot/Render pings
- **Deep links** — `/room/XXXXXX` auto-fills and joins the room
- 
