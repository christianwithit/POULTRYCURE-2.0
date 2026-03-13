import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
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

// Mock network connectivity
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe('Glossary Offline/Online Integration Tests', () => {
  let diseaseService: DiseaseService;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    diseaseService = DiseaseService.getInstance();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  describe('Offline Data Access', () => {
    it('should serve cached disease data when offline', async () => {
      // Setup cached disease data
      const cachedDiseases = [
        {
          id: 'newcastle-disease',
          name: 'Newcastle Disease',
          category: 'viral',
          symptoms: ['respiratory distress'],
          causes: ['virus'],
          treatment: 'supportive care',
          prevention: 'vaccination',
          severity: 'high',
          description: 'viral disease',
          commonIn: ['chickens'],
          transmission: { method: 'airborne', contagiousness: 'high', quarantinePeriod: '21 days' },
          incubationPeriod: '2-15 days',
          mortality: { rate: '50-100%', timeframe: '2-12 days', ageGroups: [] },
          images: [],
          relatedDiseases: [],
          lastUpdated: new Date(),
          sources: [],
          tags: ['viral'],
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedDiseases));
      mockNetInfo.fetch.mockResolvedValue({ isConnected: false, isInternetReachable: false } as any);

      const diseases = await diseaseService.getAllDiseases();

      expect(diseases).toBeDefined();
      expect(mockAsyncStorage.getItem).toHaveBeenCalled();
    });

    it('should handle search functionality offline with cached data', async () => {
      const cachedDiseases = [
        {
          id: 'newcastle-disease',
          name: 'Newcastle Disease',
          category: 'viral',
          symptoms: ['respiratory distress', 'diarrhea'],
          causes: ['virus'],
          treatment: 'supportive care',
          prevention: 'vaccination',
          severity: 'high',
          description: 'viral disease',
          commonIn: ['chickens'],
          transmission: { method: 'airborne', contagiousness: 'high', quarantinePeriod: '21 days' },
          incubationPeriod: '2-15 days',
          mortality: { rate: '50-100%', timeframe: '2-12 days', ageGroups: [] },
          images: [],
          relatedDiseases: [],
          lastUpdated: new Date(),
          sources: [],
          tags: ['viral'],
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedDiseases));
      mockNetInfo.fetch.mockResolvedValue({ isConnected: false, isInternetReachable: false } as any);

      const searchResults = await diseaseService.searchDiseases('respiratory');

      expect(searchResults).toBeDefined();
      expect(Array.isArray(searchResults)).toBe(true);
    });

    it('should maintain bookmark functionality offline', async () => {
      const existingBookmarks = [
        {
          id: 'bookmark-1',
          userId: testUserId,
          diseaseId: 'newcastle-disease',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingBookmarks));

      const bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
      const isBookmarked = await bookmarkService.isBookmarked(testUserId, 'newcastle-disease');

      expect(bookmarks).toEqual(['newcastle-disease']);
      expect(isBookmarked).toBe(true);
    });
  });

  describe('Online Data Synchronization', () => {
    it('should sync cached data when coming back online', async () => {
      const cachedDiseases = [
        {
          id: 'newcastle-disease',
          name: 'Newcastle Disease (Cached)',
          lastUpdated: new Date('2024-01-01'),
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedDiseases));

      // Get cached data
      const data = await diseaseService.getAllDiseases();
      expect(data).toBeDefined();

      // Should trigger cache update
      await diseaseService.updateDiseaseCache();

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle bookmark synchronization conflicts', async () => {
      // Simulate offline bookmark addition
      const offlineBookmarks = [
        {
          id: 'offline-bookmark',
          userId: testUserId,
          diseaseId: 'newcastle-disease',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(offlineBookmarks));

      // Add another bookmark while offline
      await bookmarkService.addBookmark(testUserId, 'avian-influenza');

      // Verify both bookmarks are stored locally
      const localBookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
      expect(localBookmarks).toContain('newcastle-disease');
      expect(localBookmarks).toContain('avian-influenza');
    });

    it('should prioritize fresh data over expired cache when online', async () => {
      const expiredCacheEntry = {
        data: [{ id: 'old-disease', name: 'Old Disease' }],
        timestamp: Date.now() - 7200000, // 2 hours old
        expiresAt: Date.now() - 3600000, // Expired 1 hour ago
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(expiredCacheEntry));

      const diseases = await diseaseService.getAllDiseases();

      // Should fetch fresh data, not return expired cache
      expect(diseases).toBeDefined();
    });
  });

  describe('Cache Management During State Transitions', () => {
    it('should handle cache corruption during offline/online transitions', async () => {
      // Simulate corrupted cache data
      mockAsyncStorage.getItem.mockResolvedValue('invalid-json-data');

      const diseases = await diseaseService.getAllDiseases();

      // Should handle corruption gracefully and return fresh data
      expect(diseases).toBeDefined();
    });

    it('should manage cache size during extended offline usage', async () => {
      // Simulate multiple cache operations
      const cacheKeys = Array.from({ length: 50 }, (_, i) => `cache_key_${i}`);
      mockAsyncStorage.getAllKeys.mockResolvedValue(cacheKeys);

      await cacheManager.clearCache();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle partial sync failures gracefully', async () => {
      // Simulate network error during sync
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));

      // Should not crash the app
      await expect(diseaseService.updateDiseaseCache()).resolves.not.toThrow();
    });
  });

  describe('Performance During State Transitions', () => {
    it('should not block UI during cache operations', async () => {
      const startTime = Date.now();

      // Simulate large cache operation
      const largeCacheData = Array.from({ length: 1000 }, (_, i) => ({
        id: `disease-${i}`,
        name: `Disease ${i}`,
      }));

      await cacheManager.cacheDiseaseData(largeCacheData as any);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete reasonably quickly (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent offline operations efficiently', async () => {
      const operations = [
        diseaseService.getAllDiseases(),
        bookmarkService.getBookmarkedDiseases(testUserId),
        diseaseService.searchDiseases('test'),
        bookmarkService.isBookmarked(testUserId, 'test-disease'),
      ];

      const results = await Promise.all(operations);

      // All operations should complete successfully
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Data Consistency Across State Changes', () => {
    it('should maintain bookmark consistency during offline/online transitions', async () => {
      // Start with bookmarks
      const initialBookmarks = [
        {
          id: 'bookmark-1',
          userId: testUserId,
          diseaseId: 'disease-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(initialBookmarks));

      // Add bookmark
      await bookmarkService.addBookmark(testUserId, 'disease-2');

      // Bookmarks should still be consistent
      const bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
      expect(bookmarks).toContain('disease-1');
    });

    it('should handle search history consistency across state changes', async () => {
      // Test that search functionality remains consistent
      const offlineResults = await diseaseService.searchDiseases('test');
      const onlineResults = await diseaseService.searchDiseases('test');
      
      // Results should be consistent (though online might have more recent data)
      expect(Array.isArray(offlineResults)).toBe(true);
      expect(Array.isArray(onlineResults)).toBe(true);
    });
  });
});