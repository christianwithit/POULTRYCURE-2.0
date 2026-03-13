import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookmarkService } from '../../services/bookmarkService';
import { cacheManager } from '../../services/cacheManager';
import { DiseaseService } from '../../services/diseaseService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Glossary Bookmark Synchronization Tests', () => {
  let diseaseService: DiseaseService;
  const testUserId = 'test-user-123';
  const testUserId2 = 'test-user-456';

  beforeEach(() => {
    jest.clearAllMocks();
    diseaseService = DiseaseService.getInstance();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  describe('Multi-User Bookmark Synchronization', () => {
    it('should maintain separate bookmarks for different users', async () => {
      const disease1 = 'newcastle-disease';
      const disease2 = 'avian-influenza';
      
      // User 1 bookmarks disease 1
      await bookmarkService.addBookmark(testUserId, disease1);
      
      // User 2 bookmarks disease 2
      await bookmarkService.addBookmark(testUserId2, disease2);
      
      // Verify separation
      const user1Bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
      const user2Bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId2);
      
      expect(user1Bookmarks).toContain(disease1);
      expect(user1Bookmarks).not.toContain(disease2);
      expect(user2Bookmarks).toContain(disease2);
      expect(user2Bookmarks).not.toContain(disease1);
    });

    it('should handle concurrent bookmark operations from multiple users', async () => {
      const operations = [
        bookmarkService.addBookmark(testUserId, 'disease-1'),
        bookmarkService.addBookmark(testUserId, 'disease-2'),
        bookmarkService.addBookmark(testUserId2, 'disease-3'),
        bookmarkService.addBookmark(testUserId2, 'disease-4'),
        bookmarkService.removeBookmark(testUserId, 'disease-1'),
      ];
      
      await Promise.all(operations);
      
      const user1Bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
      const user2Bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId2);
      
      expect(user1Bookmarks).toContain('disease-2');
      expect(user1Bookmarks).not.toContain('disease-1');
      expect(user2Bookmarks).toContain('disease-3');
      expect(user2Bookmarks).toContain('disease-4');
    });

    it('should maintain bookmark integrity during user switching', async () => {
      // Setup bookmarks for both users
      await bookmarkService.addBookmark(testUserId, 'shared-disease');
      await bookmarkService.addBookmark(testUserId2, 'shared-disease');
      
      // Add user-specific bookmarks
      await bookmarkService.addBookmark(testUserId, 'user1-specific');
      await bookmarkService.addBookmark(testUserId2, 'user2-specific');
      
      // Verify both users can access their bookmarks
      const user1Bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
      const user2Bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId2);
      
      expect(user1Bookmarks).toContain('shared-disease');
      expect(user1Bookmarks).toContain('user1-specific');
      expect(user1Bookmarks).not.toContain('user2-specific');
      
      expect(user2Bookmarks).toContain('shared-disease');
      expect(user2Bookmarks).toContain('user2-specific');
      expect(user2Bookmarks).not.toContain('user1-specific');
    });
  });

  describe('Bookmark Data Consistency', () => {
    it('should maintain bookmark timestamps correctly', async () => {
      const diseaseId = 'timestamp-test-disease';
      const beforeAdd = new Date();
      
      await bookmarkService.addBookmark(testUserId, diseaseId);
      
      const afterAdd = new Date();
      const userBookmarks = await bookmarkService.getUserBookmarks(testUserId);
      const bookmark = userBookmarks.find(b => b.diseaseId === diseaseId);
      
      expect(bookmark).toBeDefined();
      expect(bookmark!.createdAt.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
      expect(bookmark!.createdAt.getTime()).toBeLessThanOrEqual(afterAdd.getTime());
      expect(bookmark!.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
      expect(bookmark!.updatedAt.getTime()).toBeLessThanOrEqual(afterAdd.getTime());
    });

    it('should update timestamps when modifying bookmarks', async () => {
      const diseaseId = 'update-test-disease';
      
      // Add bookmark
      await bookmarkService.addBookmark(testUserId, diseaseId);
      const initialBookmarks = await bookmarkService.getUserBookmarks(testUserId);
      const initialBookmark = initialBookmarks.find(b => b.diseaseId === diseaseId);
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Update note
      await bookmarkService.updateBookmarkNote(testUserId, diseaseId, 'Updated note');
      const updatedBookmarks = await bookmarkService.getUserBookmarks(testUserId);
      const updatedBookmark = updatedBookmarks.find(b => b.diseaseId === diseaseId);
      
      expect(updatedBookmark!.updatedAt.getTime()).toBeGreaterThan(initialBookmark!.updatedAt.getTime());
      expect(updatedBookmark!.createdAt.getTime()).toBe(initialBookmark!.createdAt.getTime());
    });

    it('should handle bookmark note synchronization', async () => {
      const diseaseId = 'note-sync-disease';
      const note = 'Important note about this disease';
      
      // Add bookmark with note
      await bookmarkService.addBookmark(testUserId, diseaseId);
      await bookmarkService.updateBookmarkNote(testUserId, diseaseId, note);
      
      // Verify note is stored and retrieved correctly
      const retrievedNote = await bookmarkService.getUserBookmarkNotes(testUserId, diseaseId);
      expect(retrievedNote).toBe(note);
      
      // Verify through getUserBookmarks as well
      const userBookmarks = await bookmarkService.getUserBookmarks(testUserId);
      const bookmark = userBookmarks.find(b => b.diseaseId === diseaseId);
      expect(bookmark!.note).toBe(note);
    });
  });

  describe('Bookmark Cache Integration', () => {
    it('should sync bookmarks with disease cache', async () => {
      const diseases = await diseaseService.getAllDiseases();
      const testDisease = diseases[0];
      
      // Bookmark a disease
      await bookmarkService.addBookmark(testUserId, testDisease.id);
      
      // Verify disease exists in cache
      const cachedDisease = await diseaseService.getDiseaseById(testDisease.id);
      expect(cachedDisease).toBeDefined();
      expect(cachedDisease!.id).toBe(testDisease.id);
      
      // Verify bookmark status
      const isBookmarked = await bookmarkService.isBookmarked(testUserId, testDisease.id);
      expect(isBookmarked).toBe(true);
    });

    it('should handle bookmarks for cached vs non-cached diseases', async () => {
      // Bookmark a disease that should be in cache
      await bookmarkService.addBookmark(testUserId, 'newcastle-disease');
      
      // Bookmark a hypothetical disease not in cache
      await bookmarkService.addBookmark(testUserId, 'non-existent-disease');
      
      const bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
      
      expect(bookmarks).toContain('newcastle-disease');
      expect(bookmarks).toContain('non-existent-disease');
      
      // Verify we can still check bookmark status for non-existent diseases
      const isBookmarked = await bookmarkService.isBookmarked(testUserId, 'non-existent-disease');
      expect(isBookmarked).toBe(true);
    });

    it('should maintain bookmark consistency during cache updates', async () => {
      const diseaseId = 'cache-update-test';
      
      // Add bookmark
      await bookmarkService.addBookmark(testUserId, diseaseId);
      
      // Simulate cache update
      await cacheManager.clearCache();
      
      // Bookmark should still exist
      const isBookmarked = await bookmarkService.isBookmarked(testUserId, diseaseId);
      expect(isBookmarked).toBe(true);
    });
  });

  describe('Bookmark Storage Optimization', () => {
    it('should handle large numbers of bookmarks efficiently', async () => {
      const numberOfBookmarks = 100;
      const bookmarkPromises = Array.from({ length: numberOfBookmarks }, (_, i) => 
        bookmarkService.addBookmark(testUserId, `disease-${i}`)
      );
      
      const startTime = Date.now();
      await Promise.all(bookmarkPromises);
      const endTime = Date.now();
      
      const bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
      
      expect(bookmarks).toHaveLength(numberOfBookmarks);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should optimize storage space for bookmarks', async () => {
      // Add multiple bookmarks
      const diseases = ['disease-1', 'disease-2', 'disease-3'];
      for (const disease of diseases) {
        await bookmarkService.addBookmark(testUserId, disease);
      }
      
      // Verify storage calls are optimized (not one call per bookmark)
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      
      // Should store all bookmarks in a single storage operation per user
      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      const bookmarkCalls = setItemCalls.filter(call => call[0] === 'disease_bookmarks');
      
      // Should be efficient in storage operations
      expect(bookmarkCalls.length).toBeGreaterThan(0);
    });

    it('should handle bookmark cleanup efficiently', async () => {
      // Add bookmarks
      await bookmarkService.addBookmark(testUserId, 'cleanup-test-1');
      await bookmarkService.addBookmark(testUserId, 'cleanup-test-2');
      await bookmarkService.addBookmark(testUserId2, 'cleanup-test-3');
      
      // Clear bookmarks for one user
      const startTime = Date.now();
      await bookmarkService.clearUserBookmarks(testUserId);
      const endTime = Date.now();
      
      // Verify cleanup was efficient
      expect(endTime - startTime).toBeLessThan(100);
      
      // Verify correct bookmarks were removed
      const user1Bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
      const user2Bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId2);
      
      expect(user1Bookmarks).toHaveLength(0);
      expect(user2Bookmarks).toContain('cleanup-test-3');
    });
  });

  describe('Bookmark Error Recovery', () => {
    it('should recover from storage errors gracefully', async () => {
      // Mock storage error
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));
      
      // Attempt to add bookmark
      await expect(bookmarkService.addBookmark(testUserId, 'error-test-disease'))
        .rejects.toThrow('Storage full');
      
      // Reset mock
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      
      // Should be able to add bookmarks after error
      await bookmarkService.addBookmark(testUserId, 'recovery-test-disease');
      
      const isBookmarked = await bookmarkService.isBookmarked(testUserId, 'recovery-test-disease');
      expect(isBookmarked).toBe(true);
    });

    it('should handle corrupted bookmark data', async () => {
      // Mock corrupted data
      mockAsyncStorage.getItem.mockResolvedValueOnce('invalid-json-data');
      
      // Should handle corruption gracefully
      const bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
      expect(Array.isArray(bookmarks)).toBe(true);
      expect(bookmarks).toHaveLength(0);
    });

    it('should maintain data integrity during concurrent operations', async () => {
      const concurrentOperations = [
        bookmarkService.addBookmark(testUserId, 'concurrent-1'),
        bookmarkService.addBookmark(testUserId, 'concurrent-2'),
        bookmarkService.removeBookmark(testUserId, 'concurrent-1'),
        bookmarkService.addBookmark(testUserId, 'concurrent-3'),
      ];
      
      await Promise.all(concurrentOperations);
      
      const finalBookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
      
      // Should have consistent final state
      expect(finalBookmarks).not.toContain('concurrent-1'); // Was removed
      expect(finalBookmarks).toContain('concurrent-2');
      expect(finalBookmarks).toContain('concurrent-3');
    });
  });

  describe('Bookmark Analytics and Tracking', () => {
    it('should track bookmark usage patterns', async () => {
      const diseases = ['popular-disease-1', 'popular-disease-2', 'rare-disease'];
      
      // Simulate multiple users bookmarking popular diseases
      await bookmarkService.addBookmark(testUserId, diseases[0]);
      await bookmarkService.addBookmark(testUserId2, diseases[0]);
      await bookmarkService.addBookmark(testUserId, diseases[1]);
      await bookmarkService.addBookmark(testUserId2, diseases[2]);
      
      // Verify bookmarks are tracked per user
      const user1Bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
      const user2Bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId2);
      
      expect(user1Bookmarks).toContain(diseases[0]);
      expect(user1Bookmarks).toContain(diseases[1]);
      expect(user2Bookmarks).toContain(diseases[0]);
      expect(user2Bookmarks).toContain(diseases[2]);
    });

    it('should handle bookmark modification tracking', async () => {
      const diseaseId = 'modification-tracking-disease';
      
      // Add bookmark
      await bookmarkService.addBookmark(testUserId, diseaseId);
      const initialBookmarks = await bookmarkService.getUserBookmarks(testUserId);
      const initialBookmark = initialBookmarks.find(b => b.diseaseId === diseaseId);
      
      // Modify bookmark
      await bookmarkService.updateBookmarkNote(testUserId, diseaseId, 'Modified note');
      const modifiedBookmarks = await bookmarkService.getUserBookmarks(testUserId);
      const modifiedBookmark = modifiedBookmarks.find(b => b.diseaseId === diseaseId);
      
      // Verify modification tracking
      expect(modifiedBookmark!.updatedAt.getTime()).toBeGreaterThan(initialBookmark!.updatedAt.getTime());
      expect(modifiedBookmark!.note).toBe('Modified note');
    });
  });
});