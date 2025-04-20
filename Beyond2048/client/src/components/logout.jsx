import React, { useState } from 'react';
import { LogOut, Loader } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import './auth.css';

const AuthLogout = ({ onSuccess, onClose }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { logout } = useAuth();

  const handleLogout = async () => {
    console.log("Processing logout...");
    setError('');
    setIsLoading(true);

    try {
      console.log("About to send logout request");

      // Use the logout function from AuthContext
      const result = await logout();

      console.log('Logout result:', result);

      if (result.success) {
        // Call onSuccess to notify parent component
        console.log(result.message);
        onSuccess();
      } else {
        setError('Logout failed. Please try again.');
      }
    } catch (err) {
      console.error('Error details:', err);
      setError('Logout failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h3>Log Out</h3>

      {error && <div className="auth-error">{error}</div>}

      <div className="form-group">
        <p>Are you sure you want to log out?</p>
      </div>

      <button
        onClick={handleLogout}
        className="auth-button"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader size={16} className="spin" />
        ) : (
          <>
            <LogOut size={16} />
            <span>Logout</span>
          </>
        )}
      </button>

      <p className="auth-message">
        <button onClick={onClose} className="auth-link">Cancel</button>
      </p>
    </div>
  );
};

export default AuthLogout;