import React, { useEffect, useState, useRef } from 'react';
import { LogOut, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import { useSettings } from '../contexts/settingsContext'; // Changed to use settingsContext directly
import './profile.css';

const Profile = ({
    onClose,
    onLogout,
}) => {
    // Use the enhanced auth context
    const {
        currentUser,
        userStats,
        isAuthenticated,
        loading: authLoading,
        fetchUserStats
    } = useAuth();

    // Use settings context directly - similar to LeaderboardModal
    const { gameSettings } = useSettings();
    
    const [loading, setLoading] = useState(authLoading);
    const [error, setError] = useState(null);
    // Add ref for the modal content
    const modalRef = useRef(null);
    
    // Create local state for theme that mirrors the context
    const currentTheme = gameSettings?.theme || 'classic';
    const isDarkTheme = currentTheme === 'dark' || currentTheme === 'neon';

    const formatTimePlayed = (minutes) => {
        // Round to 2 decimal places for display purposes
        const roundedMinutes = Math.round(minutes * 100) / 100;

        if (roundedMinutes < 60) {
            // For times less than 1 hour, show as minutes with up to 2 decimal places
            return `${roundedMinutes.toFixed(1).replace(/\.0$/, '')} min`;
        } else {
            // For times >= 1 hour, split into hours and minutes
            const hours = Math.floor(roundedMinutes / 60);
            const mins = Math.round(roundedMinutes % 60);

            // Handle case where minutes round up to 60
            if (mins === 60) {
                return `${hours + 1}h 0m`;
            }

            return `${hours}h ${mins}m`;
        }
    };

    // Refresh user stats
    const refreshStats = async () => {
        try {
            setLoading(true);
            setError(null);
            await fetchUserStats();
            setLoading(false);
        } catch (err) {
            console.error('Error refreshing profile data:', err);
            setError(err.message || 'Failed to refresh profile data');
            setLoading(false);
        }
    };

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Clean up the event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Check authentication status and load user data when component mounts
    // or when auth state changes
    useEffect(() => {
        if (!isAuthenticated) {
            setError('You must be logged in to view profile data');
            setLoading(false);
        } else if (isAuthenticated && !userStats) {
            // If authenticated but no stats yet, fetch them
            refreshStats();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, userStats]);

    // Combine user and stats data
    const userData = currentUser ? {
        ...currentUser,
        bestScore: userStats?.bestScore || 0,
        highestTile: userStats?.highestTile || 0,
        gamesPlayed: userStats?.gamesPlayed || 0,
        timePlayed: userStats?.timePlayed || 0,
        totalMoves: userStats?.totalMoves || 0,
        averageScore: userStats?.averageScore || 0,
        totalWins: userStats?.totalWins || 0,
        gameHistory: currentUser?.recentGames?.map(game => ({
            date: game.date,
            score: game.score,
            highestTile: game.highestTile,
            result: game.result || (game.won ? 'WIN' : 'LOSS')
        })) || []
    } : null;

    return (
        <div className="modal-overlay">
            <div
                ref={modalRef}
                className={`profile-modal ${currentTheme} ${isDarkTheme ? 'dark' : ''}`}
            >
                <div className="modal-header">
                    <h2>My Profile</h2>
                    <div className="modal-actions">
                        {!loading && (
                            <button
                                className="refresh-btn"
                                onClick={refreshStats}
                                disabled={loading}
                                title="Refresh stats"
                            >
                                <RefreshCw size={16} />
                            </button>
                        )}
                        <button className="modal-close" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                <div className="modal-content profile-content">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading profile data...</p>
                        </div>
                    ) : error ? (
                        <div className="error-message">
                            <p>{error}</p>
                            <button className="retry-btn" onClick={refreshStats}>Try Again</button>
                        </div>
                    ) : (
                        <>
                            <div className="user-profile-section">
                                <div className="user-info">
                                    <div className="avatar-container">
                                        <div className="avatar-placeholder">
                                            {userData?.name?.[0]?.toUpperCase() || 'S'}
                                        </div>
                                    </div>
                                    <div className="user-details">
                                        <h3>{userData?.name || 'Player'}</h3>
                                        <p className="username">@{userData?.username || 'Unknown'}</p>
                                    </div>
                                </div>

                                <div className="profile-actions">
                                    <button className="profile-btn logout-btn" onClick={onLogout}>
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>

                            <div className="stats-container">
                                <h3>Game Stats</h3>

                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <div className="stat-value">{userData?.bestScore?.toLocaleString?.() ?? 0}</div>
                                        <div className="stat-label">Best Score</div>
                                    </div>

                                    <div className="stat-item">
                                        <div className="stat-value">{userData?.highestTile?.toLocaleString?.() ?? 0}</div>
                                        <div className="stat-label">Highest Tile</div>
                                    </div>

                                    <div className="stat-item">
                                        <div className="stat-value">{userData?.gamesPlayed ?? 0}</div>
                                        <div className="stat-label">Games Played</div>
                                    </div>

                                    <div className="stat-item">
                                        <div className="stat-value">{userData?.totalWins ?? 0}</div>
                                        <div className="stat-label">Total Wins</div>
                                    </div>

                                    <div className="stat-item">
                                        <div className="stat-value">{userData?.totalMoves?.toLocaleString?.() ?? 0}</div>
                                        <div className="stat-label">Total Moves</div>
                                    </div>

                                    <div className="stat-item">
                                        <div className="stat-value">{userData?.averageScore?.toLocaleString?.() ?? 0}</div>
                                        <div className="stat-label">Avg. Score</div>
                                    </div>
                                </div>
                            </div>

                            <div className="stats-group">
                                <h3>Recent Games</h3>
                                <div className="recent-games">
                                    {userData?.gameHistory?.length > 0 ? (
                                        userData.gameHistory.slice(0, 3).map((game, index) => (
                                            <div className="recent-game" key={index}>
                                                <div className="recent-game-info">
                                                    <span className="game-date">
                                                        {new Date(game.date).toLocaleDateString('en-IN', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                    <span className={`game-result ${game.result?.toLowerCase()}`}>{game.result}</span>
                                                </div>
                                                <div className="recent-game-stats">
                                                    <span>Score: {game.score?.toLocaleString?.() ?? 0}</span>
                                                    <span>Highest: {game.highestTile ?? 0}</span>
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
                                    <strong>{formatTimePlayed(userData?.timePlayed ?? 0)}</strong>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;