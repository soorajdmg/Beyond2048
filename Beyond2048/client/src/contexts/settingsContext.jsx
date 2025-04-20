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
  
  // Tracks if we've already fetched settings from the backend
  const backendFetchCompleted = useRef(false);
  
  const { 
    isAuthenticated, 
    getUserSettings, 
    updateUserSettings, 
    resetUserSettings,
    userSettings,
    loading: authLoading 
  } = useAuth();

  // Load settings only once after authentication is confirmed
  useEffect(() => {
    // Skip if already loaded or still loading auth
    if (settingsLoaded || authLoading) return;
    
    const loadSettings = async () => {
      console.log('Loading settings - init phase');
      
      // First try localStorage for immediate feedback
      const localSettings = localStorage.getItem('gameSettings');
      if (localSettings) {
        try {
          const parsedSettings = JSON.parse(localSettings);
          console.log('Applied settings from localStorage:', parsedSettings);
          setGameSettings(parsedSettings);
        } catch (e) {
          console.error('Failed to parse saved settings:', e);
        }
      }
      
      // If authenticated and we haven't fetched from backend yet, do so now
      if (isAuthenticated && !backendFetchCompleted.current) {
        try {
          console.log('Fetching settings from backend - first and only time');
          const response = await getUserSettings();
          
          if (response.success && response.settings) {
            console.log('Settings received from backend:', response.settings);
            setGameSettings(response.settings);
            // Update localStorage with server settings
            localStorage.setItem('gameSettings', JSON.stringify(response.settings));
          }
        } catch (error) {
          console.error('Error loading settings from API:', error);
        } finally {
          // Mark that we've completed backend fetch regardless of result
          backendFetchCompleted.current = true;
        }
      }
      
      // Mark settings as fully loaded
      setSettingsLoaded(true);
    };
    
    loadSettings();
  }, [isAuthenticated, authLoading, settingsLoaded]);

  // Use userSettings from auth context if they become available later
  useEffect(() => {
    if (userSettings && isAuthenticated && settingsLoaded) {
      console.log('User settings from auth context became available:', userSettings);
      setGameSettings(userSettings);
      localStorage.setItem('gameSettings', JSON.stringify(userSettings));
    }
  }, [userSettings, isAuthenticated, settingsLoaded]);

  // Save settings to localStorage for immediate effect
  // and to the backend when user is authenticated
  const saveSettings = async () => {
    // Always save to localStorage for immediate effect
    localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    console.log('Settings saved to localStorage:', gameSettings);
    
    // Only save to backend if user is authenticated
    if (isAuthenticated) {
      setIsSaving(true);
      setSaveError(null);
      
      try {
        console.log('Saving settings to backend:', gameSettings);
        const response = await updateUserSettings(gameSettings);
        if (!response.success) {
          console.error('Failed to save settings to backend:', response.message);
          setSaveError(response.message || 'Failed to save settings');
          return false;
        }
        console.log('Settings saved successfully to backend');
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

  // Update individual setting and save immediately to localStorage
  const updateSetting = async (key, value) => {
    console.log(`Updating setting ${key} to:`, value);
    
    // Update local state
    setGameSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: value
      };
      
      // Immediately save to localStorage
      localStorage.setItem('gameSettings', JSON.stringify(newSettings));
      
      return newSettings;
    });
  };

  // Reset all settings to default
  const resetSettings = async () => {
    const defaultSettings = {
      gameSize: 4,
      theme: 'classic',
      animations: true,
      soundEffects: false
    };
    
    console.log('Resetting settings to defaults:', defaultSettings);
    setGameSettings(defaultSettings);
    localStorage.setItem('gameSettings', JSON.stringify(defaultSettings));
    
    // Reset on server if authenticated
    if (isAuthenticated) {
      setIsSaving(true);
      try {
        console.log('Resetting settings on backend');
        const response = await resetUserSettings();
        if (!response.success) {
          console.error('Failed to reset settings on server:', response.message);
          setSaveError(response.message || 'Failed to reset settings on server');
          return false;
        }
        console.log('Settings reset successfully on backend');
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

  // Apply theme updates to the document body
  useEffect(() => {
    if (!gameSettings.theme) return;
    
    // Remove any existing theme classes
    document.body.classList.remove('dark-theme', 'neon-theme', 'childish-theme');

    // Apply new theme
    if (gameSettings.theme !== 'classic') {
      document.body.classList.add(`${gameSettings.theme}-theme`);
      console.log(`Applied theme: ${gameSettings.theme}`);
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