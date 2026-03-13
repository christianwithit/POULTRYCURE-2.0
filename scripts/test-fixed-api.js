// Test the fixed API with correct model name
require('dotenv').config();

async function testFixedAPI() {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  
  console.log('🧪 Testing Fixed Gemini API');
  console.log('===========================');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello! Please respond with "API is working correctly" to confirm the connection.'
            }]
          }]
        }),
      }
    );
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! API is working');
      console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
      
      // Test with a poultry diagnosis prompt
      console.log('\n🐔 Testing poultry diagnosis...');
      const diagnosisResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a poultry disease diagnosis expert. Analyze these symptoms: "chicken has runny nose, sneezing, and watery eyes". 
                
                Respond with JSON in this format:
                {
                  "diagnosis": "Disease name",
                  "confidence": 85,
                  "recommendations": ["recommendation 1", "recommendation 2"],
                  "treatment": "treatment details",
                  "severity": "low|moderate|high"
                }`
              }]
            }]
          }),
        }
      );
      
      if (diagnosisResponse.ok) {
        const diagnosisData = await diagnosisResponse.json();
        console.log('✅ Diagnosis test successful!');
        console.log('Diagnosis response:', diagnosisData.candidates?.[0]?.content?.parts?.[0]?.text);
      } else {
        console.log('❌ Diagnosis test failed:', await diagnosisResponse.text());
      }
      
    } else {
      const errorData = await response.json();
      console.log('❌ API Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testFixedAPI();