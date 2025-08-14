# CodeArena - Real-Time Competitive Programming Platform (Local-First)

Compete head-to-head in real-time coding duels in C++, Python, or Java.
CodeArena delivers fast-paced gameplay, fair matchmaking, and **secure live execution** for competitive developers — now optimized for **localhost + Docker** setup for safe, reproducible environments.

> **Local-first / Docker required:** This project must run with Docker. Before starting, run the checker script [`setupEnvironment`](server/setup-environment.js) to verify Docker and build images.

---

### 🖼️ Screenshot of CodeArena Dashboard

![CodeArena Screenshot](https://github.com/harshgarg10/codearena/blob/main/images/duel.png)
![CodeArena Screenshot](https://github.com/harshgarg10/codearena/blob/main/images/profile.png)
![CodeArena Screenshot](https://github.com/harshgarg10/codearena/blob/main/images/Home%20Screen.png)

---

## ✨ Features

*(unchanged from before)*

---

## 🚀 Quick Start (Local-First)

### 📋 Prerequisites

* Node.js v16+ (recommended v18+)
* npm
* Docker Desktop (Windows/macOS) or Docker Engine (Linux)
* MySQL (optional for local DB)
* Git

---

### 🐳 Docker Instructions

1. Start Docker Desktop before running the app.
2. Verify Docker is running:

```bash
docker --version
docker ps
```

3. Build Docker images manually if needed: [`build-docker-images.bat`](server/build-docker-images.bat)

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

### 3️⃣ Database Setup & Fixes

* Create DB & select it:

```bash
mysql -u root -p -D codearena
```

* Automated reset & seed problems:

```bash
cd server
node db/reset-problems.js
```

* Test DB connection:

```bash
node test-db.js
```

* Fix testcase paths:

```bash
node db/fix-testcase-paths.js
```

* Windows path issue: Windows-style paths (e.g., `C:\Users\...`) cause deployment failures in `evaluateSubmission`. Use [`fix-testcase-paths.js`](server/db/fix-testcase-paths.js) or SQL quick fix:

```sql
UPDATE problems SET input_path = REPLACE(input_path, 'C:\\\\', '/');
```

---

### 4️⃣ Start Commands

```bash
# Terminal 1 - Backend
cd server && npm run setup-env  # runs setup-environment.js
npm start                       # start server

# Terminal 2 - Frontend
cd client && npm start

# Dev mode with nodemon
npm run dev
```

Kill any process blocking port 5000:

```bash
npx kill-port 5000
```

---

## 🌐 API Config Behavior

The client uses [`API_ENDPOINTS`](client/src/config/api.js) / `API_BASE_URL` and auto-selects local vs deployed. Override for local dev via `.env`:

```
REACT_APP_API_URL=http://localhost:5000
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

*(unchanged from before)*

---

## 📂 Quick Links

* Server entry: [`index.js`](server/index.js)
* Execution config: [`EXECUTION_CONFIG`](server/config/executionConfig.js)
* Execution engine: [`executeCode`](server/utils/codeExecuter.js)
* Submission evaluator: [`evaluateSubmission`](server/utils/evaluateSubmission.js)
* Matchmaking: [`matchQueue`](server/matchQueue.js)
* Client API: [`API_ENDPOINTS`](client/src/config/api.js)

---

## 🐛 Troubleshooting

* **Docker daemon error** → Start Docker Desktop & run [`setup-environment.js`](server/setup-environment.js)
* **DB ETIMEDOUT / Access Denied** → Check `.env` & run [`test-db.js`](server/test-db.js)
* **Testcase not found** → Run [`fix-testcase-paths.js`](server/db/fix-testcase-paths.js) or reseed via [`reset-problems.js`](server/db/reset-problems.js)

---

## 🧪 Testing

```bash
npm run test           # backend tests
npm run test-localhost # execution tests (local)
npm run test-docker    # execution tests (docker)
```

Reference: [`executeCode`](server/utils/codeExecuter.js), `package.json`.

---

## 🤝 Contributing

* Ensure new problems are added under `server/testcases/problem-<id>/`.
* Fork, branch, commit, push, and PR.

---

## 📜 License

Licensed under the [MIT License](LICENSE).

---

**Built with ❤️ by Harsh Garg**
