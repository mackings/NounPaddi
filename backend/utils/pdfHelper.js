const axios = require('axios');
const pdfParse = require('pdf-parse');

// Function to clean extracted text
function cleanExtractedText(text) {
  if (!text) return '';

  let cleaned = text
    // Remove multiple newlines and replace with single space
    .replace(/\n+/g, ' ')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove page numbers (standalone numbers)
    .replace(/\s+\d+\s+/g, ' ')
    // Trim whitespace from start and end
    .trim();

  return cleaned;
}

async function extractTextFromPDF(url) {
  try {
    console.log('Downloading PDF from:', url);

    // Download PDF from Cloudinary URL
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const pdfBuffer = Buffer.from(response.data);
    console.log('PDF downloaded, size:', pdfBuffer.length, 'bytes');

    const data = await pdfParse(pdfBuffer);
    console.log('PDF parsed, raw text length:', data.text.length);

    // Clean the extracted text
    const cleanedText = cleanExtractedText(data.text);
    console.log('Text cleaned, final length:', cleanedText.length);

    return cleanedText;
  } catch (error) {
    console.error('PDF extraction error:', error.message);
    console.error('Error details:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

module.exports = { extractTextFromPDF, cleanExtractedText };
