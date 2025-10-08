import React, { useState, useEffect, useRef } from 'react';
import { useGameContext } from '../contexts/gameContext';
import { Info, Trophy, Settings as SettingsIcon, User, X } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import { useSettings } from '../contexts/settingsContext';
import './navbar.css';
import AuthLogin from './login';
import Signup from './signup';
import Profile from './profile';
import Settings from './settings';
import AuthLogout from './logout';
import Leaderboard from './leaderboard';

const Navbar = () => {
  const { currentUser } = useAuth();
  const { gameSettings, settingsOpen, setSettingsOpen } = useSettings();

  const {
    score,
    highScore,
    gameOver,
    won,
    board,
    history,
    updateGameSettings,
    initGame
  } = useGameContext();

  const [profileOpen, setProfileOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false); // New state for leaderboard modal
  const [authMode, setAuthMode] = useState(null); // 'login', 'signup', or 'logout'

  // Default game settings
  const defaultGameSettings = {
    gameSize: 4,
    difficulty: 'normal',
    theme: 'classic',
    animations: 'on',
    sound: 'on',
    music: 'off'
  };

  const infoModalRef = useRef(null);
  const statsModalRef = useRef(null);
  const authModalRef = useRef(null);
  const leaderboardModalRef = useRef(null); // New ref for leaderboard modal

  // Close modals on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (infoOpen && infoModalRef.current && !infoModalRef.current.contains(e.target)) {
        setInfoOpen(false);
      }
      if (statsOpen && statsModalRef.current && !statsModalRef.current.contains(e.target)) {
        setStatsOpen(false);
      }
      if (authMode && authModalRef.current && !authModalRef.current.contains(e.target)) {
        setAuthMode(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [infoOpen, statsOpen, authMode, leaderboardOpen]);

  const applyTheme = (theme) => {
    document.body.classList.remove('dark-theme', 'neon-theme', 'childish-theme');
    if (theme !== 'classic') {
      document.body.classList.add(`${theme}-theme`);
    }
  };

  const handleSettingChange = (setting, value) => {
    const newSettings = {
      ...gameSettings,
      [setting]: value
    };
    updateGameSettings(newSettings);
    if (setting === 'theme') applyTheme(value);
    if (setting === 'gameSize') initGame();
  };


  const showProfile = () => {
    if (currentUser) {
      setProfileOpen(true);
    } else {
      setAuthMode('login');
    }
  };

  const showStats = () => {
    setProfileOpen(false);
    setStatsOpen(true);
  };

  const showLogout = () => {
    setProfileOpen(false);
    setAuthMode('logout');
  };

  const showLogin = () => setAuthMode('login');
  const showSignup = () => setAuthMode('signup');
  const closeAuth = () => setAuthMode(null);
  const closeSettings = () => setSettingsOpen(false);
  const closeInfo = () => setInfoOpen(false);
  const closeProfile = () => setProfileOpen(false);
  const closeStats = () => setStatsOpen(false);
  const closeLeaderboard = () => setLeaderboardOpen(false); // New function to close leaderboard

  const handleLoginSuccess = (userData, token) => {
    if (!userData) {
      console.error("No user data received on login");
      return;
    }
    setAuthMode(null); // Close the auth modal
    setProfileOpen(true); // Immediately open the profile modal

    // If user has saved settings, apply them here
    if (userData.settings) {
      updateGameSettings(userData.settings);
      if (userData.settings.theme) applyTheme(userData.settings.theme);
    }
  };

  const handleSignupSuccess = (userData, token) => {
    setAuthMode(null);
    setProfileOpen(true);
  };

  const handleLogoutSuccess = () => {
    // Reset user state after logout
    setAuthMode(null); // Close the auth modal

    // Reset to default settings
    updateGameSettings(defaultGameSettings);
    applyTheme(defaultGameSettings.theme);
  };

  const isDarkTheme = gameSettings?.theme === 'dark' || gameSettings?.theme === 'neon';

  return (
    <>
      <div className={`navbar ${isDarkTheme ? 'dark' : ''}`}>
        <h1 className="navbar-title">Beyond 2048</h1>
        <div className="navbar-actions">
          <button className="navbar-button" onClick={() => setInfoOpen(true)} aria-label="Game Info">
            <Info size={20} />
          </button>
          <button className="navbar-button" onClick={() => setLeaderboardOpen(true)} aria-label="Leaderboard">
            <Trophy size={20} />
          </button>
          <button className="navbar-button" onClick={showProfile} aria-label="Profile or Login">
            <User size={20} />
          </button>
          <button className="navbar-button" onClick={() => setSettingsOpen(true)} aria-label="Settings">
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {infoOpen && (
        <div className="modal-overlay">
          <div ref={infoModalRef} className={`info-modal ${isDarkTheme ? 'dark' : ''} ${gameSettings?.theme}`}>
            <div className="modal-header">
              <h2>About Beyond 2048</h2>
              <button className="modal-close" onClick={closeInfo}><X size={20} /></button>
            </div>

            <div className="modal-content">
              <div className="info-section">
                <h3>How to Play</h3>
                <ol className="info-list">
                  <li>Use <strong>arrow keys</strong> or <strong>swipe</strong> to move all tiles in one direction</li>
                  <li>When two tiles with the <strong>same number</strong> touch, they <strong>merge into one</strong></li>
                  <li>Create a tile with the number <strong>2048</strong> to win the game</li>
                  <li>The game ends when there are no more possible moves</li>
                </ol>
              </div>

              <div className="info-section">
                <h3>Tips & Tricks</h3>
                <ul className="info-list">
                  <li>Keep your highest value tile in a corner</li>
                  <li>Build a chain of decreasing values from your highest tile</li>
                  <li>Avoid moving up if you've established a strategy using the bottom row</li>
                  <li>Plan several moves ahead to avoid getting stuck</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Component */}
      <Settings
        isOpen={settingsOpen}
        onClose={closeSettings}
      />

      {/* Leaderboard Modal */}
      {leaderboardOpen && (
        <Leaderboard
          theme={gameSettings?.theme || 'default'}
          onClose={closeLeaderboard}
        />
      )}

      {/* Profile Component */}
      {profileOpen && (
        <Profile
          currentUser={currentUser}
          gameSettings={gameSettings}
          onClose={closeProfile}
          onLogout={showLogout}
          isDarkTheme={isDarkTheme}
        />
      )}

      {/* Authentication Modal */}
      {authMode && (
        <div className="modal-overlay">
          <div ref={authModalRef} className={`auth-modal ${isDarkTheme ? 'dark' : ''} ${gameSettings?.theme || 'classic'}`}>
            <div className="modal-header">
              <h2>
                {authMode === 'login'
                  ? 'Login'
                  : authMode === 'signup'
                    ? 'Signup'
                    : 'Logout'}
              </h2>
              <button className="modal-close" onClick={closeAuth}><X size={20} /></button>
            </div>
            <div className="modal-content">
              {authMode === 'login' ? (
                <AuthLogin onSuccess={handleLoginSuccess} onClose={closeAuth} switchToSignup={showSignup} />
              ) : authMode === 'signup' ? (
                <Signup onSuccess={handleSignupSuccess} onClose={closeAuth} switchToLogin={showLogin} />
              ) : (
                <AuthLogout onSuccess={handleLogoutSuccess} onClose={closeAuth} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;