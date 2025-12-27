const Course = require('../models/Course');
const Material = require('../models/Material');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('departmentId', 'name facultyId');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get courses by department
// @route   GET /api/courses/department/:departmentId
// @access  Public
exports.getCoursesByDepartment = async (req, res) => {
  try {
    const courses = await Course.find({ departmentId: req.params.departmentId })
      .populate('departmentId', 'name');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Search courses
// @route   GET /api/courses/search?query=
// @access  Public
exports.searchCourses = async (req, res) => {
  try {
    const query = req.query.query;

    const courses = await Course.find({
      $or: [
        { courseCode: { $regex: query, $options: 'i' } },
        { courseName: { $regex: query, $options: 'i' } },
      ],
    }).populate('departmentId', 'name facultyId');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get course materials
// @route   GET /api/courses/:courseId/materials
// @access  Public
exports.getCourseMaterials = async (req, res) => {
  try {
    const materials = await Material.find({ courseId: req.params.courseId })
      .populate('uploadedBy', 'name');

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
