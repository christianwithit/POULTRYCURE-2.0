// List available models to find the correct model name
require('dotenv').config();

async function listAvailableModels() {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  
  console.log('🔍 Listing Available Gemini Models');
  console.log('==================================');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Available models:');
      
      if (data.models) {
        data.models.forEach((model, index) => {
          console.log(`${index + 1}. ${model.name}`);
          console.log(`   Display Name: ${model.displayName}`);
          console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
          console.log('');
        });
        
        // Find models that support generateContent
        const contentModels = data.models.filter(model => 
          model.supportedGenerationMethods?.includes('generateContent')
        );
        
        console.log('🎯 Models that support generateContent:');
        contentModels.forEach(model => {
          console.log(`- ${model.name}`);
        });
        
      } else {
        console.log('No models found in response');
        console.log('Full response:', JSON.stringify(data, null, 2));
      }
    } else {
      const errorData = await response.json();
      console.log('❌ Error listing models:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Failed to list models:', error.message);
  }
}

listAvailableModels();