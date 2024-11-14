// components/Settings/DeleteAccountPopup.js
import React, { useState } from 'react';
import api from '../../api.js';
import '../../css/DeleteAccount.css';

const DeleteAccountPopup = ({ onClose, onDelete }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleVerify = async () => {
        setIsLoading(true);
        try {
            const response = await api.post('/settings/verify-password', { password });
            if (response.data.verified) {
                setIsVerified(true);
                setError('');
            }
        } catch (error) {
            setError('Incorrect password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        await onDelete(password);
        setIsLoading(false);
    };

    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup">
                {!isVerified ? (
                    <>
                        <h3>Verify Password</h3>
                        <p>Please enter your password to continue</p>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            disabled={isLoading}
                        />
                        {error && <div className="error-message">{error}</div>}
                        <div className="button-group">
                            <button 
                                onClick={handleVerify} 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Verifying...' : 'Continue'}
                            </button>
                            <button onClick={onClose}>Cancel</button>
                        </div>
                    </>
                ) : (
                    <>
                        <h3>Delete Account</h3>
                        <p>This action cannot be undone. All your data will be permanently deleted.</p>
                        <div className="button-group">
                            <button 
                                className="delete-button" 
                                onClick={handleDelete}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Deleting...' : 'Delete Account'}
                            </button>
                            <button onClick={onClose}>Cancel</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DeleteAccountPopup;