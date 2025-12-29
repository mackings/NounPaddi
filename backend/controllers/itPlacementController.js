const ITPlacement = require('../models/ITPlacement');
const nodemailer = require('nodemailer');

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
    await sendApplicationEmail(application);

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
      await sendPlacementEmail(application);
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

// Email sending function
const sendApplicationEmail = async (application) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured');
      return;
    }

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const currentYear = new Date().getFullYear();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: application.email,
      subject: 'IT Placement Application Received - NounPaddi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">NounPaddi IT Placement</h1>
          </div>

          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Hello ${application.fullName}!</h2>

            <p style="color: #666; line-height: 1.6;">
              Thank you for applying to the NounPaddi IT Placement Program. We have successfully received your application for <strong>${application.track}</strong>.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0;">Application Summary</h3>
              <p style="margin: 10px 0;"><strong>Track:</strong> ${application.track}</p>
              <p style="margin: 10px 0;"><strong>Experience Level:</strong> ${application.experienceLevel}</p>
              <p style="margin: 10px 0;"><strong>Study Center:</strong> ${application.studyCenter}</p>
              <p style="margin: 10px 0;"><strong>Preferred Duration:</strong> ${application.duration}</p>
              <p style="margin: 10px 0;"><strong>Location Preference:</strong> ${application.locationPreference}</p>
            </div>

            <h3 style="color: #333;">What's Next?</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Our team will review your application within 3-5 business days</li>
              <li>We will match you with suitable IT placement opportunities</li>
              <li>You will receive an email with placement details and next steps</li>
              <li>Track your application status in your NounPaddi dashboard</li>
            </ul>

            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Note:</strong> Make sure to check your email regularly and keep your profile updated for the best placement opportunities.
              </p>
            </div>

            <p style="color: #666;">
              If you have any questions, feel free to reply to this email or contact our support team.
            </p>

            <p style="color: #666;">
              Best regards,<br>
              <strong>The NounPaddi Team</strong>
            </p>
          </div>

          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">
              &copy; ${currentYear} NounPaddi. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Application confirmation email sent to:', application.email);
  } catch (error) {
    console.error('Error sending application email:', error);
  }
};

const sendPlacementEmail = async (application) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured');
      return;
    }

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const currentYear = new Date().getFullYear();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: application.email,
      subject: 'Congratulations! IT Placement Confirmed - NounPaddi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">&#127881; Placement Confirmed!</h1>
          </div>

          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Congratulations ${application.fullName}!</h2>

            <p style="color: #666; line-height: 1.6;">
              We are excited to inform you that you have been successfully placed for your IT training!
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #10b981; margin-top: 0;">Placement Details</h3>
              <p style="margin: 10px 0;"><strong>Company/Organization:</strong> ${application.placementCompany || 'To be confirmed'}</p>
              <p style="margin: 10px 0;"><strong>Track:</strong> ${application.track}</p>
              <p style="margin: 10px 0;"><strong>Details:</strong></p>
              <p style="color: #666; margin: 10px 0;">${application.placementDetails || 'Further details will be sent shortly.'}</p>
            </div>

            <h3 style="color: #333;">Next Steps:</h3>
            <ol style="color: #666; line-height: 1.8;">
              <li>Check your dashboard for detailed placement information</li>
              <li>Prepare required documents (if any)</li>
              <li>Our team will contact you with onboarding details</li>
              <li>Start your IT journey!</li>
            </ol>

            <p style="color: #666;">
              We wish you all the best in your IT training. Make the most of this opportunity!
            </p>

            <p style="color: #666;">
              Best regards,<br>
              <strong>The NounPaddi Team</strong>
            </p>
          </div>

          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">
              &copy; ${currentYear} NounPaddi. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Placement confirmation email sent to:', application.email);
  } catch (error) {
    console.error('Error sending placement email:', error);
  }
};
