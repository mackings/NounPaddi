const express = require('express');
const router = express.Router();
const {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
  toggleReminder,
} = require('../controllers/readingReminderController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getReminders)
  .post(createReminder);

router.route('/:id')
  .put(updateReminder)
  .delete(deleteReminder);

router.patch('/:id/toggle', toggleReminder);

module.exports = router;
