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
const executeRoutes = require('./routes/executeRoutes');
const { getRandomProblem } = require('./utils/problemUtils');
const { seedProblems } = require('./db/seed'); // Add this import

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
app.use('/api/execute', executeRoutes);

// ====== Socket.io State & Helpers ======
const rooms = new Map();
const MatchQueue = require('./matchQueue');
const matchQueue = new MatchQueue();
const userTimeouts = new Map();
const userMap = new Map();
const duelTimers = new Map();
const socketToUser = new Map();
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

  socket.on('join-room', async ({ roomCode, username }) => {
  // Track this socket's username
  socketToUser.set(socket.id, username);

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

  if (room.players.length === 2) {
    const problem = await getRandomProblem();
    const [user1, user2] = room.players;

  room.problem = problem;
    room.scores = { [user1]: 0, [user2]: 0 };
    room.times = { [user1]: 0, [user2]: 0 };
    room.startTime = Date.now();

    // Start 30-minute timer for friend duel
    const timer = setTimeout(() => {
      handleDuelTimeout(roomCode);
    }, 30 * 60 * 1000);

    duelTimers.set(roomCode, timer);

    io.to(roomCode).emit('match-found', {
      roomCode,
      problem,
      users: [user1, user2],
    });

    console.log(`Match started in room ${roomCode} with problem: ${problem.title}`);
  }
});
  socket.on('submission-result', ({ roomCode, username, passed, total, time }) => {
  const room = rooms.get(roomCode);
  if (!room) return;

  // Update room scores and times
  room.scores[username] = passed;
  room.times[username] = time || 0;

  // Broadcast updated scores to room
  io.to(roomCode).emit('score-update', {
    scores: room.scores,
    times: room.times
  });

  console.log(`Score update in room ${roomCode}: ${username} scored ${passed}/${total}`);
});
  const handleDuelTimeout = (roomCode) => {
  const room = rooms.get(roomCode);
  if (!room) return;

  const [player1, player2] = room.players;
  const score1 = room.scores[player1] || 0;
  const score2 = room.scores[player2] || 0;
  const time1 = room.times[player1] || 0;
  const time2 = room.times[player2] || 0;

  let winner;
  let reason;

  if (score1 > score2) {
    winner = player1;
    reason = `${player1} wins with ${score1} test cases passed!`;
  } else if (score2 > score1) {
    winner = player2;
    reason = `${player2} wins with ${score2} test cases passed!`;
  } else {
    // Same score, check time
    if (time1 < time2 && time1 > 0) {
      winner = player1;
      reason = `${player1} wins with same score but faster time (${time1.toFixed(2)}s vs ${time2.toFixed(2)}s)!`;
    } else if (time2 < time1 && time2 > 0) {
      winner = player2;
      reason = `${player2} wins with same score but faster time (${time2.toFixed(2)}s vs ${time1.toFixed(2)}s)!`;
    } else {
      winner = null;
      reason = "It's a tie! Both players performed equally.";
    }
  }

  io.to(roomCode).emit('duel-ended', {
    winner,
    reason,
    finalScores: room.scores,
    finalTimes: room.times
  });

  // Clean up
  duelTimers.delete(roomCode);
  rooms.delete(roomCode);

  console.log(`Duel ended in room ${roomCode}: ${reason}`);
};
  // === Matchmaking Logic ===
  // === Matchmaking Logic ===

socket.on('cancel-matchmaking', () => {
  const user = userMap.get(socket.id);
  if (user) {
    console.log(`❌ ${user.username} cancelled matchmaking`);
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
  // Update the matchmaking logic in your server/index.js
socket.on('find-match', async ({ username, rating }) => {
  const user = { username, socketId: socket.id, rating };

  // Track this socket's username
  socketToUser.set(socket.id, username);

  if (userMap.has(socket.id)) return;

  console.log(`🔍 ${username} looking for match with rating ${rating}`);

  const match = matchQueue.match(user);
  if (match) {
    console.log(`✅ Found match: ${username} vs ${match.username}`);
    
    // Clear timeout for matched user
    clearTimeout(userTimeouts.get(match.socketId));
    userTimeouts.delete(match.socketId);
    userMap.delete(match.socketId);

    const roomCode = generateRoomCode();
    const problem = await getRandomProblem();
    
    // Create room with complete data BEFORE emitting match-found
    rooms.set(roomCode, { 
      players: [user.username, match.username], 
      creator: user.username, 
      problem: problem,
      scores: { [user.username]: 0, [match.username]: 0 },
      times: { [user.username]: 0, [match.username]: 0 },
      startTime: Date.now()
    });

    // Start 30-minute timer for the duel
    const timer = setTimeout(() => {
      handleDuelTimeout(roomCode);
    }, 30 * 60 * 1000); // 30 minutes

    duelTimers.set(roomCode, timer);

    // Join both users to the room BEFORE emitting
    socket.join(roomCode);
    const matchSocket = io.sockets.sockets.get(match.socketId);
    if (matchSocket) {
      matchSocket.join(roomCode);
    }

    // Emit match-found with all necessary data
    io.to(user.socketId).emit('match-found', { 
      roomCode, 
      opponent: match.username, 
      problem 
    });
    io.to(match.socketId).emit('match-found', { 
      roomCode, 
      opponent: user.username, 
      problem 
    });

    console.log(`✅ Match created: ${user.username} vs ${match.username} in room ${roomCode}`);
    console.log(`📋 Problem: ${problem.title}`);
  } else {
    // No match found - add to both userMap AND matchQueue
    console.log(`➕ Adding ${username} to matchmaking queue`);
    
    userMap.set(socket.id, user);
    matchQueue.insert(user);

    console.log(`${username} added to queue. Current queue size: ${userMap.size}`);

    // Set timeout for this user
    const timeoutId = setTimeout(() => {
      // Remove from both userMap and matchQueue on timeout
      const timedOutUser = userMap.get(socket.id);
      if (timedOutUser) {
        matchQueue.remove(timedOutUser);
        userMap.delete(socket.id);
      }
      socket.emit('match-timeout', 'No match found within 2 minutes');
      console.log(`⏰ ${username} removed from queue due to timeout`);
    }, 120000); // 2 minutes

    userTimeouts.set(socket.id, timeoutId);
  }
});

// Update the join-duel-room handler to be more robust
socket.on('join-duel-room', ({ roomCode, username }) => {
  console.log(`🎮 ${username} attempting to join duel room ${roomCode}`);
  
  // Track this socket's username
  socketToUser.set(socket.id, username);

  const room = rooms.get(roomCode);
  if (!room) {
    console.error(`❌ Room ${roomCode} not found for user ${username}`);
    socket.emit('duel-error', 'Room not found');
    return;
  }

  if (!room.players.includes(username)) {
    console.error(`❌ User ${username} not authorized for room ${roomCode}`);
    socket.emit('duel-error', 'You are not part of this duel');
    return;
  }

  // Ensure user is in the socket room
  socket.join(roomCode);
  
  const opponent = room.players.find(player => player !== username);
  
  console.log(`✅ ${username} successfully joined duel room ${roomCode}`);
  console.log(`🎯 Problem: ${room.problem?.title || 'Unknown'}`);
  console.log(`⚔️ Opponent: ${opponent || 'Unknown'}`);
  
  socket.emit('duel-data', { 
    problem: room.problem, 
    opponent: opponent || 'Unknown',
    scores: room.scores || {},
    times: room.times || {}
  });
});

// ...existing code...
socket.on('disconnect', () => {
  const username = socketToUser.get(socket.id);
  console.log(`User disconnected: ${username || socket.id}`);
  
  if (username) {
    // Remove from matchmaking queue if present
    if (userMap.has(socket.id)) {
      const user = userMap.get(socket.id);
      matchQueue.remove(user);
      userMap.delete(socket.id);
      
      const timeoutId = userTimeouts.get(socket.id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        userTimeouts.delete(socket.id);
      }
      console.log(`Removed ${username} from matchmaking queue`);
    }

    // Handle disconnect during a duel
    for (const [roomCode, room] of rooms.entries()) {
      if (room.players.includes(username)) {
        // Don't delete the room immediately. Just notify the other player.
        // The game end logic will handle cleanup.
        io.to(roomCode).emit('opponent-disconnected', { disconnectedPlayer: username });
        console.log(`Player ${username} disconnected from room ${roomCode}. Notifying opponent.`);
        
        // Optional: Start a timer to end the game if the user doesn't reconnect
        // For now, we'll let the other player win by default.
        break;
      }
    }
  }

  socketToUser.delete(socket.id);
});
// ...existing code...
});

// Start server with auto-seeding
const startServer = async () => {
  try {
    // Seed the database on startup
    await seedProblems();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();