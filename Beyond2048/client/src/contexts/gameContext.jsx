import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './authContext';

export const GameContext = createContext();

export const useGameContext = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const { saveGameStats, isAuthenticated } = useAuth();

  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [history, setHistory] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameMoves, setGameMoves] = useState(0);

  const [tilePositions, setTilePositions] = useState({});
  const [mergedTiles, setMergedTiles] = useState({});
  const [newTiles, setNewTiles] = useState({});

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

  const [gameSettings, setGameSettings] = useState({
    theme: 'classic',
    gameSize: 4,
    soundEffects: true,
    animations: true
  });

  const [gameStartTime, setGameStartTime] = useState(null);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('2048HighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }

    const savedStats = localStorage.getItem('playerStats');
    if (savedStats) {
      setPlayerStats(JSON.parse(savedStats));
    }

    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      setGameSettings(JSON.parse(savedSettings));
    }

    initGame();
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('2048HighScore', score.toString());

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
        moves: gameMoves,
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

    const newBoard = Array(size).fill(0).map(() => Array(size).fill(0));

    addRandomTile(newBoard);
    addRandomTile(newBoard);

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
    setGameMoves(0);

    startGameTimer();

    const newTilesState = {};
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (newBoard[i][j] !== 0) {
          newTilesState[`${i}-${j}`] = true;
        }
      }
    }
    setNewTiles(newTilesState);

    setTimeout(() => {
      setNewTiles({});
    }, 300);
  }, [gameSettings.gameSize, playerStats.gamesPlayed]);

  const addRandomTile = (board) => {
    const emptyTiles = [];

    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === 0) {
          emptyTiles.push({ row: i, col: j });
        }
      }
    }

    if (emptyTiles.length === 0) {
      console.log("No empty cells available to add a new tile");
      return false;
    }

    const { row, col } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];

    board[row][col] = Math.random() < 0.9 ? 2 : 4;

    setNewTiles(prev => ({
      ...prev,
      [`${row}-${col}`]: true
    }));

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

      if (gameMoves > 0) {
        setGameMoves(prev => prev - 1);
      }
    }
  };

  const getHighestTile = (currentBoard) => {
    let highest = 0;

    for (let row = 0; row < currentBoard.length; row++) {
      for (let col = 0; col < currentBoard[row].length; col++) {
        highest = Math.max(highest, currentBoard[row][col]);
      }
    }

    return highest;
  };

  const checkGameOver = (board) => {
    console.log("Checking for game over...");
    console.log("Current Board State:", JSON.stringify(board));

    let hasWon = false;
    let gameWon = won;

    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === 2048) {
          console.log(`2048 tile found at position [${i}][${j}]. Game is won but continues!`);

          if (!gameWon) {
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
              winningStreak: playerStats.winningStreak + 1 || 1,
              totalMoves: playerStats.totalMoves + gameMoves
            });

            console.log("Saving game stats to database as a win...");
            saveGameStatsToDatabase('win');

            gameWon = true;
          }

          hasWon = true;
        }
      }
    }

    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === 0) {
          console.log(`Empty tile found at position [${i}][${j}]. Game is not over.`);
          return false;
        }
      }
    }

    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length - 1; j++) {
        if (board[i][j] === board[i][j + 1]) {
          console.log(`Possible horizontal merge at [${i}][${j}] and [${i}][${j + 1}]. Game is not over.`);
          return false;
        }
      }
    }

    for (let i = 0; i < board.length - 1; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === board[i + 1][j]) {
          console.log(`Possible vertical merge at [${i}][${j}] and [${i + 1}][${j}]. Game is not over.`);
          return false;
        }
      }
    }

    if (!gameOver) {
      console.log("No empty tiles or possible merges. Game is over.");

      const newGame = {
        date: new Date().toLocaleDateString(),
        result: hasWon ? 'win' : 'loss',
        score: score,
        highestTile: getHighestTile(board)
      };

      console.log("Logging new game result:", newGame);
      addRecentGame(newGame);
      updateTimePlayedStat();

      updatePlayerStats({
        winningStreak: hasWon ? playerStats.winningStreak : 0,
        totalMoves: playerStats.totalMoves + gameMoves
      });

      console.log("Saving game stats to database as a " + (hasWon ? 'win' : 'loss') + "...");
      saveGameStatsToDatabase(hasWon ? 'win' : 'loss');
    } else {
      console.log("Game was already marked as over.");
    }

    return true;
  };

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

    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== 0) {
          newPositions[`${i}-${j}`] = { row: i, col: j, value: board[i][j] };
        }
      }
    }

    for (let i = 0; i < board.length; i++) {
      let row = [];
      let colMap = {};

      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== 0) {
          row.push(board[i][j]);
          colMap[row.length - 1] = j;
        }
      }

      for (let j = 0; j < row.length - 1; j++) {
        if (row[j] === row[j + 1]) {
          row[j] *= 2;
          newScore += row[j];

          newHighestTile = Math.max(newHighestTile, row[j]);

          newMergedTiles[`${i}-${j}`] = true;

          const origCol1 = colMap[j];
          const origCol2 = colMap[j + 1];

          newPositions[`${i}-${origCol1}`] = { row: i, col: j, value: row[j] };
          newPositions[`${i}-${origCol2}`] = { row: i, col: j, value: 0, merged: true };

          for (let k = j + 1; k < row.length - 1; k++) {
            colMap[k] = colMap[k + 1];
          }

          row.splice(j + 1, 1);

          if (row[j] === 2048 && !won) {
            setWon(true);

            updatePlayerStats({
              winningStreak: playerStats.winningStreak + 1
            });

            const newGame = {
              date: new Date().toLocaleDateString(),
              result: 'win',
              score: newScore,
              highestTile: newHighestTile
            };

            addRecentGame(newGame);
            updateTimePlayedStat();

            saveGameStatsToDatabase('win');
          }
        }
      }

      for (let j = 0; j < row.length; j++) {
        const origCol = colMap[j];
        if (origCol !== j) {
          moved = true;
          if (newPositions[`${i}-${origCol}`] && !newPositions[`${i}-${origCol}`].merged) {
            newPositions[`${i}-${origCol}`] = { row: i, col: j, value: row[j] };
          }
        }
      }

      while (row.length < board[i].length) {
        row.push(0);
      }

      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== row[j]) {
          moved = true;
        }
      }

      board[i] = row;
    }

    setTilePositions(newPositions);
    setMergedTiles(newMergedTiles);

    if (moved) {
      setGameMoves(prev => prev + 1);

      updatePlayerStats({
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

    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== 0) {
          newPositions[`${i}-${j}`] = { row: i, col: j, value: board[i][j] };
        }
      }
    }

    for (let i = 0; i < board.length; i++) {
      let row = [];
      let colMap = {};

      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== 0) {
          row.push(board[i][j]);
          colMap[row.length - 1] = j;
        }
      }

      for (let j = row.length - 1; j > 0; j--) {
        if (row[j] === row[j - 1]) {
          row[j] *= 2;
          newScore += row[j];

          newHighestTile = Math.max(newHighestTile, row[j]);

          const targetCol = board[i].length - (row.length - j);

          newMergedTiles[`${i}-${targetCol}`] = true;

          const origCol1 = colMap[j];
          const origCol2 = colMap[j - 1];

          newPositions[`${i}-${origCol1}`] = { row: i, col: targetCol, value: row[j] };
          newPositions[`${i}-${origCol2}`] = { row: i, col: targetCol, value: 0, merged: true };

          for (let k = j - 1; k > 0; k--) {
            colMap[k] = colMap[k - 1];
          }

          row.splice(j - 1, 1);

          if (row[j] === 2048 && !won) {
            setWon(true);

            updatePlayerStats({
              winningStreak: playerStats.winningStreak + 1
            });

            const newGame = {
              date: new Date().toLocaleDateString(),
              result: 'win',
              score: newScore,
              highestTile: newHighestTile
            };

            addRecentGame(newGame);
            updateTimePlayedStat();

            saveGameStatsToDatabase('win');
          }
        }
      }

      while (row.length < board[i].length) {
        row.unshift(0);
      }

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

      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== row[j]) {
          moved = true;
        }
      }

      board[i] = row;
    }

    setTilePositions(newPositions);
    setMergedTiles(newMergedTiles);

    if (moved) {
      setGameMoves(prev => prev + 1);

      updatePlayerStats({
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

    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== 0) {
          newPositions[`${i}-${j}`] = { row: i, col: j, value: board[i][j] };
        }
      }
    }

    for (let j = 0; j < board[0].length; j++) {
      let column = [];
      let rowMap = {};

      for (let i = 0; i < board.length; i++) {
        if (board[i][j] !== 0) {
          column.push(board[i][j]);
          rowMap[column.length - 1] = i;
        }
      }

      for (let i = 0; i < column.length - 1; i++) {
        if (column[i] === column[i + 1]) {
          column[i] *= 2;
          newScore += column[i];

          newHighestTile = Math.max(newHighestTile, column[i]);

          newMergedTiles[`${i}-${j}`] = true;

          const origRow1 = rowMap[i];
          const origRow2 = rowMap[i + 1];

          newPositions[`${origRow1}-${j}`] = { row: i, col: j, value: column[i] };
          newPositions[`${origRow2}-${j}`] = { row: i, col: j, value: 0, merged: true };

          for (let k = i + 1; k < column.length - 1; k++) {
            rowMap[k] = rowMap[k + 1];
          }

          column.splice(i + 1, 1);

          if (column[i] === 2048 && !won) {
            setWon(true);

            updatePlayerStats({
              winningStreak: playerStats.winningStreak + 1
            });

            const newGame = {
              date: new Date().toLocaleDateString(),
              result: 'win',
              score: newScore,
              highestTile: newHighestTile
            };

            addRecentGame(newGame);
            updateTimePlayedStat();

            saveGameStatsToDatabase('win');
          }
        }
      }

      for (let i = 0; i < column.length; i++) {
        const origRow = rowMap[i];
        if (origRow !== i) {
          moved = true;
          if (newPositions[`${origRow}-${j}`] && !newPositions[`${origRow}-${j}`].merged) {
            newPositions[`${origRow}-${j}`] = { row: i, col: j, value: column[i] };
          }
        }
      }

      while (column.length < board.length) {
        column.push(0);
      }

      for (let i = 0; i < board.length; i++) {
        if (board[i][j] !== column[i]) {
          moved = true;
        }
        board[i][j] = column[i];
      }
    }

    setTilePositions(newPositions);
    setMergedTiles(newMergedTiles);

    if (moved) {
      setGameMoves(prev => prev + 1);

      updatePlayerStats({
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

    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] !== 0) {
          newPositions[`${i}-${j}`] = { row: i, col: j, value: board[i][j] };
        }
      }
    }

    for (let j = 0; j < board[0].length; j++) {
      let column = [];
      let rowMap = {};

      for (let i = 0; i < board.length; i++) {
        if (board[i][j] !== 0) {
          column.push(board[i][j]);
          rowMap[column.length - 1] = i;
        }
      }

      for (let i = column.length - 1; i > 0; i--) {
        if (column[i] === column[i - 1]) {
          column[i] *= 2;
          newScore += column[i];

          newHighestTile = Math.max(newHighestTile, column[i]);

          const targetRow = board.length - (column.length - i);

          newMergedTiles[`${targetRow}-${j}`] = true;

          const origRow1 = rowMap[i];
          const origRow2 = rowMap[i - 1];

          newPositions[`${origRow1}-${j}`] = { row: targetRow, col: j, value: column[i] };
          newPositions[`${origRow2}-${j}`] = { row: targetRow, col: j, value: 0, merged: true };

          for (let k = i - 1; k > 0; k--) {
            rowMap[k] = rowMap[k - 1];
          }

          column.splice(i - 1, 1);

          if (column[i] === 2048 && !won) {
            setWon(true);

            updatePlayerStats({
              winningStreak: playerStats.winningStreak + 1
            });

            const newGame = {
              date: new Date().toLocaleDateString(),
              result: 'win',
              score: newScore,
              highestTile: newHighestTile
            };

            addRecentGame(newGame);
            updateTimePlayedStat();

            saveGameStatsToDatabase('win');
          }
        }
      }

      while (column.length < board.length) {
        column.unshift(0);
      }

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

      for (let i = 0; i < board.length; i++) {
        if (board[i][j] !== column[i]) {
          moved = true;
        }
        board[i][j] = column[i];
      }
    }

    setTilePositions(newPositions);
    setMergedTiles(newMergedTiles);

    if (moved) {
      setGameMoves(prev => prev + 1);
      updatePlayerStats({
        highestTile: Math.max(playerStats.highestTile, newHighestTile)
      });
      console.log("moves: ", playerStats.totalMoves)
    }

    finishMove(moved, newScore);
  };

  const finishMove = (moved, newScore) => {
    console.log("finishMove called with moved:", moved, "newScore:", newScore);
    if (moved) {
      setScore(newScore);
      console.log("Setting timeout for adding tile...");
      setTimeout(() => {
        console.log("Timeout executed, attempting to add random tile...");
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

        setMergedTiles({});

        setTimeout(() => {
          setIsAnimating(false);
        }, 100);
      }, 200);
    } else {
      setIsAnimating(false);
    }
  };

  const updatePlayerStats = useCallback((updates) => {
    setPlayerStats(prev => {
      const newStats = { ...prev, ...updates };

      if (updates.gamesPlayed || updates.bestScore) {
        newStats.averageScore = Math.floor(newStats.bestScore / Math.max(1, newStats.gamesPlayed));
      }

      localStorage.setItem('playerStats', JSON.stringify(newStats));

      return newStats;
    });
  }, []);

  const addRecentGame = useCallback((game) => {
    setPlayerStats(prev => {
      const updatedRecentGames = [game, ...prev.recentGames].slice(0, 10);
      const newStats = { ...prev, recentGames: updatedRecentGames };

      localStorage.setItem('playerStats', JSON.stringify(newStats));

      return newStats;
    });
  }, []);

  const updateGameSettings = useCallback((updates) => {
    setGameSettings(prev => {
      const newSettings = { ...prev, ...updates };

      localStorage.setItem('gameSettings', JSON.stringify(newSettings));

      return newSettings;
    });
  }, []);

  const updateHighScore = useCallback((newHighScore) => {
    if (newHighScore) {
      setHighScore(newHighScore);
      localStorage.setItem('2048HighScore', newHighScore.toString());

      updatePlayerStats({
        bestScore: newHighScore
      });
    }
  }, [highScore, updatePlayerStats]);

  return (
    <GameContext.Provider value={{
      board,
      score,
      highScore,
      gameOver,
      won,
      history,
      isAnimating,

      tilePositions,
      mergedTiles,
      newTiles,

      playerStats,

      gameSettings,

      initGame,
      moveUp,
      moveDown,
      moveLeft,
      moveRight,
      undo,
      updateHighScore,

      updatePlayerStats,
      updateGameSettings
    }}>
      {children}
    </GameContext.Provider>
  );
};