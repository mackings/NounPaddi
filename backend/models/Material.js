const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  cloudinaryUrl: {
    type: String,
    required: true,
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    default: 'pdf',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Material', materialSchema);
