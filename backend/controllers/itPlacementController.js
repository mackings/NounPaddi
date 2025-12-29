const ITPlacement = require('../models/ITPlacement');
const { sendITApplicationEmail, sendITPlacementEmail } = require('../utils/emailService');

// @desc    Submit IT placement application
// @route   POST /api/it-placement/apply
// @access  Private
exports.applyForIT = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      matricNumber,
      department,
      level,
      studyCenter,
      track,
      experienceLevel,
      hasLaptop,
      internetAccess,
      previousExperience,
      portfolioUrl,
      githubUrl,
      linkedinUrl,
      availableStartDate,
      duration,
      locationPreference,
      preferredLocation,
    } = req.body;

    // Check if student already applied
    const existingApplication = await ITPlacement.findOne({
      studentId: req.user._id,
      status: { $nin: ['Rejected', 'Withdrawn'] },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active IT placement application',
      });
    }

    // Create application
    const application = await ITPlacement.create({
      studentId: req.user._id,
      fullName,
      email,
      phone,
      matricNumber,
      department,
      level,
      studyCenter,
      track,
      experienceLevel,
      hasLaptop,
      internetAccess,
      previousExperience,
      portfolioUrl,
      githubUrl,
      linkedinUrl,
      availableStartDate,
      duration,
      locationPreference,
      preferredLocation,
    });

    // Send confirmation email
    await sendITApplicationEmail(application);

    res.status(201).json({
      success: true,
      message: 'IT placement application submitted successfully! Check your email for confirmation.',
      data: application,
    });
  } catch (error) {
    console.error('IT Placement Application Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting IT placement application',
    });
  }
};

// @desc    Get student's IT placement application
// @route   GET /api/it-placement/my-application
// @access  Private
exports.getMyApplication = async (req, res) => {
  try {
    const application = await ITPlacement.findOne({ studentId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching application',
    });
  }
};

// @desc    Get all IT placement applications (Admin)
// @route   GET /api/it-placement/applications
// @access  Private/Admin
exports.getAllApplications = async (req, res) => {
  try {
    const { status, track, studyCenter, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (track) query.track = track;
    if (studyCenter) query.studyCenter = studyCenter;

    const applications = await ITPlacement.find(query)
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ITPlacement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching applications',
    });
  }
};

// @desc    Update IT placement application status (Admin)
// @route   PUT /api/it-placement/applications/:id
// @access  Private/Admin
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, placementCompany, placementDetails, adminNotes } = req.body;

    const application = await ITPlacement.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    application.status = status || application.status;
    application.placementCompany = placementCompany || application.placementCompany;
    application.placementDetails = placementDetails || application.placementDetails;
    application.adminNotes = adminNotes || application.adminNotes;

    if (status === 'Under Review') {
      application.reviewedAt = Date.now();
    }

    if (status === 'Placed') {
      application.placedAt = Date.now();
      // Send placement confirmation email
      await sendITPlacementEmail(application);
    }

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating application',
    });
  }
};

// @desc    Get IT placement statistics (Admin)
// @route   GET /api/it-placement/stats
// @access  Private/Admin
exports.getITPlacementStats = async (req, res) => {
  try {
    const totalApplications = await ITPlacement.countDocuments();
    const pending = await ITPlacement.countDocuments({ status: 'Pending' });
    const underReview = await ITPlacement.countDocuments({ status: 'Under Review' });
    const placed = await ITPlacement.countDocuments({ status: 'Placed' });

    const trackStats = await ITPlacement.aggregate([
      {
        $group: {
          _id: '$track',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const centerStats = await ITPlacement.aggregate([
      {
        $group: {
          _id: '$studyCenter',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total: totalApplications,
          pending,
          underReview,
          placed,
          placementRate: totalApplications > 0 ? ((placed / totalApplications) * 100).toFixed(1) : 0,
        },
        byTrack: trackStats,
        byCenter: centerStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching statistics',
    });
  }
};
