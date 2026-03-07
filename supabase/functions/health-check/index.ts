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
    const body = await req.json()
    const timestamp = body.timestamp || Date.now()
    
    const response = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      requestTimestamp: timestamp,
      responseTime: Date.now() - timestamp,
      service: 'health-check',
      version: '1.0.0'
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Health check error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
