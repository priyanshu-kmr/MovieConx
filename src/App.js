import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { UserProvider } from './components/UserContext/UserContext';
import MainPage from './components/MainPage/MainPage';
import LoginPage from './components/Login/Login';
import SignupPage from './components/Signup/Signup';
import Preferences from './components/Preferences/Preferences';
import MoviePage from './components/Movie/MoviePage';
import Settings from './components/MainPage/Settings';

const App = () => (
  <UserProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/main" replace />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/movie/:movieId" element={<MoviePage />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  </UserProvider>
);

export default App;