const express = require('express');
const router = express.Router();
const {
  checkPlagiarism,
  compareTwoTexts,
  checkWebPlagiarism,
  getAssignmentStats,
  clearAssignmentSubmissions
} = require('../controllers/plagiarismController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Public student/teacher routes
router.post('/check', checkPlagiarism);
router.post('/compare', compareTwoTexts);
router.post('/web-check', checkWebPlagiarism);

// Admin only routes
router.get('/stats/:assignmentId', authorize('admin'), getAssignmentStats);
router.delete('/clear/:assignmentId', authorize('admin'), clearAssignmentSubmissions);

module.exports = router;
