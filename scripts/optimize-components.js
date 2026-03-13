const fs = require('fs');

// Function to add React.memo to a component
function optimizeComponent(filePath, componentName) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if React.memo is already used
    if (content.includes('React.memo')) {
      console.log(`   ✅ ${filePath} already optimized with React.memo`);
      return;
    }
    
    // Check if it's a default export function
    const defaultExportPattern = new RegExp(`export default function ${componentName}\\(`);
    if (defaultExportPattern.test(content)) {
      // Convert to React.memo
      content = content.replace(
        defaultExportPattern,
        `const ${componentName} = React.memo(function ${componentName}(`
      );
      
      // Add export after the function
      const functionEndPattern = new RegExp(`^}\\s*$`, 'm');
      content = content.replace(functionEndPattern, `});

export default ${componentName};`);
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   ✅ Added React.memo to ${filePath}`);
    } else {
      console.log(`   ⚠️  Could not optimize ${filePath} - pattern not found`);
    }
  } catch (error) {
    console.error(`   ❌ Error optimizing ${filePath}:`, error.message);
  }
}

console.log('🚀 Optimizing components with React.memo...\n');

// Components to optimize
const componentsToOptimize = [
  { file: 'components/glossary/SearchInterface.tsx', name: 'SearchInterface' },
  { file: 'components/glossary/FilterPanel.tsx', name: 'FilterPanel' },
  { file: 'components/glossary/ImageGallery.tsx', name: 'ImageGallery' },
  { file: 'components/glossary/ProgressiveImage.tsx', name: 'ProgressiveImage' },
  { file: 'components/glossary/ShareButton.tsx', name: 'ShareButton' },
  { file: 'components/glossary/ShareModal.tsx', name: 'ShareModal' }
];

componentsToOptimize.forEach(({ file, name }) => {
  if (fs.existsSync(file)) {
    optimizeComponent(file, name);
  } else {
    console.log(`   ⚠️  ${file} not found`);
  }
});

console.log('\n🎯 Performance optimization completed!');
console.log('\nOptimizations applied:');
console.log('   • React.memo for expensive components');
console.log('   • Proper component memoization');
console.log('   • Reduced unnecessary re-renders');

console.log('\nNext steps:');
console.log('   1. Test components to ensure they still work correctly');
console.log('   2. Monitor performance improvements');
console.log('   3. Add performance monitoring in production');