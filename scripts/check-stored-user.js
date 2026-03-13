const { storageManager } = require('../services/storage');

async function checkStoredUser() {
  try {
    console.log('Checking stored user data...');
    
    const user = await storageManager.getUser();
    const credentials = await storageManager.getCredentials();
    const session = await storageManager.getSession();

    console.log('\n--- Stored User ---');
    if (user) {
      console.log('✅ User found:');
      console.log('  ID:', user.id);
      console.log('  Name:', user.name);
      console.log('  Email:', user.email);
      console.log('  Created:', user.createdAt);
      console.log('  Updated:', user.updatedAt);
    } else {
      console.log('❌ No user found in storage');
    }

    console.log('\n--- Stored Credentials ---');
    if (credentials) {
      console.log('✅ Credentials found');
      console.log('  Has hashed password:', !!credentials.hashedPassword);
      console.log('  Has salt:', !!credentials.salt);
    } else {
      console.log('❌ No credentials found in storage');
    }

    console.log('\n--- Stored Session ---');
    if (session) {
      console.log('✅ Session found:');
      console.log('  User ID:', session.userId);
      console.log('  Token:', session.token.substring(0, 20) + '...');
      console.log('  Created:', session.createdAt);
      console.log('  Expires:', session.expiresAt);
      console.log('  Is expired:', session.expiresAt <= new Date());
    } else {
      console.log('❌ No session found in storage');
    }

  } catch (error) {
    console.error('❌ Error checking stored data:', error.message);
  }
}

checkStoredUser();