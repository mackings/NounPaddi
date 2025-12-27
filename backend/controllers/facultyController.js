const Faculty = require('../models/Faculty');
const Department = require('../models/Department');

// @desc    Get all faculties
// @route   GET /api/faculties
// @access  Public
exports.getFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find();

    res.status(200).json({
      success: true,
      count: faculties.length,
      data: faculties,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create faculty
// @route   POST /api/faculties
// @access  Private/Admin
exports.createFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);

    res.status(201).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get departments by faculty
// @route   GET /api/faculties/:facultyId/departments
// @access  Public
exports.getDepartmentsByFaculty = async (req, res) => {
  try {
    const departments = await Department.find({ facultyId: req.params.facultyId })
      .populate('facultyId', 'name');

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
