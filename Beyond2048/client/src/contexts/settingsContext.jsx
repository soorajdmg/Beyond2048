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
      console.log('Loading settings - init phase');
      
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
      
      if (isAuthenticated && !backendFetchCompleted.current) {
        try {
          console.log('Fetching settings from backend - first and only time');
          const response = await getUserSettings();
          
          if (response.success && response.settings) {
            console.log('Settings received from backend:', response.settings);
            setGameSettings(response.settings);
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
      console.log('User settings from auth context became available:', userSettings);
      setGameSettings(userSettings);
      localStorage.setItem('gameSettings', JSON.stringify(userSettings));
    }
  }, [userSettings, isAuthenticated, settingsLoaded]);

  const saveSettings = async () => {
    localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    console.log('Settings saved to localStorage:', gameSettings);
    
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

  const updateSetting = async (key, value) => {
    console.log(`Updating setting ${key} to:`, value);
    
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
    
    console.log('Resetting settings to defaults:', defaultSettings);
    setGameSettings(defaultSettings);
    localStorage.setItem('gameSettings', JSON.stringify(defaultSettings));
    
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

  useEffect(() => {
    if (!gameSettings.theme) return;
    
    document.body.classList.remove('dark-theme', 'neon-theme', 'childish-theme');

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