// Load environment variables FIRST
require('dotenv').config();

console.log('=== Environment Variables Check ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS ? 'Password exists' : 'No password');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'JWT secret exists' : 'No JWT secret');
console.log('PORT:', process.env.PORT);

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const leaderboardRoutes = require('./routes/leaderboard');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);

// ====== Socket.io State & Helpers ======
const rooms = new Map(); // { roomCode => { players: [usernames], creator } } 
const MatchQueue = require('./matchQueue');
const matchQueue = new MatchQueue(); // [{ username, socketId, rating }]
const userTimeouts = new Map(); // socketId => timeoutId
const userMap = new Map();
const generateRoomCode = () =>
  Math.random().toString(36).substr(2, 6).toUpperCase();



// ====== Socket.io Logic ======
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // === Play With Friend ===
  socket.on('create-room', ({ username }) => {
    const roomCode = generateRoomCode();
    rooms.set(roomCode, { players: [username], creator: username });
    socket.join(roomCode);
    socket.emit('room-created', { roomCode });
    console.log(`🟣 Room ${roomCode} created by ${username}`);
  });

  socket.on('join-room', ({ roomCode, username }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('join-error', 'Room not found');
      return;
    }
    if (room.players.length >= 2) {
      socket.emit('join-error', 'Room is full');
      return;
    }

    room.players.push(username);
    socket.join(roomCode);
    io.to(roomCode).emit('room-update', {
      message: `${username} joined the room`,
      players: room.players
    });
    console.log(`${username} joined room ${roomCode}`);
  });

  // === Matchmaking Logic ===
  socket.on('find-match', ({ username, rating }) => {
  const user = { username, socketId: socket.id, rating };

  // If already queued, ignore
  if (userMap.has(socket.id)) return;

  // Try to match
  const match = matchQueue.match(user);
  if (match) {
    // cleanup the matched user
    clearTimeout(userTimeouts.get(match.socketId));
    userTimeouts.delete(match.socketId);
    userMap.delete(match.socketId);

    const roomCode = generateRoomCode();
    io.to(user.socketId).emit('match-found', { roomCode, opponent: match.username });
    io.to(match.socketId).emit('match-found', { roomCode, opponent: user.username });

    socket.join(roomCode);
    io.sockets.sockets.get(match.socketId)?.join(roomCode);
    console.log(`Matched ${user.username} with ${match.username} in room ${roomCode}`);
  } else {
    // No match yet: queue & track
    matchQueue.insert(user);
    userMap.set(socket.id, user);

    const timeout = setTimeout(() => {
      matchQueue.remove(user);
      userMap.delete(socket.id);
      socket.emit('match-timeout');
      userTimeouts.delete(socket.id);
      console.log(`Timeout for ${user.username}`);
    }, 60000);

    userTimeouts.set(socket.id, timeout);
    socket.emit('searching');
  }
});


  socket.on('cancel-matchmaking', () => {
    const user = userMap.get(socket.id);
    if (user) {
      matchQueue.remove(user);
      userMap.delete(socket.id);
    }
    if (userTimeouts.has(socket.id)) {
      clearTimeout(userTimeouts.get(socket.id));
      userTimeouts.delete(socket.id);
    }
    socket.emit('match-cancelled');
    console.log(`❌ Matchmaking cancelled by ${socket.id}`);
  });      


  // === Disconnect Cleanup ===
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Clean up match queue
    const user = userMap.get(socket.id);
    if (user) {
      matchQueue.remove(user);
      userMap.delete(socket.id);
    }
    if (userTimeouts.has(socket.id)) {
      clearTimeout(userTimeouts.get(socket.id));
      userTimeouts.delete(socket.id);
    }
    // Clean up friend rooms
    for (const [roomCode, room] of rooms.entries()) {
      const index = room.players.findIndex((p) => p.socketId === socket.id || p === socket.id);
      if (index !== -1) {
        room.players.splice(index, 1);
        if (room.players.length === 0) {
          rooms.delete(roomCode);
        } else {
          io.to(roomCode).emit('room-update', {
            message: 'A player left the room',
            players: room.players
          });
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
