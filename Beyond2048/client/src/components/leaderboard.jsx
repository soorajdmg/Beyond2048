import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useSettings } from '../contexts/settingsContext';
import { useAuth } from '../contexts/authContext'; // Import the auth context
import './leaderboard.css';

const LeaderboardModal = ({
  onClose,
}) => {
  // Use settings and auth contexts
  const { gameSettings } = useSettings();
  const { fetchLeaderboard } = useAuth(); // Get the fetchLeaderboard function from auth context
  
  // Theme handling
  const currentTheme = gameSettings?.theme || 'classic';
  const isDarkTheme = currentTheme === 'dark' || currentTheme === 'neon';

  // Local states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [timeframe, setTimeframe] = useState('alltime');

  // Add ref for the modal content
  const modalRef = useRef(null);

  // Fetch leaderboard data
  useEffect(() => {
    fetchLeaderboardData();
  }, [timeframe]);

  // Fetch leaderboard data function using AuthContext
  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      // Use the fetchLeaderboard function from AuthContext
      const result = await fetchLeaderboard();
      
      if (result.success) {
        // Transform backend data to match the component's expected format
        const formattedData = result.leaderboard.map(player => ({
          id: player.rank, // Use the rank as ID if no specific ID is available
          username: player.username,
          score: player.highScore,
          position: player.rank,
          games: player.gamesPlayed,
          avatar: player.username.substring(0, 2).toUpperCase() // Create avatar from first two letters of username
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

  // Handle timeframe change - Note: Your backend would need to support this feature
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    // In a full implementation, you would pass the timeframe to your fetchLeaderboard function
    // For now, we'll just update the local state since the backend doesn't support timeframes yet
  };

  // Click outside handler
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
            {/* Note: You would need to implement this feature in your application */}
            <button className="view-all-btn">View Full Rankings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;