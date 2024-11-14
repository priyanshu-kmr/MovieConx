// components/Signup/Signup.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext/UserContext.js';
import api from '../../api.js';
import '../../css/Signup.css';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

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
    if (!formData.email) newErrors.email = 'Please enter the Email';
    if (!formData.password) newErrors.password = 'Please fill the Password';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await api.post('/signup', formData);
        const { token, user } = response.data;
        setUser({ ...user, token });
        navigate('/preferences');
      } catch (error) {
        if (error.response && error.response.data) {
          setErrors(error.response.data);
        } else {
          console.error('Error creating user:', error);
        }
      }
    }
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit} className="signup-form" noValidate>
        <h2>Create an account</h2>
        <p>
          Already have an account? <a href="/login">Log in</a>
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
          {errors.username && (
            <div className="error-message">
              <span>{errors.username}</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            placeholder='Email Address'
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email && (
            <div className="error-message">
              <span>{errors.email}</span>
            </div>
          )}
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
          {errors.password && (
            <div className="error-message">
              <span>{errors.password}</span>
            </div>
          )}
        </div>

        <button type="submit">Create account</button>
      </form>
    </div>
  );
};

export default SignupPage;