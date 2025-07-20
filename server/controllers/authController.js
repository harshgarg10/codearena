const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Check if user already exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // --- START: Added token generation ---
    const newUser = { id: result.insertId, username };
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      message: 'Signup successful!', 
      token,
      user: { id: newUser.id, username: newUser.username }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during signup.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ 
      message: 'Login successful!', 
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

module.exports = { signup, login };
