// Simple validation script for Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function validateGeminiAPI() {
  try {
    console.log('🔍 Testing Gemini API connection...');
    
    // Get API key from environment
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ No API key found in environment variables');
      return false;
    }
    
    console.log('✅ API key found');
    
    // Initialize client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    console.log('✅ Client initialized');
    
    // Test with simple request
    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: "Hello, respond with just 'OK'" }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10,
          responseMimeType: "text/plain",
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
      )
    ]);
    
    console.log('✅ API call successful!');
    console.log('Response:', result.response.text());
    
    return true;
    
  } catch (error) {
    console.error('❌ API validation failed:', error.message);
    
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('403')) {
      console.error('   → Invalid API key');
    } else if (error.message.includes('Timeout')) {
      console.error('   → Connection timeout');
    } else if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
      console.error('   → API quota exceeded');
    } else {
      console.error('   → Network or other error');
    }
    
    return false;
  }
}

// Load environment variables
require('dotenv').config();

validateGeminiAPI().then(success => {
  if (success) {
    console.log('\n🎉 Gemini API is ready for integration!');
  } else {
    console.log('\n💥 Please check your API key and try again');
  }
  process.exit(success ? 0 : 1);
});