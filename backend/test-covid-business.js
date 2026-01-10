const { checkProjectPlagiarism } = require('./utils/projectPlagiarismChecker');
require('dotenv').config();

async function testCovidBusinessProject() {
  console.log('\n🧪 TESTING COVID-19 BUSINESS PROJECT\n');
  console.log('='.repeat(70));
  console.log('📋 This should NOT show tech patterns like MERN Stack or React!\n');

  const testTitle = 'Impact of COVID-19 on Small Business Operations';
  const testAbstract = 'This study examines how the COVID-19 pandemic affected small businesses in Nigeria. We analyze the economic impact, challenges faced by entrepreneurs, and strategies used to adapt to the crisis. The research uses surveys and interviews with business owners.';
  const testFullText = `
Introduction:
The COVID-19 pandemic has created unprecedented challenges for small businesses worldwide. In Nigeria, many entrepreneurs faced closures, reduced customer demand, and supply chain disruptions. This study investigates how small businesses reacted to the crisis and what survival strategies they employed.

Research Methodology:
We conducted surveys with 150 small business owners across Lagos, Abuja, and Port Harcourt. Additionally, we performed in-depth interviews with 20 entrepreneurs to understand their experiences. The data was analyzed using statistical methods and thematic analysis.

Findings:
Our research revealed that 65% of small businesses experienced revenue declines of more than 50%. Many entrepreneurs shifted to online sales channels to reach customers during lockdowns. The most common challenges included:
1. Reduced customer demand
2. Supply chain interruptions
3. Cash flow problems
4. Employee layoffs

Business owners who successfully adapted implemented strategies such as:
- Digital marketing through social media
- Diversifying product offerings
- Reducing operational costs
- Seeking government relief funds

Economic Impact:
The pandemic caused significant economic hardship. Many businesses reported difficulties in paying rent and salaries. However, some entrepreneurs found new opportunities by pivoting to essential services or e-commerce platforms. The business model changes required creativity and resilience.

Conclusion:
This study demonstrates the severe impact of COVID-19 on small businesses. Entrepreneurs who adapted quickly by embracing digital channels and diversifying their offerings had better survival rates. Policymakers should provide targeted support to help businesses recover and build resilience against future crises.

Recommendations:
1. Government should provide financial assistance programs
2. Business training on digital transformation
3. Access to affordable loans and grants
4. Support for supply chain development
5. Policies to encourage entrepreneurship
`;

  try {
    console.log('📊 Running plagiarism check...\n');

    const report = await checkProjectPlagiarism(testTitle, testAbstract, testFullText, '507f1f77bcf86cd799439011');

    console.log('\n' + '='.repeat(70));
    console.log('✅ PLAGIARISM CHECK COMPLETED\n');

    console.log('📈 OVERALL RESULTS:');
    console.log(`   Plagiarism Score: ${report.overallScore}%`);
    console.log(`   Status: ${report.status}`)
    console.log(`   Verdict: ${report.verdict}\n`);

    console.log('🌐 WEB SOURCE DETECTION:');
    console.log(`   Total sources found: ${report.webSources ? report.webSources.length : 0}`);

    if (report.webSources && report.webSources.length > 0) {
      console.log('\n   📍 Potential Sources:');
      report.webSources.forEach((source, i) => {
        console.log(`\n      Source ${i + 1}:`)
        console.log(`         Type: ${source.sourceType}`);
        console.log(`         Likelihood: ${source.likelihood}%`);
        console.log(`         Reason: ${source.reason}`);
      });
    }

    console.log('\n' + '='.repeat(70));

    // Check if tech patterns were incorrectly flagged
    const hasTechPatterns = report.webSources?.some(s =>
      s.sourceType === 'MERN Stack' ||
      s.sourceType === 'Tutorial' ||
      s.reason.includes('React') ||
      s.reason.includes('Firebase') ||
      s.reason.includes('Node')
    );

    if (hasTechPatterns) {
      console.log('❌ FAILED: Tech patterns found in non-tech project!');
      console.log('   This COVID-19 business project should NOT have tech references.\n');
    } else {
      console.log('✅ SUCCESS: No tech patterns found in business project!');
      console.log('   The domain detection is working correctly.\n');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

testCovidBusinessProject();
