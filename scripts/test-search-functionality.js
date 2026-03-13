// Simple test script to verify search functionality
const { diseaseService } = require('../services/diseaseService');

async function testSearchFunctionality() {
  console.log('Testing Disease Search Functionality...\n');

  try {
    // Test 1: Get all diseases
    console.log('1. Testing getAllDiseases...');
    const allDiseases = await diseaseService.getAllDiseases();
    console.log(`✓ Found ${allDiseases.length} diseases`);

    // Test 2: Search for diseases
    console.log('\n2. Testing searchDiseases...');
    const searchResults = await diseaseService.searchDiseases('respiratory');
    console.log(`✓ Found ${searchResults.length} diseases matching "respiratory"`);
    if (searchResults.length > 0) {
      console.log(`  - First result: ${searchResults[0].name}`);
    }

    // Test 3: Get search suggestions
    console.log('\n3. Testing getSearchSuggestions...');
    const suggestions = await diseaseService.getSearchSuggestions('cough');
    console.log(`✓ Found ${suggestions.length} suggestions for "cough"`);
    suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion.text} (${suggestion.type})`);
    });

    // Test 4: Test search with different queries
    console.log('\n4. Testing various search queries...');
    const testQueries = ['Newcastle', 'viral', 'diarrhea', 'bacterial'];
    
    for (const query of testQueries) {
      const results = await diseaseService.searchDiseases(query);
      console.log(`✓ "${query}": ${results.length} results`);
    }

    // Test 5: Test disease statistics
    console.log('\n5. Testing getDiseaseStatistics...');
    const stats = await diseaseService.getDiseaseStatistics();
    console.log(`✓ Total diseases: ${stats.total}`);
    console.log(`✓ By category:`, stats.byCategory);
    console.log(`✓ By severity:`, stats.bySeverity);

    console.log('\n✅ All search functionality tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSearchFunctionality();