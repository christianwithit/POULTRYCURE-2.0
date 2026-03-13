// Test script based on troubleshooting suggestions
require('dotenv').config();

async function testGeminiConnection() {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  
  console.log('🔍 Debugging Gemini API Connection');
  console.log('================================');
  
  // Issue 1: Check API Key Loading
  console.log('\n1. API Key Check:');
  console.log('API Key loaded:', apiKey ? 'YES' : 'NO');
  console.log('First 10 chars:', apiKey?.substring(0, 10));
  
  if (!apiKey) {
    console.log('❌ API key not found in environment variables');
    console.log('Check:');
    console.log('- .env file exists in project root');
    console.log('- No spaces around = in EXPO_PUBLIC_GEMINI_API_KEY=...');
    console.log('- Restart Expo with: npx expo start -c');
    return;
  }
  
  // Issue 4: Test REST API v1 endpoint
  console.log('\n2. Testing REST API v1 endpoint:');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello, respond with just "API Working"'
            }]
          }]
        }),
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ API Connection successful!');
      console.log('Response text:', data.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log('❌ API Error:', data.error);
      
      // Issue 3: Check for common API key issues
      if (response.status === 403) {
        console.log('\n🔧 API Key Issues:');
        console.log('- Verify key at: https://aistudio.google.com/app/apikey');
        console.log('- Check if key is still active');
        console.log('- Try regenerating a new key');
        console.log('- Make sure you copied the entire key (starts with AIza)');
      }
      
      // Issue 5: Regional availability
      if (response.status === 404 || data.error?.message?.includes('not available')) {
        console.log('\n🌍 Regional Availability Issue:');
        console.log('Gemini API might not be available in your region');
        console.log('Try using a VPN or check Google AI Studio availability');
      }
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Issue 2: Network/CORS errors
    console.log('\n🔧 Network Error Details:');
    console.log('Full error:', JSON.stringify(error, null, 2));
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    
    if (error.message.includes('fetch')) {
      console.log('\nPossible causes:');
      console.log('- Network connectivity issues');
      console.log('- Firewall blocking requests');
      console.log('- CORS issues (try from Node.js instead of browser)');
    }
  }
}

// Also test with curl command equivalent
async function testWithCurl() {
  console.log('\n3. Testing with curl equivalent:');
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  
  console.log('Run this curl command to test manually:');
  console.log(`curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}" \\`);
  console.log(`  -H 'Content-Type: application/json' \\`);
  console.log(`  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'`);
}

testGeminiConnection().then(() => {
  testWithCurl();
});