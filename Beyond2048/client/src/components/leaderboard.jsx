import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useSettings } from '../contexts/settingsContext';
import { useAuth } from '../contexts/authContext'; 
import './leaderboard.css';

const LeaderboardModal = ({
  onClose,
}) => {
  const { gameSettings } = useSettings();
  const { fetchLeaderboard } = useAuth();
  
  const currentTheme = gameSettings?.theme || 'classic';
  const isDarkTheme = currentTheme === 'dark' || currentTheme === 'neon';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [timeframe, setTimeframe] = useState('alltime');

  const modalRef = useRef(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, [timeframe]);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchLeaderboard();
      
      if (result.success) {
        const formattedData = result.leaderboard.map(player => ({
          id: player.rank, 
          username: player.username,
          score: player.highScore,
          position: player.rank,
          games: player.gamesPlayed,
          avatar: player.username.substring(0, 2).toUpperCase() 
        }));
        
        setLeaderboardData(formattedData);
        setError(null);
      } else {
        setError(result.message || 'Failed to load leaderboard data');
        setLeaderboardData([]);
      }
    } catch (err) {
      setError('Failed to load leaderboard data');
      console.error('Leaderboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div
        ref={modalRef}
        className={`leaderboard-modal ${currentTheme} ${isDarkTheme ? 'dark' : ''}`}
      >
        <div className="modal-header">
          <h2>Leaderboard</h2>
          <div className="modal-actions">
            {!isLoading && (
              <button
                className="refresh-btn"
                onClick={fetchLeaderboardData}
                disabled={isLoading}
                title="Refresh leaderboard"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-content leaderboard-content">
          <div className="timeframe-selector">
            <button
              className={`timeframe-btn ${timeframe === 'daily' ? 'active' : ''}`}
              onClick={() => handleTimeframeChange('daily')}
            >
              Daily
            </button>
            <button
              className={`timeframe-btn ${timeframe === 'weekly' ? 'active' : ''}`}
              onClick={() => handleTimeframeChange('weekly')}
            >
              Weekly
            </button>
            <button
              className={`timeframe-btn ${timeframe === 'alltime' ? 'active' : ''}`}
              onClick={() => handleTimeframeChange('alltime')}
            >
              All Time
            </button>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading leaderboard data...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchLeaderboardData}>Try Again</button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="no-data-message">
              <p>No leaderboard data available yet. Be the first to play!</p>
            </div>
          ) : (
            <div className="leaderboard-table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th className="rank-col">Rank</th>
                    <th className="player-col">Player</th>
                    <th className="score-col">Score</th>
                    <th className="games-col">Games</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((player) => (
                    <tr key={player.id} className={`leaderboard-row ${player.position <= 3 ? 'top-rank' : ''}`}>
                      <td className="rank-cell">
                        <span className={`rank-badge rank-${player.position}`}>
                          {player.position}
                        </span>
                      </td>
                      <td className="player-cell">
                        <div className="player-info">
                          <div className="avatar-placeholder">
                            {player.avatar}
                          </div>
                          <div className="player-name">
                            <span className="username">{player.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="score-cell">{player.score.toLocaleString()}</td>
                      <td className="games-cell">{player.games}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="leaderboard-footer">
            <p>Top players for {timeframe === 'daily' ? 'today' : timeframe === 'weekly' ? 'this week' : 'all time'}</p>
            <button className="view-all-btn">View Full Rankings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;