const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadPDF,
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

// Configure multer for PDF uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// All routes require authentication
router.use(protect);

// Student routes
router.post('/upload-pdf', upload.single('pdf'), uploadPDF);
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
