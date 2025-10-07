// File: /src/services/statsService.js

const API_URL = '/api/stats';

// Get user stats from the backend
export const getUserStats = async () => {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user stats');
    }
    
    const result = await response.json();
    return result.data; // Your API returns data in a 'data' property
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};