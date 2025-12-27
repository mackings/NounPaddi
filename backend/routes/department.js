const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  getDepartment,
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getDepartments)
  .post(protect, authorize('admin'), createDepartment);

router.route('/:id')
  .get(getDepartment);

module.exports = router;
