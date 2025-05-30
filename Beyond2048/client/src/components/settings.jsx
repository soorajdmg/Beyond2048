import React, { useEffect, useRef, useState } from 'react';
import { X, Save } from 'lucide-react';
import { useSettings } from '../contexts/settingsContext';
import { useAuth } from '../contexts/authContext';
import './settings.css';

const Settings = ({ isOpen, onClose }) => {
  const {
    gameSettings,
    updateSetting,
    saveSettings,
    isSaving,
    saveError
  } = useSettings();
  
  const [saveStatus, setSaveStatus] = useState('');
  const saveTimeoutRef = useRef(null);

  const { isAuthenticated } = useAuth();

  // Create ref for the modal
  const settingsModalRef = useRef(null);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      // Close settings modal if open and clicked outside
      if (isOpen && settingsModalRef.current && !settingsModalRef.current.contains(event.target)) {
        onClose();
      }
    }

    // Add event listener when modal is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Clear any pending save timeouts when component unmounts
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isOpen, onClose]);

  // Apply theme from context
  const applyTheme = (theme) => {
    // Remove any existing theme classes
    document.body.classList.remove('dark-theme', 'neon-theme', 'childish-theme');

    // Apply new theme
    if (theme !== 'classic') {
      document.body.classList.add(`${theme}-theme`);
    }
  };

  const handleSettingChange = async (setting, value) => {
    // Update context
    updateSetting(setting, value);

    // Apply theme immediately if that's what changed
    if (setting === 'theme') {
      applyTheme(value);
    }

    // Auto-save settings after user changes them if authenticated
    if (isAuthenticated) {
      // Clear any existing save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set status to saving
      setSaveStatus('Saving...');

      // Add a small delay before saving to prevent excessive API calls
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveSettings();
          setSaveStatus('Saved!');
          
          // Clear the "Saved!" message after 2 seconds
          setTimeout(() => {
            setSaveStatus('');
          }, 2000);
        } catch (error) {
          setSaveStatus('Save failed');
          
          // Clear the error message after 3 seconds
          setTimeout(() => {
            setSaveStatus('');
          }, 3000);
        }
      }, 500);
    }
  };

  // Manual save handler
  const handleManualSave = async () => {
    if (!isAuthenticated) return;
    
    setSaveStatus('Saving...');
    
    try {
      await saveSettings();
      setSaveStatus('Saved!');
      
      // Clear the "Saved!" message after 2 seconds
      setTimeout(() => {
        setSaveStatus('');
      }, 2000);
    } catch (error) {
      setSaveStatus('Save failed');
      
      // Clear the error message after 3 seconds
      setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    }
  };

  // Determine if we're in a dark theme for styling purposes
  const isDarkTheme = gameSettings?.theme === 'dark' || gameSettings?.theme === 'neon';

  // If not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        ref={settingsModalRef}
        className={`settings-modal ${isDarkTheme ? 'dark' : ''} ${gameSettings?.theme}`}
      >
        <div className="modal-header">
          <h2>Game Settings</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="settings-group">
            <h3>Theme</h3>
            <div className="theme-options">
              <div
                className={`theme-option ${gameSettings?.theme === 'classic' ? 'selected' : ''}`}
                onClick={() => handleSettingChange('theme', 'classic')}
              >
                <div className="theme-preview classic-preview"></div>
                <span>Classic</span>
              </div>

              <div
                className={`theme-option ${gameSettings?.theme === 'dark' ? 'selected' : ''}`}
                onClick={() => handleSettingChange('theme', 'dark')}
              >
                <div className="theme-preview dark-preview"></div>
                <span>Dark</span>
              </div>

              <div
                className={`theme-option ${gameSettings?.theme === 'neon' ? 'selected' : ''}`}
                onClick={() => handleSettingChange('theme', 'neon')}
              >
                <div className="theme-preview neon-preview"></div>
                <span>Neon</span>
              </div>

              <div
                className={`theme-option ${gameSettings?.theme === 'childish' ? 'selected' : ''}`}
                onClick={() => handleSettingChange('theme', 'childish')}
              >
                <div className="theme-preview childish-preview"></div>
                <span>Childish</span>
              </div>
            </div>
          </div>

          <div className="settings-group">
            <h3>Game Options</h3>
            <div className="setting-row">
              <label>Game Size</label>
              <select
                value={gameSettings?.gameSize || 4}
                onChange={(e) => handleSettingChange('gameSize', parseInt(e.target.value))}
                className="settings-select"
              >
                <option value="3">3x3</option>
                <option value="4">4x4 (Classic)</option>
                <option value="5">5x5</option>
                <option value="6">6x6</option>
              </select>
            </div>

            <div className="setting-row">
              <label>Sound Effects</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={gameSettings?.soundEffects || false}
                  onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <label>Animations</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={gameSettings?.animations || false}
                  onChange={(e) => handleSettingChange('animations', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          {isAuthenticated && (
            <div className="settings-footer">
              <div className="settings-status">
                {saveError && <div className="save-error">{saveError}</div>}
                {saveStatus && <div className="save-status">{saveStatus}</div>}
              </div>
              
              <button 
                className={`save-button ${isSaving ? 'saving' : ''}`} 
                onClick={handleManualSave}
                disabled={isSaving}
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;