import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

axios.defaults.baseURL = 'http://beyond2048-backend.onrender.com/';

const authAxios = axios.create({
  baseURL: 'http://beyond2048-backend.onrender.com/',
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
  const [recentGames, setRecentGames] = useState([]);

  const setAxiosAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      authAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
      delete authAxios.defaults.headers.common['Authorization'];
    }
  };

  useEffect(() => {
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

    const responseInterceptor = authAxios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.log('Auth token expired or invalid. Logging out...');
          localStorage.removeItem('token');
          setCurrentUser(null);
          setUserStats(null);
          setUserSettings(null);
          setRecentGames([]);
          setIsAuthenticated(false);
          setAxiosAuthHeader(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      authAxios.interceptors.request.eject(requestInterceptor);
      authAxios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const fetchUserData = async () => {
    try {
      console.log("Fetching user data from backend");
      const response = await authAxios.get('/api/auth/user');

      if (response.data && response.data.success) {
        console.log("User data fetched successfully:", response.data.user);

        if (response.data.user) {
          setCurrentUser(response.data.user);
        }

        if (response.data.user && response.data.user.stats) {
          setUserStats(response.data.user.stats);
        }

        if (response.data.user && response.data.user.settings) {
          setUserSettings(response.data.user.settings);
        }

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
        setRecentGames([]);
        setAxiosAuthHeader(null);
        setLoading(false);
        return;
      }

      console.log("Setting authorization header");
      setAxiosAuthHeader(token);

      console.log("Sending verification request to /api/auth/user");
      const userData = await fetchUserData();

      if (userData) {
        console.log("Authentication successful - user data received");
        setIsAuthenticated(true);

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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const saveAuthData = async (userData, token) => {
    if (!userData || !token) {
      console.error("Invalid auth data provided:", {
        userData: userData ? 'exists' : undefined,
        token: token ? 'exists' : 'missing'
      });
      return { success: false, user: null, stats: null, settings: null, recentGames: [] };
    }

    try {
      localStorage.setItem('token', token);

      setAxiosAuthHeader(token);

      setCurrentUser(userData);
      setIsAuthenticated(true);

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

      console.log("Attempting login for user:", username);
      const response = await authAxios.post('/api/auth/login', {
        username,
        password
      });

      console.log("Login response received:", response.status);

      let token, userData;

      if (response.data.data && response.data.data.token) {
        token = response.data.data.token;
        userData = response.data.data.user;
      } else if (response.data.token) {
        token = response.data.token;
        userData = response.data.user;
      } else {
        throw new Error("Invalid login response format");
      }

      if (!token || !userData) {
        throw new Error("Missing token or user data in login response");
      }

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

      const userData = {
        name,
        username,
        password,
      };

      const response = await authAxios.post('/api/auth/signup', userData);

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
      localStorage.removeItem('token');
      const logOutScore = 0;
      localStorage.setItem('2048HighScore', logOutScore.toString());

      setAxiosAuthHeader(null);

      setCurrentUser(null);
      setUserStats(null);
      setUserSettings(null);
      setRecentGames([]);
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

        if (response.data.data && response.data.data.stats) {
          setUserStats(response.data.data.stats);
        }

        await Promise.all([
          fetchUserStats(),
          fetchRecentGames()
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

        await Promise.all([
          fetchUserStats(),
          fetchRecentGames()
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

      const [profileResponse, statsResponse, settingsResponse, gamesResponse] = await Promise.all([
        authAxios.get('/api/user/profile'),
        fetchUserStats(),
        getUserSettings(),
        fetchRecentGames()
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

  const fetchLeaderboard = async () => {
    try {
      console.log("Fetching standard leaderboard data from backend");
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

  const fetchMostWinsLeaderboard = async () => {
    try {
      console.log("Fetching most wins leaderboard data from backend");
      const response = await axios.get('/api/auth/leaderboard/wins');

      if (response.data && response.data.success) {
        console.log("Most wins leaderboard data fetched successfully:", response.data.data);
        return {
          success: true,
          leaderboard: response.data.data
        };
      } else {
        console.error("Failed to fetch most wins leaderboard:", response.data?.message || "Unknown error");
        return {
          success: false,
          message: response.data?.message || "Failed to fetch most wins leaderboard",
          leaderboard: []
        };
      }
    } catch (error) {
      console.error("Error fetching most wins leaderboard data:", error.message);
      console.log("Response details:", error.response?.status, error.response?.data);
      return {
        success: false,
        message: error.message || "Error fetching most wins leaderboard",
        leaderboard: []
      };
    }
  };

  const fetchHighestTilesLeaderboard = async () => {
    try {
      console.log("Fetching highest tiles leaderboard data from backend");
      const response = await axios.get('/api/auth/leaderboard/tiles');

      if (response.data && response.data.success) {
        console.log("Highest tiles leaderboard data fetched successfully:", response.data.data);
        return {
          success: true,
          leaderboard: response.data.data
        };
      } else {
        console.error("Failed to fetch highest tiles leaderboard:", response.data?.message || "Unknown error");
        return {
          success: false,
          message: response.data?.message || "Failed to fetch highest tiles leaderboard",
          leaderboard: []
        };
      }
    } catch (error) {
      console.error("Error fetching highest tiles leaderboard data:", error.message);
      console.log("Response details:", error.response?.status, error.response?.data);
      return {
        success: false,
        message: error.message || "Error fetching highest tiles leaderboard",
        leaderboard: []
      };
    }
  };

  const value = {
    currentUser,
    userStats,
    userSettings,
    recentGames,
    isAuthenticated,
    login,
    signup,
    logout,
    authError,
    loading,
    saveGameStats,
    updateProfile,
    refreshUserData,
    fetchUserData,
    fetchUserStats,
    fetchRecentGames,
    getUserSettings,
    updateUserSettings,
    resetUserSettings,
    fetchLeaderboard,
    fetchMostWinsLeaderboard,
    fetchHighestTilesLeaderboard,
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