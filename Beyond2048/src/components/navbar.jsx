import React, { useState, useEffect, useRef } from 'react';
import { useGameContext } from './gameContext';
import { Info, Trophy, Settings, HelpCircle, X, Save, BarChart2 } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const {
    score,
    highScore,
    gameOver,
    won,
    board,
    history,
    gameSettings,
    updateGameSettings,
    initGame
  } = useGameContext();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [playerStats, setPlayerStats] = useState({
    highestTile: 0,
    bestScore: highScore || 0,
    winningStreak: 0,
    gamesPlayed: 0,
    totalMoves: 0,
    averageScore: 0,
    timePlayed: 0,
    recentGames: []
  });

  // Create refs for each modal
  const infoModalRef = useRef(null);
  const settingsModalRef = useRef(null);
  const statsModalRef = useRef(null);

  // Load player stats from localStorage on component mount
  useEffect(() => {
    const savedStats = localStorage.getItem('playerStats');
    if (savedStats) {
      setPlayerStats(JSON.parse(savedStats));
    }
  }, []);

  // Load and apply theme from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Update context with saved settings
      updateGameSettings(parsedSettings);
      // Apply the saved theme
      applyTheme(parsedSettings.theme);
    }
  }, [updateGameSettings]);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      // Close info modal if open and clicked outside
      if (infoOpen && infoModalRef.current && !infoModalRef.current.contains(event.target)) {
        setInfoOpen(false);
      }

      // Close settings modal if open and clicked outside
      if (settingsOpen && settingsModalRef.current && !settingsModalRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }

      // Close stats modal if open and clicked outside
      if (statsOpen && statsModalRef.current && !statsModalRef.current.contains(event.target)) {
        setStatsOpen(false);
      }
    }

    // Add event listener when any modal is open
    if (infoOpen || settingsOpen || statsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [infoOpen, settingsOpen, statsOpen]);

  // Update player stats when game state changes
  useEffect(() => {
    // Calculate highest tile on the board
    let highest = 0;
    board?.forEach(row => {
      row.forEach(cell => {
        if (cell > highest) {
          highest = cell;
        }
      });
    });

    // Only update if we have valid data
    if (highest > 0) {
      const updatedStats = {
        ...playerStats,
        highestTile: Math.max(playerStats.highestTile, highest),
        bestScore: Math.max(playerStats.bestScore, highScore || 0),
        totalMoves: playerStats.totalMoves + (history?.length || 0)
      };

      // Update recent games when game ends
      if (gameOver) {
        const newGame = {
          date: new Date().toLocaleDateString(),
          result: won ? 'Win' : 'Loss',
          score: score,
          highestTile: highest
        };

        // Update games played and streak
        updatedStats.gamesPlayed += 1;
        updatedStats.winningStreak = won ? updatedStats.winningStreak + 1 : 0;

        // Add to recent games, keep only the latest 5
        updatedStats.recentGames = [newGame, ...updatedStats.recentGames.slice(0, 4)];

        // Update average score
        updatedStats.averageScore = Math.round(
          (updatedStats.averageScore * (updatedStats.gamesPlayed - 1) + score) / updatedStats.gamesPlayed
        );

        // Save the updated stats
        setPlayerStats(updatedStats);
        localStorage.setItem('playerStats', JSON.stringify(updatedStats));
      }
    }
  }, [board, highScore, score, gameOver, won, history?.length]);

  // Track play time
  useEffect(() => {
    let interval;
    const trackPlayTime = () => {
      setPlayerStats(prev => {
        const updated = { ...prev, timePlayed: prev.timePlayed + 1 };
        localStorage.setItem('playerStats', JSON.stringify(updated));
        return updated;
      });
    };

    // Update time played every minute
    interval = setInterval(trackPlayTime, 60000);

    return () => clearInterval(interval);
  }, []);

  // Apply theme from context
  const applyTheme = (theme) => {
    // Remove any existing theme classes
    document.body.classList.remove('dark-theme', 'neon-theme', 'childish-theme');

    // Apply new theme
    if (theme !== 'classic') {
      document.body.classList.add(`${theme}-theme`);
    }
  };

  const showRules = () => {
    setInfoOpen(true);
  };

  const closeInfo = () => {
    setInfoOpen(false);
  };

  const showLeaderboard = () => {
    alert("Leaderboard feature coming soon!");
  };

  const showSettings = () => {
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
  };

  const showStats = () => {
    setStatsOpen(true);
  };

  const closeStats = () => {
    setStatsOpen(false);
  };

  const handleSettingChange = (setting, value) => {
    // Create updated settings object
    const newSettings = {
      ...gameSettings,
      [setting]: value
    };

    // Update context
    updateGameSettings(newSettings);

    // Apply theme immediately if that's what changed
    if (setting === 'theme') {
      applyTheme(value);
    }

    // Save to localStorage immediately
    localStorage.setItem('gameSettings', JSON.stringify(newSettings));

    // If game size changed, initialize a new game
    if (setting === 'gameSize') {
      initGame();
    }
  };

  // Format time played (in minutes) to readable format
  const formatTimePlayed = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
  };

  // Determine if we're in a dark theme for styling purposes
  const isDarkTheme = gameSettings?.theme === 'dark' || gameSettings?.theme === 'neon';

  return (
    <>
      <div className={`navbar ${isDarkTheme ? 'dark' : ''}`}>
        <h1 className="navbar-title">Beyond 2048</h1>

        <div className="navbar-actions">
          <button
            className="navbar-button"
            onClick={showRules}
            aria-label="Game Info and Rules"
          >
            <Info size={20} />
          </button>

          <button
            className="navbar-button"
            onClick={showLeaderboard}
            aria-label="Leaderboard"
          >
            <Trophy size={20} />
          </button>

          <button
            className="navbar-button"
            onClick={showStats}
            aria-label="Player Statistics"
          >
            <BarChart2 size={20} />
          </button>

          <button
            className="navbar-button"
            onClick={showSettings}
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {infoOpen && (
        <div className="modal-overlay">
          <div
            ref={infoModalRef}
            className={`info-modal ${isDarkTheme ? 'dark' : ''} ${gameSettings?.theme}`}
          >
            <div className="modal-header">
              <h2>About Beyond 2048</h2>
              <button className="modal-close" onClick={closeInfo}>
                <X size={20} />
              </button>
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

      {/* Settings Modal (Integrated) */}
      {settingsOpen && (
        <div className="modal-overlay">
          <div
            ref={settingsModalRef}
            className={`settings-modal ${isDarkTheme ? 'dark' : ''}`}
          >
            <div className="modal-header">
              <h2>Game Settings</h2>
              <button className="modal-close" onClick={closeSettings}>
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
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {statsOpen && (
        <div className="modal-overlay">
          <div
            ref={statsModalRef}
            className={`stats-modal ${isDarkTheme ? 'dark' : ''} ${gameSettings?.theme}`}
          >
            <div className="modal-header">
              <h2>Player Statistics</h2>
              <button className="modal-close" onClick={closeStats}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{playerStats.highestTile.toLocaleString()}</div>
                  <div className="stat-label">Highest Tile</div>
                </div>

                <div className="stat-item">
                  <div className="stat-value">{playerStats.bestScore.toLocaleString()}</div>
                  <div className="stat-label">Best Score</div>
                </div>

                <div className="stat-item">
                  <div className="stat-value">{playerStats.winningStreak}</div>
                  <div className="stat-label">Win Streak</div>
                </div>

                <div className="stat-item">
                  <div className="stat-value">{playerStats.gamesPlayed}</div>
                  <div className="stat-label">Games Played</div>
                </div>

                <div className="stat-item">
                  <div className="stat-value">{playerStats.totalMoves.toLocaleString()}</div>
                  <div className="stat-label">Total Moves</div>
                </div>

                <div className="stat-item">
                  <div className="stat-value">{playerStats.averageScore.toLocaleString()}</div>
                  <div className="stat-label">Avg. Score</div>
                </div>
              </div>

              <div className="stats-group">
                <h3>Recent Games</h3>
                <div className="recent-games">
                  {playerStats.recentGames && playerStats.recentGames.length > 0 ? (
                    playerStats.recentGames.map((game, index) => (
                      <div className="recent-game" key={index}>
                        <div className="recent-game-info">
                          <span className="game-date">{game.date}</span>
                          <span className={`game-result ${game.result.toLowerCase()}`}>{game.result}</span>
                        </div>
                        <div className="recent-game-stats">
                          <span>Score: {game.score.toLocaleString()}</span>
                          <span>Highest: {game.highestTile}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-games">No recent games recorded</div>
                  )}
                </div>
              </div>

              <div className="stats-footer">
                <div className="time-played">
                  <span>Total Time Played:</span>
                  <strong>{formatTimePlayed(playerStats.timePlayed)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;