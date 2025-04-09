import React, { useEffect, useRef } from 'react';
import './gameTile.css';

const GameTile = ({ value, position, previousPosition, isNew, isMerged, isMoving }) => {
  const tileRef = useRef(null);

  // Get tile color based on value
  const getTileClass = (value) => {
    if (value === 0) return 'tile-empty';
    return `tile-${value}`;
  };

  // Get font size based on tile value length
  const getFontSizeClass = (value) => {
    if (value === 0) return '';
    const length = value.toString().length;
    if (length <= 1) return 'font-large';
    if (length === 2) return 'font-medium';
    if (length === 3) return 'font-small';
    return 'font-xsmall';
  };

  // Apply merge animation directly using Web Animations API
  useEffect(() => {
    if (isMerged && tileRef.current) {
      // Create merge animation
      const mergeAnimation = tileRef.current.animate(
        [
          { transform: 'scale(1)', opacity: 0.9 },
          { transform: 'scale(1.2)', opacity: 1 },
          { transform: 'scale(1)' }
        ],
        {
          duration: 300,
          easing: 'cubic-bezier(0.25, 0.1, 0.25, 1.5)'
        }
      );

      // Create flash effect
      const flash = document.createElement('div');
      flash.style.position = 'absolute';
      flash.style.top = '0';
      flash.style.right = '0';
      flash.style.bottom = '0';
      flash.style.left = '0';
      flash.style.backgroundColor = 'white';
      flash.style.borderRadius = 'inherit';
      flash.style.pointerEvents = 'none';
      flash.style.zIndex = '30';

      tileRef.current.appendChild(flash);

      const flashAnimation = flash.animate(
        [
          { opacity: 0.7 },
          { opacity: 0 }
        ],
        {
          duration: 300,
          easing: 'ease-out',
          fill: 'forwards'
        }
      );

      // Clean up flash element after animation
      flashAnimation.onfinish = () => {
        if (tileRef.current && tileRef.current.contains(flash)) {
          tileRef.current.removeChild(flash);
        }
      };
    }
  }, [isMerged, value]);

  // Calculate tile position and apply animation
  useEffect(() => {
    if (isMoving && !isNew && previousPosition && tileRef.current) {
      const tile = tileRef.current;
      const cellSize = tile.offsetWidth;

      const startX = (previousPosition.col - position.col) * cellSize;
      const startY = (previousPosition.row - position.row) * cellSize;

      // Use Web Animation API for movement
      tile.animate(
        [
          { transform: `translate(${startX}px, ${startY}px)` },
          { transform: 'translate(0px, 0px)' }
        ],
        {
          duration: 200,
          easing: 'ease-in-out',
          fill: 'forwards'
        }
      );
    }
  }, [position, previousPosition, isMoving, isNew]);

  return (
    <div
      ref={tileRef}
      className={`game-tile ${getTileClass(value)} ${isNew ? 'tile-new' : ''}`}
      style={{
        gridRow: `${position.row + 1} / span 1`,
        gridColumn: `${position.col + 1} / span 1`,
        position: 'relative'
      }}
    >
      <span className={`tile-value ${getFontSizeClass(value)}`}>
        {value !== 0 ? value : ''}
      </span>
    </div>
  );
};

export default GameTile;