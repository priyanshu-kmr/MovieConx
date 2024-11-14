// components/Login/Login.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Login.css';
import { UserContext } from '../UserContext/UserContext.js';
import api from '../../api.js';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });

  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
  
    if (!formData.username) newErrors.username = 'Please enter the Username';
    if (!formData.password) newErrors.password = 'Please enter the Password';
  
    setErrors(newErrors);
  
    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await api.post('/login', formData);
        const { token, user } = response.data;
        setUser({ ...user, token });
        navigate('/main');
      } catch (error) {
        if (error.response && error.response.data) {
          setErrors(error.response.data);
        } else {
          console.error('Error logging in:', error);
        }
      }
    }
  };

  const ErrorMessage = ({ message }) => (
    <div className="error-message">
      <svg width="16" height="16" fill="red" className="error-icon">
        <circle cx="8" cy="8" r="8" />
        <line x1="4" y1="4" x2="12" y2="12" stroke="white" strokeWidth="2" />
        <line x1="12" y1="4" x2="4" y2="12" stroke="white" strokeWidth="2" />
      </svg>
      <span>{message}</span>
    </div>
  );

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form" noValidate>
        <h2>Log in to your account</h2>
        <p>
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            name="username"
            placeholder='Username'
            value={formData.username}
            onChange={handleChange}
            required
          />
          {errors.username && <ErrorMessage message={errors.username} />}
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            placeholder='Password'
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && <ErrorMessage message={errors.password} />}
        </div>
        <button type="submit">Log in</button>
      </form>
    </div>
  );
};

export default LoginPage;