import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './authContext';

// Create context
export const GameContext = createContext(); 

// Custom hook to use the game context
export const useGameContext = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  // Get the auth context functions
  const { saveGameStats, isAuthenticated } = useAuth();

  // Core game state
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [history, setHistory] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation states
  const [tilePositions, setTilePositions] = useState({});
  const [mergedTiles, setMergedTiles] = useState({});
  const [newTiles, setNewTiles] = useState({});

  // Player statistics
  const [playerStats, setPlayerStats] = useState({
    highestTile: 0,
    bestScore: 0,
    winningStreak: 0,
    gamesPlayed: 0,
    totalMoves: 0,
    averageScore: 0,
    timePlayed: 0,
    recentGames: []
  });

  // Game settings
  const [gameSettings, setGameSettings] = useState({
    theme: 'classic',
    gameSize: 4,
    soundEffects: true,
    animations: true
  });

  


  // Time tracking for statistics
  const [gameStartTime, setGameStartTime] = useState(null);

  // Initialize the game and load high score
  useEffect(() => {
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('2048HighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }

    // Load player stats
    const savedStats = localStorage.getItem('playerStats');
    if (savedStats) {
      setPlayerStats(JSON.parse(savedStats));
    }

    // Load game settings
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      setGameSettings(JSON.parse(savedSettings));
    }

    initGame();
  }, []);

  // Update high score when current score increases
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('2048HighScore', score.toString());

      // Update in player stats
      updatePlayerStats({
        bestScore: score
      });
    }
  }, [score, highScore]);

  const cloneBoard = (board) => {
    return board.map(row => [...row]);
  };

  const startGameTimer = () => {
    setGameStartTime(Date.now());
  };

  const updateTimePlayedStat = () => {
    if (gameStartTime) {
      const minutesPlayed = Math.floor((Date.now() - gameStartTime) / 60000);
      updatePlayerStats({
        timePlayed: playerStats.timePlayed + minutesPlayed
      });
      setGameStartTime(null);
    }
  };

  // Save game stats to database - new function
  const saveGameStatsToDatabase = (gameResult) => {
    if (isAuthenticated) {
      console.log("Current time:", new Date());
      console.log("Game start time:", gameStartTime);
      console.log("Game start time type:", typeof gameStartTime);
      console.log("Time difference:", new Date() - gameStartTime);
      const timePlayed = Math.floor((new Date() - gameStartTime) / 1000);
      console.log("Highest tile value:", getHighestTile(board));
      const gameData = {
        score: score,
        highestTile: getHighestTile(board),
        moves: playerStats.totalMoves,
        result: gameResult,
        won: gameResult.toLowerCase() === 'win',
        timePlayed: timePlayed,
        date: new Date().toISOString(),
      };


      console.log("Saving game stats to database:", gameData);
      saveGameStats(gameData);
    } else {
      console.log("User not authenticated, skipping database save");
    }
  };

  const initGame = useCallback(() => {
    const size = gameSettings.gameSize || 4;

    // Create empty board
    const newBoard = Array(size).fill(0).map(() => Array(size).fill(0));

    // Add two initial tiles
    addRandomTile(newBoard);
    addRandomTile(newBoard);

    // Update player stats - increment games played
    updatePlayerStats({
      gamesPlayed: playerStats.gamesPlayed + 1
    });

    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setHistory([]);
    setIsAnimating(false);
    setTilePositions({});
    setMergedTiles({});
    setNewTiles({});

    // Start the game timer
    startGameTimer();

    // Initialize new tiles animation for the starting tiles
    const newTilesState = {};
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (newBoard[i][j] !== 0) {
          newTilesState[`${i}-${j}`] = true;
        }
      }
    }
    setNewTiles(newTilesState);

    // Clear the new tiles animation after animation completes
    setTimeout(() => {
      setNewTiles({});
    }, 300);
  }, [gameSettings.gameSize, playerStats.gamesPlayed]);

  const addRandomTile = (board) => {
    const emptyTiles = [];

    // Find all empty positions
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === 0) {
          emptyTiles.push({ row: i, col: j });
        }
      }
    }

    // No empty tiles, game is over
    if (emptyTiles.length === 0) {
      console.log("No empty cells available to add a new tile");
      return false;
    }

    // Select random empty position
    const { row, col } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];

    // Place a 2 (90% chance) or 4 (10% chance)
    board[row][col] = Math.random() < 0.9 ? 2 : 4;

    // Mark this tile as new for animation
    setNewTiles(prev => ({
      ...prev,
      [`${row}-${col}`]: true
    }));

    // Clear the new tile animation after it completes
    setTimeout(() => {
      setNewTiles(prev => {
        const updated = { ...prev };
        delete updated[`${row}-${col}`];
        return updated;
      });
    }, 300);

    console.log(`Added new tile at [${row}][${col}] with value ${board[row][col]}`);
    return true;
  };

  const saveGameState = (board, score) => {
    const boardCopy = cloneBoard(board);
    setHistory(prev => [...prev, { board: boardCopy, score }]);
  };

  const undo = () => {
    if (history.length > 0 && !isAnimating) {
      const lastState = history[history.length - 1];
      setBoard(lastState.board);
      setScore(lastState.score);
      setHistory(prev => prev.slice(0, -1));
      setGameOver(false);
      setNewTiles({});
    }
  };

  // Get highest tile value on the board
  const getHighestTile = (currentBoard) => {
    let highest = 0;

    for (let row = 0; row < currentBoard.length; row++) {
      for (let col = 0; col < currentBoard[row].length; col++) {
        highest = Math.max(highest, currentBoard[row][col]);
      }
    }

    return highest;
  };

  // Check if the game is over
  const checkGameOver = (board) => {
    console.log("Checking for game over...");
    console.log("Current Board State:", JSON.stringify(board));
    
    // Check for 2048 tile (win condition)
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === 2048) {
          console.log(`2048 tile found at position [${i}][${j}]. Game is won!`);
          
          // If game not already marked as over, update stats for a win
          if (!gameOver) {
            const newGame = {
              date: new Date().toLocaleDateString(),
              result: 'win',
              score: score,
              highestTile: 2048
            };
            
            console.log("Logging new game result:", newGame);
            addRecentGame(newGame);
            updateTimePlayedStat();
            
            console.log("Updating player winning streak...");
            updatePlayerStats({
              winningStreak: playerStats.winningStreak + 1 || 1
            });
            
            console.log("Saving game stats to database as a win...");
            saveGameStatsToDatabase('win');
          }
          
          return true;
        }
      }
    }

    // Check for empty tiles
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === 0) {
          console.log(`Empty tile found at position [${i}][${j}]. Game is not over.`);
          return false;
        }
      }
    }

    // Check for possible merges horizontally
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length - 1; j++) {
        if (board[i][j] === board[i][j + 1]) {
          console.log(`Possible horizontal merge at [${i}][${j}] and [${i}][${j + 1}]. Game is not over.`);
          return false;
        }
      }
    }

    // Check for possible merges vertically
    for (let i = 0; i < board.length - 1; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === board[i + 1][j]) {
          console.log(`Possible vertical merge at [${i}][${j}] and [${i + 1}][${j}]. Game is not over.`);
          return false;
        }
      }
    }

    // If game over and not already marked as over, update stats for a loss
    if (!gameOver) {
      console.log("No empty tiles or possible merges. Game is over.");

      const newGame = {
        date: new Date().toLocaleDateString(),
        result: 'loss',
        score: score,
        highestTile: getHighestTile(board)
      };

      console.log("Logging new game result:", newGame);
      addRecentGame(newGame);
      updateTimePlayedStat();

      console.log("Resetting player winning streak...");
      updatePlayerStats({
        winningStreak: 0
      });

      console.log("Saving game stats to database as a loss...");
      saveGameStatsToDatabase('loss');
    } else {
      console.log("Game was already marked as over.");
    }

    return true;
  };

  // Movement functions
  const moveLeft = () => {
    if (gameOver || isAnimating) return;

    setIsAnimating(true);
    const boardCopy = cloneBoard(board);
    saveGameState(boardCopy, score);

    let moved = false;
    let newScore = score;
    let newHighestTile = playerStats.highestTile;
    const newMergedTiles = {};
    const newPositions = {};

    // Record initial positions
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== 0) {
          newPositions[`${i}-${j}`] = { row: i, col: j, value: board[i][j] };
        }
      }
    }

    // Process each row
    for (let i = 0; i < board.length; i++) {
      let row = [];
      let colMap = {};

      // Copy non-zero values and track original positions
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== 0) {
          row.push(board[i][j]);
          colMap[row.length - 1] = j;
        }
      }

      // Merge tiles
      for (let j = 0; j < row.length - 1; j++) {
        if (row[j] === row[j + 1]) {
          row[j] *= 2;
          newScore += row[j];

          // Check if this created a new highest tile
          newHighestTile = Math.max(newHighestTile, row[j]);

          // Mark as merged for animation
          newMergedTiles[`${i}-${j}`] = true;

          // Track which tiles were merged
          const origCol1 = colMap[j];
          const origCol2 = colMap[j + 1];

          // Update position tracking for the merged tiles
          newPositions[`${i}-${origCol1}`] = { row: i, col: j, value: row[j] };
          newPositions[`${i}-${origCol2}`] = { row: i, col: j, value: 0, merged: true };

          // Update the column mapping for remaining tiles
          for (let k = j + 1; k < row.length - 1; k++) {
            colMap[k] = colMap[k + 1];
          }

          row.splice(j + 1, 1);

          // Check for win (2048 tile)
          if (row[j] === 2048 && !won) {
            setWon(true);

            // Update player stats
            updatePlayerStats({
              winningStreak: playerStats.winningStreak + 1
            });

            // Add to recent games
            const newGame = {
              date: new Date().toLocaleDateString(),
              result: 'win',
              score: newScore,
              highestTile: newHighestTile
            };

            addRecentGame(newGame);
            updateTimePlayedStat();

            // Save win stats to database
            saveGameStatsToDatabase('win');
          }
        }
      }

      // Update positions for non-merged tiles
      for (let j = 0; j < row.length; j++) {
        const origCol = colMap[j];
        if (origCol !== j) {
          moved = true;
          if (newPositions[`${i}-${origCol}`] && !newPositions[`${i}-${origCol}`].merged) {
            newPositions[`${i}-${origCol}`] = { row: i, col: j, value: row[j] };
          }
        }
      }

      // Pad with zeros
      while (row.length < board[i].length) {
        row.push(0);
      }

      // Check if the row changed
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== row[j]) {
          moved = true;
        }
      }

      board[i] = row;
    }

    // Update animation states
    setTilePositions(newPositions);
    setMergedTiles(newMergedTiles);

    // Update player stats if moved
    if (moved) {
      updatePlayerStats({
        totalMoves: playerStats.totalMoves + 1,
        highestTile: Math.max(playerStats.highestTile, newHighestTile)
      });
    }

    finishMove(moved, newScore);
  };

  const moveRight = () => {
    if (gameOver || isAnimating) return;

    setIsAnimating(true);
    const boardCopy = cloneBoard(board);
    saveGameState(boardCopy, score);

    let moved = false;
    let newScore = score;
    let newHighestTile = playerStats.highestTile;
    const newMergedTiles = {};
    const newPositions = {};

    // Record initial positions
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== 0) {
          newPositions[`${i}-${j}`] = { row: i, col: j, value: board[i][j] };
        }
      }
    }

    // Process each row
    for (let i = 0; i < board.length; i++) {
      let row = [];
      let colMap = {};

      // Copy non-zero values and track original positions
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== 0) {
          row.push(board[i][j]);
          colMap[row.length - 1] = j;
        }
      }

      // Merge tiles (right to left)
      for (let j = row.length - 1; j > 0; j--) {
        if (row[j] === row[j - 1]) {
          row[j] *= 2;
          newScore += row[j];

          // Check if this created a new highest tile
          newHighestTile = Math.max(newHighestTile, row[j]);

          // Target column in the final state
          const targetCol = board[i].length - (row.length - j);

          // Mark as merged for animation
          newMergedTiles[`${i}-${targetCol}`] = true;

          // Track which tiles were merged
          const origCol1 = colMap[j];
          const origCol2 = colMap[j - 1];

          // Update position tracking for the merged tiles
          newPositions[`${i}-${origCol1}`] = { row: i, col: targetCol, value: row[j] };
          newPositions[`${i}-${origCol2}`] = { row: i, col: targetCol, value: 0, merged: true };

          // Update the column mapping for remaining tiles
          for (let k = j - 1; k > 0; k--) {
            colMap[k] = colMap[k - 1];
          }

          row.splice(j - 1, 1);

          // Check for win (2048 tile)
          if (row[j] === 2048 && !won) {
            setWon(true);

            // Update player stats
            updatePlayerStats({
              winningStreak: playerStats.winningStreak + 1
            });

            // Add to recent games
            const newGame = {
              date: new Date().toLocaleDateString(),
              result: 'win',
              score: newScore,
              highestTile: newHighestTile
            };

            addRecentGame(newGame);
            updateTimePlayedStat();

            // Save win stats to database
            saveGameStatsToDatabase('win');
          }
        }
      }

      // Pad with zeros at the beginning
      while (row.length < board[i].length) {
        row.unshift(0);
      }

      // Update positions for non-merged tiles
      for (let j = 0; j < row.length; j++) {
        if (row[j] !== 0) {
          const originalIndex = row.length - 1 - j;
          const origCol = colMap[originalIndex];
          if (origCol !== j) {
            moved = true;
            if (newPositions[`${i}-${origCol}`] && !newPositions[`${i}-${origCol}`].merged) {
              newPositions[`${i}-${origCol}`] = { row: i, col: j, value: row[j] };
            }
          }
        }
      }

      // Check if the row changed
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== row[j]) {
          moved = true;
        }
      }

      board[i] = row;
    }

    // Update animation states
    setTilePositions(newPositions);
    setMergedTiles(newMergedTiles);

    // Update player stats if moved
    if (moved) {
      updatePlayerStats({
        totalMoves: playerStats.totalMoves + 1,
        highestTile: Math.max(playerStats.highestTile, newHighestTile)
      });
    }

    finishMove(moved, newScore);
  };

  const moveUp = () => {
    if (gameOver || isAnimating) return;

    setIsAnimating(true);
    const boardCopy = cloneBoard(board);
    saveGameState(boardCopy, score);

    let moved = false;
    let newScore = score;
    let newHighestTile = playerStats.highestTile;
    const newMergedTiles = {};
    const newPositions = {};

    // Record initial positions
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== 0) {
          newPositions[`${i}-${j}`] = { row: i, col: j, value: board[i][j] };
        }
      }
    }

    // Process each column
    for (let j = 0; j < board[0].length; j++) {
      let column = [];
      let rowMap = {};

      // Copy non-zero values and track original positions
      for (let i = 0; i < board.length; i++) {
        if (board[i][j] !== 0) {
          column.push(board[i][j]);
          rowMap[column.length - 1] = i;
        }
      }

      // Merge tiles
      for (let i = 0; i < column.length - 1; i++) {
        if (column[i] === column[i + 1]) {
          column[i] *= 2;
          newScore += column[i];

          // Check if this created a new highest tile
          newHighestTile = Math.max(newHighestTile, column[i]);

          // Mark as merged for animation
          newMergedTiles[`${i}-${j}`] = true;

          // Track which tiles were merged
          const origRow1 = rowMap[i];
          const origRow2 = rowMap[i + 1];

          // Update position tracking for the merged tiles
          newPositions[`${origRow1}-${j}`] = { row: i, col: j, value: column[i] };
          newPositions[`${origRow2}-${j}`] = { row: i, col: j, value: 0, merged: true };

          // Update the row mapping for remaining tiles
          for (let k = i + 1; k < column.length - 1; k++) {
            rowMap[k] = rowMap[k + 1];
          }

          column.splice(i + 1, 1);

          // Check for win (2048 tile)
          if (column[i] === 2048 && !won) {
            setWon(true);

            // Update player stats
            updatePlayerStats({
              winningStreak: playerStats.winningStreak + 1
            });

            // Add to recent games
            const newGame = {
              date: new Date().toLocaleDateString(),
              result: 'win',
              score: newScore,
              highestTile: newHighestTile
            };

            addRecentGame(newGame);
            updateTimePlayedStat();

            // Save win stats to database
            saveGameStatsToDatabase('win');
          }
        }
      }

      // Update positions for non-merged tiles
      for (let i = 0; i < column.length; i++) {
        const origRow = rowMap[i];
        if (origRow !== i) {
          moved = true;
          if (newPositions[`${origRow}-${j}`] && !newPositions[`${origRow}-${j}`].merged) {
            newPositions[`${origRow}-${j}`] = { row: i, col: j, value: column[i] };
          }
        }
      }

      // Pad with zeros
      while (column.length < board.length) {
        column.push(0);
      }

      // Update board and check if changed
      for (let i = 0; i < board.length; i++) {
        if (board[i][j] !== column[i]) {
          moved = true;
        }
        board[i][j] = column[i];
      }
    }

    // Update animation states
    setTilePositions(newPositions);
    setMergedTiles(newMergedTiles);

    // Update player stats if moved
    if (moved) {
      updatePlayerStats({
        totalMoves: playerStats.totalMoves + 1,
        highestTile: Math.max(playerStats.highestTile, newHighestTile)
      });
    }

    finishMove(moved, newScore);
  };

  const moveDown = () => {
    if (gameOver || isAnimating) return;

    setIsAnimating(true);
    const boardCopy = cloneBoard(board);
    saveGameState(boardCopy, score);

    let moved = false;
    let newScore = score;
    let newHighestTile = playerStats.highestTile;
    const newMergedTiles = {};
    const newPositions = {};

    // Record initial positions
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== 0) {
          newPositions[`${i}-${j}`] = { row: i, col: j, value: board[i][j] };
        }
      }
    }

    // Process each column
    for (let j = 0; j < board[0].length; j++) {
      let column = [];
      let rowMap = {};

      // Copy non-zero values and track original positions
      for (let i = 0; i < board.length; i++) {
        if (board[i][j] !== 0) {
          column.push(board[i][j]);
          rowMap[column.length - 1] = i;
        }
      }

      // Merge tiles (bottom to top)
      for (let i = column.length - 1; i > 0; i--) {
        if (column[i] === column[i - 1]) {
          column[i] *= 2;
          newScore += column[i];

          // Check if this created a new highest tile
          newHighestTile = Math.max(newHighestTile, column[i]);

          // Target row in the final state
          const targetRow = board.length - (column.length - i);

          // Mark as merged for animation
          newMergedTiles[`${targetRow}-${j}`] = true;

          // Track which tiles were merged
          const origRow1 = rowMap[i];
          const origRow2 = rowMap[i - 1];

          // Update position tracking for the merged tiles
          newPositions[`${origRow1}-${j}`] = { row: targetRow, col: j, value: column[i] };
          newPositions[`${origRow2}-${j}`] = { row: targetRow, col: j, value: 0, merged: true };

          // Update the row mapping for remaining tiles
          for (let k = i - 1; k > 0; k--) {
            rowMap[k] = rowMap[k - 1];
          }

          column.splice(i - 1, 1);

          // Check for win (2048 tile)
          if (column[i] === 2048 && !won) {
            setWon(true);

            // Update player stats
            updatePlayerStats({
              winningStreak: playerStats.winningStreak + 1
            });

            // Add to recent games
            const newGame = {
              date: new Date().toLocaleDateString(),
              result: 'win',
              score: newScore,
              highestTile: newHighestTile
            };

            addRecentGame(newGame);
            updateTimePlayedStat();

            // Save win stats to database
            saveGameStatsToDatabase('win');
          }
        }
      }

      // Pad with zeros at the beginning
      while (column.length < board.length) {
        column.unshift(0);
      }

      // Update positions for non-merged tiles
      for (let i = 0; i < column.length; i++) {
        if (column[i] !== 0) {
          const originalIndex = column.length - 1 - i;
          const origRow = rowMap[originalIndex];
          if (origRow !== i) {
            moved = true;
            if (newPositions[`${origRow}-${j}`] && !newPositions[`${origRow}-${j}`].merged) {
              newPositions[`${origRow}-${j}`] = { row: i, col: j, value: column[i] };
            }
          }
        }
      }

      // Update board and check if changed
      for (let i = 0; i < board.length; i++) {
        if (board[i][j] !== column[i]) {
          moved = true;
        }
        board[i][j] = column[i];
      }
    }

    // Update animation states
    setTilePositions(newPositions);
    setMergedTiles(newMergedTiles);

    // Update player stats if moved
    if (moved) {
      updatePlayerStats({
        totalMoves: playerStats.totalMoves + 1,
        highestTile: Math.max(playerStats.highestTile, newHighestTile)
      });
    }

    finishMove(moved, newScore);
  };

  const finishMove = (moved, newScore) => {
    console.log("finishMove called with moved:", moved, "newScore:", newScore);
    if (moved) {
      setScore(newScore);
      console.log("Setting timeout for adding tile...");
      // Allow time for slide animations to complete before adding a new tile
      setTimeout(() => {
        console.log("Timeout executed, attempting to add random tile...");
        // Create a new board with the added tile
        const newBoard = [...board];


        console.log("Board before adding tile:", JSON.stringify(newBoard));
        const addedTile = addRandomTile(newBoard);
        console.log("Result of addRandomTile:", addedTile);
        console.log("Board after adding tile:", JSON.stringify(newBoard));

        if (!addedTile) {
          console.log("Couldn't add a tile");
        } else {
          console.log("Updating board state with new tile");
          setBoard(newBoard);

          // Check if game is over with the updated board
          const isGameOver = checkGameOver(newBoard);
          console.log("Game over check result:", isGameOver);

          if (isGameOver) {
            console.log("Setting game over state to true");
            setGameOver(true);
          } else {
            console.log("Setting game over state to false");
            setGameOver(false);
          }
        }

        // Clear merged tiles after animation completes
        setMergedTiles({});

        // End animation state
        setTimeout(() => {
          setIsAnimating(false);
        }, 100);
      }, 200);
    } else {
      setIsAnimating(false);
    }
  };

  // Update player statistics
  const updatePlayerStats = useCallback((updates) => {
    setPlayerStats(prev => {
      const newStats = { ...prev, ...updates };

      // Calculate average score if needed
      if (updates.gamesPlayed || updates.bestScore) {
        newStats.averageScore = Math.floor(newStats.bestScore / Math.max(1, newStats.gamesPlayed));
      }

      // Save to localStorage
      localStorage.setItem('playerStats', JSON.stringify(newStats));

      return newStats;
    });
  }, []);

  // Add a recent game to the list (keeping only the last 10)
  const addRecentGame = useCallback((game) => {
    setPlayerStats(prev => {
      const updatedRecentGames = [game, ...prev.recentGames].slice(0, 10);
      const newStats = { ...prev, recentGames: updatedRecentGames };

      // Save to localStorage
      localStorage.setItem('playerStats', JSON.stringify(newStats));

      return newStats;
    });
  }, []);

  // Update game settings - Wrapped in useCallback to prevent infinite loops
  const updateGameSettings = useCallback((updates) => {
    setGameSettings(prev => {
      const newSettings = { ...prev, ...updates };

      // Save to localStorage
      localStorage.setItem('gameSettings', JSON.stringify(newSettings));

      return newSettings;
    });
  }, []);

  // Function to update high score manually
  const updateHighScore = useCallback((newHighScore) => {
    if (newHighScore) {
      setHighScore(newHighScore);
      localStorage.setItem('2048HighScore', newHighScore.toString());

      // Update in player stats
      updatePlayerStats({
        bestScore: newHighScore
      });
    }
  }, [highScore, updatePlayerStats]);

  return (
    <GameContext.Provider value={{
      // Game state
      board,
      score,
      highScore,
      gameOver,
      won,
      history,
      isAnimating,

      // Animation state
      tilePositions,
      mergedTiles,
      newTiles,

      // Player statistics
      playerStats,

      // Game settings
      gameSettings,

      // Game actions
      initGame,
      moveUp,
      moveDown,
      moveLeft,
      moveRight,
      undo,
      updateHighScore,

      // Stats and settings management
      updatePlayerStats,
      updateGameSettings
    }}>
      {children}
    </GameContext.Provider>
  );
};

