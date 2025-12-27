const Question = require('../models/Question');

// @desc    Get questions by course
// @route   GET /api/questions/course/:courseId
// @access  Public
exports.getQuestionsByCourse = async (req, res) => {
  try {
    const questions = await Question.find({ courseId: req.params.courseId });

    // Don't send correct answers to students initially
    const questionsWithoutAnswers = questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      difficulty: q.difficulty,
    }));

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questionsWithoutAnswers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Check answer
// @route   POST /api/questions/:questionId/check
// @access  Public
exports.checkAnswer = async (req, res) => {
  try {
    const { answer } = req.body;
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    const isCorrect = question.correctAnswer === parseInt(answer);

    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: `The correct answer is: ${question.options[question.correctAnswer]}`,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private/Admin
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private/Admin
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    await question.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
