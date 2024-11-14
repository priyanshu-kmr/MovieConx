// api.js
import axios from 'axios';

// Set these in .env (see .env.example); CRA only exposes variables prefixed REACT_APP_.
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const AI_URL = process.env.REACT_APP_AI_URL || 'http://localhost:3001';

// Express API client. Sends the logged-in user's token with every request.
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  try {
    const { token } = JSON.parse(localStorage.getItem('user')) || {};
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (error) {
    // no stored user
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expired or revoked: drop the session and start over at login.
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export const recordSearch = (query) =>
  api.post('/search-history', { query }).catch((error) => {
    console.error('Error saving search history:', error);
  });

export default api;
