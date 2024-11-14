// routes/Signup.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { hashPassword, isNonEmptyString } = require('../utils/password');

const MIN_PASSWORD_LENGTH = 8;

// Signup route
router.post('/', async (req, res) => {
  const { username, email, password } = req.body;

  const errors = {};
  if (!isNonEmptyString(username)) errors.username = 'Please enter the Username';
  if (!isNonEmptyString(email)) errors.email = 'Please enter the Email';
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (Object.keys(errors).length) {
    return res.status(400).json(errors);
  }

  try {
    // Check if the username already exists
    const userByUsername = await User.findOne({ username: username.trim() });
    // Check if the email already exists
    const userByEmail = await User.findOne({ email: email.trim().toLowerCase() });

    if (userByUsername || userByEmail) {
      return res.status(400).json({
        ...(userByUsername && { username: 'Username is already taken' }),
        ...(userByEmail && { email: 'Email is already linked to another account' })
      });
    }

    // Create a new user
    const newUser = new User({ username, email, password: await hashPassword(password) });
    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      token: signToken(newUser),
      user: { id: newUser._id, username: newUser.username, genres: newUser.genres }
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
