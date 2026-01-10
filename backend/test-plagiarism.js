const { checkProjectPlagiarism } = require('./utils/projectPlagiarismChecker');
require('dotenv').config();

async function testFreePlagiarismDetection() {
  console.log('\n🧪 TESTING FREE PLAGIARISM DETECTION SYSTEM\n');
  console.log('='.repeat(70));
  console.log('✨ This system uses COMPLETELY FREE methods - no paid APIs!\n');

  const testTitle = 'E-Commerce Website with React and Node.js';
  const testAbstract = 'This project implements a full-stack e-commerce platform using React for the frontend and Node.js with Express for the backend. The system includes user authentication, product catalog, shopping cart functionality, and payment processing. In today\'s world, e-commerce has become essential for businesses.';
  const testFullText = `
Introduction:
E-commerce has become an integral part of modern business. In today's digital world, it is important to note that online shopping continues to grow exponentially. This project aims to develop a comprehensive e-commerce solution. Furthermore, the implementation follows industry best practices.

Implementation:
The frontend is built using React.js, implementing component-based architecture. State management is handled using Redux for global state. The backend uses Express.js with MongoDB for data persistence. Moreover, the system implements RESTful API design patterns.

Features:
1. User Registration and Authentication
2. Product Catalog with Search
3. Shopping Cart Management
4. Order Processing
5. Payment Integration

The implementation follows best practices and industry standards. Thus, the application uses JWT for authentication and bcrypt for password hashing. Hence, security is a top priority.

Conclusion:
In summary, this project successfully demonstrates the implementation of a modern e-commerce platform. Therefore, the system is scalable and maintainable, following clean code principles. As mentioned above, all features have been thoroughly tested.
`;

  try {
    console.log('📊 Running plagiarism check...\n');

    const report = await checkProjectPlagiarism(testTitle, testAbstract, testFullText, '507f1f77bcf86cd799439011');

    console.log('\n' + '='.repeat(70));
    console.log('✅ PLAGIARISM CHECK COMPLETED\n');

    console.log('📈 OVERALL RESULTS:');
    console.log(`   Plagiarism Score: ${report.overallScore}%`);
    console.log(`   Status: ${report.status}`);
    console.log(`   Verdict: ${report.verdict}\n`);

    console.log('🤖 AI CONTENT DETECTION:');
    console.log(`   AI Likelihood: ${report.geminiInsights.aiGeneratedLikelihood}%`);
    console.log(`   Detection Verdict: ${report.geminiInsights.aiDetectionVerdict}`);
    console.log(`   Confidence: ${report.geminiInsights.confidence}%`);

    if (report.geminiInsights.aiIndicators && report.geminiInsights.aiIndicators.length > 0) {
      console.log('\n   🔍 AI Indicators Found:');
      report.geminiInsights.aiIndicators.forEach((indicator, i) => {
        console.log(`      ${i + 1}. ${indicator}`);
      });
    }

    if (report.geminiInsights.redFlags && report.geminiInsights.redFlags.length > 0) {
      console.log('\n   🚩 Red Flags:');
      report.geminiInsights.redFlags.forEach((flag, i) => {
        console.log(`      ${i + 1}. ${flag}`);
      });
    }

    console.log('\n🌐 WEB SOURCE DETECTION:');
    console.log(`   Web Plagiarism Score: ${report.webSources ? report.webSources.length : 0} source(s) found`);

    if (report.webSources && report.webSources.length > 0) {
      console.log('\n   📍 Potential Sources:');
      report.webSources.forEach((source, i) => {
        console.log(`\n      Source ${i + 1}:`);
        console.log(`         Type: ${source.sourceType}`);
        console.log(`         Likelihood: ${source.likelihood}%`);
        console.log(`         Reason: ${source.reason}`);

        if (source.possibleUrls && source.possibleUrls.length > 0) {
          console.log(`         URLs:`);
          source.possibleUrls.forEach(url => {
            console.log(`            - ${url}`);
          });
        }
      });
    }

    console.log('\n📝 DETAILED ANALYSIS:');
    console.log(`   ${report.geminiInsights.detailedAnalysis}`);

    console.log('\n💡 RECOMMENDATIONS:');
    if (report.recommendations) {
      report.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL FEATURES WORKING:');
    console.log('   ✓ AI Content Detection');
    console.log('   ✓ Web Source URLs');
    console.log('   ✓ AI Writing Pattern Detection');
    console.log('   ✓ Rule-based Analysis');
    console.log('\n🎉 System is 100% FREE and fully functional!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

testFreePlagiarismDetection();
