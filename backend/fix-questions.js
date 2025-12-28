const mongoose = require('mongoose');
require('dotenv').config();

const Question = require('./models/Question');

async function fixQuestions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete all existing questions since they all have wrong answer (C)
    const result = await Question.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} questions with incorrect answers`);

    console.log('\n⚠️  All practice questions have been deleted.');
    console.log('📝 Next steps:');
    console.log('   1. Go to Admin Materials page');
    console.log('   2. Click "Generate Questions" for each material');
    console.log('   3. The fixed parser will now correctly extract answer letters');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixQuestions();
