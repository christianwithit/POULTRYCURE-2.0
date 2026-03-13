// Simple test script for accessibility utilities
const { execSync } = require('child_process');

console.log('Testing accessibility utilities...');

try {
  // Test if the TypeScript files compile
  execSync('npx tsc --noEmit utils/accessibility.ts', { stdio: 'inherit' });
  console.log('✅ Accessibility utilities compile successfully');
  
  execSync('npx tsc --noEmit hooks/useAccessibility.ts', { stdio: 'inherit' });
  console.log('✅ Accessibility hooks compile successfully');
  
  execSync('npx tsc --noEmit components/glossary/AccessibleButton.tsx', { stdio: 'inherit' });
  console.log('✅ AccessibleButton compiles successfully');
  
  execSync('npx tsc --noEmit components/glossary/AccessibleText.tsx', { stdio: 'inherit' });
  console.log('✅ AccessibleText compiles successfully');
  
  execSync('npx tsc --noEmit components/glossary/AccessibleContainer.tsx', { stdio: 'inherit' });
  console.log('✅ AccessibleContainer compiles successfully');
  
  console.log('\n🎉 All accessibility components compile successfully!');
  
} catch (error) {
  console.error('❌ Compilation failed:', error.message);
  process.exit(1);
}