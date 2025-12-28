const mongoose = require('mongoose');
require('dotenv').config();

const Question = require('./models/Question');

async function deleteAllQuestions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const count = await Question.countDocuments();
    console.log(`Found ${count} questions in database`);

    const result = await Question.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} questions`);

    console.log('\n📝 Next: Restart backend and regenerate questions from Admin Materials page');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteAllQuestions();
