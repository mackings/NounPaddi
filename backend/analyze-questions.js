const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Question = require('./models/Question');

async function analyzeQuestions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Get all questions
    const questions = await Question.find({});

    console.log('📊 Question Statistics:');
    console.log('='.repeat(60));
    console.log(`Total questions: ${questions.length}\n`);

    // Count by question type
    const byType = {
      'multiple-choice': 0,
      'true-false': 0,
      'multi-select': 0
    };

    questions.forEach(q => {
      byType[q.questionType] = (byType[q.questionType] || 0) + 1;
    });

    console.log('Question Types:');
    console.log(`  Multiple Choice: ${byType['multiple-choice']}`);
    console.log(`  True/False: ${byType['true-false']}`);
    console.log(`  Multi-Select: ${byType['multi-select']}\n`);

    // Check answer distribution for single-answer questions
    const singleAnswer = questions.filter(q =>
      q.questionType !== 'multi-select' && typeof q.correctAnswer === 'number'
    );

    const answerDist = { 0: 0, 1: 0, 2: 0, 3: 0 };
    singleAnswer.forEach(q => {
      if (q.correctAnswer >= 0 && q.correctAnswer <= 3) {
        answerDist[q.correctAnswer]++;
      }
    });

    console.log('Answer Distribution (single-answer questions):');
    console.log(`  Option A (index 0): ${answerDist[0]} questions`);
    console.log(`  Option B (index 1): ${answerDist[1]} questions`);
    console.log(`  Option C (index 2): ${answerDist[2]} questions`);
    console.log(`  Option D (index 3): ${answerDist[3]} questions\n`);

    // Check if all are C
    if (singleAnswer.length > 0 && answerDist[2] === singleAnswer.length) {
      console.log('❌ BUG STILL EXISTS: All answers are C!');
      console.log('\n⚠️  The backend may not have been restarted with the fix.');
      console.log('   Please restart: ./start-mobile.sh\n');
    } else if (singleAnswer.length > 0) {
      console.log('✅ Answers are properly distributed!');
    }

    // Show sample questions
    console.log('\n' + '='.repeat(60));
    console.log('Sample Questions:\n');

    const samples = questions.slice(0, 8);
    samples.forEach((q, i) => {
      console.log(`${i+1}. [${q.questionType}] ${q.questionText.substring(0, 60)}...`);
      console.log(`   Correct Answer: ${q.correctAnswer}`);
      if (q.options && q.options.length > 0) {
        const correctOption = Array.isArray(q.correctAnswer)
          ? q.correctAnswer.map(idx => q.options[idx]).join(', ')
          : q.options[q.correctAnswer];
        console.log(`   Correct Option(s): ${correctOption}`);
      }
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeQuestions();
