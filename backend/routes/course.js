const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCoursesByDepartment,
  searchCourses,
  createCourse,
  getCourseMaterials,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getCourses)
  .post(protect, authorize('admin'), createCourse);

router.get('/search', searchCourses);
router.get('/department/:departmentId', getCoursesByDepartment);
router.get('/:courseId/materials', getCourseMaterials);

module.exports = router;
