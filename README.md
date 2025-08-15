# CodeArena - Real-Time Competitive Programming Platform

Compete head-to-head in real-time coding duels in C++, Python, or Java. CodeArena delivers fast-paced gameplay, fair matchmaking, and **secure live execution**, used **Docker** to ensure safe, reproducible environments.

---

## 🖼️ Screenshots

![Dashboard](https://github.com/harshgarg10/codearena/blob/main/images/duel.png)
![Profile](https://github.com/harshgarg10/codearena/blob/main/images/profile.png)
![Home Screen](https://github.com/harshgarg10/codearena/blob/main/images/Home%20Screen.png)

---

## ✨ Features

* **Game Modes:** Ranked (ELO-based) and Casual with room codes
* **Real-Time Gameplay:** Monaco Editor, live opponent updates, 30-min timer
* **Languages:** C++17, Python 3.11+, Java 17+, Docker-isolated
* **Stats & Rankings:** Win/loss history, leaderboards
* **Secure Execution:** CPU/memory limits, path validation, JWT auth
* **Matchmaking:** Red-Black Tree for O(log n) matching

---

## 🚀 Quick Start

**Prerequisites:** Node.js 16+, npm, Docker, MySQL, Git

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/codearena.git
cd codearena
cd server && npm install
cd ../client && npm install
```

### 2. Environment Setup

`server/.env`

```
DB_USER=root
DB_PASS=your_password
DB_NAME=codearena
JWT_SECRET=your_secret_key
PORT=5000
USE_DOCKER=true
```

`client/.env`

```
REACT_APP_API_URL=http://localhost:5000
```

### 3. Docker Check

```bash
docker --version
docker ps
cd server && node setup-environment.js
```

### 4. Database Setup

```bash
cd server
node db/reset-problems.js
node test-db.js
```

### 5. Start

```bash
cd server && npm start
cd ../client && npm start
```

---

## 🛠 Architecture

```
[React] → [Express + Socket.io] → [MySQL]
                          │
                [Docker Code Execution]
                          │
                [Red-Black Tree Queue]
```

---

## 🐛 Troubleshooting

* **Docker error:** Start Docker Desktop, rerun setup
* **DB timeout:** Check `.env` host/port, run `node test-db.js`
* **Missing testcases:** `node db/fix-testcase-paths.js` or reset problems

---

## 🧪 Testing

```bash
npm run test          # Backend tests
npm run test-docker   # Docker exec tests
npm run test-localhost # Local exec tests
```

---

## 🤝 Contributing

Fork, branch, commit, push, PR. Areas: new problems, Rust/Go support, UI, security.

---

## 📜 License

MIT License. Built with ❤️ by Harsh Garg — ⭐ the repo!
