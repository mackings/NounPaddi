const pdf = require('pdf-parse');

/**
 * Extract text content from PDF buffer
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} - Extracted text and metadata
 */
async function extractTextFromPDF(pdfBuffer) {
  try {
    const data = await pdf(pdfBuffer);

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file. Please ensure it is a valid PDF document.');
  }
}

/**
 * Clean and format extracted PDF text
 * @param {string} text - Raw text from PDF
 * @returns {string} - Cleaned text
 */
function cleanPDFText(text) {
  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, ' ');

  // Remove page numbers and headers/footers (common patterns)
  cleaned = cleaned.replace(/Page \d+ of \d+/gi, '');
  cleaned = cleaned.replace(/^\d+$/gm, ''); // Remove standalone numbers

  // Normalize line breaks
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '\n');

  // Remove excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * Extract sections from project PDF (Introduction, Methodology, etc.)
 * @param {string} text - Full PDF text
 * @returns {Object} - Sections object
 */
function extractProjectSections(text) {
  const sections = {
    title: '',
    abstract: '',
    fullText: text,
  };

  // Try to extract title (usually first line or first few words)
  const lines = text.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);

  if (nonEmptyLines.length > 0) {
    sections.title = nonEmptyLines[0].substring(0, 200); // First line as title
  }

  // Try to find abstract
  const abstractMatch = text.match(/abstract[\s\S]{0,50}([\s\S]{100,1000})(?=introduction|chapter|keywords|$)/i);
  if (abstractMatch) {
    sections.abstract = abstractMatch[1].trim().substring(0, 1000);
  } else {
    // If no abstract found, use first 500 characters as abstract
    sections.abstract = text.substring(0, 500);
  }

  return sections;
}

module.exports = {
  extractTextFromPDF,
  cleanPDFText,
  extractProjectSections,
};
