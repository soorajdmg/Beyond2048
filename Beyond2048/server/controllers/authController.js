const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.signup = async (req, res) => {
  console.log('Request body:', req.body);
  try {
    const { name, username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      username,
      password: hashedPassword
    });

    console.log('Password before saving:', user.password);
    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

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

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

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

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

exports.updateProfile = async (req, res) => {
  try {
    const { name, username, stats } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;

    if (req.body.password) {
      updateData.password = req.body.password;
    }

    if (stats) {
      updateData.stats = stats;
    }

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

exports.getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

exports.saveGameStats = async (req, res) => {
  try {
    console.log("Request from frontend: ", req)
    const userId = req.user.id;
    const { score, highestTile, moves, result, won, timePlayed, date } = req.body;

    if (score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Game score is required'
      });
    }

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

    user.gamesPlayed += 1;
    user.totalScore += score;
    user.totalMoves += moves;
    user.minutesPlayed += timePlayed / 60;

    if (score > user.bestScore) {
      user.bestScore = score;
    }

    if (highestTile > user.highestTile) {
      user.highestTile = highestTile;
    }

    if (won) {
      user.totalWins = (user.totalWins || 0) + 1;
    }

    user.averageScore = user.gamesPlayed > 0 ? (Math.round(user.totalScore / user.gamesPlayed)) : 0;

    const gameRecord = {
      date: new Date(date) || new Date(),
      score,
      highestTile,
      moves,
      result: result?.toUpperCase(),
      won,
      timePlayed: timePlayed / 60,
      completed: "true"
    };
    user.gameHistory.push(gameRecord);

    await user.save();

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
      .select('username bestScore gamesPlayed');

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
      gamesPlayed: user.gamesPlayed || 0
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

exports.updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    const validatedSettings = {
      theme: settings.theme || 'classic',
      gameSize: settings.gameSize || 4,
      soundEffects: settings.soundEffects !== undefined ? settings.soundEffects : false,
      animations: settings.animations !== undefined ? settings.animations : true
    };

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

exports.resetUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const defaultSettings = {
      theme: 'classic',
      gameSize: 4,
      soundEffects: false,
      animations: true
    };

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