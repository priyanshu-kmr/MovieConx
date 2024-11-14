// routes/SearchHistory.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const HISTORY_SIZE = 20;      // searches kept per user
const QUERIES_FOR_RECS = 5;   // most recent searches used for recommendations
const MAX_QUERY_LENGTH = 200;

router.use(requireAuth);

// Save a search query for the logged-in user
router.post('/', async (req, res) => {
  const { query } = req.body;
  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  try {
    await User.findByIdAndUpdate(req.userId, {
      $push: {
        searchHistory: { $each: [query.trim().slice(0, MAX_QUERY_LENGTH)], $slice: -HISTORY_SIZE }
      }
    });
    res.status(200).json({ message: 'Search history updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update search history' });
  }
});

// Most recent searches, newest first
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json([...user.searchHistory].reverse());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});

// Movies similar to the user's recent searches, scored by the AI service
router.get('/recommendations', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const queries = user.searchHistory.slice(-QUERIES_FOR_RECS);
    if (!queries.length) {
      return res.json({});
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 14, 50);
    const response = await fetch(`${process.env.AI_SERVICE_URL}/history-recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries, limit })
    });
    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}`);
    }

    res.json(await response.json());
  } catch (error) {
    console.error('Error fetching history recommendations:', error.message);
    res.status(502).json({ error: 'Failed to fetch similar movies' });
  }
});

module.exports = router;
