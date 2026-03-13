// Quick test script for Gemini API
const { GeminiClient } = require('../services/gemini-client.ts');

async function testGeminiConnection() {
  try {
    console.log('Testing Gemini API connection...');
    
    const client = new GeminiClient();
    console.log('Client created successfully');
    
    const isValid = await client.validateApiKey();
    console.log('API Key validation result:', isValid);
    
    if (isValid) {
      console.log('✅ Gemini API is ready to use!');
    } else {
      console.log('❌ API key validation failed');
    }
    
  } catch (error) {
    console.error('❌ Error testing Gemini API:', error.message);
  }
}

testGeminiConnection();