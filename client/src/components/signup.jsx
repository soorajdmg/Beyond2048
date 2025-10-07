import React, { useState } from 'react';
import { UserPlus, Loader } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import './auth.css';

const Signup = ({ onSuccess, onClose, switchToLogin }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    console.log("Submitting signup form...");
    e.preventDefault();
    setError('');

    // Password validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      console.log("About to send request with data:", { name, username, password: "********" });

      // Use the signup function from AuthContext
      const result = await signup(name, username, password);

      console.log('Signup result:', result);

      if (result.username === username) {
        // Call onSuccess with the user data
        console.log('Signup successful, calling onSuccess');
        onSuccess(result.user, localStorage.getItem('token'));
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Error details:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h3>Create Account</h3>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="signup-username">Username</label>
          <input
            type="text"
            id="signup-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="signup-password">Password</label>
          <input
            type="password"
            id="signup-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="form-input"
            required
          />
        </div>

        <button
          type="submit"
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader size={16} className="spin" />
          ) : (
            <>
              <UserPlus size={16} />
              <span>Sign Up</span>
            </>
          )}
        </button>
      </form>

      <p className="auth-message">
        Already have an account? <button onClick={switchToLogin} className="auth-link">Login</button>
      </p>
    </div>
  );
};

export default Signup;