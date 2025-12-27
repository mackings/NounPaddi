const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log('API Key loaded:', API_KEY ? 'Yes (length: ' + API_KEY.length + ')' : 'No');
console.log('');

async function listModels() {
  try {
    console.log('Fetching available models from Google AI API...\n');

    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );

    console.log('Available models:');
    console.log('='.repeat(80));

    const models = response.data.models;

    if (!models || models.length === 0) {
      console.log('No models found!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return;
    }

    models.forEach(model => {
      console.log(`\nModel: ${model.name}`);
      console.log(`  Display Name: ${model.displayName || 'N/A'}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log(`  Description: ${model.description || 'N/A'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\nTotal models found: ${models.length}`);

    // Filter models that support generateContent
    const contentGenerationModels = models.filter(m =>
      m.supportedGenerationMethods?.includes('generateContent')
    );

    console.log('\n✓ Models supporting generateContent:');
    contentGenerationModels.forEach(model => {
      // Extract just the model name from the full path (e.g., "models/gemini-pro" -> "gemini-pro")
      const shortName = model.name.replace('models/', '');
      console.log(`  - ${shortName}`);
    });

    if (contentGenerationModels.length > 0) {
      const recommendedModel = contentGenerationModels[0].name.replace('models/', '');
      console.log(`\n💡 Recommended model to use: "${recommendedModel}"`);
    }

  } catch (error) {
    console.error('Error listing models:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

listModels();
