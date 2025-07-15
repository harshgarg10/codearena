const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { getUserStats } = require('../controllers/profileController');

// Route to fetch profile stats (protected by token)
router.get('/stats', verifyToken, getUserStats);

module.exports = router;
