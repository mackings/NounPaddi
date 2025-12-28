const Question = require('../models/Question');

// @desc    Get questions by course
// @route   GET /api/questions/course/:courseId
// @access  Public
exports.getQuestionsByCourse = async (req, res) => {
  try {
    const questions = await Question.find({ courseId: req.params.courseId });

    // Send questions with answers (needed for client-side transformation)
    const questionsFormatted = questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      questionType: q.questionType || 'multiple-choice',
      options: q.options,
      correctAnswer: q.correctAnswer, // Include for client-side transformation
      difficulty: q.difficulty,
      explanation: q.explanation,
    }));

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questionsFormatted,
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
    const { answer } = req.body; // Can be a single number or array of numbers
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    let isCorrect = false;
    const questionType = question.questionType || 'multiple-choice';

    // Handle different question types
    if (questionType === 'multi-select') {
      // For multi-select, answer should be an array
      const userAnswers = Array.isArray(answer) ? answer.sort() : [answer];
      const correctAnswers = Array.isArray(question.correctAnswer)
        ? question.correctAnswer.sort()
        : [question.correctAnswer];

      // Check if arrays are equal
      isCorrect =
        userAnswers.length === correctAnswers.length &&
        userAnswers.every((val, index) => val === correctAnswers[index]);
    } else {
      // For single-answer questions (multiple-choice, true-false)
      const userAnswer = Array.isArray(answer) ? answer[0] : parseInt(answer);
      const correctAnswer = Array.isArray(question.correctAnswer)
        ? question.correctAnswer[0]
        : question.correctAnswer;

      isCorrect = correctAnswer === userAnswer;
    }

    // Prepare response with explanation
    let explanationText = question.explanation || 'No explanation available.';

    // Add correct answer(s) to explanation if available
    if (questionType === 'multi-select' && Array.isArray(question.correctAnswer)) {
      const correctOptions = question.correctAnswer.map(idx => question.options[idx]);
      explanationText = `Correct answers: ${correctOptions.join(', ')}. ${explanationText}`;
    } else {
      const correctIdx = Array.isArray(question.correctAnswer)
        ? question.correctAnswer[0]
        : question.correctAnswer;
      const correctOption = question.options[correctIdx];
      if (correctOption) {
        explanationText = `The correct answer is: ${correctOption}. ${explanationText}`;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: explanationText,
        questionType: questionType,
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
