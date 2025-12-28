const express = require('express');
const router = express.Router();
const {
  uploadMaterial,
  generateSummary,
  generateQuestionsForMaterial,
  getMaterialSummary,
  deleteMaterial,
  getCourseMaterials,
  getAllMaterials,
  studentUploadMaterial,
  getStudentStats,
} = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Admin routes
router.get('/', protect, authorize('admin'), getAllMaterials);
router.post('/upload', protect, authorize('admin'), upload.single('file'), uploadMaterial);
router.post('/:materialId/summarize', protect, authorize('admin'), generateSummary);
router.post('/:materialId/generate-questions', protect, authorize('admin'), generateQuestionsForMaterial);
router.delete('/:id', protect, authorize('admin'), deleteMaterial);

// Student routes
router.post('/student-upload', protect, upload.single('file'), studentUploadMaterial);
router.get('/my-stats', protect, getStudentStats);

// Public routes
router.get('/course/:courseId', getCourseMaterials);
router.get('/:materialId/summary', getMaterialSummary);

module.exports = router;
