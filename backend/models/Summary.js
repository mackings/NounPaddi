const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true,
  },
  summaryText: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    default: 'facebook/bart-large-cnn',
  },
  generatedDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Summary', summarySchema);
