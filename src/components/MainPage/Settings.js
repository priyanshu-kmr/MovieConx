// components/Settings/Settings.js
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../UserContext/UserContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api.js';
import '../../css/Settings.css';
import DeleteAccountPopup from './DeleteAccount';

const Settings = () => {
    const { user, setUser } = useContext(UserContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: ''
    });
    const [errors, setErrors] = useState({
        username: '',
        email: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showDeletePopup, setShowDeletePopup] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await api.get('/settings');
                setFormData({
                    username: response.data.username,
                    email: response.data.email
                });
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setErrors(prev => ({
            ...prev,
            [name]: ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/settings', formData);
            setUser(prev => ({
                ...prev,
                username: response.data.user.username
            }));
            alert('Settings updated successfully');
            navigate('/main'); // Redirect to main page after successful update
        } catch (error) {
            if (error.response && error.response.data) {
                setErrors(error.response.data);
            }
        }
    };

    const handleDeleteAccount = async (password) => {
        try {
            const response = await api.delete('/settings', { data: { password } });
            if (response.data.message === 'Account deleted successfully') {
                setUser(null);
                navigate('/login');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account. Please try again.');
        }
    };

    if (isLoading) return <div className="settings-container">Loading...</div>;

    return (
        <div className="settings-container">
            <div className="settings-box">
                <h2>Update account</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                        />
                        {errors.username && (
                            <div className="error-message">
                                <span>{errors.username}</span>
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && (
                            <div className="error-message">
                                <span>{errors.email}</span>
                            </div>
                        )}
                    </div>
                    <button type="submit">Update</button>
                </form>
                <button 
                    className="delete-account-button" 
                    onClick={() => setShowDeletePopup(true)}
                >
                    Delete Account
                </button>
                {showDeletePopup && (
                    <DeleteAccountPopup
                        onClose={() => setShowDeletePopup(false)}
                        onDelete={handleDeleteAccount}
                    />
                )}
            </div>
        </div>
    );
};

export default Settings;