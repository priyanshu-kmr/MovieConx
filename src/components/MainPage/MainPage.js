import React, { useContext, useState, useEffect } from 'react';
import '../../css/MainPage.css';
import MovieList from '../MainPage/MovieList.js';
import SearchHistory from '../SearchHistory/SearchHistory.js';
import { UserContext } from '../UserContext/UserContext.js';
import IconButton from '@mui/material/IconButton';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import AccountPopup from '../MainPage/AccountPopup.js';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { AI_URL, recordSearch } from '../../api.js';

const toArray = (movies) => Object.keys(movies).map(id => ({ id, ...movies[id] }));

const MainPage = () => {
  const navigator = useNavigate();
  const location = useLocation();
  const { user } = useContext(UserContext);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [historyMovies, setHistoryMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // The URL (?query=...) is the source of truth for what is shown.
  useEffect(() => {
    if (!user) {
      navigator('/login');
    } else {
      const queryParams = new URLSearchParams(location.search);
      const query = (queryParams.get('query') || '').trim();
      setSearchQuery(query);
      setActiveQuery(query);
      if (query) {
        runSearch(query);
      } else {
        fetchMovies(0, true); // Fetch movies with reset
        fetchHistoryRecommendations();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.search]);

  const fetchMovies = async (newOffset = 0, reset = false) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${AI_URL}/filter?offset=${newOffset}&limit=14`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ genre: user.genres })
      });
      const moviesArray = toArray(await response.json());

      setRecommendedMovies(prevMovies => reset ? moviesArray : [...prevMovies, ...moviesArray]);
      setOffset(newOffset + 14);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoryRecommendations = async () => {
    try {
      const response = await api.get('/search-history/recommendations');
      setHistoryMovies(toArray(response.data));
    } catch (error) {
      console.error('Error fetching search history recommendations:', error);
      setHistoryMovies([]);
    }
  };

  const searchUrl = (query, from) =>
    `${AI_URL}/search?query=${encodeURIComponent(query)}&offset=${from}&limit=14`;

  const runSearch = async (query) => {
    setIsLoading(true);
    try {
      const response = await fetch(searchUrl(query, 0));
      setRecommendedMovies(toArray(await response.json()));
      setOffset(14);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) {
      navigator('/main');
      return;
    }
    recordSearch(query);
    navigator(`/main?query=${encodeURIComponent(query)}`);
  };

  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const togglePopup = () => {
    setPopupVisible(!isPopupVisible);
  };

  const loadMoreMovies = async () => {
    if (!activeQuery) {
      await fetchMovies(offset);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(searchUrl(activeQuery, offset));
      const searchResultsArray = toArray(await response.json());
      setRecommendedMovies(prevMovies => [...prevMovies, ...searchResultsArray]);
      setOffset(prev => prev + 14);
    } catch (error) {
      console.error('Error loading more movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <header className="header">
        <div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <IconButton className="search-button" disableRipple disableFocusRipple onClick={handleSearch}>
            <SearchIcon />
          </IconButton>
        </div>
        <IconButton className="icon-button" disableRipple disableFocusRipple onClick={togglePopup}>
          <AccountCircleIcon />
        </IconButton>
      </header>
      {!activeQuery && (
        <SearchHistory movies={historyMovies} title="Based on your recent searches" />
      )}
      <h2>{activeQuery ? `Results for "${activeQuery}"` : 'Recommended Movies'}</h2>

      <MovieList movies={recommendedMovies} />
      {isPopupVisible && <AccountPopup onClose={togglePopup} />}
      <div className="load-more-container">
        <button className="load-more-button" onClick={loadMoreMovies} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      </div>
    </div>
  );
};

export default MainPage;
