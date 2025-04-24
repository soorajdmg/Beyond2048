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
  getLeaderboard,
  getMostWinsLeaderboard,
  getHighestTilesLeaderboard
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

router.get('/user', authMiddleware, getUser);

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

router.get('/stats', authMiddleware, getStats);
router.post('/stats/game', authMiddleware, saveGameStats);

router.get('/leaderboard', getLeaderboard);
router.get('/leaderboard/wins', getMostWinsLeaderboard);
router.get('/leaderboard/tiles', getHighestTilesLeaderboard);

router.get('/settings', authMiddleware, getUserSettings);
router.post('/settings', authMiddleware, updateUserSettings);
router.post('/reset', authMiddleware, resetUserSettings);

module.exports = router;