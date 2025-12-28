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
  .post(protect, createFaculty); // Allow both students and admins to create faculties

router.get('/:facultyId/departments', getDepartmentsByFaculty);

module.exports = router;
