// routes/Login.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { verifyPassword, isNonEmptyString } = require('../utils/password');

router.post('/', async (req, res) => {
  const { username, password } = req.body;

  if (!isNonEmptyString(username) || typeof password !== 'string') {
    return res.status(400).json({ password: 'Incorrect username or password' });
  }

  try {
    const user = await User.findOne({ username: username.trim() });
    if (!user || !(await verifyPassword(user, password))) {
      return res.status(400).json({ password: 'Incorrect username or password' });
    }

    res.json({
      message: 'Login successful',
      token: signToken(user),
      user: { id: user._id, username: user.username, genres: user.genres }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
