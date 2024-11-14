const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const signupRoutes = require('./routes/Signup.js');
const loginRoutes = require('./routes/Login.js');
const preferencesRoutes = require('./routes/Preferences.js');
const settingsRoutes = require('./routes/Settings');
const searchHistoryRoutes = require('./routes/SearchHistory.js');

const missing = ['MONGO_URI', 'JWT_SECRET'].filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing ${missing.join(', ')}. Copy backend/.env.example to backend/.env and fill it in.`);
  process.exit(1);
}
process.env.AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3001';

const app = express();

app.use(express.json());
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',') }));
app.use('/signup', signupRoutes);
app.use('/login', loginRoutes);
app.use('/preferences', preferencesRoutes);
app.use('/settings', settingsRoutes);
app.use('/search-history', searchHistoryRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`server running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
