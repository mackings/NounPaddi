const express = require('express');
const router = express.Router();
const {
  submitProject,
  checkPlagiarism,
  getPlagiarismReport,
  finalizeSubmission,
  getMyProjects,
  getAllProjects,
  reviewProject,
  deleteProject,
} = require('../controllers/projectSubmissionController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Student routes
router.post('/submit', submitProject);
router.post('/:projectId/check-plagiarism', checkPlagiarism);
router.get('/:projectId/plagiarism-report', getPlagiarismReport);
router.put('/:projectId/finalize', finalizeSubmission);
router.get('/my-projects', getMyProjects);
router.delete('/:projectId', deleteProject);

// Admin routes
router.get('/all', authorize('admin'), getAllProjects);
router.put('/:projectId/review', authorize('admin'), reviewProject);

module.exports = router;
