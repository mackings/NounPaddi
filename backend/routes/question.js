const express = require('express');
const router = express.Router();
const {
  getQuestionsByCourse,
  checkAnswer,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/course/:courseId', getQuestionsByCourse);
router.post('/:questionId/check', checkAnswer);
router.put('/:id', protect, authorize('admin'), updateQuestion);
router.delete('/:id', protect, authorize('admin'), deleteQuestion);

module.exports = router;
