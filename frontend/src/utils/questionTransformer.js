/**
 * Transform multiple-choice questions into different formats
 * Creates a mix of Multiple Choice, True/False, and Multi-Select questions
 */

/**
 * Convert a multiple-choice question into a True/False question
 */
const convertToTrueFalse = (question) => {
  const correctAnswerIndex = question.correctAnswer;
  const correctOption = question.options[correctAnswerIndex];

  // Validate that the correct option exists
  if (!correctOption || question.options.length < 2) {
    console.warn('Invalid question for True/False conversion, keeping as multiple-choice');
    return {
      ...question,
      questionType: 'multiple-choice',
    };
  }

  // Randomly decide if we make a true or false statement
  const makeTrue = Math.random() > 0.5;

  if (makeTrue) {
    // Use the correct answer as a TRUE statement
    return {
      ...question,
      questionType: 'true-false',
      questionText: `${question.questionText}\n\n"${correctOption}"`,
      options: ['True', 'False'],
      correctAnswer: 0, // True
      originalQuestion: question.questionText,
      explanation: `This statement is TRUE. ${correctOption} is the correct answer to the question.`,
    };
  } else {
    // Use an incorrect answer as a FALSE statement
    const incorrectOptions = question.options.filter((_, idx) => idx !== correctAnswerIndex);
    const incorrectOption = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];

    return {
      ...question,
      questionType: 'true-false',
      questionText: `${question.questionText}\n\n"${incorrectOption}"`,
      options: ['True', 'False'],
      correctAnswer: 1, // False
      originalQuestion: question.questionText,
      explanation: `This statement is FALSE. The correct answer is: ${correctOption}.`,
    };
  }
};

/**
 * Convert a multiple-choice question into a multi-select question
 */
const convertToMultiSelect = (question) => {
  // Only convert questions with 4 options (skip True/False with 2 options)
  if (question.options.length < 3) {
    return {
      ...question,
      questionType: 'multiple-choice',
    };
  }

  // For multi-select, we'll mark 2 answers as correct
  const correctAnswerIndex = question.correctAnswer;

  // Pick a random second correct answer (different from the first)
  let secondCorrectIndex;
  do {
    secondCorrectIndex = Math.floor(Math.random() * question.options.length);
  } while (secondCorrectIndex === correctAnswerIndex);

  const correctIndices = [correctAnswerIndex, secondCorrectIndex].sort();
  const correctOptions = correctIndices.map(idx => question.options[idx]);

  // Validate that both options exist
  if (!correctOptions[0] || !correctOptions[1]) {
    console.warn('Invalid multi-select conversion, keeping as multiple-choice');
    return {
      ...question,
      questionType: 'multiple-choice',
    };
  }

  return {
    ...question,
    questionType: 'multi-select',
    questionText: `${question.questionText} (Select all that apply)`,
    correctAnswer: correctIndices,
    originalQuestion: question.questionText,
    explanation: `Both "${correctOptions[0]}" and "${correctOptions[1]}" are correct answers for this question.`,
  };
};

/**
 * Transform a list of questions to include variety
 * Target: 60% Multiple Choice, 30% True/False, 10% Multi-Select
 */
export const transformQuestions = (questions) => {
  if (!questions || questions.length === 0) return [];

  const transformed = [];
  const totalQuestions = questions.length;

  // Calculate how many of each type we want
  const numTrueFalse = Math.floor(totalQuestions * 0.3); // 30%
  const numMultiSelect = Math.floor(totalQuestions * 0.1); // 10%
  const numMultipleChoice = totalQuestions - numTrueFalse - numMultiSelect; // Remaining

  // Create indices array and shuffle it
  const indices = Array.from({ length: totalQuestions }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Assign question types based on shuffled indices
  const trueFalseIndices = new Set(indices.slice(0, numTrueFalse));
  const multiSelectIndices = new Set(indices.slice(numTrueFalse, numTrueFalse + numMultiSelect));

  questions.forEach((question, index) => {
    // Skip questions that don't have correctAnswer (these come from backend without answer for security)
    const hasCorrectAnswer = question.correctAnswer !== undefined && question.correctAnswer !== null;
    const isAlreadyTransformed = question.questionType && question.questionType !== 'multiple-choice';
    const hasEnoughOptions = question.options && question.options.length >= 4;

    console.log(`Q${index + 1}: hasAnswer=${hasCorrectAnswer}, alreadyTransformed=${isAlreadyTransformed}, hasOptions=${hasEnoughOptions}, type=${question.questionType}`);

    // Only transform questions that have correctAnswer field
    if (!hasCorrectAnswer || isAlreadyTransformed || !hasEnoughOptions) {
      // Keep as is - these will be checked by backend API
      transformed.push({
        ...question,
        questionType: question.questionType || 'multiple-choice',
      });
      console.log(`  -> Kept as ${question.questionType || 'multiple-choice'}`);
    } else if (trueFalseIndices.has(index)) {
      const result = convertToTrueFalse(question);
      transformed.push(result);
      console.log(`  -> Converted to ${result.questionType}`);
    } else if (multiSelectIndices.has(index)) {
      const result = convertToMultiSelect(question);
      transformed.push(result);
      console.log(`  -> Converted to ${result.questionType}`);
    } else {
      // Keep as multiple choice but preserve correctAnswer
      transformed.push({
        ...question,
        questionType: 'multiple-choice',
      });
      console.log(`  -> Kept as multiple-choice`);
    }
  });

  return transformed;
};

/**
 * Shuffle array in place
 */
export const shuffleQuestions = (questions) => {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Get a balanced mix of questions with variety
 */
export const getBalancedQuestions = (questions) => {
  const transformed = transformQuestions(questions);
  return shuffleQuestions(transformed);
};

/**
 * Simple transformer: Convert 50% to True/False, keep 50% as single-answer
 */
export const convertHalfToTrueFalse = (questions) => {
  if (!questions || questions.length === 0) return [];

  const transformed = [];
  const numToConvert = Math.floor(questions.length * 0.5);

  // Shuffle indices to randomly select which questions to convert
  const indices = Array.from({ length: questions.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const trueFalseIndices = new Set(indices.slice(0, numToConvert));

  questions.forEach((question, index) => {
    // Only convert if question has correct answer and 4 options
    const canTransform = question.correctAnswer !== undefined &&
                        question.correctAnswer !== null &&
                        question.options &&
                        question.options.length === 4;

    if (canTransform && trueFalseIndices.has(index)) {
      // Convert to True/False
      transformed.push(convertToTrueFalse(question));
    } else {
      // Keep as regular single-answer question
      transformed.push({
        ...question,
        questionType: question.questionType || 'multiple-choice',
      });
    }
  });

  return shuffleQuestions(transformed);
};
