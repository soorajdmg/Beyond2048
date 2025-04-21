import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

axios.defaults.baseURL = 'https://beyond2048-backend.onrender.com';

const authAxios = axios.create({
  baseURL: 'https://beyond2048-backend.onrender.com',
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
      const response = await authAxios.get('/api/auth/user');

      if (response.data && response.data.success) {
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
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await authAxios.get('/api/auth/stats');

      if (response.data && response.data.success) {
        setUserStats(response.data.data);
        return response.data.data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const fetchRecentGames = async () => {
    try {
      const response = await authAxios.get('/api/auth/stats');

      if (response.data && response.data.success) {
        setRecentGames(response.data.games);
        return response.data.games;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  };

  const getUserSettings = async () => {
    try {
      const response = await authAxios.get('/api/auth/settings');

      if (response.data && response.data.success) {
        setUserSettings(response.data.settings);
        return {
          success: true,
          settings: response.data.settings
        };
      } else {
        return {
          success: false,
          message: response.data?.message || "Failed to fetch settings"
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || "Error fetching settings"
      };
    }
  };

  const updateUserSettings = async (settings) => {
    try {
      const response = await authAxios.post('/api/auth/settings', { settings });

      if (response.data && response.data.success) {
        setUserSettings(response.data.settings);
        return {
          success: true,
          settings: response.data.settings
        };
      } else {
        return {
          success: false,
          message: response.data?.message || "Failed to update settings"
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || "Error updating settings"
      };
    }
  };

  const resetUserSettings = async () => {
    try {
      const response = await authAxios.post('/api/auth/reset');

      if (response.data && response.data.success) {
        setUserSettings(response.data.settings);
        return {
          success: true,
          settings: response.data.settings
        };
      } else {
        return {
          success: false,
          message: response.data?.message || "Failed to reset settings"
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || "Error resetting settings"
      };
    }
  };

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserStats(null);
        setUserSettings(null);
        setRecentGames([]);
        setAxiosAuthHeader(null);
        setLoading(false);
        return;
      }

      setAxiosAuthHeader(token);

      const userData = await fetchUserData();

      if (userData) {
        setIsAuthenticated(true);

        if (!userData.stats || !userData.recentGames) {
          await Promise.all([
            fetchUserStats(),
            fetchRecentGames(),
            getUserSettings()
          ]);
        }
      } else {
        localStorage.removeItem('token');
        setCurrentUser(null);
        setUserStats(null);
        setUserSettings(null);
        setRecentGames([]);
        setIsAuthenticated(false);
        setAxiosAuthHeader(null);
      }
    } catch (error) {
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
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const saveAuthData = async (userData, token) => {
    if (!userData || !token) {
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

      return {
        success: true,
        user: userData,
        stats,
        settings: settingsResponse?.settings,
        recentGames: games
      };
    } catch (error) {
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

      const response = await authAxios.post('/api/auth/login', {
        username,
        password
      });

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

      return {
        ...userData,
        stats: userStats,
        settings: userSettings,
        recentGames: recentGames
      };
    } catch (error) {
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

      if (response.data && response.data.token) {
        token = response.data.token;
        user = response.data.user;
      } else if (response.data.token) {
        token = response.data.token;
        user = response.data.user;
      } else {
        throw new Error("Invalid signup response format");
      }

      await saveAuthData(user, token);

      return {
        ...userData,
        stats: userStats,
        settings: userSettings,
        recentGames: recentGames
      };
    } catch (error) {
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

      return {
        ...response
      };
    } catch (error) {
    }
  };

  const saveGameStats = async (gameStats) => {
    try {
      if (!isAuthenticated || !currentUser) {
        return false;
      }

      const response = await authAxios.post('/api/auth/stats/game', gameStats);

      if (response.data && response.data.success) {
        if (response.data.data && response.data.data.stats) {
          setUserStats(response.data.data.stats);
        }

        await Promise.all([
          fetchUserStats(),
          fetchRecentGames()
        ]);

        return true;
      } else {
        return false;
      }
    } catch (error) {
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
      setAuthError(error.response?.data?.message || "Failed to load profile data");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('/api/auth/leaderboard');

      if (response.data && response.data.success) {
        return {
          success: true,
          leaderboard: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data?.message || "Failed to fetch leaderboard",
          leaderboard: []
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || "Error fetching leaderboard",
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