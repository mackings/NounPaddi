const { GoogleGenerativeAI } = require('@google/generative-ai');
const ProjectSubmission = require('../models/ProjectSubmission');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Comprehensive plagiarism check for academic projects with web search
 * @param {string} title - Project title
 * @param {string} abstract - Project abstract
 * @param {string} fullText - Full project text
 * @param {string} studentId - Student ID submitting the project
 * @returns {Promise<Object>} - Detailed plagiarism report
 */
async function checkProjectPlagiarism(title, abstract, fullText, studentId) {
  try {
    console.log('Starting comprehensive plagiarism check...');

    // Step 1: Check against existing projects in database
    const databaseCheck = await checkAgainstDatabase(fullText, studentId);

    // Step 2: Use Gemini to analyze originality and web presence
    const geminiAnalysis = await analyzeWithGemini(title, abstract, fullText);

    // Step 3: Extract key phrases and simulate web search analysis
    const webSearchAnalysis = await analyzeWebPresence(title, abstract, fullText);

    // Step 4: Calculate overall plagiarism score
    const overallScore = calculateOverallScore(databaseCheck, geminiAnalysis, webSearchAnalysis);

    // Step 5: Determine final verdict
    const verdict = determinePlagiarismVerdict(overallScore, databaseCheck, geminiAnalysis, webSearchAnalysis);

    return {
      overallScore,
      status: verdict.status,
      verdict: verdict.message,
      detailedAnalysis: verdict.detailedAnalysis,
      databaseMatches: databaseCheck.matches,
      webSources: webSearchAnalysis.suspiciousSources,
      geminiInsights: geminiAnalysis,
      recommendations: verdict.recommendations,
      checkedAt: new Date(),
    };
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
    // Get all previously submitted projects (excluding current student's drafts)
    const existingProjects = await ProjectSubmission.find({
      studentId: { $ne: currentStudentId },
      submissionStatus: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
    }).select('title fullText studentId plagiarismReport').populate('studentId', 'name');

    if (existingProjects.length === 0) {
      return { matches: [], highestSimilarity: 0 };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const matches = [];

    // Compare with up to 10 most recent projects (to avoid rate limits)
    const projectsToCheck = existingProjects.slice(0, 10);

    for (const project of projectsToCheck) {
      const prompt = `Compare these two academic projects and calculate similarity percentage (0-100%).

**PROJECT 1 (New Submission):**
${fullText.substring(0, 3000)}

**PROJECT 2 (Existing Project: "${project.title}"):**
${project.fullText.substring(0, 3000)}

IMPORTANT: Be STRICT. Consider:
- Exact text matches
- Paraphrased content
- Similar methodology
- Identical code snippets
- Same data/results

Respond with ONLY this JSON format:
{
  "similarityScore": <0-100>,
  "matchedSections": ["section1", "section2"],
  "analysis": "brief explanation"
}`;

      try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const comparison = JSON.parse(jsonMatch[0]);

          if (comparison.similarityScore >= 30) { // Report similarities above 30%
            matches.push({
              projectId: project._id,
              projectTitle: project.title,
              studentName: project.studentId?.name || 'Unknown',
              similarity: comparison.similarityScore,
              matchedSections: comparison.matchedSections,
              analysis: comparison.analysis,
            });
          }
        }
      } catch (err) {
        console.error(`Error comparing with project ${project._id}:`, err);
      }
    }

    // Sort by similarity (highest first)
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
 * Analyze project originality using Gemini AI
 */
async function analyzeWithGemini(title, abstract, fullText) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a strict academic plagiarism detector. Analyze this final year project for originality, potential plagiarism indicators, AND AI-generated content.

**PROJECT TITLE:** ${title}

**ABSTRACT:** ${abstract}

**FULL TEXT (First 4000 chars):**
${fullText.substring(0, 4000)}

Perform a STRICT analysis checking for:
1. **Generic/Common Content**: Is this topic/approach widely published?
2. **Writing Style Consistency**: Does writing style change suspiciously?
3. **Citation Patterns**: Missing citations for complex concepts?
4. **Technical Depth**: Does it show genuine understanding or just copy-paste?
5. **Originality Markers**: Unique insights, methodology, or perspective?
6. **AI-Generated Content Detection**:
   - Repetitive sentence structures common in AI writing
   - Overly formal or generic language typical of AI
   - Lack of personal experiences or specific examples
   - Perfect grammar but lacking human imperfections
   - Generic transitions and conclusions
   - Absence of genuine critical thinking or personal insights
7. **Red Flags**:
   - Sudden vocabulary changes
   - Inconsistent formatting
   - Overly perfect language for student level
   - Common textbook examples without attribution
   - AI-like writing patterns

**Be STRICT**: Academic integrity requires high standards.

Respond in this EXACT JSON format:
{
  "originalityScore": <0-100>,
  "verdict": "ORIGINAL|SUSPICIOUS|LIKELY_PLAGIARIZED",
  "aiGeneratedLikelihood": <0-100>,
  "aiDetectionVerdict": "HUMAN_WRITTEN|LIKELY_AI_ASSISTED|LIKELY_AI_GENERATED",
  "aiIndicators": ["indicator1", "indicator2", ...],
  "redFlags": ["flag1", "flag2", ...],
  "strengths": ["strength1", "strength2", ...],
  "suspiciousPatterns": ["pattern1", "pattern2", ...],
  "citationIssues": "description of citation problems if any",
  "detailedAnalysis": "comprehensive explanation including AI detection findings",
  "confidence": <0-100>
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse Gemini analysis');
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return {
      originalityScore: 50,
      verdict: 'SUSPICIOUS',
      redFlags: ['Analysis failed - manual review required'],
      detailedAnalysis: 'Automated analysis encountered an error. Manual review recommended.',
      confidence: 0,
    };
  }
}

/**
 * Analyze web presence and common sources
 */
async function analyzeWebPresence(title, abstract, fullText) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are an expert at detecting plagiarism from web sources. Analyze if this project content appears to be from common online sources.

**PROJECT TITLE:** ${title}

**ABSTRACT:** ${abstract}

**SAMPLE TEXT:**
${fullText.substring(0, 2000)}

Based on your knowledge, identify:
1. Does this content match known online tutorials, documentation, or repositories?
2. Are there phrases commonly found in GitHub projects, StackOverflow, or academic papers?
3. Does the title/topic match common online project examples?
4. Technical patterns that suggest copying from specific sources (e.g., exact code structure from tutorials)
5. Provide likely source URLs if you recognize specific content patterns

**Be STRICT**: Flag any content that seems too generic or matches common online patterns.

Respond in this EXACT JSON format:
{
  "webPlagiarismScore": <0-100>,
  "suspiciousSources": [
    {
      "sourceType": "GitHub|Tutorial|Documentation|Academic Paper|Blog|StackOverflow",
      "likelihood": <0-100>,
      "reason": "why this source is suspected",
      "indicators": ["indicator1", "indicator2"],
      "possibleUrls": ["https://example.com if you recognize the pattern"]
    }
  ],
  "commonPatterns": ["pattern1", "pattern2"],
  "verdict": "LIKELY_ORIGINAL|POSSIBLY_COPIED|LIKELY_COPIED",
  "analysis": "detailed explanation"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse web presence analysis');
  } catch (error) {
    console.error('Web presence analysis error:', error);
    return {
      webPlagiarismScore: 50,
      suspiciousSources: [],
      verdict: 'POSSIBLY_COPIED',
      analysis: 'Analysis incomplete - manual review recommended',
    };
  }
}

/**
 * Calculate overall plagiarism score from all checks
 */
function calculateOverallScore(databaseCheck, geminiAnalysis, webSearchAnalysis) {
  // Weighted average of different scores
  const weights = {
    database: 0.4,      // 40% weight - direct matches are serious
    gemini: 0.35,       // 35% weight - AI analysis
    webSearch: 0.25,    // 25% weight - web presence
  };

  const databaseScore = databaseCheck.highestSimilarity || 0;
  const geminiScore = 100 - (geminiAnalysis.originalityScore || 50);
  const webScore = webSearchAnalysis.webPlagiarismScore || 0;

  const overallScore = Math.round(
    (databaseScore * weights.database) +
    (geminiScore * weights.gemini) +
    (webScore * weights.webSearch)
  );

  return Math.min(100, Math.max(0, overallScore));
}

/**
 * Determine final verdict with strict thresholds
 */
function determinePlagiarismVerdict(overallScore, databaseCheck, geminiAnalysis, webSearchAnalysis) {
  let status, message, detailedAnalysis, recommendations;

  // STRICT THRESHOLDS
  if (overallScore >= 70) {
    status = 'PLAGIARIZED';
    message = 'SEVERE PLAGIARISM DETECTED - Project Rejected';
    detailedAnalysis = `This project has been flagged for severe plagiarism with an overall score of ${overallScore}%. ` +
      `${databaseCheck.matches.length > 0 ? `Found ${databaseCheck.matches.length} similar existing project(s). ` : ''}` +
      `${geminiAnalysis.redFlags?.length > 0 ? `AI detected ${geminiAnalysis.redFlags.length} red flags. ` : ''}` +
      `This submission cannot be accepted.`;
    recommendations = [
      'Submit completely original work',
      'Properly cite all sources',
      'Rewrite content in your own words',
      'Consult with supervisor before resubmission'
    ];
  } else if (overallScore >= 45) {
    status = 'SUSPICIOUS';
    message = 'SUSPICIOUS - Requires Manual Review';
    detailedAnalysis = `This project shows concerning similarity patterns (${overallScore}%). ` +
      `${databaseCheck.matches.length > 0 ? `Similar to ${databaseCheck.matches.length} existing project(s). ` : ''}` +
      `${geminiAnalysis.suspiciousPatterns?.length > 0 ? `Suspicious patterns detected. ` : ''}` +
      `Manual review by supervisor required before approval.`;
    recommendations = [
      'Review and revise flagged sections',
      'Add proper citations where missing',
      'Explain similar content to reviewer',
      'Provide evidence of original work'
    ];
  } else if (overallScore >= 25) {
    status = 'SUSPICIOUS';
    message = 'MODERATE CONCERNS - Proceed with Caution';
    detailedAnalysis = `Some similarities detected (${overallScore}%). ` +
      `While not conclusive, this requires attention. ` +
      `${webSearchAnalysis.commonPatterns?.length > 0 ? 'Contains common patterns found online. ' : ''}` +
      `Review recommended before final submission.`;
    recommendations = [
      'Review citation formatting',
      'Ensure all quotes are attributed',
      'Add more original analysis',
      'Consider supervisor consultation'
    ];
  } else {
    status = 'ORIGINAL';
    message = 'ORIGINAL WORK - Passed Plagiarism Check';
    detailedAnalysis = `This project appears to be original work (${overallScore}% similarity score). ` +
      `${geminiAnalysis.strengths?.length > 0 ? `Strengths identified: ${geminiAnalysis.strengths.join(', ')}. ` : ''}` +
      `Approved for submission pending final review.`;
    recommendations = [
      'Proceed with submission',
      'Double-check citation formatting',
      'Maintain academic integrity',
      'Keep documentation of your work process'
    ];
  }

  return {
    status,
    message,
    detailedAnalysis,
    recommendations,
  };
}

module.exports = {
  checkProjectPlagiarism,
  analyzeWithGemini,
  analyzeWebPresence,
};
