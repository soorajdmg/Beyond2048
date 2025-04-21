import React, { useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useGameContext } from '../contexts/gameContext';
import './controls.css';

const Controls = () => {
  const { moveUp, moveDown, moveLeft, moveRight } = useGameContext();

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          moveUp();
          break;
        case 'ArrowDown':
          event.preventDefault();
          moveDown();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          event.preventDefault();
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
  }, [moveUp, moveDown, moveLeft, moveRight]);

  return (
    <div className="controls-container">
      <div className="controls-grid">
        <div className="controls-spacer"></div>
        <button
          onClick={moveUp}
          className="control-button"
          aria-label="Swipe Up"
        >
          <ArrowUp size={24} />
        </button>
        <div className="controls-spacer"></div>
        
        <button
          onClick={moveLeft}
          className="control-button"
          aria-label="Swipe Left"
        >
          <ArrowLeft size={24} />
        </button>
        
        <button
          onClick={moveDown}
          className="control-button"
          aria-label="Swipe Down"
        >
          <ArrowDown size={24} />
        </button>
        
        <button
          onClick={moveRight}
          className="control-button"
          aria-label="Swipe Right"
        >
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default Controls;
