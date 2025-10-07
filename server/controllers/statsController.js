// File: /controllers/statsController.js

const User = require('../models/user'); // Import your User model

/**
 * Get user statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();

    // If user ID is not available in token
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user in request' });
    }

    // Find user in MongoDB
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get stats from user document
    const stats = {
      highestTile: user.highestTile || 0,
      bestScore: user.bestScore || 0,
      gamesPlayed: user.gamesPlayed || 0,
      winningStreak: user.winningStreak || 0,
      totalMoves: user.totalMoves || 0,
      averageScore: user.averageScore || 0,
      timePlayed: user.minutesPlayed || 0,
      recentGames: user.gameHistory || []
    };

    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUserStats = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token or user not found'
      });
    }

    const {
      score,
      highestTile,
      moves,
      won,
      timePlayed
    } = req.body;

    // Validate input
    if (typeof score !== 'number' || typeof highestTile !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Invalid game data provided'
      });
    }

    // Find user in MongoDB
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const gameRecord = {
      date: new Date(),
      score,
      highestTile,
      moves: moves || 0,
      result: won ? 'WIN' : 'LOSS',
      won: !!won,
      timePlayed: timePlayed || 0
    };

    const updates = {
      $inc: {
        gamesPlayed: 1,
        totalMoves: moves || 0,
        minutesPlayed: timePlayed || 0
      },
      $push: {
        gameHistory: {
          $each: [gameRecord],
          $position: 0,
          $slice: 20
        }
      },
      $set: {}
    };

    if (!user.bestScore || score > user.bestScore) {
      updates.$set.bestScore = score;
    }

    if (!user.highestTile || highestTile > user.highestTile) {
      updates.$set.highestTile = highestTile;
    }

    if (won) {
      updates.$inc.winningStreak = 1;
    } else {
      updates.$set.winningStreak = 0;
    }

    const totalGames = user.gamesPlayed + 1;
    const currentTotalScore = (user.averageScore || 0) * user.gamesPlayed;
    const newAverage = (currentTotalScore + score) / totalGames;
    updates.$set.averageScore = Math.round(newAverage);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: 'Stats updated successfully',
      data: {
        bestScore: updatedUser.bestScore,
        highestTile: updatedUser.highestTile,
        gamesPlayed: updatedUser.gamesPlayed,
        winningStreak: updatedUser.winningStreak
      }
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reset user statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.resetUserStats = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token or user not found'
      });
    }

    const updates = {
      $set: {
        bestScore: 0,
        highestTile: 0,
        gamesPlayed: 0,
        winningStreak: 0,
        totalMoves: 0,
        averageScore: 0,
        gameHistory: []
        // Add minutesPlayed: 0 if you also want to reset time played
      }
    };

    await User.findByIdAndUpdate(userId, updates);

    return res.json({
      success: true,
      message: 'Stats reset successfully'
    });
  } catch (error) {
    console.error('Error resetting user stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get leaderboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'bestScore';

    const validSortFields = ['bestScore', 'highestTile', 'winningStreak', 'gamesPlayed'];
    if (!validSortFields.includes(sort)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort parameter'
      });
    }

    const sortObj = {};
    sortObj[sort] = -1;

    const leaderboard = await User.find({}, {
      username: 1,
      bestScore: 1,
      highestTile: 1,
      winningStreak: 1,
      gamesPlayed: 1
    }).sort(sortObj).limit(limit);

    return res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
