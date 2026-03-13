// Test the updated DiagnosisAPI service
require('dotenv').config();

// Import the DiagnosisAPI (we'll need to simulate the import)
async function testDiagnosisService() {
  console.log('🧪 Testing DiagnosisAPI Service');
  console.log('===============================');
  
  // Test the testConnection method
  console.log('\n1. Testing API connection...');
  try {
    // Simulate the testConnection method
    const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }]
        }),
      }
    );
    
    if (response.ok) {
      console.log('✅ API Connection successful!');
    } else {
      console.log('❌ API Connection failed');
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
  
  // Test symptom analysis
  console.log('\n2. Testing symptom analysis...');
  try {
    const symptoms = "chicken has runny nose, sneezing, and watery eyes";
    const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
    const prompt = `You are a poultry disease diagnosis expert. Analyze these symptoms: "${symptoms}". 
    
    Respond with JSON in this format:
    {
      "diagnosis": "Disease name",
      "confidence": 85,
      "recommendations": ["recommendation 1", "recommendation 2"],
      "treatment": "treatment details",
      "severity": "low|moderate|high"
    }`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const aiResult = JSON.parse(data.candidates[0].content.parts[0].text);
      
      console.log('✅ Symptom analysis successful!');
      console.log('Diagnosis:', aiResult.diagnosis);
      console.log('Confidence:', aiResult.confidence);
      console.log('Severity:', aiResult.severity);
      console.log('Recommendations:', aiResult.recommendations.slice(0, 2)); // Show first 2
      
    } else {
      console.log('❌ Symptom analysis failed');
    }
    
  } catch (error) {
    console.error('❌ Symptom analysis error:', error.message);
  }
}

testDiagnosisService();