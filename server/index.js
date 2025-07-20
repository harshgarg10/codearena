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
const { saveDuelResult } = require('./controllers/duelController');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000","https://codearena-bice.vercel.app" ],
    credentials: true,
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
app.use('/testcases', (req, res) => {
  console.log(`🚨 Blocked attempt to access testcases: ${req.path}`);
  res.status(403).json({ error: 'Access forbidden' });
});

app.use('/temp', (req, res) => {
  console.log(`🚨 Blocked attempt to access temp files: ${req.path}`);
  res.status(403).json({ error: 'Access forbidden' });
});

// Block .txt file access using middleware (CORRECT way)
app.use((req, res, next) => {
  if (req.path.endsWith('.txt')) {
    console.log(`🚨 Blocked attempt to access .txt file: ${req.path}`);
    return res.status(403).json({ error: 'Access forbidden' });
  }
  next();
});
// Middleware
app.use(cors());
app.use(express.json());
const helmet = require('helmet');
const { securityLogger } = require('./middleware/securityMonitor');
app.use(securityLogger);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Prevent information disclosure
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/execute', executeRoutes);

// Add rate limiting imports and setup AFTER the routes
const rateLimit = require('express-rate-limit');

// Rate limiting for code execution
const executeLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requests per minute per IP
  message: {
    error: 'Too many code execution requests. Please wait before trying again.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for submissions
const submitLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute  
  max: 10, // 10 submissions per minute per IP
  message: {
    error: 'Too many submissions. Please wait before submitting again.',
    retryAfter: 60
  }
});

// Apply rate limiting to execution routes (ONLY ONCE)
app.use('/api/execute/custom', executeLimit);
app.use('/api/execute/submit', submitLimit);
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
    const room = {
      code: roomCode,
      players: [username],
      creator: username,
      problem: null,
      scores: {},
      times: {},
      isRanked: false // Mark friend duels as unranked
    };
    
    rooms.set(roomCode, room);
    socket.join(roomCode);
    
    console.log(`Room ${roomCode} created by ${username} (unranked)`);
    socket.emit('room-created', { roomCode });
  });

  // Add this event handler in the socket.io section
  socket.on('player-forfeit', async ({ roomCode, username }) => {
    console.log(`🏃‍♂️ ${username} is forfeiting duel in room ${roomCode}`);
    
    const room = rooms.get(roomCode);
    if (!room) return;

    // Clear the duel timer since game is ending
    const timer = duelTimers.get(roomCode);
    if (timer) {
      clearTimeout(timer);
      duelTimers.delete(roomCode);
    }

    // Determine the winner (the opponent)
    const [player1, player2] = room.players;
    const winner = player1 === username ? player2 : player1;
    const reason = `🏃‍♂️ ${username} forfeited the match. ${winner} wins!`;

    // Save duel result to database
    try {
      const { ratingChanges } = await saveDuelResult({
        roomCode,
        players: room.players,
        problemId: room.problem?.id,
        scores: room.scores,
        times: room.times,
        winner,
        endReason: reason,
        isRanked: room.isRanked
      });

      io.to(roomCode).emit('duel-ended', {
        winner,
        reason,
        finalScores: room.scores,
        finalTimes: room.times,
        ratingChanges,
        isRnaked: room.isRanked
      });
    } catch (error) {
      console.error('Failed to save forfeit result:', error);
      // Still end the game even if saving fails
      io.to(roomCode).emit('duel-ended', {
        winner,
        reason,
        finalScores: room.scores,
        finalTimes: room.times
      });
    }

    rooms.delete(roomCode);
    console.log(`Duel ended due to forfeit in room ${roomCode}: ${reason}`);
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
  // Update the submission-result handler
  socket.on('submission-result', async ({ roomCode, username, passed, total, time }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Update room scores and times
    room.scores[username] = passed;
    room.times[username] = time || 0;

    console.log(`Score update in room ${roomCode}: ${username} scored ${passed}/${total}`);

    // Check if player got perfect score (solved the problem completely)
    if (passed === total && total > 0) {
      // Player solved all test cases - end the game immediately
      const [player1, player2] = room.players;
      
      console.log(`🏆 ${username} solved all test cases! Game ending immediately.`);
      
      // Clear the duel timer since game is ending early
      const timer = duelTimers.get(roomCode);
      if (timer) {
        clearTimeout(timer);
        duelTimers.delete(roomCode);
      }

      const reason = `🏆 ${username} wins by solving all test cases! (${passed}/${total} in ${time.toFixed(2)}s)`;

      // Save duel result to database
      try {
        const { ratingChanges } = await saveDuelResult({
          roomCode,
          players: room.players,
          problemId: room.problem?.id,
          scores: room.scores,
          times: room.times,
          winner: username,
          endReason: reason,
          isRanked: room.isRanked
        });

        io.to(roomCode).emit('duel-ended', {
          winner: username,
          reason,
          finalScores: room.scores,
          finalTimes: room.times,
          ratingChanges,
          isRanked: room.isRanked
        });
      } catch (error) {
        console.error('Failed to save duel result:', error);
        // Still end the game even if saving fails
        io.to(roomCode).emit('duel-ended', {
          winner: username,
          reason,
          finalScores: room.scores,
          finalTimes: room.times
        });
      }

      rooms.delete(roomCode);
      return;
    }

    // Broadcast updated scores to room (only if game hasn't ended)
    io.to(roomCode).emit('score-update', {
      scores: room.scores,
      times: room.times
    });
  });

  // Update the handleDuelTimeout function
  const handleDuelTimeout = async (roomCode) => {
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

    // Save duel result to database
    try {
      const { ratingChanges } = await saveDuelResult({
        roomCode,
        players: room.players,
        problemId: room.problem?.id,
        scores: room.scores,
        times: room.times,
        winner,
        endReason: reason,
        isRanked: room.isRanked
      });

      io.to(roomCode).emit('duel-ended', {
        winner,
        reason,
        finalScores: room.scores,
        finalTimes: room.times,
        ratingChanges,
        isRanked: room.isRanked
      });
    } catch (error) {
      console.error('Failed to save duel result:', error);
      // Still end the game even if saving fails
      io.to(roomCode).emit('duel-ended', {
        winner,
        reason,
        finalScores: room.scores,
        finalTimes: room.times
      });
    }

    // Clean up
    duelTimers.delete(roomCode);
    rooms.delete(roomCode);

    console.log(`Duel ended in room ${roomCode}: ${reason}`);
  };
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
    
    // Fix: Define user1 and user2 properly
    const user1 = user.username;      // Current user
    const user2 = match.username;     // Matched user
    
    // Create room with complete data BEFORE emitting match-found
    const room = {
      code: roomCode,
      players: [user1, user2],
      problem,
      scores: { [user1]: 0, [user2]: 0 },
      times: { [user1]: 0, [user2]: 0 },
      isRanked: true // Mark online matchmaking duels as ranked
    };
    rooms.set(roomCode, room);

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