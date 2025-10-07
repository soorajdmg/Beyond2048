import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from './authContext';

const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    gameSize: 4,
    theme: 'classic',
    animations: true,
    soundEffects: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  const backendFetchCompleted = useRef(false);
  
  const { 
    isAuthenticated, 
    getUserSettings, 
    updateUserSettings, 
    resetUserSettings,
    userSettings,
    loading: authLoading 
  } = useAuth();

  useEffect(() => {
    if (settingsLoaded || authLoading) return;
    
    const loadSettings = async () => {
      const localSettings = localStorage.getItem('gameSettings');
      if (localSettings) {
        try {
          const parsedSettings = JSON.parse(localSettings);
          setGameSettings(parsedSettings);
        } catch (e) {
          console.error('Failed to parse saved settings:', e);
        }
      }
      
      if (isAuthenticated && !backendFetchCompleted.current) {
        try {
          const response = await getUserSettings();
          
          if (response.success && response.settings) {
            setGameSettings(response.settings);
            // Update localStorage with server settings
            localStorage.setItem('gameSettings', JSON.stringify(response.settings));
          }
        } catch (error) {
          console.error('Error loading settings from API:', error);
        } finally {
          backendFetchCompleted.current = true;
        }
      }
      
      setSettingsLoaded(true);
    };
    
    loadSettings();
  }, [isAuthenticated, authLoading, settingsLoaded]);

  useEffect(() => {
    if (userSettings && isAuthenticated && settingsLoaded) {
      setGameSettings(userSettings);
      localStorage.setItem('gameSettings', JSON.stringify(userSettings));
    }
  }, [userSettings, isAuthenticated, settingsLoaded]);

  const saveSettings = async () => {
    localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    
    if (isAuthenticated) {
      setIsSaving(true);
      setSaveError(null);
      
      try {
        const response = await updateUserSettings(gameSettings);
        if (!response.success) {
          console.error('Failed to save settings to backend:', response.message);
          setSaveError(response.message || 'Failed to save settings');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Failed to save settings to server:', error);
        setSaveError('Failed to save settings. Please try again.');
        return false;
      } finally {
        setIsSaving(false);
      }
    }
    
    return true;
  };

  const updateSetting = async (key, value) => {
    setGameSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: value
      };
      
      localStorage.setItem('gameSettings', JSON.stringify(newSettings));
      
      return newSettings;
    });
  };

  const resetSettings = async () => {
    const defaultSettings = {
      gameSize: 4,
      theme: 'classic',
      animations: true,
      soundEffects: false
    };
    
    setGameSettings(defaultSettings);
    localStorage.setItem('gameSettings', JSON.stringify(defaultSettings));
    
    if (isAuthenticated) {
      setIsSaving(true);
      try {
        const response = await resetUserSettings();
        if (!response.success) {
          console.error('Failed to reset settings on server:', response.message);
          setSaveError(response.message || 'Failed to reset settings on server');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Failed to reset settings on server:', error);
        setSaveError('Failed to reset settings. Please try again.');
        return false;
      } finally {
        setIsSaving(false);
      }
    }
    
    return true;
  };

  // Apply theme updates to the document body and html
  useEffect(() => {
    if (!gameSettings.theme) return;

    // Remove any existing theme classes from both html and body
    document.documentElement.classList.remove('dark-theme', 'neon-theme', 'childish-theme');
    document.body.classList.remove('dark-theme', 'neon-theme', 'childish-theme');

    // Apply new theme to both html and body
    if (gameSettings.theme !== 'classic') {
      document.documentElement.classList.add(`${gameSettings.theme}-theme`);
      document.body.classList.add(`${gameSettings.theme}-theme`);
    }
  }, [gameSettings.theme]);

  const value = {
    gameSettings,
    updateSetting,
    resetSettings,
    saveSettings,
    isSaving,
    saveError,
    settingsOpen,
    setSettingsOpen,
    settingsLoaded
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}