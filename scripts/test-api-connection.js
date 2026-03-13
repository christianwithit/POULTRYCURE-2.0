// Test Gemini API connection
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing Gemini API connection...');
    
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not found in environment variables');
    }
    
    console.log('API Key found:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    console.log('Sending test request...');
    
    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ text: "Hello, can you respond with just 'API connection successful'?" }] 
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 20,
        responseMimeType: "text/plain",
      }
    });
    
    const response = result.response;
    console.log('✅ API Connection successful!');
    console.log('Response:', response.text());
    
    return true;
  } catch (error) {
    console.error('❌ API Connection failed:', error.message);
    return false;
  }
}

testConnection();