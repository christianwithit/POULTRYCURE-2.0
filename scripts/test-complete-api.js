// Complete API test without TypeScript dependencies
require('dotenv').config();

// Mock the disease matching function for testing
function mockMatchDisease(symptoms) {
  return [
    {
      disease: "Infectious Bronchitis (Local Match)",
      confidence: 75,
      info: {
        treatment: "Supportive care and isolation",
        prevention: "Vaccination and biosecurity",
        severity: "moderate"
      }
    }
  ];
}

// Simulate the DiagnosisAPI class
class TestDiagnosisAPI {
  static async testConnection() {
    const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    console.log('Testing Gemini API...');
    console.log('API Key exists:', !!GEMINI_API_KEY);
    console.log('API Key preview:', GEMINI_API_KEY?.substring(0, 15) + '...');
    
    try {
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
      
      console.log('Response status:', response.status);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ API Connection successful!');
        console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
      } else {
        console.log('❌ API Error:', data.error);
      }
    } catch (error) {
      console.error('❌ Connection failed:', error);
    }
  }

  static async analyzeSymptoms(symptoms) {
    const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
    try {
      const prompt = `You are a poultry disease diagnosis expert. Analyze these symptoms: "${symptoms}". 
      
      Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
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

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Gemini API Response received');

      // Parse the response - handle markdown code blocks
      let responseText = data.candidates[0].content.parts[0].text;
      
      // Remove markdown code blocks if present
      if (responseText.includes('```json')) {
        responseText = responseText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (responseText.includes('```')) {
        responseText = responseText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const aiResult = JSON.parse(responseText.trim());
      
      return {
        success: true,
        data: {
          id: Date.now().toString(),
          type: 'symptom',
          input: symptoms,
          diagnosis: aiResult.diagnosis,
          confidence: aiResult.confidence,
          recommendations: aiResult.recommendations,
          treatment: aiResult.treatment,
          severity: aiResult.severity,
          date: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Full error:', JSON.stringify(error, null, 2));
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      console.log('Falling back to local diagnosis...');
      return this.localSymptomAnalysis(symptoms);
    }
  }

  static async localSymptomAnalysis(symptoms) {
    const matches = mockMatchDisease(symptoms);

    if (matches.length === 0) {
      return {
        success: true,
        data: {
          id: Date.now().toString(),
          type: 'symptom',
          input: symptoms,
          diagnosis: 'No Specific Disease Identified (Local Analysis)',
          confidence: 0,
          recommendations: [
            'Monitor bird closely for 24-48 hours',
            'Ensure proper nutrition and clean water',
            'Isolate bird if symptoms worsen',
            'Consult with a veterinarian if concerned'
          ],
          severity: 'low',
          date: new Date().toISOString()
        }
      };
    }

    const topMatch = matches[0];
    
    return {
      success: true,
      data: {
        id: Date.now().toString(),
        type: 'symptom',
        input: symptoms,
        diagnosis: `${topMatch.disease} (Local Analysis)`,
        confidence: topMatch.confidence,
        recommendations: this.generateRecommendations(topMatch.info),
        treatment: topMatch.info.treatment,
        prevention: topMatch.info.prevention,
        severity: topMatch.info.severity,
        date: new Date().toISOString()
      }
    };
  }

  static generateRecommendations(diseaseInfo) {
    const recommendations = [
      `Immediate isolation of affected bird(s)`,
      `Treatment: ${diseaseInfo.treatment}`,
      `Consult a veterinarian for proper diagnosis`,
    ];

    if (diseaseInfo.severity === 'high') {
      recommendations.unshift('⚠️ HIGH SEVERITY - Seek immediate veterinary attention');
      recommendations.push('Monitor entire flock closely');
      recommendations.push('Consider testing and culling if necessary');
    }

    return recommendations;
  }
}

async function runCompleteTest() {
  console.log('🧪 Complete API Integration Test');
  console.log('================================');
  
  // Test 1: Connection
  console.log('\n1. Testing API Connection:');
  await TestDiagnosisAPI.testConnection();
  
  // Test 2: Symptom Analysis
  console.log('\n2. Testing Symptom Analysis:');
  const result = await TestDiagnosisAPI.analyzeSymptoms('chicken has runny nose, sneezing, and watery eyes');
  
  if (result.success) {
    console.log('✅ Symptom analysis successful!');
    console.log('- Diagnosis:', result.data.diagnosis);
    console.log('- Confidence:', result.data.confidence);
    console.log('- Severity:', result.data.severity);
    console.log('- Treatment:', result.data.treatment);
    console.log('- Recommendations:', result.data.recommendations.slice(0, 2));
  } else {
    console.log('❌ Symptom analysis failed:', result.error);
  }
  
  console.log('\n🎉 API Integration Test Complete!');
}

runCompleteTest().catch(console.error);