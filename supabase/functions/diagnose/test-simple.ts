import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🤖 Simple test function called');
    
    // Get environment variables
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY')
    
    console.log('🔑 Environment variables check:');
    console.log(`   GEMINI_API_KEY: ${geminiApiKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`   SERVICE_ROLE_KEY: ${serviceKey ? '✅ Set' : '❌ Missing'}`);
    
    // Parse request body
    const body = await req.json()
    const { type, input, userId, symptoms, imageData } = body
    
    console.log('📝 Request parsed:');
    console.log(`   Type: ${type}`);
    console.log(`   Input: ${input}`);
    console.log(`   User ID: ${userId}`);
    
    // Validate request
    if (!type || !input || !userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: type, input, userId' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Test Gemini API connection
    if (geminiApiKey) {
      try {
        console.log('🔗 Testing Gemini API connection...');
        const { GoogleGenerativeAI } = await import('https://esm.sh/@google/generative-ai@0.1.3')
        const genAI = new GoogleGenerativeAI(geminiApiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        
        // Simple test prompt
        const testPrompt = "Respond with 'Gemini API is working' in JSON format: {\"status\": \"working\"}"
        const result = await model.generateContent(testPrompt)
        const response = await result.response
        const text = response.text()
        
        console.log('✅ Gemini API test successful');
        console.log(`   Response: ${text}`);
        
        // Return a mock diagnosis for now
        const mockDiagnosis = {
          disease: "Test Disease",
          confidence: 85,
          severity: "medium",
          recommendations: [
            "Test recommendation 1",
            "Test recommendation 2"
          ],
          treatment: "Test treatment plan",
          prevention: "Test prevention measures"
        }
        
        const response_data = {
          success: true,
          diagnosis: mockDiagnosis,
          usage: {
            requestsToday: 1,
            requestsLimit: 50,
            resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          debug: {
            geminiTest: text,
            environment: {
              geminiKeySet: !!geminiApiKey,
              supabaseUrlSet: !!supabaseUrl,
              serviceKeySet: !!serviceKey
            }
          }
        }

        return new Response(
          JSON.stringify(response_data),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
        
      } catch (geminiError) {
        console.error('❌ Gemini API test failed:', geminiError);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Gemini API error: ${geminiError.message}`,
            debug: {
              geminiKeySet: !!geminiApiKey,
              error: geminiError.toString()
            }
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Gemini API key not configured',
          debug: {
            geminiKeySet: !!geminiApiKey,
            supabaseUrlSet: !!supabaseUrl,
            serviceKeySet: !!serviceKey
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
  } catch (error) {
    console.error('❌ Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Internal server error: ${error.message}`,
        debug: {
          errorMessage: error.message,
          errorStack: error.stack
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
