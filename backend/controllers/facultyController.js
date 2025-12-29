const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const { facultyCache, departmentCache, cacheHelper } = require('../utils/cache');

// @desc    Get all faculties
// @route   GET /api/faculties
// @access  Public
exports.getFaculties = async (req, res) => {
  try {
    const cacheKey = 'all_faculties';

    const faculties = await cacheHelper.getOrSet(facultyCache, cacheKey, async () => {
      const results = await Faculty.find();
      return results.map(doc => doc.toObject());
    });

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

    // Invalidate faculty cache
    cacheHelper.invalidate(facultyCache, 'all_faculties');

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
    const cacheKey = `faculty_${req.params.facultyId}_departments`;

    const departments = await cacheHelper.getOrSet(departmentCache, cacheKey, async () => {
      const results = await Department.find({ facultyId: req.params.facultyId })
        .populate('facultyId', 'name');
      return results.map(doc => doc.toObject());
    });

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
