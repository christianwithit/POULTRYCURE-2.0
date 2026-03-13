import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheManager } from '../cacheManager';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('CacheManager', () => {
  const mockDiseases = [
    {
      id: 'test-disease-1',
      name: 'Test Disease 1',
      category: 'viral' as const,
      symptoms: ['symptom1'],
      causes: ['cause1'],
      treatment: 'treatment1',
      prevention: 'prevention1',
      severity: 'moderate' as const,
      description: 'Test disease description',
      commonIn: ['chickens'],
      transmission: {
        method: 'airborne' as const,
        contagiousness: 'moderate' as const,
        quarantinePeriod: '14 days',
      },
      incubationPeriod: '3-7 days',
      mortality: {
        rate: '10-20%',
        timeframe: '5-10 days',
        ageGroups: [],
      },
      images: [],
      relatedDiseases: [],
      lastUpdated: new Date(),
      sources: [],
      tags: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  describe('disease data caching', () => {
    it('should cache disease data successfully', async () => {
      await cacheManager.cacheDiseaseData(mockDiseases);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'disease_cache_v2',
        expect.stringContaining('test-disease-1')
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'cache_metadata',
        expect.stringContaining('lastUpdated')
      );
    });

    it('should load cached disease data successfully', async () => {
      const cachedData = JSON.stringify(mockDiseases);
      mockAsyncStorage.getItem.mockResolvedValue(cachedData);

      const result = await cacheManager.loadCachedDiseaseData();

      expect(result).toBeDefined();
      expect(result![0].id).toBe('test-disease-1');
    });

    it('should return null for non-existent cached data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await cacheManager.loadCachedDiseaseData();

      expect(result).toBeNull();
    });
  });

  describe('cache metadata and validation', () => {
    it('should get cache metadata successfully', async () => {
      const metadata = {
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        diseaseCount: 1,
        isOffline: false,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(metadata));

      const result = await cacheManager.getCacheMetadata();

      expect(result).toBeDefined();
      expect(result!.diseaseCount).toBe(1);
      expect(result!.version).toBe('1.0.0');
    });

    it('should check if cache is expired', async () => {
      const expiredMetadata = {
        lastUpdated: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        version: '1.0.0',
        diseaseCount: 1,
        isOffline: false,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(expiredMetadata));

      const isExpired = await cacheManager.isCacheExpired();

      expect(isExpired).toBe(true);
    });

    it('should return true for expired cache when no metadata exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const isExpired = await cacheManager.isCacheExpired();

      expect(isExpired).toBe(true);
    });
  });

  describe('viewed diseases tracking', () => {
    it('should track viewed disease successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      await cacheManager.trackViewedDisease('test-disease-1');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'viewed_diseases',
        expect.stringContaining('test-disease-1')
      );
    });

    it('should get viewed diseases successfully', async () => {
      const viewedDiseases = [
        {
          diseaseId: 'test-disease-1',
          viewedAt: new Date().toISOString(),
          viewCount: 1,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(viewedDiseases));

      const result = await cacheManager.getViewedDiseases();

      expect(result).toHaveLength(1);
      expect(result[0].diseaseId).toBe('test-disease-1');
    });

    it('should get prioritized disease IDs', async () => {
      const viewedDiseases = [
        {
          diseaseId: 'viewed-disease-1',
          viewedAt: new Date().toISOString(),
          viewCount: 1,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(viewedDiseases));

      const bookmarkedIds = ['bookmarked-disease-1'];
      const result = await cacheManager.getPrioritizedDiseaseIds(bookmarkedIds);

      expect(result).toContain('bookmarked-disease-1');
      expect(result).toContain('viewed-disease-1');
    });
  });

  describe('offline queue management', () => {
    it('should queue offline actions successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      const action = {
        type: 'bookmark_add' as const,
        data: { userId: 'test-user', diseaseId: 'test-disease' },
        timestamp: new Date(),
      };

      await cacheManager.queueOfflineAction(action);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_queue',
        expect.stringContaining('bookmark_add')
      );
    });

    it('should get offline queue successfully', async () => {
      const queue = [
        {
          type: 'bookmark_add',
          data: { userId: 'test-user', diseaseId: 'test-disease' },
          timestamp: new Date().toISOString(),
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(queue));

      const result = await cacheManager.getOfflineQueue();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('bookmark_add');
    });

    it('should clear offline queue successfully', async () => {
      await cacheManager.clearOfflineQueue();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline_queue');
    });
  });

  describe('connectivity management', () => {
    it('should get connectivity status', async () => {
      const isOnline = await cacheManager.getConnectivityStatus();

      expect(typeof isOnline).toBe('boolean');
    });

    it('should store and retrieve connectivity status', async () => {
      const status = {
        isOnline: true,
        lastChecked: new Date().toISOString(),
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(status));

      const result = await cacheManager.getStoredConnectivityStatus();

      expect(result).toBeDefined();
      expect(result!.isOnline).toBe(true);
    });
  });

  describe('cache cleanup and size management', () => {
    it('should clear all cache successfully', async () => {
      await cacheManager.clearCache();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('disease_cache_v2');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('cache_metadata');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('viewed_diseases');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline_queue');
    });

    it('should get cache size information', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('{"test": "data"}');

      const sizeInfo = await cacheManager.getCacheSize();

      expect(sizeInfo).toHaveProperty('diseaseDataSize');
      expect(sizeInfo).toHaveProperty('viewedDiseasesSize');
      expect(sizeInfo).toHaveProperty('totalSize');
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await cacheManager.loadCachedDiseaseData();

      expect(result).toBeNull();
    });

    it('should handle corrupted data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid-json');

      const result = await cacheManager.loadCachedDiseaseData();

      expect(result).toBeNull();
    });
  });
});