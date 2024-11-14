// components/Preferences/Preferences.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext/UserContext.js';
import api from '../../api.js';
import '../../css/Preferences.css';

// Must match the genre names in AI/movies.json
const genresList = [
  'Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 'Horror', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western',
];

const Preferences = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const [selectedGenres, setSelectedGenres] = useState(user?.genres || []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleGenreClick = (genre) => {
    setSelectedGenres((prevSelected) => {
      if (prevSelected.includes(genre)) {
        return prevSelected.filter((g) => g !== genre);
      }
      return [...prevSelected, genre];
    });
  };

  const handleContinue = async () => {
    if (selectedGenres.length >= 3) {
      try {
        await api.post('/preferences', { genres: selectedGenres });
        setUser({ ...user, genres: selectedGenres });
        navigate('/main'); // Replace with your desired route
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    } else {
      alert("Please select at least three genres.");
    }
  };

  return (
    <div className="preferences-container">
      <h2>Select at least three genres of your choice</h2>
      <div className="genres">
        {genresList.map((genre) => (
          <button
            key={genre}
            className={`genre-button ${selectedGenres.includes(genre) ? 'selected' : ''}`}
            onClick={() => handleGenreClick(genre)}
          >
            {genre}
          </button>
        ))}
      </div>
      <button className="continue-button" onClick={handleContinue}>
        Continue
      </button>
    </div>
  );
};

export default Preferences;