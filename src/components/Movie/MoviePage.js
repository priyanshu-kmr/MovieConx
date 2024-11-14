// components/MoviePage/MoviePage.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../css/MoviePage.css';
import RatingVisual from './RatingVisual';
import IconButton from '@mui/material/IconButton';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import AccountPopup from '../MainPage/AccountPopup';
import { UserContext } from '../UserContext/UserContext';
import { AI_URL, recordSearch } from '../../api.js';

const MoviePage = () => {
    const { movieId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const [movie, setMovie] = useState(null);
    const [movieDetails, setMovieDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchMovieDetails = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${AI_URL}/movie/${movieId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch movie details');
                }
                const movieData = await response.json();
                setMovie(movieData);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchAdditionalDetails = async () => {
            try {
                const response = await fetch(`${AI_URL}/movie_details/${movieId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch additional movie details');
                }
                const detailsData = await response.json();
                setMovieDetails(detailsData);
            } catch (err) {
                // Optional section (needs a Gemini key); the rest of the page still renders
                console.warn(err.message);
            }
        };

        fetchMovieDetails();
        fetchAdditionalDetails();
    }, [movieId]);

    const handleSearch = async () => {
        const query = searchQuery.trim();
        if (!query) return;
        if (user) recordSearch(query);
        navigate(`/main?query=${encodeURIComponent(query)}`);
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

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!movie) {
        return <div>Movie not found</div>;
    }

    return (
        <div className="movie-page">
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
            <div className="movie-content">
                <div className="movie-info">
                    <h1 className="movie-title">{movie.title}</h1>
                    <div className="movie-rating-container">
                        <RatingVisual rating={movie.average_rating}/>
                        <p className="rating-text">Average Rating: {movie.average_rating.toFixed(2)}</p>
                    </div>
                    <div className="movie-metadata">
                        <h2 className="movie-year">{movie.year}</h2>
                        <div className="movie-genres">
                            {movie.genres.map((genre, index) => (
                                <span key={index} className="genre-tag">
                                    {genre}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="video-container">
                    {movie.video_link ? (
                        <video controls width="100%">
                            <source src={movie.video_link} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <div className="video-placeholder">
                            <p>Video preview not available</p>
                        </div>
                    )}
                </div>
            </div>

            {movieDetails && (
                <div className="movie-details">
                    <h2>Description</h2>
                    <p>{movieDetails.description}</p>
                    <h2>Directors</h2>
                    <p>{(movieDetails.directors || []).join(', ')}</p>
                    <h2>Cast</h2>
                    <p>{(movieDetails.actors || []).join(', ')}</p>
                </div>
            )}
            {isPopupVisible && <AccountPopup onClose={togglePopup} />}
        </div>
    );
};

export default MoviePage;