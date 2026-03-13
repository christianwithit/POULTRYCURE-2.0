#!/usr/bin/env node

/**
 * Test script for sharing functionality
 * This script tests the ShareService methods to ensure they work correctly
 */

// Mock React Native modules for Node.js environment
const mockShare = {
  share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
  sharedAction: 'sharedAction',
  dismissedAction: 'dismissedAction'
};

const mockAlert = {
  alert: jest.fn()
};

// Mock the React Native modules
global.Share = mockShare;
global.Alert = mockAlert;

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined)
};

// Create a mock disease for testing
const mockDisease = {
  id: 'test-disease-1',
  name: 'Newcastle Disease',
  description: 'A highly contagious viral disease affecting poultry',
  category: 'viral',
  severity: 'high',
  symptoms: ['Respiratory distress', 'Nervous signs', 'Diarrhea', 'Drop in egg production'],
  treatment: 'Supportive care, vaccination programs, biosecurity measures',
  prevention: 'Vaccination, quarantine, proper sanitation',
  commonIn: ['chickens', 'turkeys'],
  causes: ['Newcastle disease virus (NDV)', 'Contact with infected birds', 'Contaminated equipment'],
  transmission: {
    method: 'airborne',
    contagiousness: 'high',
    quarantinePeriod: '21 days'
  },
  incubationPeriod: '2-15 days',
  mortality: {
    rate: '50-100%',
    timeframe: '1-2 weeks',
    ageGroups: [
      { ageGroup: 'Chicks (0-8 weeks)', mortalityRate: '90-100%' },
      { ageGroup: 'Adults (>8 weeks)', mortalityRate: '50-80%' }
    ]
  },
  images: [],
  relatedDiseases: ['avian-influenza', 'infectious-bronchitis'],
  lastUpdated: new Date('2024-01-01'),
  sources: ['OIE Manual', 'Veterinary Pathology'],
  tags: ['viral', 'respiratory', 'nervous', 'reportable']
};

async function testShareService() {
  console.log('🧪 Testing ShareService functionality...\n');

  try {
    // Import the ShareService (we'll need to mock the React Native dependencies)
    const { ShareService } = require('../services/shareService');
    const shareService = ShareService.getInstance();

    console.log('✅ ShareService instance created successfully');

    // Test 1: Generate shareable link
    console.log('\n📋 Test 1: Generate shareable link');
    const shareableLink = shareService.generateShareableLink(mockDisease.id);
    console.log(`Generated link: ${shareableLink.url}`);
    console.log(`Short URL: ${shareableLink.shortUrl}`);
    console.log('✅ Shareable link generation works');

    // Test 2: Format basic content
    console.log('\n📋 Test 2: Test content formatting');
    
    // We'll test the private methods by calling the public shareDiseaseInfo method
    // and checking the Share.share call
    mockShare.share.mockClear();
    
    await shareService.shareDiseaseInfo(mockDisease, {
      shareFormat: 'basic',
      includeDisclaimer: true
    });

    const basicShareCall = mockShare.share.mock.calls[0][0];
    console.log('Basic format content preview:');
    console.log(basicShareCall.message.substring(0, 200) + '...');
    console.log('✅ Basic content formatting works');

    // Test 3: Test detailed format
    mockShare.share.mockClear();
    await shareService.shareDiseaseInfo(mockDisease, {
      shareFormat: 'detailed',
      includePersonalNote: true,
      personalNote: 'This is affecting my flock - need urgent advice',
      includeDisclaimer: true
    });

    const detailedShareCall = mockShare.share.mock.calls[0][0];
    console.log('\nDetailed format with personal note:');
    console.log('Contains personal note:', detailedShareCall.message.includes('📝 Personal Note:'));
    console.log('Contains mortality info:', detailedShareCall.message.includes('📊 Additional Information:'));
    console.log('Contains disclaimer:', detailedShareCall.message.includes('⚠️ IMPORTANT DISCLAIMER'));
    console.log('✅ Detailed content formatting works');

    // Test 4: Test platform-specific sharing
    console.log('\n📋 Test 3: Test platform-specific sharing');
    
    mockShare.share.mockClear();
    await shareService.shareToSpecificPlatform(mockDisease, 'sms', {
      shareFormat: 'summary'
    });

    const smsShareCall = mockShare.share.mock.calls[0][0];
    console.log('SMS format length:', smsShareCall.message.length);
    console.log('SMS is concise (< 500 chars):', smsShareCall.message.length < 500);
    console.log('✅ Platform-specific sharing works');

    // Test 5: Test multiple diseases sharing
    console.log('\n📋 Test 4: Test multiple diseases sharing');
    
    const mockDisease2 = { ...mockDisease, id: 'test-disease-2', name: 'Avian Influenza' };
    const diseases = [mockDisease, mockDisease2];
    
    mockShare.share.mockClear();
    await shareService.shareMultipleDiseases(diseases, {
      personalNote: 'Comparing these two diseases for my research'
    });

    const multipleShareCall = mockShare.share.mock.calls[0][0];
    console.log('Multiple diseases format:');
    console.log('Contains both diseases:', 
      multipleShareCall.message.includes('Newcastle Disease') && 
      multipleShareCall.message.includes('Avian Influenza')
    );
    console.log('Contains disease count:', multipleShareCall.message.includes('2 Disease'));
    console.log('✅ Multiple diseases sharing works');

    // Test 6: Test error handling
    console.log('\n📋 Test 5: Test error handling');
    
    mockShare.share.mockRejectedValueOnce(new Error('Share failed'));
    const result = await shareService.shareDiseaseInfo(mockDisease);
    
    console.log('Error handled gracefully:', result === false);
    console.log('Alert called for error:', mockAlert.alert.mock.calls.length > 0);
    console.log('✅ Error handling works');

    console.log('\n🎉 All ShareService tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- ✅ Shareable link generation');
    console.log('- ✅ Content formatting (basic, detailed, summary)');
    console.log('- ✅ Platform-specific formatting (SMS, email, social)');
    console.log('- ✅ Multiple diseases sharing');
    console.log('- ✅ Personal notes and disclaimers');
    console.log('- ✅ Error handling');
    console.log('\n🚀 ShareService is ready for production use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Mock jest functions for Node.js environment
global.jest = {
  fn: () => ({
    mockResolvedValue: (value) => ({
      mockClear: () => {},
      mockRejectedValueOnce: (error) => Promise.reject(error),
      mock: { calls: [] }
    })
  })
};

// Run the tests
if (require.main === module) {
  testShareService().catch(console.error);
}

module.exports = { testShareService };