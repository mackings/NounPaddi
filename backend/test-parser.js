const { formatQuestionsToMCQ } = require('./utils/aiHelper');

// Sample AI output matching the expected format
const sampleAIOutput = {
  generated_text: `
Q1: What is the capital of France?
Type: multiple-choice
A) London
B) Paris
C) Berlin
D) Madrid
Correct Answer: B
Explanation: Paris is the capital and largest city of France.
Difficulty: easy

Q2: The Earth is flat.
Type: true-false
A) True
B) False
Correct Answer: B
Explanation: The Earth is an oblate spheroid, not flat.
Difficulty: easy

Q3: Which of the following are programming languages?
Type: multi-select
A) Python
B) HTML
C) JavaScript
D) CSS
Correct Answers: A, C
Explanation: Python and JavaScript are programming languages, while HTML and CSS are markup and styling languages.
Difficulty: medium

Q4: What is 2 + 2?
Type: multiple-choice
A) 3
B) 4
C) 5
D) 6
Correct Answer: B
Explanation: Basic arithmetic.
Difficulty: easy

Q5: Water freezes at 0°C.
Type: true-false
A) True
B) False
Correct Answer: A
Explanation: At standard atmospheric pressure, water freezes at 0°C (32°F).
Difficulty: easy
`
};

console.log('Testing question parser...\n');
console.log('='.repeat(80));

const parsedQuestions = formatQuestionsToMCQ(sampleAIOutput, 'sample text');

console.log('\n' + '='.repeat(80));
console.log(`\nParsed ${parsedQuestions.length} questions:\n`);

parsedQuestions.forEach((q, i) => {
  console.log(`${i + 1}. ${q.questionText}`);
  console.log(`   Type: ${q.questionType}`);
  console.log(`   Options: ${q.options.length} options`);
  console.log(`   Correct Answer: ${q.correctAnswer}`);
  console.log(`   Difficulty: ${q.difficulty}`);
  console.log('');
});

// Verify results
const multipleChoice = parsedQuestions.filter(q => q.questionType === 'multiple-choice');
const trueFalse = parsedQuestions.filter(q => q.questionType === 'true-false');
const multiSelect = parsedQuestions.filter(q => q.questionType === 'multi-select');

console.log('Summary:');
console.log(`- Multiple Choice: ${multipleChoice.length}`);
console.log(`- True/False: ${trueFalse.length}`);
console.log(`- Multi-Select: ${multiSelect.length}`);

// Check for bugs
const allOptionC = parsedQuestions.filter(q =>
  q.questionType !== 'multi-select' && q.correctAnswer === 2
);

if (allOptionC.length === parsedQuestions.filter(q => q.questionType !== 'multi-select').length) {
  console.log('\n❌ BUG DETECTED: All single-answer questions have answer C!');
} else {
  console.log('\n✅ Answers are distributed correctly!');
}
