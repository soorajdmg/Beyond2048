import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useSettings } from '../contexts/settingsContext';
import { useAuth } from '../contexts/authContext';
import './leaderboard.css';

const LeaderboardModal = ({
  onClose,
}) => {
  const { gameSettings } = useSettings();
  const {
    fetchLeaderboard,
    fetchMostWinsLeaderboard,
    fetchHighestTilesLeaderboard
  } = useAuth();

  const currentTheme = gameSettings?.theme || 'classic';
  const isDarkTheme = currentTheme === 'dark' || currentTheme === 'neon';

  // Local states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [category, setCategory] = useState('highScore');

  const modalRef = useRef(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, [category]);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      let result;
      
      // Use the appropriate fetch function based on the selected category
      if (category === 'highScore') {
        result = await fetchLeaderboard();
      } else if (category === 'totalWins') {
        result = await fetchMostWinsLeaderboard();
      } else if (category === 'highestTile') {
        result = await fetchHighestTilesLeaderboard();
      }

      if (result && result.success) {
        const formattedData = result.leaderboard.map(player => ({
          id: player.rank,
          username: player.username,
          score: player.highScore || player.bestScore || 0,
          position: player.rank,
          games: player.gamesPlayed,
          wins: player.totalWins,
          highestTile: player.highestTile,
          winRate: player.winRate,
          avatar: player.username.substring(0, 2).toUpperCase()
        }));

        setLeaderboardData(formattedData);
        setError(null);
      } else {
        setError(result?.message || 'Failed to load leaderboard data');
        setLeaderboardData([]);
      }
    } catch (err) {
      setError('Failed to load leaderboard data');
      console.error('Leaderboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
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

  const renderValueColumn = () => {
    if (category === 'highScore') {
      return <th className="score-col">Score</th>;
    } else if (category === 'totalWins') {
      return <th className="wins-col">Wins</th>;
    } else if (category === 'highestTile') {
      return <th className="tile-col">Tile</th>;
    }
  };

  const renderSecondaryColumn = () => {
    if (category === 'totalWins') {
      return <th className="winrate-col">Win Rate</th>;
    } else {
      return <th className="games-col">Games</th>;
    }
  };

  const renderValueCell = (player) => {
    if (category === 'highScore') {
      return <td className="score-cell">{player.score.toLocaleString()}</td>;
    } else if (category === 'totalWins') {
      return <td className="wins-cell">{player.wins.toLocaleString()}</td>;
    } else if (category === 'highestTile') {
      return <td className="tile-cell">{player.highestTile.toLocaleString()}</td>;
    }
  };

  const renderSecondaryCell = (player) => {
    if (category === 'totalWins') {
      return <td className="winrate-cell">{player.winRate}%</td>;
    } else {
      return <td className="games-cell">{player.games}</td>;
    }
  };

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
          <div className="category-selector">
            <button
              className={`category-btn ${category === 'highScore' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('highScore')}
            >
              High Score
            </button>
            <button
              className={`category-btn ${category === 'highestTile' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('highestTile')}
            >
              Highest Tile
            </button>
            <button
              className={`category-btn ${category === 'totalWins' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('totalWins')}
            >
              Total Wins
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
                    {renderValueColumn()}
                    {renderSecondaryColumn()}
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
                      {renderValueCell(player)}
                      {renderSecondaryCell(player)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="leaderboard-footer">
            <p>Top players with the {category === 'highScore' ? 'Highest Scores' : category === 'highestTile' ? 'Highest Tiles' : 'Most Wins'}</p>
            {/* Note: You would need to implement this feature in your application */}
            <button className="view-all-btn">View Full Rankings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal