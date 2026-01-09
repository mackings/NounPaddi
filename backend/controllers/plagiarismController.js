const {
  checkPlagiarismBetweenTexts,
  checkWebPlagiarism,
  comprehensivePlagiarismCheck
} = require('../utils/plagiarismChecker');

// In-memory storage for submissions (you can replace with MongoDB model)
// This stores submissions per assignment
const submissionDatabase = new Map();

// @desc    Check plagiarism for a submission
// @route   POST /api/plagiarism/check
// @access  Private
exports.checkPlagiarism = async (req, res) => {
  try {
    const { text, assignmentId, studentId, studentName } = req.body;

    if (!text || !assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Text and assignmentId are required'
      });
    }

    // Get previous submissions for this assignment
    const previousSubmissions = submissionDatabase.get(assignmentId) || [];

    // Perform comprehensive plagiarism check
    const result = await comprehensivePlagiarismCheck(text, previousSubmissions);

    // Store this submission for future comparisons (only if it's original)
    if (result.finalVerdict === 'ORIGINAL') {
      if (!submissionDatabase.has(assignmentId)) {
        submissionDatabase.set(assignmentId, []);
      }

      submissionDatabase.get(assignmentId).push({
        studentId: studentId || req.user?._id,
        studentName: studentName || req.user?.name,
        text,
        submittedAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Plagiarism check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check plagiarism',
      error: error.message
    });
  }
};

// @desc    Compare two texts directly
// @route   POST /api/plagiarism/compare
// @access  Private
exports.compareTwoTexts = async (req, res) => {
  try {
    const { text1, text2 } = req.body;

    if (!text1 || !text2) {
      return res.status(400).json({
        success: false,
        message: 'Both text1 and text2 are required'
      });
    }

    const result = await checkPlagiarismBetweenTexts(text1, text2);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Text comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare texts',
      error: error.message
    });
  }
};

// @desc    Check if text is plagiarized from web
// @route   POST /api/plagiarism/web-check
// @access  Private
exports.checkWebPlagiarism = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const result = await checkWebPlagiarism(text);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Web plagiarism check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check web plagiarism',
      error: error.message
    });
  }
};

// @desc    Get submission statistics for an assignment
// @route   GET /api/plagiarism/stats/:assignmentId
// @access  Private/Admin
exports.getAssignmentStats = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submissions = submissionDatabase.get(assignmentId) || [];

    res.status(200).json({
      success: true,
      data: {
        assignmentId,
        totalSubmissions: submissions.length,
        submissions: submissions.map(s => ({
          studentId: s.studentId,
          studentName: s.studentName,
          submittedAt: s.submittedAt,
          textLength: s.text.length
        }))
      }
    });
  } catch (error) {
    console.error('Stats retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assignment stats',
      error: error.message
    });
  }
};

// @desc    Clear submissions for an assignment (Admin only)
// @route   DELETE /api/plagiarism/clear/:assignmentId
// @access  Private/Admin
exports.clearAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (submissionDatabase.has(assignmentId)) {
      submissionDatabase.delete(assignmentId);
    }

    res.status(200).json({
      success: true,
      message: 'Assignment submissions cleared successfully'
    });
  } catch (error) {
    console.error('Clear submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear submissions',
      error: error.message
    });
  }
};
