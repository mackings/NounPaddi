const mongoose = require('mongoose');

const ITPlacementSchema = new mongoose.Schema({
  // Student Information
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fullName: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide your phone number'],
  },
  
  // Academic Information
  matricNumber: {
    type: String,
    required: [true, 'Please provide your matric number'],
    trim: true,
  },
  department: {
    type: String,
    required: [true, 'Please provide your department'],
  },
  level: {
    type: String,
    required: [true, 'Please provide your current level'],
    enum: ['100', '200', '300', '400', '500'],
  },
  studyCenter: {
    type: String,
    required: [true, 'Please provide your study center'],
  },
  
  // IT Track Selection
  track: {
    type: String,
    required: [true, 'Please select a tech track'],
    enum: ['Frontend Development', 'Backend Development', 'Mobile App Development', 'Cloud Engineering', 'Full Stack Development', 'DevOps', 'Data Science'],
  },
  
  // Experience Level
  experienceLevel: {
    type: String,
    required: [true, 'Please select your experience level'],
    enum: ['Beginner', 'Intermediate', 'Advanced'],
  },
  
  // Additional Information
  hasLaptop: {
    type: Boolean,
    required: true,
  },
  internetAccess: {
    type: Boolean,
    required: true,
  },
  previousExperience: {
    type: String,
    trim: true,
  },
  portfolioUrl: {
    type: String,
    trim: true,
  },
  githubUrl: {
    type: String,
    trim: true,
  },
  linkedinUrl: {
    type: String,
    trim: true,
  },
  
  // Availability
  availableStartDate: {
    type: Date,
    required: [true, 'Please provide when you can start'],
  },
  duration: {
    type: String,
    required: [true, 'Please select preferred duration'],
    enum: ['3 months', '6 months', '12 months'],
  },
  
  // Location Preference
  locationPreference: {
    type: String,
    required: [true, 'Please select location preference'],
    enum: ['Remote', 'On-site', 'Hybrid'],
  },
  preferredLocation: {
    type: String,
    trim: true,
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Matched', 'Placed', 'Rejected', 'Withdrawn'],
    default: 'Pending',
  },
  placementCompany: {
    type: String,
    trim: true,
  },
  placementDetails: {
    type: String,
    trim: true,
  },
  
  // Admin Notes
  adminNotes: {
    type: String,
    trim: true,
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: {
    type: Date,
  },
  placedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for faster queries
ITPlacementSchema.index({ studentId: 1 });
ITPlacementSchema.index({ status: 1 });
ITPlacementSchema.index({ track: 1 });
ITPlacementSchema.index({ studyCenter: 1 });

module.exports = mongoose.model('ITPlacement', ITPlacementSchema);
