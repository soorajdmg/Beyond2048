import React from 'react';
import { useGameContext } from '../contexts/gameContext';
import './gameOverlay.css';

const GameOverlay = ({ won }) => {
  const { score, highScore, initGame } = useGameContext();
  const isNewHighScore = score === highScore && score > 0;

  return (
    <div className="game-overlay">
      <div className="overlay-content">
        <h2 className="overlay-title">{won ? 'You Win!' : 'Game Over!'}</h2>
        <p className="overlay-score">Final Score: {score}</p>

        {isNewHighScore && (
          <p className="overlay-high-score">New High Score!</p>
        )}

        <p className="overlay-best-score">Best Score: {highScore}</p>

        <button
          onClick={initGame}
          className="overlay-button"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverlay;