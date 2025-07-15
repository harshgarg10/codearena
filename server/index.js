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
const authRoutes = require('./routes/authRoutes');
const leaderboardRoutes = require('./routes/leaderboard');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});