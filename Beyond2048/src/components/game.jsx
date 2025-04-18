import React, { useState, useEffect } from 'react';
import { useGameContext } from './gameContext';
import GameTile from './GameTile';
import GameOverlay from './GameOverlay';
import { Undo, RotateCcw } from 'lucide-react';
import './Game.css';

const Game = () => {
  const {
    board,
    score,
    highScore,
    history,
    isAnimating,
    gameOver,
    won,
    newTiles,
    playerStats,
    undo,
    initGame,
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    updateHighScore,
    updatePlayerStats
  } = useGameContext();

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Load high score from localStorage on initial render
  useEffect(() => {
    const savedHighScore = localStorage.getItem('2048HighScore');
    if (savedHighScore && parseInt(savedHighScore) > highScore) {
      updateHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Update localStorage whenever the high score changes
  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem('2048HighScore', highScore.toString());
    }
  }, [highScore]);

  // Update high score if current score is higher
  useEffect(() => {
    if (score > highScore) {
      updateHighScore(score);
    }
  }, [score, highScore, updateHighScore]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAnimating || gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnimating, gameOver, moveUp, moveDown, moveLeft, moveRight]);

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const diffX = touchStart.x - touchEnd.x;
    const diffY = touchStart.y - touchEnd.y;

    // Determine the direction of the swipe (with a minimum threshold of 20px)
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > 20) {
        moveLeft();
      } else if (diffX < -20) {
        moveRight();
      }
    } else {
      // Vertical swipe
      if (diffY > 20) {
        moveUp();
      } else if (diffY < -20) {
        moveDown();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="game-container">
      <div className="game-layout">
        {/* Left side - Score and High Score */}
        <div className="game-side-panel score-panel">
          <div className="score-container">
            <div className="score-label">Score</div>
            <div className="score-value">{score}</div>
          </div>

          <div className="score-container high-score-container">
            <div className="score-label">Best</div>
            <div className="score-value">{highScore || 0}</div>
          </div>
        </div>

        {/* Center - Game Board */}
        <div
          className="game-board"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="game-grid">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <GameTile
                  key={`${rowIndex}-${colIndex}`}
                  value={cell}
                  position={{ row: rowIndex, col: colIndex }}
                  isNew={newTiles[`${rowIndex}-${colIndex}`]}
                />
              ))
            )}
          </div>

          {gameOver && 
            <GameOverlay 
              won={won} 
              score={score} 
              highScore={highScore} 
            />
          }
        </div>

        {/* Right side - Control Buttons */}
        <div className="game-side-panel controls-panel">
          <button
            onClick={undo}
            disabled={history.length === 0 || isAnimating}
            className={`game-button ${history.length === 0 ? 'disabled' : ''}`}
            aria-label="Undo"
          >
            <Undo size={20} />
          </button>
          <button
            onClick={initGame}
            className="game-button"
            aria-label="New Game"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Game;