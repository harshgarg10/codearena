# CodeArena - Real-Time Competitive Programming Platform (Local-First)

Compete head-to-head in real-time coding duels in C++, Python, or Java.
CodeArena delivers fast-paced gameplay, fair matchmaking, and **secure live execution** for competitive developers, now optimized for **localhost + Docker** setup for safe, reproducible environments.

---

### 🖼️ Screenshot of CodeArena Dashboard

![CodeArena Screenshot](https://github.com/harshgarg10/codearena/blob/main/images/duel.png)
![CodeArena Screenshot](https://github.com/harshgarg10/codearena/blob/main/images/profile.png)
![CodeArena Screenshot](https://github.com/harshgarg10/codearena/blob/main/images/Home%20Screen.png)

---

## ✨ Features

### 🎮 Game Modes

* **Ranked Matches:** ELO-based rating updates with fair matchmaking
* **Play with Friends:** Casual rooms via room codes

### ⚡ Real-Time Gameplay

* Monaco Editor in-browser (VS Code-like)
* Live opponent code/test results
* 30-minute duel timer

### 🖥 Language Support

* C++17 (GCC), Python 3.11+, Java 17+
* Runs in Docker containers for security (Windows/Linux)

### 📊 Player Stats

* Win/loss records, match history, and leaderboard
* ELO-based ranking system

### 🔒 Secure Execution

* Isolated Docker environments with CPU/memory limits
* Path validation & secure testcase access
* JWT authentication + API rate limiting

### 🔍 Efficient Matchmaking (Red-Black Tree)

* O(log n) insert/search/remove with `bintrees`
* Closest rating match within 2-minute timeout
* Live queue monitoring

---

## 🚀 Quick Start (Local-First)

### 📋 Prerequisites

* Node.js (v16+) & npm
* Docker Desktop (Windows/macOS) or Docker Engine (Linux)
* MySQL (optional for local DB)
* Git

---

### 1️⃣ Clone & Install

```bash
git clone https://github.com/yourusername/codearena.git
cd codearena

# Install backend
cd server
npm install

# Install frontend
cd ../client
npm install
```

---

### 2️⃣ Environment Setup

**server/.env** (required)

```
DB_USER=root
DB_PASS=your_password
DB_NAME=codearena
JWT_SECRET=your_secret_key
PORT=5000
USE_DOCKER=true
```

**client/.env** (optional)

```
REACT_APP_API_URL=http://localhost:5000
```

---

### 3️⃣ Verify Docker

```bash
docker --version
docker ps
```

Make sure Docker Desktop is running.

Run setup:

```bash
cd server
node setup-environment.js
```

---

### 4️⃣ Database Setup

```bash
# Automated reset & seed problems
cd server
node db/reset-problems.js

# Test DB connection
node test-db.js
```

---

### 5️⃣ Start App

```bash
# Terminal 1 - Backend
cd server
npm start    # http://localhost:5000

# Terminal 2 - Frontend
cd client
npm start    # http://localhost:3000
```

---

## 🛠 Architecture Overview

```
[ React (Frontend) ] → [ Express + Socket.io (Backend) ] → [ MySQL ]
                                         │
                               [ Docker Code Execution ]
                                         │
                               [ Red-Black Tree Queue ]
```

---

## 🧩 Matchmaking Algorithm

```js
const { RBTree } = require('bintrees');
class MatchQueue {
  constructor() {
    this.tree = new RBTree((a, b) => a.rating - b.rating || a.socketId.localeCompare(b.socketId));
  }
  insert(user) { this.tree.insert(user); }
  remove(user) { this.tree.remove(user); }
  match(user) {
    const it = this.tree.lowerBound(user);
    const c1 = it.data(); const c2 = it.prev();
    const match = [c1, c2].filter(Boolean)
      .map(u => ({ u, diff: Math.abs(u.rating - user.rating) }))
      .sort((a, b) => a.diff - b.diff)[0];
    if (!match) return null;
    this.tree.remove(match.u);
    return match.u;
  }
}
```

---

## 🐛 Troubleshooting

* **Docker error** → Start Docker Desktop & re-run `node setup-environment.js`
* **DB timeout** → Check `.env` DB host/port → `node test-db.js`
* **Testcase not found** →

  ```bash
  node db/fix-testcase-paths.js
  # or
  node db/reset-problems.js
  ```

---

## 🧪 Testing

```bash
# Backend tests
npm run test

# Execution tests (Docker/local)
npm run test-docker
npm run test-localhost
```

---

## 🤝 Contributing

```bash
# Fork & branch
git checkout -b feature/new-feature

# Make changes
git commit -m "Add new feature"

# Push & PR
git push origin feature/new-feature
```

**Areas to contribute:**

* New problems / test cases
* Add Rust/Go support
* UI enhancements
* Security improvements

---

## 📜 License

Licensed under the [MIT License](LICENSE).

---

**Built with ❤️ by Harsh Garg**
If you love it, ⭐ star the repo!
