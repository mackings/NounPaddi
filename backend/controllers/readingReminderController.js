const ReadingReminder = require('../models/ReadingReminder');

// @desc    Create reading reminder
// @route   POST /api/reminders
// @access  Private
exports.createReminder = async (req, res) => {
  try {
    const { title, days, time } = req.body;

    const reminder = await ReadingReminder.create({
      userId: req.user._id,
      title,
      days,
      time,
    });

    res.status(201).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating reminder',
    });
  }
};

// @desc    Get user's reminders
// @route   GET /api/reminders
// @access  Private
exports.getReminders = async (req, res) => {
  try {
    const reminders = await ReadingReminder.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching reminders',
    });
  }
};

// @desc    Update reminder
// @route   PUT /api/reminders/:id
// @access  Private
exports.updateReminder = async (req, res) => {
  try {
    const reminder = await ReadingReminder.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    const { title, days, time, isActive } = req.body;

    if (title !== undefined) reminder.title = title;
    if (days !== undefined) reminder.days = days;
    if (time !== undefined) reminder.time = time;
    if (isActive !== undefined) reminder.isActive = isActive;

    await reminder.save();

    res.status(200).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating reminder',
    });
  }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await ReadingReminder.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    await reminder.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting reminder',
    });
  }
};

// @desc    Toggle reminder active status
// @route   PATCH /api/reminders/:id/toggle
// @access  Private
exports.toggleReminder = async (req, res) => {
  try {
    const reminder = await ReadingReminder.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    reminder.isActive = !reminder.isActive;
    await reminder.save();

    res.status(200).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    console.error('Error toggling reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error toggling reminder',
    });
  }
};
