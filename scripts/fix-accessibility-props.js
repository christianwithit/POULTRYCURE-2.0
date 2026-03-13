const fs = require('fs');
const path = require('path');

// Function to fix importantForAccessibility in a file
function fixAccessibilityProps(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace importantForAccessibility="no" with accessible={false}
    content = content.replace(/importantForAccessibility="no"/g, 'accessible={false}');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed accessibility props in ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// List of files to fix
const filesToFix = [
  'components/glossary/DiseaseCard.tsx',
  'components/glossary/DiseaseListView.tsx',
  'components/glossary/SearchInterface.tsx',
  'components/glossary/FilterPanel.tsx',
  'components/glossary/ShareButton.tsx',
  'components/glossary/ImageGallery.tsx',
  'components/glossary/ProgressiveImage.tsx',
  'app/(tabs)/glossary.tsx',
  'app/glossary/[diseaseId].tsx'
];

console.log('Fixing accessibility props in glossary components...\n');

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    fixAccessibilityProps(file);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('\n🎉 Accessibility props fix completed!');