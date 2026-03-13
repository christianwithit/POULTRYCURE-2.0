const { authService } = require('../services/auth');

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const result = await authService.signup({
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!'
    });

    if (result.success) {
      console.log('✅ Test user created successfully!');
      console.log('Email: test@example.com');
      console.log('Password: TestPass123!');
      console.log('User ID:', result.user?.id);
    } else {
      console.log('❌ Failed to create test user:', result.error);
    }
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  }
}

createTestUser();