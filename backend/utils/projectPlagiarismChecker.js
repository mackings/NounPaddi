const { HfInference } = require('@huggingface/inference');
const ProjectSubmission = require('../models/ProjectSubmission');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

/**
 * Comprehensive plagiarism check for academic projects using FREE Hugging Face models
 * @param {string} title - Project title
 * @param {string} abstract - Project abstract
 * @param {string} fullText - Full project text
 * @param {string} studentId - Student ID submitting the project
 * @returns {Promise<Object>} - Detailed plagiarism report
 */
async function checkProjectPlagiarism(title, abstract, fullText, studentId) {
  try {
    console.log('Starting comprehensive plagiarism check with FREE AI...');

    // Step 1: Check against existing projects in database
    const databaseCheck = await checkAgainstDatabase(fullText, studentId);

    // Step 2: Use FREE Hugging Face AI to analyze originality
    const aiAnalysis = await analyzeWithFreeAI(title, abstract, fullText);

    // Step 3: Analyze web presence patterns
    const webSearchAnalysis = await analyzeWebPresence(title, abstract, fullText);

    // Step 4: Calculate overall plagiarism score
    const overallScore = calculateOverallScore(databaseCheck, aiAnalysis, webSearchAnalysis);

    // Step 5: Determine final verdict
    const verdict = determinePlagiarismVerdict(overallScore, databaseCheck, aiAnalysis, webSearchAnalysis);

    const finalReport = {
      overallScore,
      status: verdict.status,
      verdict: verdict.message,
      detailedAnalysis: verdict.detailedAnalysis,
      databaseMatches: databaseCheck.matches,
      webSources: webSearchAnalysis.suspiciousSources,
      geminiInsights: aiAnalysis, // Keep this name for frontend compatibility
      recommendations: verdict.recommendations,
      checkedAt: new Date(),
    };

    console.log('Final Plagiarism Report:', JSON.stringify({
      overallScore: finalReport.overallScore,
      status: finalReport.status,
      hasAiInsights: !!finalReport.geminiInsights,
      aiGeneratedLikelihood: finalReport.geminiInsights?.aiGeneratedLikelihood,
      aiDetectionVerdict: finalReport.geminiInsights?.aiDetectionVerdict,
    }, null, 2));

    return finalReport;
  } catch (error) {
    console.error('Plagiarism check error:', error);
    throw new Error(`Failed to complete plagiarism check: ${error.message}`);
  }
}

/**
 * Check project against existing submissions in database
 */
async function checkAgainstDatabase(fullText, currentStudentId) {
  try {
    const existingProjects = await ProjectSubmission.find({
      studentId: { $ne: currentStudentId },
    }).select('title fullText studentId').limit(50);

    const matches = [];

    // Simple text similarity check
    for (const project of existingProjects) {
      const similarity = calculateTextSimilarity(fullText, project.fullText);

      if (similarity >= 30) {
        matches.push({
          projectId: project._id,
          projectTitle: project.title,
          studentName: project.studentId?.name || 'Unknown',
          similarity: Math.round(similarity),
          matchedSections: ['Content overlap detected'],
          analysis: `${Math.round(similarity)}% textual similarity found`,
        });
      }
    }

    matches.sort((a, b) => b.similarity - a.similarity);

    return {
      matches,
      highestSimilarity: matches.length > 0 ? matches[0].similarity : 0,
    };
  } catch (error) {
    console.error('Database check error:', error);
    return { matches: [], highestSimilarity: 0 };
  }
}

/**
 * Simple text similarity calculator
 */
function calculateTextSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return (intersection.size / union.size) * 100;
}

/**
 * Analyze project using FREE Hugging Face AI
 */
async function analyzeWithFreeAI(title, abstract, fullText) {
  try {
    console.log('Analyzing with FREE Hugging Face AI...');

    const textToAnalyze = `Title: ${title}\n\nAbstract: ${abstract}\n\nContent: ${fullText.substring(0, 3000)}`;

    // Use Hugging Face's free text generation model
    const prompt = `Analyze this academic project for plagiarism and AI-generated content. Be strict.

${textToAnalyze}

Provide a JSON analysis with:
1. originalityScore (0-100): Lower scores mean more plagiarism
2. aiGeneratedLikelihood (0-100): Higher scores mean more AI-generated
3. aiDetectionVerdict: HUMAN_WRITTEN, LIKELY_AI_ASSISTED, or LIKELY_AI_GENERATED
4. aiIndicators: List of AI writing patterns found
5. redFlags: List of plagiarism concerns
6. detailedAnalysis: Comprehensive explanation

Respond with ONLY valid JSON.`;

    try {
      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          return_full_text: false
        }
      });

      console.log('AI Response:', response.generated_text);

      // Try to parse JSON from response
      const jsonMatch = response.generated_text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          originalityScore: parsed.originalityScore || 50,
          verdict: parsed.originalityScore > 70 ? 'ORIGINAL' : parsed.originalityScore > 40 ? 'SUSPICIOUS' : 'LIKELY_PLAGIARIZED',
          aiGeneratedLikelihood: parsed.aiGeneratedLikelihood || 50,
          aiDetectionVerdict: parsed.aiDetectionVerdict || 'LIKELY_AI_ASSISTED',
          aiIndicators: parsed.aiIndicators || ['Generic academic language', 'Formal structure'],
          redFlags: parsed.redFlags || ['Requires manual review'],
          strengths: ['Analysis completed'],
          suspiciousPatterns: [],
          citationIssues: 'Manual citation check recommended',
          detailedAnalysis: parsed.detailedAnalysis || 'AI analysis completed',
          confidence: 70,
        };
      }
    } catch (aiError) {
      console.log('AI model error, using rule-based analysis:', aiError.message);
    }

    // Fallback: Rule-based analysis
    return performRuleBasedAnalysis(title, abstract, fullText);

  } catch (error) {
    console.error('AI analysis error:', error);
    return performRuleBasedAnalysis(title, abstract, fullText);
  }
}

/**
 * Rule-based analysis as fallback (completely free, no API needed)
 */
function performRuleBasedAnalysis(title, abstract, fullText) {
  console.log('Using rule-based plagiarism detection...');

  const text = `${title} ${abstract} ${fullText}`.toLowerCase();

  // AI-generated content indicators
  const aiPhrases = [
    'in today\'s world', 'it is important to note', 'in conclusion',
    'furthermore', 'moreover', 'thus', 'hence', 'therefore',
    'in summary', 'to summarize', 'as mentioned above'
  ];

  const aiIndicators = [];
  let aiPhraseCount = 0;

  aiPhrases.forEach(phrase => {
    const count = (text.match(new RegExp(phrase, 'g')) || []).length;
    if (count > 0) {
      aiPhraseCount += count;
      aiIndicators.push(`Uses generic phrase "${phrase}" ${count} time(s)`);
    }
  });

  // Plagiarism red flags
  const redFlags = [];

  if (text.includes('github') || text.includes('stackoverflow')) {
    redFlags.push('Contains references to code sharing platforms');
  }

  if (!text.includes('citation') && !text.includes('reference')) {
    redFlags.push('Missing proper citations');
  }

  const sentences = text.split(/[.!?]+/);
  if (sentences.length < 10) {
    redFlags.push('Very short content - insufficient for thorough analysis');
  }

  // Calculate scores
  const aiGeneratedLikelihood = Math.min(95, Math.max(20, aiPhraseCount * 10));
  const originalityScore = Math.max(5, 100 - aiGeneratedLikelihood - (redFlags.length * 10));

  return {
    originalityScore,
    verdict: originalityScore > 70 ? 'ORIGINAL' : originalityScore > 40 ? 'SUSPICIOUS' : 'LIKELY_PLAGIARIZED',
    aiGeneratedLikelihood,
    aiDetectionVerdict: aiGeneratedLikelihood > 70 ? 'LIKELY_AI_GENERATED' :
                       aiGeneratedLikelihood > 40 ? 'LIKELY_AI_ASSISTED' : 'HUMAN_WRITTEN',
    aiIndicators,
    redFlags,
    strengths: originalityScore > 60 ? ['Some original content detected'] : [],
    suspiciousPatterns: aiIndicators.slice(0, 3),
    citationIssues: 'Citation analysis requires manual review',
    detailedAnalysis: `Analysis based on ${sentences.length} sentences. Found ${aiPhraseCount} AI-like phrases and ${redFlags.length} concerns.`,
    confidence: 75,
  };
}

/**
 * Analyze web presence (rule-based, completely free)
 */
async function analyzeWebPresence(title, abstract, fullText) {
  try {
    console.log('Analyzing web presence patterns...');

    const suspiciousSources = [];
    const commonPatterns = [];
    const text = `${title} ${abstract} ${fullText}`.toLowerCase();

    // Check for common tutorial patterns
    if (text.includes('react') && text.includes('node') && text.includes('e-commerce')) {
      suspiciousSources.push({
        sourceType: 'Tutorial',
        likelihood: 70,
        reason: 'Common tutorial project pattern detected',
        indicators: ['React + Node.js e-commerce is a popular tutorial topic'],
        possibleUrls: [
          'https://www.youtube.com/results?search_query=react+nodejs+ecommerce+tutorial',
          'https://github.com/search?q=react+nodejs+ecommerce'
        ]
      });
      commonPatterns.push('E-commerce with React and Node.js');
    }

    // Check for generic project patterns
    const genericTopics = {
      'library management': 'https://github.com/search?q=library+management+system',
      'student portal': 'https://github.com/search?q=student+portal',
      'online shopping': 'https://github.com/search?q=online+shopping+system',
      'hospital management': 'https://github.com/search?q=hospital+management',
      'hotel booking': 'https://github.com/search?q=hotel+booking+system'
    };

    Object.keys(genericTopics).forEach(topic => {
      if (text.includes(topic)) {
        suspiciousSources.push({
          sourceType: 'GitHub',
          likelihood: 60,
          reason: `"${topic}" is a common project on GitHub`,
          indicators: [`Generic ${topic} pattern`],
          possibleUrls: [genericTopics[topic]]
        });
        commonPatterns.push(topic);
      }
    });

    const webPlagiarismScore = suspiciousSources.length > 0 ?
      Math.min(80, suspiciousSources.length * 30) : 20;

    return {
      webPlagiarismScore,
      suspiciousSources,
      commonPatterns,
      verdict: webPlagiarismScore > 60 ? 'LIKELY_COPIED' :
              webPlagiarismScore > 35 ? 'POSSIBLY_COPIED' : 'LIKELY_ORIGINAL',
      analysis: `Found ${suspiciousSources.length} potential web source(s). ${commonPatterns.length} common pattern(s) detected.`
    };
  } catch (error) {
    console.error('Web presence analysis error:', error);
    return {
      webPlagiarismScore: 30,
      suspiciousSources: [],
      commonPatterns: [],
      verdict: 'POSSIBLY_COPIED',
      analysis: 'Web analysis completed with limited data'
    };
  }
}

/**
 * Calculate overall plagiarism score
 */
function calculateOverallScore(databaseCheck, aiAnalysis, webSearchAnalysis) {
  const weights = {
    database: 0.4,
    ai: 0.35,
    webSearch: 0.25,
  };

  const databaseScore = databaseCheck.highestSimilarity || 0;
  const aiScore = 100 - (aiAnalysis.originalityScore || 50);
  const webScore = webSearchAnalysis.webPlagiarismScore || 0;

  const overallScore = Math.round(
    (databaseScore * weights.database) +
    (aiScore * weights.ai) +
    (webScore * weights.webSearch)
  );

  return Math.min(100, Math.max(0, overallScore));
}

/**
 * Determine final verdict with strict thresholds
 */
function determinePlagiarismVerdict(overallScore, databaseCheck, aiAnalysis, webSearchAnalysis) {
  let status, message, detailedAnalysis, recommendations;

  if (overallScore >= 70) {
    status = 'PLAGIARIZED';
    message = 'HIGH RISK - Significant plagiarism detected';
    detailedAnalysis = 'This project shows strong indicators of plagiarism or AI-generated content.';
    recommendations = [
      'Requires immediate manual review',
      'Request original work documentation',
      'Consider rejection or resubmission'
    ];
  } else if (overallScore >= 40) {
    status = 'SUSPICIOUS';
    message = 'MODERATE CONCERNS - Proceed with Caution';
    detailedAnalysis = 'This project raises several concerns regarding originality.';
    recommendations = [
      'Manual review recommended',
      'Request additional documentation',
      'Interview student about implementation'
    ];
  } else if (overallScore >= 20) {
    status = 'SUSPICIOUS';
    message = 'LOW CONCERNS - Minor Issues Detected';
    detailedAnalysis = 'Project appears mostly original with minor concerns.';
    recommendations = [
      'Quick manual review advised',
      'Verify citations and references'
    ];
  } else {
    status = 'ORIGINAL';
    message = 'PASSED - Project appears original';
    detailedAnalysis = 'No significant plagiarism detected.';
    recommendations = ['Proceed with standard review process'];
  }

  return { status, message, detailedAnalysis, recommendations };
}

module.exports = { checkProjectPlagiarism };
