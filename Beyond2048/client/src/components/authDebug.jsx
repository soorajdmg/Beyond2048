import React, { useEffect } from 'react';
import { useAuth } from './authContext';

const AuthDebug = () => {
  const { currentUser, loading } = useAuth();
  
  useEffect(() => {
    // Check what's in localStorage
    const token = localStorage.getItem('token');
    console.log("DEBUG - Token in localStorage:", token ? 'exists' : 'not found');
    console.log("DEBUG - Current User:", currentUser);
    console.log("DEBUG - Loading State:", loading);
    
    // Check axios headers
    const axiosHeaders = window.axios ? window.axios.defaults.headers.common['Authorization'] : 'axios not available';
    console.log("DEBUG - Axios Auth Header:", axiosHeaders || 'not set');
  }, [currentUser, loading]);
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      borderRadius: '5px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      zIndex: 9999
    }}>
      <h4>Auth Debug</h4>
      <div>User: {currentUser ? currentUser.username : 'Not logged in'}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Token: {localStorage.getItem('token') ? 'Exists' : 'None'}</div>
    </div>
  );
};

export default AuthDebug;