// List available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    console.log('🔍 Checking available Gemini models...');
    
    // Get API key from environment
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ No API key found');
      return;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // List available models
    const models = await genAI.listModels();
    
    console.log('✅ Available models:');
    models.forEach(model => {
      console.log(`  - ${model.name}`);
      console.log(`    Display Name: ${model.displayName}`);
      console.log(`    Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
  }
}

// Load environment variables
require('dotenv').config();

listModels();