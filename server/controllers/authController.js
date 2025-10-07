const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

// Register a new user
exports.signup = async (req, res) => {
  console.log('Request body:', req.body);
  try {
    const { name, username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      username,
      password: hashedPassword
    });

    console.log('Password before saving:', user.password);
    // Save user to database
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Get initial stats (empty)
    const stats = {
      gamesPlayed: 0,
      highScore: 0,
      totalScore: 0,
      averageScore: 0,
      winRate: 0
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        stats: stats
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }


    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Get user stats from database (assuming stats are stored in user document)
    // Or you can query from a separate stats collection
    const stats = user.stats || {
      gamesPlayed: 0,
      highScore: 0,
      totalScore: 0,
      averageScore: 0,
      winRate: 0
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        stats: stats
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message
    });
  }
};

// Verify user token and return user data (used by frontend for auth checks)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user stats data
    const stats = {
      gamesPlayed: user.gamesPlayed || 0,
      bestScore: user.bestScore || 0,
      highestTile: user.highestTile || 0,
      totalWins: user.totalWins || 0,
      winRate: user.gamesPlayed > 0 ? (user.totalWins / user.gamesPlayed * 100).toFixed(1) : 0,
      averageScore: user.averageScore || 0,
      totalScore: user.totalScore || 0,
      totalMoves: user.totalMoves || 0,
      minutesPlayed: user.minutesPlayed || 0
    };

    // Get the 10 most recent games from the user's game history
    const recentGames = user.gameHistory ?
      user.gameHistory
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
      : [];

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        settings: user.settings,
        stats: stats,
        recentGames: recentGames
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user data',
      error: error.message
    });
  }
};

// Update user profile and stats
exports.updateProfile = async (req, res) => {
  try {
    const { name, username, stats } = req.body;

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;

    // If user wants to change password
    if (req.body.password) {
      updateData.password = req.body.password;
      // Note: Password hashing should be handled by a pre-save hook in the User model
    }

    // Update stats if provided
    if (stats) {
      updateData.stats = stats;
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        stats: user.stats || {
          gamesPlayed: 0,
          highScore: 0,
          totalScore: 0,
          averageScore: 0,
          winRate: 0
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message
    });
  }
};

// Get user profile with stats
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Get stats or provide default empty stats
    const stats = user.stats || {
      gamesPlayed: 0,
      highScore: 0,
      totalScore: 0,
      averageScore: 0,
      winRate: 0
    };

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          username: user.username
        },
        stats: stats
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile data',
      error: error.message
    });
  }
};

// NEW: Get user stats
exports.getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get stats or provide default empty stats
    const stats = {
      bestScore: user.bestScore || 0,
      highestTile: user.highestTile || 0,
      totalScore: user.totalScore || 0,
      gamesPlayed: user.gamesPlayed || 0,
      totalWins: user.totalWins || 0,
      totalMoves: user.totalMoves || 0,
      averageScore: user.averageScore || 0,
      minutesPlayed: user.minutesPlayed || 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user stats',
      error: error.message
    });
  }
};

// NEW: Save game stats
exports.saveGameStats = async (req, res) => {
  try {
    console.log("Request from frontend: ", req)
    const userId = req.user.id;
    const { score, highestTile, moves, result, won, timePlayed, date } = req.body;

    // Validate required fields
    if (score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Game score is required'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.bestScore = user.bestScore || 0;
    user.highestTile = user.highestTile || 0;
    user.gamesPlayed = user.gamesPlayed || 0;
    user.totalWins = user.totalWins || 0;
    user.totalMoves = user.totalMoves || 0;
    user.totalScore = user.totalScore || 0;
    user.averageScore = user.averageScore || 0;
    user.minutesPlayed = user.minutesPlayed || 0;

    // Update stats
    user.gamesPlayed += 1;
    user.totalScore += score;
    user.totalMoves += moves;
    user.minutesPlayed += timePlayed / 60;

    // Update high score if current score is higher
    if (score > user.bestScore) {
      user.bestScore = score;
    }

    if (highestTile > user.highestTile) {
      user.highestTile = highestTile;
    }


    // Update win count if game was completed
    if (won) {
      user.totalWins = (user.totalWins || 0) + 1;
    }

    // Calculate average score and win rate
    user.averageScore = user.gamesPlayed > 0 ? (Math.round(user.totalScore / user.gamesPlayed)) : 0;


    // Add game to history
    const gameRecord = {
      date: new Date(date) || new Date(),
      score,
      highestTile,
      moves,
      result: result?.toUpperCase(),  // Convert to uppercase to match the enum
      won,
      timePlayed: timePlayed / 60,
      completed: "true"
    };
    user.gameHistory.push(gameRecord);


    // Save updated user with new stats
    await user.save();

    // Return updated stats
    res.status(200).json({
      success: true,
      message: 'Game stats saved successfully',
      data: {
        game: {
          score,
          highestTile,
          moves,
          result,
          won,
          timePlayed,
          date
          // completed
        },
        stats: user
      }
    });
  } catch (error) {
    console.error('Save game stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving game stats',
      error: error.message
    });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({})
      .sort({ bestScore: -1 })
      .limit(10)
      .select('username bestScore gamesPlayed totalWins highestTile');

    if (!leaderboard) {
      return res.status(404).json({
        success: false,
        message: 'No users found for leaderboard'
      });
    }

    const formattedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      highScore: user.bestScore || 0,
      gamesPlayed: user.gamesPlayed || 0,
      totalWins: user.totalWins || 0,
      highestTile: user.highestTile || 0
    }));

    res.status(200).json({
      success: true,
      data: formattedLeaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaderboard data',
      error: error.message
    });
  }
};

// Get leaderboard of players with most wins
exports.getMostWinsLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({ totalWins: { $gt: 0 } })
      .sort({ totalWins: -1 })
      .limit(10)
      .select('username totalWins gamesPlayed bestScore highestTile');

    if (!leaderboard || leaderboard.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found with wins for leaderboard'
      });
    }

    const formattedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      totalWins: user.totalWins || 0,
      gamesPlayed: user.gamesPlayed || 0,
      winRate: user.gamesPlayed > 0 ? ((user.totalWins / user.gamesPlayed) * 100).toFixed(1) : "0.0",
      bestScore: user.bestScore || 0,
      highestTile: user.highestTile || 0
    }));

    res.status(200).json({
      success: true,
      data: formattedLeaderboard
    });
  } catch (error) {
    console.error('Get most wins leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching most wins leaderboard data',
      error: error.message
    });
  }
};

// Get leaderboard of players with highest tiles
exports.getHighestTilesLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({ highestTile: { $gt: 0 } })
      .sort({ highestTile: -1 })
      .limit(10)
      .select('username highestTile bestScore gamesPlayed totalWins');

    if (!leaderboard || leaderboard.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found with tiles for leaderboard'
      });
    }

    const formattedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      highestTile: user.highestTile || 0,
      bestScore: user.bestScore || 0,
      gamesPlayed: user.gamesPlayed || 0,
      totalWins: user.totalWins || 0
    }));

    res.status(200).json({
      success: true,
      data: formattedLeaderboard
    });
  } catch (error) {
    console.error('Get highest tiles leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching highest tiles leaderboard data',
      error: error.message
    });
  }
};

exports.getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('settings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user has no settings yet, return default settings
    const settings = user.settings || {
      theme: 'classic',
      gameSize: 4,
      soundEffects: false,
      animations: true
    };

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user settings',
      error: error.message
    });
  }
};

// Update user settings
exports.updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { settings } = req.body;

    // Validate settings object
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    // Ensure settings has the correct structure
    const validatedSettings = {
      theme: settings.theme || 'classic',
      gameSize: settings.gameSize || 4,
      soundEffects: settings.soundEffects !== undefined ? settings.soundEffects : false,
      animations: settings.animations !== undefined ? settings.animations : true
    };

    // Update the user's settings
    const user = await User.findByIdAndUpdate(
      userId,
      { settings: validatedSettings },
      { new: true }
    ).select('settings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings: user.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user settings',
      error: error.message
    });
  }
};

// Reset user settings to default
exports.resetUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Default settings
    const defaultSettings = {
      theme: 'classic',
      gameSize: 4,
      soundEffects: false,
      animations: true
    };

    // Update the user's settings to default
    const user = await User.findByIdAndUpdate(
      userId,
      { settings: defaultSettings },
      { new: true }
    ).select('settings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Settings reset to default',
      settings: user.settings
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting user settings',
      error: error.message
    });
  }
};

module.exports = exports;