import React, { useState } from 'react';
import { LogIn, Loader } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import './auth.css';

const AuthLogin = ({ onSuccess, onClose, switchToSignup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    console.log("Submitting login form...");
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("About to send login request with:", { username, password: "********" });
      
      const result = await login(username, password);
      
      console.log('Login result:', result);
      
      if (result) {
        console.log('Login successful, calling onSuccess');
        onSuccess(result, localStorage.getItem('token'));
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Error details:', err);
      setError('Login failed. Please check your credentials or try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h3>Login to Your Account</h3>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-username">Username</label>
          <input
            type="text"
            id="login-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            type="password"
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
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
              <LogIn size={16} />
              <span>Login</span>
            </>
          )}
        </button>
      </form>
      
      <p className="auth-message">
        Don't have an account? <button onClick={switchToSignup} className="auth-link">Sign up</button>
      </p>
    </div>
  );
};

export default AuthLogin;