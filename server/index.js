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

// Socket.io for real-time features
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', ({ username }) => {
    const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    rooms.set(roomCode, { players: [username], creator: username });
    socket.join(roomCode);
    socket.emit('room-created', { roomCode });
    console.log(`Room ${roomCode} created by ${username}`);
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
    // if (room.players.includes(username)) {
    //   socket.emit('join-error', 'Username already taken in this room');
    //   return;
    // }

    room.players.push(username);
    socket.join(roomCode);
    io.to(roomCode).emit('room-update', {
      message: `${username} joined the room`,
      players: room.players
    });
    console.log(`${username} joined room ${roomCode}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Handle room cleanup when user disconnects
    rooms.forEach((room, roomCode) => {
      const playerIndex = room.players.findIndex(player => player === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          rooms.delete(roomCode);
        } else {
          io.to(roomCode).emit('room-update', {
            message: 'A player left the room',
            players: room.players
          });
        }
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});