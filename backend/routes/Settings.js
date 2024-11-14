// routes/Settings.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { verifyPassword, isNonEmptyString } = require('../utils/password');

// Every settings route acts on the logged-in user only.
router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ username: user.username, email: user.email });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/', async (req, res) => {
    const { username, email } = req.body;
    const userId = req.userId;

    const errors = {};
    if (!isNonEmptyString(username)) errors.username = 'Please enter the Username';
    if (!isNonEmptyString(email)) errors.email = 'Please enter the Email';
    if (Object.keys(errors).length) return res.status(400).json(errors);

    try {
        // Check if username or email already exists
        const existingUsername = await User.findOne({ username: username.trim(), _id: { $ne: userId } });
        if (existingUsername) {
            return res.status(400).json({ username: 'Username already taken' });
        }

        const existingEmail = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: userId } });
        if (existingEmail) {
            return res.status(400).json({ email: 'Email already linked to another account' });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username, email },
            { new: true, runValidators: true }
        );
        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        res.json({ user: { id: updatedUser._id, username: updatedUser.username, email: updatedUser.email } });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/verify-password', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (typeof req.body.password === 'string' && await verifyPassword(user, req.body.password)) {
            res.json({ verified: true });
        } else {
            res.status(400).json({ error: 'Incorrect password' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Deleting needs the password again, not just a valid token.
router.delete('/', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (typeof req.body.password !== 'string' || !(await verifyPassword(user, req.body.password))) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        await User.findByIdAndDelete(req.userId);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
