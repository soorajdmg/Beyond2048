const express = require('express');
const router = express.Router();

const {
  signup,
  login,
  logout,
  getUser,
  updateProfile,
  getProfile,
  getStats,
  saveGameStats,
  getUserSettings,
  updateUserSettings,
  resetUserSettings,
  getLeaderboard // Add this import
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Authentication routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// User verification route
router.get('/user', authMiddleware, getUser);

// Profile routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// Stats routes 
router.get('/stats', authMiddleware, getStats);
router.post('/stats/game', authMiddleware, saveGameStats);

// Leaderboard route
router.get('/leaderboard', getLeaderboard);

// Settings routes 
router.get('/settings', authMiddleware, getUserSettings);
router.post('/settings', authMiddleware, updateUserSettings);
router.post('/reset', authMiddleware, resetUserSettings);

module.exports = router;