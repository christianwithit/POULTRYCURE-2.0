// Simple Gemini API test with different model names
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testModels() {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelsToTry = [
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro',
    'models/gemini-pro',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-pro-latest'
  ];
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`\n🧪 Testing model: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello");
      
      console.log(`✅ SUCCESS with ${modelName}`);
      console.log('Response:', result.response.text());
      break; // Stop on first success
      
    } catch (error) {
      console.log(`❌ Failed with ${modelName}: ${error.message.split('\n')[0]}`);
    }
  }
}

testModels();