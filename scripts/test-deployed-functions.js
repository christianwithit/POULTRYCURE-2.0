// Test Deployed Edge Functions
// Run with: node scripts/test-deployed-functions.js

console.log('🧪 Testing Deployed Edge Functions...\n');

const SUPABASE_URL = 'https://hjoqywslyqcakhydgurx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqb3F5d3NseXFjYWtoeWRndXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNjI0NDYsImV4cCI6MjA4NzgzODQ0Nn0.aLbsqRm9wQkkoAVQLQCpyBeyC9ty5Q5ZVCyrLph8stc';

// Test 1: Health Check Function
async function testHealthCheck() {
  console.log('1. Testing Health Check Function...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/health-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        timestamp: Date.now()
      })
    });

    console.log(`   Status: ${response.status}`);
    
    const text = await response.text();
    console.log(`   Response: ${text}`);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        if (data.success && data.status === 'healthy') {
          console.log('✅ Health check passed');
          console.log(`   Response time: ${data.responseTime || 'N/A'}ms`);
        } else {
          console.log('❌ Health check failed');
          console.log(`   Error: ${data.error || 'Unknown error'}`);
        }
      } catch (parseError) {
        console.log('❌ Invalid JSON response');
        console.log(`   Raw response: ${text}`);
      }
    } else {
      console.log('❌ Health check request failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${text}`);
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
  }
}

// Test 2: Diagnose Function (Text)
async function testDiagnoseText() {
  console.log('\n2. Testing Diagnose Function (Text)...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        type: 'text',
        input: 'chicken has respiratory symptoms and sneezing',
        userId: 'test-user-123',
        symptoms: ['sneezing', 'coughing', 'nasal discharge']
      })
    });

    console.log(`   Status: ${response.status}`);
    
    const text = await response.text();
    console.log(`   Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        if (data.success && data.diagnosis) {
          console.log('✅ Text diagnosis successful');
          console.log(`   Disease: ${data.diagnosis.disease}`);
          console.log(`   Confidence: ${data.diagnosis.confidence}%`);
          console.log(`   Severity: ${data.diagnosis.severity}`);
          console.log(`   Recommendations: ${data.diagnosis.recommendations?.length || 0}`);
          if (data.usage) {
            console.log(`   Usage: ${data.usage.requestsToday}/${data.usage.requestsLimit}`);
          }
        } else {
          console.log('❌ Text diagnosis failed');
          console.log(`   Error: ${data.error || 'Unknown error'}`);
          if (data.usage) {
            console.log(`   Usage: ${data.usage.requestsToday}/${data.usage.requestsLimit}`);
          }
        }
      } catch (parseError) {
        console.log('❌ Invalid JSON response');
        console.log(`   Parse error: ${parseError.message}`);
      }
    } else {
      console.log('❌ Text diagnosis request failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${text}`);
    }
  } catch (error) {
    console.log('❌ Text diagnosis error:', error.message);
  }
}

// Test 3: Diagnose Function (Rate Limiting)
async function testRateLimit() {
  console.log('\n3. Testing Rate Limiting...');
  
  try {
    // Make multiple rapid requests
    const requests = [];
    for (let i = 0; i < 3; i++) {
      requests.push(
        fetch(`${SUPABASE_URL}/functions/v1/diagnose`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            type: 'text',
            input: `rate limit test ${i}`,
            userId: 'rate-limit-test-user'
          })
        })
      );
    }

    const responses = await Promise.all(requests);
    let successCount = 0;
    let rateLimitedCount = 0;

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const text = await response.text();
      
      console.log(`   Request ${i + 1}: Status ${response.status}`);
      
      if (response.ok) {
        try {
          const data = JSON.parse(text);
          if (data.success) {
            successCount++;
          }
        } catch (parseError) {
          console.log(`     Parse error: ${parseError.message}`);
        }
      } else if (response.status === 429) {
        rateLimitedCount++;
        console.log(`     Rate limited: ${text}`);
      } else {
        console.log(`     Error: ${text}`);
      }
    }

    console.log(`✅ Rate limiting test completed`);
    console.log(`   Successful requests: ${successCount}`);
    console.log(`   Rate limited requests: ${rateLimitedCount}`);
    
  } catch (error) {
    console.log('❌ Rate limiting test error:', error.message);
  }
}

// Test 4: Error Handling
async function testErrorHandling() {
  console.log('\n4. Testing Error Handling...');
  
  try {
    // Test with invalid request
    const response = await fetch(`${SUPABASE_URL}/functions/v1/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        // Missing required fields
        type: 'invalid-type'
      })
    });

    const text = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${text}`);
    
    if (response.status === 400) {
      try {
        const data = JSON.parse(text);
        if (!data.success && data.error) {
          console.log('✅ Error handling working correctly');
          console.log(`   Error message: ${data.error}`);
        } else {
          console.log('❌ Error handling response format incorrect');
        }
      } catch (parseError) {
        console.log('❌ Invalid error response JSON');
      }
    } else {
      console.log('❌ Expected 400 status for invalid request');
    }
  } catch (error) {
    console.log('❌ Error handling test error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Testing Deployed Edge Functions on Supabase');
  console.log(`📍 Project: ${SUPABASE_URL}`);
  console.log('');
  
  await testHealthCheck();
  await testDiagnoseText();
  await testRateLimit();
  await testErrorHandling();
  
  console.log('\n🎉 Edge Functions Testing Complete!');
  console.log('\n📊 Test Summary:');
  console.log('✅ Health Check Function - Tested');
  console.log('✅ Text Diagnosis Function - Tested');
  console.log('✅ Rate Limiting - Tested');
  console.log('✅ Error Handling - Tested');
  
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Check Supabase Dashboard for function logs');
  console.log('2. Verify environment variables are set correctly');
  console.log('3. Check Gemini API key is valid');
  console.log('4. Ensure database migration was applied');
  
  console.log('\n🔗 Dashboard Links:');
  console.log(`Functions: https://supabase.com/dashboard/project/hjoqywslyqcakhydgurx/functions`);
  console.log(`Logs: https://supabase.com/dashboard/project/hjoqywslyqcakhydgurx/logs`);
}

// Run tests
runAllTests().catch(console.error);
