const mongoose = require('mongoose');

const ProjectSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide project title'],
    trim: true,
  },
  abstract: {
    type: String,
    required: [true, 'Please provide project abstract'],
  },
  fullText: {
    type: String,
    required: [true, 'Please provide project full text'],
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false, // Made optional - not all students need to select department
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false, // Made optional - not all students need to select course
  },
  fileUrl: {
    type: String, // If you want to store PDF/DOC files
  },
  plagiarismReport: {
    overallScore: { type: Number, default: 0 }, // 0-100
    status: {
      type: String,
      enum: ['PENDING', 'CHECKING', 'ORIGINAL', 'SUSPICIOUS', 'PLAGIARIZED', 'FAILED'],
      default: 'PENDING',
    },
    webSources: [{
      sourceType: String,
      likelihood: Number,
      reason: String,
      indicators: [String],
      possibleUrls: [String],
    }],
    databaseMatches: [{
      projectId: mongoose.Schema.Types.ObjectId,
      projectTitle: String,
      studentName: String,
      similarity: Number,
      matchedSections: [String],
      analysis: String,
    }],
    geminiInsights: {
      originalityScore: Number,
      verdict: String,
      aiGeneratedLikelihood: Number,
      aiDetectionVerdict: String,
      aiIndicators: [String],
      redFlags: [String],
      strengths: [String],
      suspiciousPatterns: [String],
      citationIssues: String,
      detailedAnalysis: String,
      confidence: Number,
    },
    recommendations: [String],
    detailedAnalysis: String,
    checkedAt: Date,
    verdict: String,
  },
  submissionStatus: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
    default: 'DRAFT',
  },
  reviewerNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  submittedAt: Date,
}, {
  timestamps: true,
});

// Index for faster searches
ProjectSubmissionSchema.index({ studentId: 1, submittedAt: -1 });
ProjectSubmissionSchema.index({ department: 1 });
ProjectSubmissionSchema.index({ 'plagiarismReport.status': 1 });

module.exports = mongoose.model('ProjectSubmission', ProjectSubmissionSchema);
