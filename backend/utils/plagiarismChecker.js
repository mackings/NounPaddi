const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Check plagiarism between two texts using Gemini AI
 * @param {string} text1 - First text to compare
 * @param {string} text2 - Second text to compare
 * @returns {Promise<Object>} - Plagiarism analysis results
 */
async function checkPlagiarismBetweenTexts(text1, text2) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a plagiarism detection expert. Compare the following two texts and determine if there is plagiarism.

**TEXT 1:**
${text1}

**TEXT 2:**
${text2}

Analyze the texts and provide:
1. **Plagiarism Score** (0-100%): How similar are these texts?
   - 0-20%: No plagiarism
   - 21-40%: Low similarity (acceptable)
   - 41-60%: Moderate similarity (suspicious)
   - 61-80%: High similarity (likely plagiarism)
   - 81-100%: Very high similarity (definite plagiarism)

2. **Analysis**: Brief explanation of similarities found
3. **Verdict**: "ORIGINAL", "SUSPICIOUS", or "PLAGIARIZED"
4. **Similar Sections**: List any matching or highly similar sections

Respond in this exact JSON format:
{
  "plagiarismScore": <number>,
  "verdict": "<ORIGINAL|SUSPICIOUS|PLAGIARIZED>",
  "analysis": "<detailed explanation>",
  "similarSections": ["<section1>", "<section2>", ...]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse plagiarism check response');
  } catch (error) {
    console.error('Plagiarism check error:', error);
    throw error;
  }
}

/**
 * Check if text is plagiarized from web sources using Gemini
 * @param {string} text - Text to check
 * @returns {Promise<Object>} - Analysis results
 */
async function checkWebPlagiarism(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a plagiarism detection expert. Analyze the following text and determine if it appears to be original or potentially copied from common sources.

**TEXT TO ANALYZE:**
${text}

Based on your knowledge, determine:
1. **Originality Score** (0-100%): How original does this text appear?
2. **Analysis**: Does this text contain common phrases, clichés, or patterns typical of copied content?
3. **Indicators**: List any red flags (generic language, lack of personal voice, overly formal, etc.)
4. **Verdict**: "LIKELY_ORIGINAL", "NEEDS_REVIEW", or "LIKELY_COPIED"

Respond in this exact JSON format:
{
  "originalityScore": <number>,
  "verdict": "<LIKELY_ORIGINAL|NEEDS_REVIEW|LIKELY_COPIED>",
  "analysis": "<detailed explanation>",
  "indicators": ["<indicator1>", "<indicator2>", ...]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse web plagiarism check response');
  } catch (error) {
    console.error('Web plagiarism check error:', error);
    throw error;
  }
}

/**
 * Check student submission against multiple submissions
 * @param {string} studentText - The student's submission
 * @param {Array<Object>} previousSubmissions - Array of {studentId, text} objects
 * @returns {Promise<Object>} - Comprehensive plagiarism report
 */
async function checkAgainstSubmissions(studentText, previousSubmissions) {
  try {
    const matches = [];

    for (const submission of previousSubmissions) {
      const result = await checkPlagiarismBetweenTexts(studentText, submission.text);

      if (result.plagiarismScore >= 41) { // Only report moderate to high matches
        matches.push({
          studentId: submission.studentId,
          studentName: submission.studentName,
          plagiarismScore: result.plagiarismScore,
          verdict: result.verdict,
          analysis: result.analysis,
          similarSections: result.similarSections
        });
      }
    }

    // Sort by plagiarism score (highest first)
    matches.sort((a, b) => b.plagiarismScore - a.plagiarismScore);

    return {
      totalChecked: previousSubmissions.length,
      matchesFound: matches.length,
      highestMatch: matches.length > 0 ? matches[0] : null,
      allMatches: matches,
      overallVerdict: matches.length > 0 && matches[0].plagiarismScore >= 61
        ? 'PLAGIARIZED'
        : matches.length > 0
          ? 'SUSPICIOUS'
          : 'ORIGINAL'
    };
  } catch (error) {
    console.error('Submission comparison error:', error);
    throw error;
  }
}

/**
 * Comprehensive plagiarism check (both database and web)
 * @param {string} text - Text to check
 * @param {Array<Object>} previousSubmissions - Previous submissions to compare against
 * @returns {Promise<Object>} - Complete plagiarism report
 */
async function comprehensivePlagiarismCheck(text, previousSubmissions = []) {
  try {
    const [databaseCheck, webCheck] = await Promise.all([
      previousSubmissions.length > 0
        ? checkAgainstSubmissions(text, previousSubmissions)
        : Promise.resolve({ totalChecked: 0, matchesFound: 0, overallVerdict: 'ORIGINAL' }),
      checkWebPlagiarism(text)
    ]);

    return {
      databaseCheck,
      webCheck,
      finalVerdict: determineFinalVerdict(databaseCheck, webCheck),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Comprehensive plagiarism check error:', error);
    throw error;
  }
}

/**
 * Determine final verdict based on all checks
 */
function determineFinalVerdict(databaseCheck, webCheck) {
  if (databaseCheck.overallVerdict === 'PLAGIARIZED' || webCheck.verdict === 'LIKELY_COPIED') {
    return 'PLAGIARIZED';
  }

  if (databaseCheck.overallVerdict === 'SUSPICIOUS' || webCheck.verdict === 'NEEDS_REVIEW') {
    return 'NEEDS_REVIEW';
  }

  return 'ORIGINAL';
}

module.exports = {
  checkPlagiarismBetweenTexts,
  checkWebPlagiarism,
  checkAgainstSubmissions,
  comprehensivePlagiarismCheck
};
