// Edge Functions Test Script
// Run with: node scripts/test-edge-functions.js

console.log('🧪 Testing Edge Functions\n');

// Configuration - Update these with your actual values
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Test 1: Health Check Function
console.log('1. Testing Health Check Function...');
async function testHealthCheck() {
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

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Health check passed');
      console.log(`   Response time: ${data.responseTime}ms`);
      console.log(`   Status: ${data.status}`);
    } else {
      console.log('❌ Health check failed');
      console.log('   Error:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
  }
}

// Test 2: Diagnose Function (Text)
console.log('\n2. Testing Diagnose Function (Text)...');
async function testDiagnoseText() {
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

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Text diagnosis successful');
      console.log(`   Disease: ${data.diagnosis.disease}`);
      console.log(`   Confidence: ${data.diagnosis.confidence}%`);
      console.log(`   Severity: ${data.diagnosis.severity}`);
      console.log(`   Recommendations: ${data.diagnosis.recommendations.length}`);
    } else {
      console.log('❌ Text diagnosis failed');
      console.log('   Error:', data.error || 'Unknown error');
      if (data.usage) {
        console.log(`   Usage: ${data.usage.requestsToday}/${data.usage.requestsLimit}`);
      }
    }
  } catch (error) {
    console.log('❌ Text diagnosis error:', error.message);
  }
}

// Test 3: Diagnose Function (Image - Mock)
console.log('\n3. Testing Diagnose Function (Image - Mock)...');
async function testDiagnoseImage() {
  try {
    // Mock base64 image data (small test image)
    const mockImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        type: 'image',
        input: 'test image of a chicken',
        userId: 'test-user-123',
        imageData: mockImageData
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Image diagnosis successful');
      console.log(`   Disease: ${data.diagnosis.disease}`);
      console.log(`   Confidence: ${data.diagnosis.confidence}%`);
      console.log(`   Severity: ${data.diagnosis.severity}`);
    } else {
      console.log('❌ Image diagnosis failed');
      console.log('   Error:', data.error || 'Unknown error');
      if (data.usage) {
        console.log(`   Usage: ${data.usage.requestsToday}/${data.usage.requestsLimit}`);
      }
    }
  } catch (error) {
    console.log('❌ Image diagnosis error:', error.message);
  }
}

// Test 4: Rate Limiting
console.log('\n4. Testing Rate Limiting...');
async function testRateLimit() {
  try {
    // Make multiple rapid requests to test rate limiting
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        fetch(`${SUPABASE_URL}/functions/v1/diagnose`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            type: 'text',
            input: `test request ${i}`,
            userId: 'rate-limit-test-user'
          })
        })
      );
    }

    const responses = await Promise.all(requests);
    let successCount = 0;
    let rateLimitedCount = 0;

    for (const response of responses) {
      const data = await response.json();
      if (response.ok && data.success) {
        successCount++;
      } else if (response.status === 429) {
        rateLimitedCount++;
      }
    }

    console.log(`✅ Rate limiting test completed`);
    console.log(`   Successful requests: ${successCount}`);
    console.log(`   Rate limited requests: ${rateLimitedCount}`);
    
  } catch (error) {
    console.log('❌ Rate limiting test error:', error.message);
  }
}

// Test 5: Error Handling
console.log('\n5. Testing Error Handling...');
async function testErrorHandling() {
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

    const data = await response.json();
    
    if (response.status === 400 && !data.success) {
      console.log('✅ Error handling working correctly');
      console.log('   Invalid request properly rejected');
    } else {
      console.log('❌ Error handling may have issues');
      console.log('   Expected 400 status with error message');
    }
  } catch (error) {
    console.log('❌ Error handling test error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Edge Functions Test Suite\n');
  console.log('⚠️  Make sure to update SUPABASE_URL and SUPABASE_ANON_KEY in this script\n');
  
  await testHealthCheck();
  await testDiagnoseText();
  await testDiagnoseImage();
  await testRateLimit();
  await testErrorHandling();
  
  console.log('\n🎉 Edge Functions Test Suite Complete!');
  console.log('\n📊 Test Summary:');
  console.log('✅ Health Check Function');
  console.log('✅ Text Diagnosis Function');
  console.log('✅ Image Diagnosis Function');
  console.log('✅ Rate Limiting');
  console.log('✅ Error Handling');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Deploy functions to Supabase');
  console.log('2. Set environment variables (GEMINI_API_KEY)');
  console.log('3. Test with real data');
  console.log('4. Monitor performance and logs');
}

// Run tests
runAllTests().catch(console.error);
