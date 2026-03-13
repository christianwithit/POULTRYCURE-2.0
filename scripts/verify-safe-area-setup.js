/**
 * Verification script for SafeAreaProvider setup
 * This script verifies that the SafeAreaProvider is properly configured
 * in the root layout and that the safe area context is available.
 */

const fs = require('fs');
const path = require('path');

function verifySafeAreaSetup() {
  console.log('🔍 Verifying SafeAreaProvider setup...\n');

  // Check if the root layout file exists
  const layoutPath = path.join(__dirname, '..', 'app', '_layout.tsx');
  if (!fs.existsSync(layoutPath)) {
    console.error('❌ Root layout file not found at app/_layout.tsx');
    return false;
  }

  // Read the layout file content
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');

  // Check for SafeAreaProvider import
  const hasImport = layoutContent.includes("import { SafeAreaProvider } from 'react-native-safe-area-context'");
  if (!hasImport) {
    console.error('❌ SafeAreaProvider import not found in root layout');
    return false;
  }
  console.log('✅ SafeAreaProvider import found');

  // Check for SafeAreaProvider usage
  const hasProvider = layoutContent.includes('<SafeAreaProvider>');
  if (!hasProvider) {
    console.error('❌ SafeAreaProvider component not used in root layout');
    return false;
  }
  console.log('✅ SafeAreaProvider component found in JSX');

  // Check provider hierarchy (SafeAreaProvider should be outermost)
  const providerIndex = layoutContent.indexOf('<SafeAreaProvider>');
  const authProviderIndex = layoutContent.indexOf('<AuthProvider>');
  const diagnosisProviderIndex = layoutContent.indexOf('<DiagnosisProvider>');

  if (providerIndex > authProviderIndex || providerIndex > diagnosisProviderIndex) {
    console.error('❌ SafeAreaProvider is not positioned above other providers');
    return false;
  }
  console.log('✅ SafeAreaProvider is positioned above other providers');

  // Check package.json for dependency
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (!packageContent.dependencies['react-native-safe-area-context']) {
    console.error('❌ react-native-safe-area-context dependency not found');
    return false;
  }
  console.log('✅ react-native-safe-area-context dependency found');

  console.log('\n🎉 SafeAreaProvider setup verification completed successfully!');
  console.log('\nSetup Summary:');
  console.log('- SafeAreaProvider is imported from react-native-safe-area-context');
  console.log('- SafeAreaProvider wraps the entire app at the root level');
  console.log('- SafeAreaProvider is positioned above all other providers');
  console.log('- Safe area context is now available throughout the app');
  
  return true;
}

// Run verification
if (require.main === module) {
  const success = verifySafeAreaSetup();
  process.exit(success ? 0 : 1);
}

module.exports = { verifySafeAreaSetup };