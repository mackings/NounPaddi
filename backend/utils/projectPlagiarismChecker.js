const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const ProjectSubmission = require('../models/ProjectSubmission');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const finalReport = {
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

    console.log('Final Plagiarism Report:', JSON.stringify({
      overallScore: finalReport.overallScore,
      status: finalReport.status,
      hasGeminiInsights: !!finalReport.geminiInsights,
      geminiInsightsKeys: finalReport.geminiInsights ? Object.keys(finalReport.geminiInsights) : [],
      hasWebSources: !!finalReport.webSources,
      webSourcesCount: finalReport.webSources?.length || 0,
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
 * Analyze project originality using OpenAI GPT-4 for STRICT plagiarism detection
 */
async function analyzeWithGemini(title, abstract, fullText) {
  try {
    const prompt = `You are an EXTREMELY STRICT academic plagiarism detector with ZERO TOLERANCE for any form of academic dishonesty. Analyze this final year project with MAXIMUM STRICTNESS for originality, potential plagiarism indicators, AND AI-generated content.

**PROJECT TITLE:** ${title}

**ABSTRACT:** ${abstract}

**FULL TEXT (First 6000 chars):**
${fullText.substring(0, 6000)}

Perform an ULTRA-STRICT analysis. Flag ANYTHING suspicious. Check for:

1. **Generic/Common Content**: (BE STRICT)
   - Is this topic done to death online?
   - Does it follow common tutorial structures?
   - Generic examples that appear in textbooks/online courses?
   - Lack of novel approach or unique perspective?

2. **Writing Style RED FLAGS**: (BE EXTREMELY CRITICAL)
   - ANY sudden changes in vocabulary sophistication
   - Inconsistent writing quality between sections
   - Sections that sound too professional vs student-level
   - Different formatting or citation styles

3. **Citation Issues**: (ZERO TOLERANCE)
   - Missing citations for ANY complex concepts
   - Technical explanations without proper attribution
   - Code snippets without source references
   - Methodology copied from papers without citation

4. **AI-Generated Content Detection**: (MAXIMUM SENSITIVITY)
   - Repetitive sentence structures (AI hallmark)
   - Overly formal, robotic language patterns
   - Generic filler phrases like "In today's world", "It is important to note"
   - Perfect grammar with no natural human imperfections
   - Lack of personal examples, anecdotes, or struggles
   - Generic conclusions that could apply to any topic
   - Obvious AI transitions and connectors
   - Surface-level analysis without deep insight
   - Hallucination indicators (made-up statistics, fake references)

5. **Plagiarism Indicators**: (BE HARSH)
   - Common code patterns from GitHub/StackOverflow
   - Tutorial-like step-by-step explanations
   - Boilerplate implementations
   - Exact matches to common project templates
   - Suspiciously similar to online documentation

6. **Technical Depth**: (QUESTION EVERYTHING)
   - Does the student REALLY understand this?
   - Is there evidence of actual implementation?
   - Are there personal debugging stories or challenges?
   - Does it show trial-and-error learning?

**SCORING INSTRUCTIONS - BE HARSH:**
- originalityScore: 0-20 for obvious copies, 21-40 for heavy AI use, 41-60 for suspicious, 61-80 for some originality, 81-100 for truly original (rare)
- aiGeneratedLikelihood: 0-30 is human, 31-60 is AI-assisted, 61-100 is mostly/fully AI
- Flag EVERYTHING suspicious. It's better to false-positive than miss plagiarism.

Respond in this EXACT JSON format (NO MARKDOWN, JUST JSON):
{
  "originalityScore": <0-100>,
  "verdict": "ORIGINAL|SUSPICIOUS|LIKELY_PLAGIARIZED",
  "aiGeneratedLikelihood": <0-100>,
  "aiDetectionVerdict": "HUMAN_WRITTEN|LIKELY_AI_ASSISTED|LIKELY_AI_GENERATED",
  "aiIndicators": ["specific AI writing pattern found", "another AI indicator", ...],
  "redFlags": ["specific plagiarism red flag", "another concern", ...],
  "strengths": ["any genuine originality found (be stingy)", ...],
  "suspiciousPatterns": ["pattern1", "pattern2", ...],
  "citationIssues": "detailed description of all citation problems",
  "detailedAnalysis": "comprehensive harsh critique including all concerns",
  "confidence": <0-100>
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an EXTREMELY STRICT academic plagiarism detector. Be harsh and flag everything suspicious. Academic integrity is paramount.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, stricter analysis
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0].message.content;
    console.log('OpenAI GPT-4 Analysis Raw Response:', response);

    const parsedData = JSON.parse(response);
    console.log('OpenAI GPT-4 Analysis Parsed Data:', JSON.stringify(parsedData, null, 2));
    return parsedData;
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
 * Analyze web presence and common sources using OpenAI GPT-4
 */
async function analyzeWebPresence(title, abstract, fullText) {
  try {
    const prompt = `You are an expert at detecting plagiarism from web sources with MAXIMUM STRICTNESS. Analyze if this project appears copied from online sources.

**PROJECT TITLE:** ${title}

**ABSTRACT:** ${abstract}

**SAMPLE TEXT:**
${fullText.substring(0, 3000)}

BE EXTREMELY STRICT. Check for:

1. **GitHub Repository Patterns**:
   - Common README structures
   - Boilerplate project setups
   - Tutorial-style implementations
   - Popular framework examples
   - Provide specific GitHub repos if you recognize the pattern

2. **Tutorial/Course Content**:
   - Udemy, Coursera, YouTube tutorial patterns
   - FreeCodeCamp, W3Schools examples
   - Step-by-step tutorial language
   - Common beginner project structures
   - Provide tutorial URLs if recognizable

3. **Documentation Copies**:
   - Official framework documentation examples
   - Library quick-start guides
   - API documentation samples
   - Provide documentation URLs

4. **StackOverflow/Forums**:
   - Common solution patterns
   - Popular answered questions
   - Code snippets from top answers

5. **Academic Sources**:
   - Research paper methodologies
   - Common thesis structures
   - Published project implementations

6. **Blog/Medium Articles**:
   - Technical blog post patterns
   - Tutorial series content

**PROVIDE SPECIFIC URLs** when you recognize content patterns. Be generous with URL suggestions.

**SCORING - BE HARSH:**
- webPlagiarismScore: 0-30 unlikely copied, 31-60 possibly copied, 61-100 likely copied
- For EACH suspicious source, provide likelihood 0-100

Respond in this EXACT JSON format (NO MARKDOWN, JUST JSON):
{
  "webPlagiarismScore": <0-100>,
  "suspiciousSources": [
    {
      "sourceType": "GitHub|Tutorial|Documentation|Academic Paper|Blog|StackOverflow|YouTube|Course",
      "likelihood": <0-100>,
      "reason": "specific reason why this source is suspected",
      "indicators": ["specific indicator 1", "specific indicator 2"],
      "possibleUrls": ["https://specific-url-1.com", "https://specific-url-2.com"]
    }
  ],
  "commonPatterns": ["specific pattern 1", "specific pattern 2"],
  "verdict": "LIKELY_ORIGINAL|POSSIBLY_COPIED|LIKELY_COPIED",
  "analysis": "detailed harsh explanation of all concerns"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at detecting web plagiarism. Be strict and provide specific URLs when you recognize content patterns. Flag everything suspicious.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0].message.content;
    console.log('OpenAI Web Presence Analysis Raw Response:', response);

    const parsedData = JSON.parse(response);
    console.log('OpenAI Web Presence Analysis Parsed Data:', JSON.stringify(parsedData, null, 2));
    return parsedData;
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
