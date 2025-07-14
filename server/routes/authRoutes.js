const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { signup, login } = require('../controllers/authController');
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.username}, you are verified!` });
});
router.post('/signup', signup);
router.post('/login', login);

module.exports = router;
