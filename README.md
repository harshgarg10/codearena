# CodeArena - Real-Time Competitive Programming Platform

**Live Demo:** [https://codearena-bice.vercel.app](https://codearena-bice.vercel.app)

Compete head-to-head in real-time coding duels in C++, Python, or Java. CodeArena delivers fast-paced gameplay, fair matchmaking, and secure live execution for competitive developers.

---
### 🖼️ Screenshot of CodeArena Dashboard

![CodeArena Screenshot](https://github.com/harshgarg10/codearena/blob/main/images/DuelScreen.png)

![CodeArena Screenshot](https://github.com/harshgarg10/codearena/blob/main/images/ProfileScreen.png)

---
## Features

### Game Modes

* **Ranked Matches**: Matchmaking with ELO-based rating updates
* **Play with Friends**: Casual rooms using room codes

### Real-time Gameplay

* Monaco Editor in-browser (VS Code-like)
* Live opponent tracking and test results
* 30-minute time-limited duels

### Language Support

* C++17 (GCC), Python 3.11+, Java 17+
* Windows & Linux execution environments

### Player Stats

* Win/loss records, match history, and global leaderboard
* ELO-based skill ranking system

### Secure Execution

* Isolated environments with CPU/memory limits
* Secure testcase access, path validation, and response sanitization
* JWT authentication and API rate limiting

### Efficient Matchmaking (Red-Black Tree)

* O(log n) insert/search/remove with bintrees
* Closest rating match within 2-minute timeout
* Live queue monitoring and fair pairing

---

## Quick Start

### Prerequisites

* Node.js (v16+), MySQL (v8+), Git, npm/yarn

### Installation

```bash
# Clone and install
$ git clone https://github.com/yourusername/codearena.git
$ cd codearena && npm install

# Server & Client
$ cd server && npm install
$ cd ../client && npm install
```

### Database Setup

```bash
# Create DB & run schema
$ mysql -u root -p < db/schema.sql
$ mysql -u root -p < db/add-execution-platform.sql

# Or run automated setup
$ cd server && npm run setup-db
```

### Environment Files

**server/.env**

```
DB_USER=root
DB_PASS=your_password
DB_NAME=codearena
JWT_SECRET=your_secret_key
PORT=5000
```

**client/.env**

```
REACT_APP_API_URL=http://localhost:5000
```

### Start App

```bash
# Terminal 1
$ cd server && npm start

# Terminal 2
$ cd client && npm start
```

---

## Architecture Overview

```
[ React (Frontend) ] —→ [ Express + Socket.io (Backend) ] —→ [ MySQL ]
                                          │
                                 [ Code Execution Engine ]
                                          │
                                  [ Red-Black Tree Queue ]
```

---

## Matchmaking Deep Dive

**Algorithm:** Red-Black Tree via `bintrees`

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

**Benefits:**

* Insert/Search/Delete: O(log n)
* Closest match in real time
* Avoids rating manipulation with fair queueing

---

## Contributing

```bash
# Fork & branch
$ git checkout -b feature/new-feature
# Make changes and commit
$ git commit -m "Add new feature"
# Push and open PR
$ git push origin feature/new-feature
```

**Areas to contribute:**

* New problems / test cases
* Add Rust/Go support
* UI enhancements
* Security patches

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---
**Built with ❤️**

If you love it, star it!
