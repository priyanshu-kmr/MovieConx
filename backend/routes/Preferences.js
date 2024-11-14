// routes/Preferences.js
const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, async (req, res) => {
  const { genres } = req.body;

  if (!Array.isArray(genres) || !genres.every((genre) => typeof genre === 'string')) {
    return res.status(400).json({ message: 'genres must be a list of genre names' });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.genres = genres;
    await user.save();

    res.status(200).json({ message: 'Preferences updated successfully', genres: user.genres });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
