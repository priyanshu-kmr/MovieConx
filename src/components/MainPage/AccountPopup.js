// components/AccountPopup/AccountPopup.js
import React, { useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext/UserContext.js';
import '../../css/AccountPopup.css';

const AccountPopup = ({ onClose }) => {
  const popupRef = useRef(null);
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSelectGenres = () => {
    navigate('/preferences');
  };

  return (
    <div className="popup" ref={popupRef}>
      <div className="popup-content">
        <p>{user?.username}</p>
        <button className="popup-button" onClick={handleLogout}>Logout</button>
        <button className="popup-button" onClick={handleSelectGenres}>Select Genres</button>
        <button className='popup-button' onClick={() => {
          onClose();
          navigate('/settings');
        }}>Settings</button>
      </div>
    </div>
  );
};

export default AccountPopup;
