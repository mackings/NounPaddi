const Department = require('../models/Department');
const { departmentCache, cacheHelper } = require('../utils/cache');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public
exports.getDepartments = async (req, res) => {
  try {
    const cacheKey = 'all_departments';

    const departments = await cacheHelper.getOrSet(departmentCache, cacheKey, async () => {
      return await Department.find().populate('facultyId', 'name code');
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

// @desc    Create department
// @route   POST /api/departments
// @access  Private/Admin
exports.createDepartment = async (req, res) => {
  try {
    const department = await Department.create(req.body);

    // Invalidate relevant caches
    cacheHelper.invalidate(departmentCache, 'all_departments');
    cacheHelper.invalidatePattern(departmentCache, `faculty_${department.facultyId}_*`);

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Public
exports.getDepartment = async (req, res) => {
  try {
    const cacheKey = `department_${req.params.id}`;

    const department = await cacheHelper.getOrSet(departmentCache, cacheKey, async () => {
      return await Department.findById(req.params.id).populate('facultyId', 'name code');
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
