const mongoose = require('mongoose');

const ReadingReminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    default: 'Reading Time',
  },
  days: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  }],
  time: {
    type: String, // Format: "HH:MM" (24-hour format)
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastTriggered: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
ReadingReminderSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('ReadingReminder', ReadingReminderSchema);
