// Quick test with new API key
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function quickTest() {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    console.log('Testing with API key:', apiKey);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent("Say hello");
    console.log('✅ Success!');
    console.log('Response:', result.response.text());
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest();