// Test JSON parsing with markdown handling
require('dotenv').config();

async function testJSONParsing() {
  console.log('🧪 Testing JSON Parsing');
  console.log('=======================');
  
  const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const symptoms = "chicken has runny nose, sneezing, and watery eyes";
  
  const prompt = `You are a poultry disease diagnosis expert. Analyze these symptoms: "${symptoms}". 
  
  Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
  {
    "diagnosis": "Disease name",
    "confidence": 85,
    "recommendations": ["recommendation 1", "recommendation 2"],
    "treatment": "treatment details",
    "severity": "low|moderate|high"
  }`;

  try {
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
      let responseText = data.candidates[0].content.parts[0].text;
      
      console.log('Raw response:');
      console.log(responseText);
      console.log('\n' + '='.repeat(50));
      
      // Handle markdown code blocks
      if (responseText.includes('```json')) {
        responseText = responseText.replace(/```json\s*/, '').replace(/```\s*$/, '');
        console.log('Removed ```json blocks');
      } else if (responseText.includes('```')) {
        responseText = responseText.replace(/```\s*/, '').replace(/```\s*$/, '');
        console.log('Removed ``` blocks');
      }
      
      console.log('\nCleaned response:');
      console.log(responseText.trim());
      console.log('\n' + '='.repeat(50));
      
      try {
        const aiResult = JSON.parse(responseText.trim());
        console.log('\n✅ JSON parsing successful!');
        console.log('Parsed result:');
        console.log('- Diagnosis:', aiResult.diagnosis);
        console.log('- Confidence:', aiResult.confidence);
        console.log('- Severity:', aiResult.severity);
        console.log('- Recommendations count:', aiResult.recommendations?.length);
        
      } catch (parseError) {
        console.log('\n❌ JSON parsing failed:', parseError.message);
        console.log('Trying to fix common issues...');
        
        // Try to fix common JSON issues
        let fixedText = responseText.trim();
        
        // Remove any trailing commas
        fixedText = fixedText.replace(/,(\s*[}\]])/g, '$1');
        
        // Try parsing again
        try {
          const aiResult = JSON.parse(fixedText);
          console.log('✅ Fixed and parsed successfully!');
          console.log('Result:', aiResult);
        } catch (secondError) {
          console.log('❌ Still failed after fixes:', secondError.message);
        }
      }
      
    } else {
      console.log('❌ API request failed');
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testJSONParsing();