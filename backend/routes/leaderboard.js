const express = require('express');
const router = express.Router();
const {
  submitExamResult,
  getCourseLeaderboard,
  getMyResults,
  getMyRank,
} = require('../controllers/leaderboardController');
const { protect } = require('../middleware/auth');

// Submit exam result
router.post('/submit', protect, submitExamResult);

// Get leaderboard for a course
router.get('/course/:courseId', getCourseLeaderboard);

// Get student's exam history
router.get('/my-results', protect, getMyResults);

// Get student's rank for a course
router.get('/my-rank/:courseId', protect, getMyRank);

module.exports = router;
