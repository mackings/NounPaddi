const ProjectSubmission = require('../models/ProjectSubmission');
const { checkProjectPlagiarism } = require('../utils/projectPlagiarismChecker');
const { extractTextFromPDF, cleanPDFText, extractProjectSections } = require('../utils/pdfParser');

// @desc    Upload and parse PDF project
// @route   POST /api/projects/upload-pdf
// @access  Private (Student)
exports.uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file',
      });
    }

    // Check if file is PDF
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF files are allowed',
      });
    }

    // Extract text from PDF
    const pdfData = await extractTextFromPDF(req.file.buffer);
    const cleanedText = cleanPDFText(pdfData.text);

    // Extract sections
    const sections = extractProjectSections(cleanedText);

    res.status(200).json({
      success: true,
      message: 'PDF parsed successfully',
      data: {
        title: sections.title,
        abstract: sections.abstract,
        fullText: cleanedText,
        numPages: pdfData.numPages,
        wordCount: cleanedText.split(/\s+/).length,
      },
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to parse PDF file',
    });
  }
};

// @desc    Submit a final year project
// @route   POST /api/projects/submit
// @access  Private (Student)
exports.submitProject = async (req, res) => {
  try {
    const { title, abstract, fullText, department, courseId } = req.body;

    if (!title || !abstract || !fullText || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, abstract, full text, and department',
      });
    }

    // Check if student already has a submitted project for this course
    const existingSubmission = await ProjectSubmission.findOne({
      studentId: req.user._id,
      courseId: courseId || null,
      submissionStatus: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a project for this course',
      });
    }

    // Create initial project submission
    const project = await ProjectSubmission.create({
      studentId: req.user._id,
      title,
      abstract,
      fullText,
      department,
      courseId,
      submissionStatus: 'DRAFT',
      plagiarismReport: {
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully. You can now check for plagiarism.',
      data: project,
    });
  } catch (error) {
    console.error('Project submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit project',
      error: error.message,
    });
  }
};

// @desc    Check plagiarism for a project
// @route   POST /api/projects/:projectId/check-plagiarism
// @access  Private (Student - own projects only)
exports.checkPlagiarism = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await ProjectSubmission.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Ensure student can only check their own projects
    if (project.studentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check this project',
      });
    }

    // Update status to checking
    project.plagiarismReport.status = 'CHECKING';
    await project.save();

    // Perform comprehensive plagiarism check
    const plagiarismReport = await checkProjectPlagiarism(
      project.title,
      project.abstract,
      project.fullText,
      project.studentId
    );

    // Update project with plagiarism report
    project.plagiarismReport = {
      ...project.plagiarismReport.toObject(),
      overallScore: plagiarismReport.overallScore,
      status: plagiarismReport.status,
      verdict: plagiarismReport.verdict,
      detailedAnalysis: plagiarismReport.detailedAnalysis,
      webSources: plagiarismReport.webSources || [],
      databaseMatches: plagiarismReport.databaseMatches || [],
      checkedAt: plagiarismReport.checkedAt,
    };

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Plagiarism check completed',
      data: {
        projectId: project._id,
        plagiarismReport: {
          overallScore: plagiarismReport.overallScore,
          status: plagiarismReport.status,
          verdict: plagiarismReport.verdict,
          detailedAnalysis: plagiarismReport.detailedAnalysis,
          recommendations: plagiarismReport.recommendations,
          databaseMatches: plagiarismReport.databaseMatches?.length || 0,
          webSources: plagiarismReport.webSources?.length || 0,
          checkedAt: plagiarismReport.checkedAt,
        },
      },
    });
  } catch (error) {
    console.error('Plagiarism check error:', error);

    // Update project status to failed
    try {
      await ProjectSubmission.findByIdAndUpdate(req.params.projectId, {
        'plagiarismReport.status': 'FAILED',
      });
    } catch (updateError) {
      console.error('Failed to update project status:', updateError);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to check plagiarism',
      error: error.message,
    });
  }
};

// @desc    Get plagiarism report for a project
// @route   GET /api/projects/:projectId/plagiarism-report
// @access  Private (Student - own projects, Admin - all)
exports.getPlagiarismReport = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await ProjectSubmission.findById(projectId)
      .select('title plagiarismReport studentId')
      .populate('studentId', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Authorization check
    if (project.studentId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this report',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        projectTitle: project.title,
        studentName: project.studentId.name,
        plagiarismReport: project.plagiarismReport,
      },
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve plagiarism report',
      error: error.message,
    });
  }
};

// @desc    Finalize project submission after plagiarism check
// @route   PUT /api/projects/:projectId/finalize
// @access  Private (Student - own projects only)
exports.finalizeSubmission = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await ProjectSubmission.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Authorization check
    if (project.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to finalize this project',
      });
    }

    // Check if plagiarism check was done
    if (project.plagiarismReport.status === 'PENDING' || project.plagiarismReport.status === 'CHECKING') {
      return res.status(400).json({
        success: false,
        message: 'Please complete plagiarism check before finalizing submission',
      });
    }

    // Don't allow submission if plagiarized
    if (project.plagiarismReport.status === 'PLAGIARIZED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot submit project flagged for plagiarism. Please revise and recheck.',
      });
    }

    // Update submission status
    project.submissionStatus = 'SUBMITTED';
    project.submittedAt = new Date();
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project submitted successfully for review',
      data: project,
    });
  } catch (error) {
    console.error('Finalize submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize submission',
      error: error.message,
    });
  }
};

// @desc    Get all student's projects
// @route   GET /api/projects/my-projects
// @access  Private (Student)
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await ProjectSubmission.find({ studentId: req.user._id })
      .select('-fullText') // Don't send full text in list view
      .populate('department', 'name')
      .populate('courseId', 'courseName courseCode')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects',
      error: error.message,
    });
  }
};

// @desc    Get all submitted projects (Admin only)
// @route   GET /api/projects/all
// @access  Private/Admin
exports.getAllProjects = async (req, res) => {
  try {
    const { status, department } = req.query;

    const query = {};
    if (status) query.submissionStatus = status;
    if (department) query.department = department;

    const projects = await ProjectSubmission.find(query)
      .select('-fullText')
      .populate('studentId', 'name email')
      .populate('department', 'name')
      .populate('courseId', 'courseName courseCode')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects',
      error: error.message,
    });
  }
};

// @desc    Update project review status (Admin only)
// @route   PUT /api/projects/:projectId/review
// @access  Private/Admin
exports.reviewProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { submissionStatus, reviewerNotes } = req.body;

    const project = await ProjectSubmission.findByIdAndUpdate(
      projectId,
      {
        submissionStatus,
        reviewerNotes,
        reviewedBy: req.user._id,
      },
      { new: true }
    ).populate('studentId', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project review updated',
      data: project,
    });
  } catch (error) {
    console.error('Review project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project review',
      error: error.message,
    });
  }
};

// @desc    Delete a project (own projects only, before submission)
// @route   DELETE /api/projects/:projectId
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await ProjectSubmission.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Only allow deletion of own drafts
    if (project.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project',
      });
    }

    if (project.submissionStatus !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete submitted projects',
      });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message,
    });
  }
};
