// File: /routes/stats.js

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const statsController = require('../controllers/statsController');

/**
 * @route   GET /api/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/', authMiddleware, statsController.getUserStats);

/**
 * @route   POST /api/stats
 * @desc    Update user statistics with new game results
 * @access  Private
 */
router.post('/', authMiddleware, statsController.updateUserStats);

/**
 * @route   DELETE /api/stats
 * @desc    Reset user statistics
 * @access  Private
 */
router.delete('/', authMiddleware, statsController.resetUserStats);

/**
 * @route   GET /api/stats/leaderboard
 * @desc    Get global leaderboard
 * @access  Public
 */
router.get('/leaderboard', statsController.getLeaderboard);

module.exports = router;
