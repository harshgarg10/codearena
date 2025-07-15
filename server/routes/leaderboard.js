const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 
router.get('/top', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT username, rating FROM users ORDER BY rating DESC LIMIT 5'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
