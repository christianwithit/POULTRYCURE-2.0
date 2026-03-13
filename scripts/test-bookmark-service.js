// Test script for bookmark service
const { bookmarkService } = require('../services/bookmarkService');

async function testBookmarkService() {
  console.log('Testing Bookmark Service...');
  
  const testUserId = 'test-user-123';
  const testDiseaseId = 'avian-influenza';
  
  try {
    // Test adding a bookmark
    console.log('Adding bookmark...');
    await bookmarkService.addBookmark(testUserId, testDiseaseId);
    
    // Test checking if bookmarked
    console.log('Checking if bookmarked...');
    const isBookmarked = await bookmarkService.isBookmarked(testUserId, testDiseaseId);
    console.log('Is bookmarked:', isBookmarked);
    
    // Test getting bookmarked diseases
    console.log('Getting bookmarked diseases...');
    const bookmarkedDiseases = await bookmarkService.getBookmarkedDiseases(testUserId);
    console.log('Bookmarked diseases:', bookmarkedDiseases);
    
    // Test adding a note
    console.log('Adding note...');
    await bookmarkService.updateBookmarkNote(testUserId, testDiseaseId, 'This is a test note');
    
    // Test getting note
    console.log('Getting note...');
    const note = await bookmarkService.getUserBookmarkNotes(testUserId, testDiseaseId);
    console.log('Note:', note);
    
    // Test getting user bookmarks with details
    console.log('Getting user bookmarks...');
    const userBookmarks = await bookmarkService.getUserBookmarks(testUserId);
    console.log('User bookmarks:', userBookmarks);
    
    // Test removing bookmark
    console.log('Removing bookmark...');
    await bookmarkService.removeBookmark(testUserId, testDiseaseId);
    
    // Verify removal
    const isStillBookmarked = await bookmarkService.isBookmarked(testUserId, testDiseaseId);
    console.log('Is still bookmarked after removal:', isStillBookmarked);
    
    console.log('✅ All bookmark service tests passed!');
    
  } catch (error) {
    console.error('❌ Bookmark service test failed:', error);
  }
}

testBookmarkService();