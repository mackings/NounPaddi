const express = require('express');
const router = express.Router();
const {
  getFaculties,
  createFaculty,
  getDepartmentsByFaculty,
} = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getFaculties)
  .post(protect, authorize('admin'), createFaculty);

router.get('/:facultyId/departments', getDepartmentsByFaculty);

module.exports = router;
