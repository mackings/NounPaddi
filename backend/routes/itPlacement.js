const express = require('express');
const router = express.Router();
const {
  applyForIT,
  getMyApplication,
  getAllApplications,
  updateApplicationStatus,
  getITPlacementStats,
} = require('../controllers/itPlacementController');
const { protect, authorize } = require('../middleware/auth');

// Student routes
router.post('/apply', protect, applyForIT);
router.get('/my-application', protect, getMyApplication);

// Admin routes
router.get('/applications', protect, authorize('admin'), getAllApplications);
router.put('/applications/:id', protect, authorize('admin'), updateApplicationStatus);
router.get('/stats', protect, authorize('admin'), getITPlacementStats);

module.exports = router;
