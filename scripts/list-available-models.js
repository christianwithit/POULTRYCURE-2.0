// List available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  try {
    console.log('Listing available Gemini models...');
    
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not found in environment variables');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // List available models
    const models = await genAI.listModels();
    
    console.log('\n📋 Available models:');
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log('');
    });
    
    // Test with the correct model name
    const correctModel = models.find(m => m.name.includes('gemini-1.5-flash'));
    if (correctModel) {
      console.log(`🎯 Testing with: ${correctModel.name}`);
      
      const model = genAI.getGenerativeModel({ model: correctModel.name });
      const result = await model.generateContent("Hello, respond with 'Connection successful'");
      
      console.log('✅ Test successful!');
      console.log('Response:', result.response.text());
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();