// This script shows how to clear storage in your app
// You can add this as a button in your app for testing

import { storageManager } from '../services/storage';

export async function clearAllUserData() {
  try {
    await storageManager.clearUserData();
    console.log('✅ All user data cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear user data:', error);
    return false;
  }
}

// You can call this function from your app's debug menu or add a button
// clearAllUserData();