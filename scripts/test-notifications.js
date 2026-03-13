// scripts/test-notifications.js
// Test notification functionality

const { notificationService } = require('../services/notificationService');

async function testNotifications() {
  console.log('🧪 Testing Notification Service...\n');
  
  try {
    // Test 1: Check permissions
    console.log('1️⃣ Testing permissions...');
    const hasPermission = await notificationService.requestPermissions();
    console.log(`   Permission status: ${hasPermission ? '✅ Granted' : '❌ Denied'}\n`);
    
    // Test 2: Get device token
    console.log('2️⃣ Testing device token...');
    const token = await notificationService.getDeviceToken();
    console.log(`   Device token: ${token ? '✅ Obtained' : '❌ Failed'}`);
    if (token) console.log(`   Token: ${token.substring(0, 20)}...\n`);
    
    // Test 3: Send local notification
    console.log('3️⃣ Testing local notification...');
    await notificationService.sendLocalNotification({
      type: 'system_update',
      title: 'Test Notification',
      body: 'This is a test from PoultryCure!',
      data: { test: true, timestamp: new Date().toISOString() }
    });
    console.log('   ✅ Test notification sent!\n');
    
    // Test 4: Schedule notification
    console.log('4️⃣ Testing scheduled notification...');
    const scheduledId = await notificationService.scheduleNotification({
      type: 'reminder',
      title: 'Scheduled Test',
      body: 'This should appear in 5 seconds',
      data: { scheduled: true }
    }, { seconds: 5 });
    console.log(`   ✅ Scheduled notification ID: ${scheduledId}\n`);
    
    // Test 5: Get scheduled notifications
    console.log('5️⃣ Getting scheduled notifications...');
    const scheduled = await notificationService.getScheduledNotifications();
    console.log(`   📋 Scheduled notifications: ${scheduled.length}\n`);
    
    // Test 6: Badge count
    console.log('6️⃣ Testing badge count...');
    const currentBadge = await notificationService.getBadgeCount();
    await notificationService.setBadgeCount(currentBadge + 1);
    const newBadge = await notificationService.getBadgeCount();
    console.log(`   🏷️ Badge count: ${currentBadge} → ${newBadge}\n`);
    
    console.log('✅ All notification tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testNotifications();
