import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';


// Set default base URL
axios.defaults.baseURL = 'http://localhost:5000';

// Create a separate axios instance for auth to avoid header conflicts
const authAxios = axios.create({
  baseURL: 'http://localhost:5000',
});
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [recentGames, setRecentGames] = useState([]);  // Add state for recent games

  // Set axios default headers on app start and when token changes
  const setAxiosAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      authAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
      delete authAxios.defaults.headers.common['Authorization'];
    }
  };

  // Set up axios interceptors for authentication
  useEffect(() => {
    // Add request interceptor to include auth token
    const requestInterceptor = authAxios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle auth errors
    const responseInterceptor = authAxios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token expired or invalid
          console.log('Auth token expired or invalid. Logging out...');
          localStorage.removeItem('token');
          setCurrentUser(null);
          setUserStats(null);
          setUserSettings(null);
          setRecentGames([]);  // Clear recent games on logout
          setIsAuthenticated(false);
          setAxiosAuthHeader(null);
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptors on unmount
    return () => {
      authAxios.interceptors.request.eject(requestInterceptor);
      authAxios.interceptors.response.eject(responseInterceptor);
    };
  }, []);


  // Fetch user data (profile, stats, and recent games) from the backend
  const fetchUserData = async () => {
    try {
      console.log("Fetching user data from backend");
      const response = await authAxios.get('/api/auth/user');

      if (response.data && response.data.success) {
        console.log("User data fetched successfully:", response.data.user);

        // Update user data
        if (response.data.user) {
          setCurrentUser(response.data.user);
        }

        // Update stats
        if (response.data.user && response.data.user.stats) {
          setUserStats(response.data.user.stats);
        }

        // Update settings
        if (response.data.user && response.data.user.settings) {
          setUserSettings(response.data.user.settings);
        }

        // Update recent games
        if (response.data.user && response.data.user.recentGames) {
          setRecentGames(response.data.user.recentGames);
        }

        return response.data.user;
      } else {
        console.error("Failed to fetch user data:", response.data?.message || "Unknown error");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error.message);
      console.log("Response details:", error.response?.status, error.response?.data);
      return null;
    }
  };

  // Fetch user stats from the backend
  const fetchUserStats = async () => {
    try {
      console.log("Fetching user stats from backend");
      const response = await authAxios.get('/api/auth/stats');

      if (response.data && response.data.success) {
        console.log("User stats fetched successfully:", response.data.data);
        setUserStats(response.data.data);
        return response.data.data;
      } else {
        console.error("Failed to fetch user stats:", response.data?.message || "Unknown error");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user stats:", error.message);
      console.log("Response details:", error.response?.status, error.response?.data);
      return null;
    }
  };

  // Fetch recent games history
  const fetchRecentGames = async () => {
    try {
      console.log("Fetching recent games from backend");
      const response = await authAxios.get('/api/auth/stats');

      if (response.data && response.data.success) {
        console.log("Recent games fetched successfully:", response.data);
        setRecentGames(response.data.games);
        return response.data.games;
      } else {
        console.error("Failed to fetch recent games:", response.data?.message || "Unknown error");
        return [];
      }
    } catch (error) {
      console.error("Error fetching recent games:", error.message);
      console.log("Response details:", error.response?.status, error.response?.data);
      return [];
    }
  };

  // Fetch user settings from the backend
  const getUserSettings = async () => {
    try {
      console.log("Fetching user settings from backend");
      const response = await authAxios.get('/api/auth/settings');

      if (response.data && response.data.success) {
        console.log("User settings fetched successfully:", response.data.settings);
        setUserSettings(response.data.settings);
        return {
          success: true,
          settings: response.data.settings
        };
      } else {
        console.error("Failed to fetch user settings:", response.data?.message || "Unknown error");
        return {
          success: false,
          message: response.data?.message || "Failed to fetch settings"
        };
      }
    } catch (error) {
      console.error("Error fetching user settings:", error.message);
      console.log("Response details:", error.response?.status, error.response?.data);
      return {
        success: false,
        message: error.message || "Error fetching settings"
      };
    }
  };

  // Update user settings in the backend
  const updateUserSettings = async (settings) => {
    try {
      console.log("Updating user settings in backend:", settings);
      const response = await authAxios.post('/api/auth/settings', { settings });

      if (response.data && response.data.success) {
        console.log("User settings updated successfully:", response.data.settings);
        setUserSettings(response.data.settings);
        return {
          success: true,
          settings: response.data.settings
        };
      } else {
        console.error("Failed to update user settings:", response.data?.message || "Unknown error");
        return {
          success: false,
          message: response.data?.message || "Failed to update settings"
        };
      }
    } catch (error) {
      console.error("Error updating user settings:", error.message);
      console.log("Response details:", error.response?.status, error.response?.data);
      return {
        success: false,
        message: error.message || "Error updating settings"
      };
    }
  };

  // Reset user settings to defaults in the backend
  const resetUserSettings = async () => {
    try {
      console.log("Resetting user settings in backend");
      const response = await authAxios.post('/api/auth/reset');

      if (response.data && response.data.success) {
        console.log("User settings reset successfully:", response.data.settings);
        setUserSettings(response.data.settings);
        return {
          success: true,
          settings: response.data.settings
        };
      } else {
        console.error("Failed to reset user settings:", response.data?.message || "Unknown error");
        return {
          success: false,
          message: response.data?.message || "Failed to reset settings"
        };
      }
    } catch (error) {
      console.error("Error resetting user settings:", error.message);
      console.log("Response details:", error.response?.status, error.response?.data);
      return {
        success: false,
        message: error.message || "Error resetting settings"
      };
    }
  };

  // Function to check auth status - can be called manually if needed
  const checkAuthStatus = async () => {
    console.log("==== AUTH CHECK STARTED ====");
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log("Token from storage:", token ? `${token.substring(0, 15)}...` : 'none');

      if (!token) {
        console.log("No token found - user is not authenticated");
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserStats(null);
        setUserSettings(null);
        setRecentGames([]);  // Clear recent games
        setAxiosAuthHeader(null);
        setLoading(false);
        return;
      }

      // Add token to request headers
      console.log("Setting authorization header");
      setAxiosAuthHeader(token);

      // Verify token with backend and fetch user data
      console.log("Sending verification request to /api/auth/user");
      const userData = await fetchUserData();

      if (userData) {
        console.log("Authentication successful - user data received");
        setIsAuthenticated(true);

        // Fetch additional user data if not already included
        if (!userData.stats || !userData.recentGames) {
          console.log("Fetching additional user data");
          await Promise.all([
            fetchUserStats(),
            fetchRecentGames(),
            getUserSettings()
          ]);
        }

        console.log("Auth state updated: isAuthenticated=true");
      } else {
        console.log("Invalid response format - logging out");
        localStorage.removeItem('token');
        setCurrentUser(null);
        setUserStats(null);
        setUserSettings(null);
        setRecentGames([]);
        setIsAuthenticated(false);
        setAxiosAuthHeader(null);
      }
    } catch (error) {
      console.error("Auth verification error:", error.message);
      console.log("Response details:", error.response?.status, error.response?.data);

      // Only clear token if it's an authentication error
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem('token');
        setCurrentUser(null);
        setUserStats(null);
        setUserSettings(null);
        setRecentGames([]);
        setIsAuthenticated(false);
        setAxiosAuthHeader(null);
      }
    } finally {
      setLoading(false);
      console.log("==== AUTH CHECK COMPLETED ====");
    }
  };

  // Initialize authentication state on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Save auth data (called after successful login/registration)
  const saveAuthData = async (userData, token) => {
    if (!userData || !token) {
      console.error("Invalid auth data provided:", {
        userData: userData ? 'exists' : undefined,
        token: token ? 'exists' : 'missing'
      });
      return { success: false, user: null, stats: null, settings: null, recentGames: [] };
    }

    try {
      // Save token to localStorage
      localStorage.setItem('token', token);

      // Set auth headers for future requests
      setAxiosAuthHeader(token);

      // Update state
      setCurrentUser(userData);
      setIsAuthenticated(true);

      // Fetch user stats, settings, and recent games
      const [stats, settingsResponse, games] = await Promise.all([
        fetchUserStats(),
        getUserSettings(),
        fetchRecentGames()
      ]);

      console.log("Auth data saved successfully");
      return {
        success: true,
        user: userData,
        stats,
        settings: settingsResponse?.settings,
        recentGames: games
      };
    } catch (error) {
      console.error("Failed to save auth data:", error);
      return {
        success: false,
        user: null,
        stats: null,
        settings: null,
        recentGames: []
      };
    }
  };

  const login = async (username, password) => {
    try {
      setAuthError(null);
      setLoading(true);

      // Login request
      console.log("Attempting login for user:", username);  
      const response = await authAxios.post('/api/auth/login', {
        username,
        password
      });

      console.log("Login response received:", response.status);

      // Extract token and user data from various response formats
      let token, userData;

      if (response.data.data && response.data.data.token) {
        // Format: { success: true, data: { token, user } }
        token = response.data.data.token;
        userData = response.data.data.user;
      } else if (response.data.token) {
        // Format: { success: true, token, user }
        token = response.data.token;
        userData = response.data.user;
      } else {
        throw new Error("Invalid login response format");
      }

      if (!token || !userData) {
        throw new Error("Missing token or user data in login response");
      }

      // Save auth data and fetch user stats and settings
      const saved = await saveAuthData(userData, token);
      if (!saved) {
        throw new Error("Failed to save authentication data");
      }

      console.log("Login successful!");
      return {
        ...userData,
        stats: userStats,
        settings: userSettings,
        recentGames: recentGames
      };
    } catch (error) {
      console.error("Login failed:", error.message);
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      setAuthError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, username, password) => {
    try {
      setAuthError(null);
      setLoading(true);

      // Create user data object
      const userData = {
        name,
        username,
        password,
      };

      // Register request
      const response = await authAxios.post('/api/auth/signup', userData);

      // Extract token and user data
      let token, user;

      console.log("authcontext: ", response.data)
      console.log("authcontext: ", response.data.user)
      console.log("authcontext: ", response.data.token)

      if (response.data && response.data.token) {
        token = response.data.token;
        user = response.data.user;
      } else if (response.data.token) {
        token = response.data.token;
        user = response.data.user;
      } else {
        throw new Error("Invalid signup response format");
      }

      console.log("authcontext: ", user)

      // Save auth data and fetch user stats and settings
      await saveAuthData(user, token);

      return {
        ...userData,
        stats: userStats,
        settings: userSettings,
        recentGames: recentGames
      };
    } catch (error) {
      console.error("Signup failed:", error);
      setAuthError(error.response?.data?.message || "Registration failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      // Remove token and user stats from localStorage
      localStorage.removeItem('token');
      const logOutScore = 0;
      localStorage.setItem('2048HighScore', logOutScore.toString());

      // Clear auth headers
      setAxiosAuthHeader(null);

      // Reset state
      setCurrentUser(null);
      setUserStats(null);
      setUserSettings(null);
      setRecentGames([]);  // Clear recent games
      setIsAuthenticated(false);

      const response = { success: "true", message: "Logout successful" }

      console.log("Logout successful");
      return {
        ...response
      };
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const saveGameStats = async (gameStats) => {
    try {
      if (!isAuthenticated || !currentUser) {
        console.log("Cannot save stats: User not authenticated");
        return false;
      }

      console.log("Saving game stats to database:", gameStats);
      const response = await authAxios.post('/api/auth/stats/game', gameStats);

      if (response.data && response.data.success) {
        console.log("Game stats saved successfully:", response.data.data);

        // If updated user stats were returned, update the local state
        if (response.data.data && response.data.data.stats) {
          setUserStats(response.data.data.stats);
        }

        // Refresh user data after saving game stats
        await Promise.all([
          fetchUserStats(),
          fetchRecentGames()  // Refresh recent games list
        ]);

        return true;
      } else {
        console.error("Failed to save game stats:", response.data?.message || "Unknown error");
        return false;
      }
    } catch (error) {
      console.error("Error saving game stats:", error.message);
      console.log("Response details:", error.response?.status, error.response?.data);
      return false;
    }
  };

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setAuthError(null);

      const response = await authAxios.put('/api/user/profile', userData);

      if (response.data && response.data.user) {
        setCurrentUser(response.data.user);

        // Refresh user data after profile update
        await Promise.all([
          fetchUserStats(),
          fetchRecentGames()  // Refresh recent games
        ]);

        return true;
      }

      return false;
    } catch (error) {
      console.error("Update profile failed:", error);
      setAuthError(error.response?.data?.message || "Failed to update profile");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      setLoading(true);
      setAuthError(null);

      // Get all user data in parallel
      const [profileResponse, statsResponse, settingsResponse, gamesResponse] = await Promise.all([
        authAxios.get('/api/user/profile'),
        fetchUserStats(),
        getUserSettings(),
        fetchRecentGames()  // Fetch recent games
      ]);

      if (profileResponse.data && profileResponse.data.user) {
        setCurrentUser(profileResponse.data.user);
        return {
          user: profileResponse.data.user,
          stats: statsResponse,
          settings: settingsResponse?.settings,
          recentGames: gamesResponse
        };
      }

      return false;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      setAuthError(error.response?.data?.message || "Failed to load profile data");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaderboard data from the backend
  const fetchLeaderboard = async () => {
    try {
      console.log("Fetching leaderboard data from backend");
      // Note: We don't need authAxios since leaderboard is public - using regular axios
      const response = await axios.get('/api/auth/leaderboard');

      if (response.data && response.data.success) {
        console.log("Leaderboard data fetched successfully:", response.data.data);
        return {
          success: true,
          leaderboard: response.data.data
        };
      } else {
        console.error("Failed to fetch leaderboard:", response.data?.message || "Unknown error");
        return {
          success: false,
          message: response.data?.message || "Failed to fetch leaderboard",
          leaderboard: []
        };
      }
    } catch (error) {
      console.error("Error fetching leaderboard data:", error.message);
      console.log("Response details:", error.response?.status, error.response?.data);
      return {
        success: false,
        message: error.message || "Error fetching leaderboard",
        leaderboard: []
      };
    }
  };

  // Provide auth context value
  const value = {
    currentUser,
    userStats,
    userSettings,
    recentGames,  // Add recent games to context value
    isAuthenticated,
    login,
    signup,
    logout,
    authError,
    loading,
    saveGameStats,
    updateProfile,
    refreshUserData,
    fetchUserData,  // New method to fetch complete user data
    fetchUserStats,
    fetchRecentGames,  // Expose method to fetch recent games
    getUserSettings,
    updateUserSettings,
    resetUserSettings,
    fetchLeaderboard,
    authAxios,
    checkAuthStatus,
    setError: setAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;