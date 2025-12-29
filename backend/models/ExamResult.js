const mongoose = require('mongoose');

const ExamResultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number, // in seconds
    required: true,
  },
  timeTaken: {
    type: Number, // in seconds - actual time taken
    required: true,
  },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    answer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
  }],
  completedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient leaderboard queries
ExamResultSchema.index({ courseId: 1, percentage: -1, timeTaken: 1 });
ExamResultSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('ExamResult', ExamResultSchema);
