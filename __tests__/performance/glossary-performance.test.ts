import { bookmarkService } from '../../services/bookmarkService';
import { cacheManager } from '../../services/cacheManager';
import { DiseaseService } from '../../services/diseaseService';
import { DiseaseCategory } from '../../types/types';

// Mock AsyncStorage for performance testing
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

describe('Glossary Performance Tests', () => {
  let diseaseService: DiseaseService;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    diseaseService = DiseaseService.getInstance();
  });

  describe('Large Dataset Handling', () => {
    it('should handle 1000+ diseases efficiently', async () => {
      const startTime = performance.now();

      // Generate large dataset
      const largeDiseaseList = Array.from({ length: 1000 }, (_, index) => ({
        id: `disease-${index}`,
        name: `Disease ${index}`,
        category: 'viral' as const,
        symptoms: [`symptom-${index}`, `symptom-${index + 1}`],
        causes: [`cause-${index}`],
        treatment: `treatment-${index}`,
        prevention: `prevention-${index}`,
        severity: 'moderate' as const,
        description: `Description for disease ${index}`,
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
        tags: [`tag-${index}`],
      }));

      // Test data processing performance
      const processedDiseases = largeDiseaseList.filter(d => d.category === 'viral');
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processedDiseases).toHaveLength(1000);
      expect(processingTime).toBeLessThan(100); // Should process in under 100ms
    });

    it('should perform search efficiently on large dataset', async () => {
      const largeDiseaseList = Array.from({ length: 5000 }, (_, index) => ({
        id: `disease-${index}`,
        name: `Disease ${index}`,
        category: 'viral' as const,
        symptoms: [`respiratory-${index}`, `fever-${index}`],
        causes: [`virus-${index}`],
        treatment: `treatment-${index}`,
        prevention: `prevention-${index}`,
        severity: 'moderate' as const,
        description: `Respiratory disease affecting poultry ${index}`,
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
        tags: [`respiratory`],
      }));

      const startTime = performance.now();

      // Simulate search operation
      const searchResults = largeDiseaseList.filter(disease => 
        disease.name.toLowerCase().includes('respiratory') ||
        disease.symptoms.some(symptom => symptom.toLowerCase().includes('respiratory')) ||
        disease.description.toLowerCase().includes('respiratory')
      );

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(50); // Search should complete in under 50ms
    });

    it('should handle complex filtering efficiently', async () => {
      const largeDiseaseList = Array.from({ length: 2000 }, (_, index) => ({
        id: `disease-${index}`,
        name: `Disease ${index}`,
        category: (index % 4 === 0 ? 'viral' : index % 4 === 1 ? 'bacterial' : index % 4 === 2 ? 'parasitic' : 'nutritional') as DiseaseCategory,
        symptoms: [`symptom-${index}`],
        causes: [`cause-${index}`],
        treatment: `treatment-${index}`,
        prevention: `prevention-${index}`,
        severity: (index % 3 === 0 ? 'low' : index % 3 === 1 ? 'moderate' : 'high') as 'low' | 'moderate' | 'high',
        description: `Description ${index}`,
        commonIn: index % 2 === 0 ? ['chickens'] : ['turkeys'],
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
      }));

      const startTime = performance.now();

      // Complex multi-criteria filtering
      const filteredResults = largeDiseaseList.filter(disease => 
        disease.category === 'viral' &&
        disease.severity === 'high' &&
        disease.commonIn.includes('chickens')
      );

      const endTime = performance.now();
      const filterTime = endTime - startTime;

      expect(filteredResults.length).toBeGreaterThan(0);
      expect(filterTime).toBeLessThan(30); // Complex filtering should complete in under 30ms
    });
  });

  describe('Cache Performance', () => {
    it('should cache large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        id: `item-${index}`,
        data: `Large data item ${index}`.repeat(100), // Simulate large data
      }));

      const startTime = performance.now();

      await cacheManager.cacheDiseaseData(largeDataset as any);

      const endTime = performance.now();
      const cacheTime = endTime - startTime;

      expect(cacheTime).toBeLessThan(200); // Caching should complete in under 200ms
    });

    it('should retrieve cached data efficiently', async () => {
      const testData = Array.from({ length: 500 }, (_, index) => ({
        id: `cached-item-${index}`,
        name: `Cached Item ${index}`,
      }));

      // First, cache the data
      await cacheManager.cacheDiseaseData(testData as any);

      const startTime = performance.now();

      const retrievedData = await cacheManager.loadCachedDiseaseData();

      const endTime = performance.now();
      const retrievalTime = endTime - startTime;

      expect(retrievedData).toEqual(testData);
      expect(retrievalTime).toBeLessThan(50); // Retrieval should complete in under 50ms
    });

    it('should handle cache cleanup efficiently', async () => {
      // Simulate multiple cache entries by caching disease data multiple times
      const cachePromises = Array.from({ length: 10 }, (_, index) => 
        cacheManager.cacheDiseaseData([{ 
          id: `test-disease-${index}`, 
          name: `Test Disease ${index}`,
          category: 'viral' as const,
          symptoms: [],
          causes: [],
          treatment: '',
          prevention: '',
          severity: 'low' as const,
          description: '',
          commonIn: [],
          transmission: { method: 'direct' as const, contagiousness: 'low' as const, quarantinePeriod: '' },
          incubationPeriod: '',
          mortality: { rate: '', timeframe: '', ageGroups: [] },
          images: [],
          relatedDiseases: [],
          lastUpdated: new Date(),
          sources: [],
          tags: []
        }])
      );

      await Promise.all(cachePromises);

      const startTime = performance.now();

      await cacheManager.clearCache();

      const endTime = performance.now();
      const cleanupTime = endTime - startTime;

      expect(cleanupTime).toBeLessThan(100); // Cleanup should complete in under 100ms
    });
  });

  describe('Bookmark Performance', () => {
    it('should handle large number of bookmarks efficiently', async () => {
      const bookmarkPromises = Array.from({ length: 1000 }, (_, index) => 
        bookmarkService.addBookmark(testUserId, `disease-${index}`)
      );

      const startTime = performance.now();

      await Promise.all(bookmarkPromises);

      const endTime = performance.now();
      const bookmarkTime = endTime - startTime;

      expect(bookmarkTime).toBeLessThan(500); // Should handle 1000 bookmarks in under 500ms
    });

    it('should retrieve bookmarks efficiently', async () => {
      // Add some bookmarks first
      const bookmarkPromises = Array.from({ length: 100 }, (_, index) => 
        bookmarkService.addBookmark(testUserId, `disease-${index}`)
      );
      await Promise.all(bookmarkPromises);

      const startTime = performance.now();

      const bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);

      const endTime = performance.now();
      const retrievalTime = endTime - startTime;

      expect(bookmarks).toBeDefined();
      expect(retrievalTime).toBeLessThan(50); // Retrieval should be fast
    });

    it('should check bookmark status efficiently', async () => {
      // Add some bookmarks
      await bookmarkService.addBookmark(testUserId, 'test-disease-1');
      await bookmarkService.addBookmark(testUserId, 'test-disease-2');

      const startTime = performance.now();

      // Check multiple bookmark statuses
      const checkPromises = Array.from({ length: 100 }, (_, index) => 
        bookmarkService.isBookmarked(testUserId, `test-disease-${index}`)
      );

      const results = await Promise.all(checkPromises);

      const endTime = performance.now();
      const checkTime = endTime - startTime;

      expect(results).toHaveLength(100);
      expect(checkTime).toBeLessThan(100); // Should check 100 bookmarks in under 100ms
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform repeated operations
      for (let i = 0; i < 100; i++) {
        const diseases = await diseaseService.getAllDiseases();
        const searchResults = await diseaseService.searchDiseases('test');
        await bookmarkService.getBookmarkedDiseases(testUserId);
        
        // Clear references to help GC
        diseases.length = 0;
        searchResults.length = 0;
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle concurrent operations without excessive memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create multiple concurrent operations
      const operations = Array.from({ length: 50 }, () => [
        diseaseService.getAllDiseases(),
        diseaseService.searchDiseases('respiratory'),
        bookmarkService.getBookmarkedDiseases(testUserId),
        cacheManager.loadCachedDiseaseData(),
      ]).flat();

      await Promise.all(operations);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable even with concurrent operations
      expect(memoryIncrease).toBeLessThan(15 * 1024 * 1024);
    });
  });

  describe('Response Time Benchmarks', () => {
    it('should meet response time requirements for critical operations', async () => {
      const benchmarks = {
        getAllDiseases: 100, // 100ms max
        searchDiseases: 50,  // 50ms max
        getDiseaseById: 30,  // 30ms max
        isBookmarked: 20,    // 20ms max
        cacheGet: 25,        // 25ms max
      };

      // Test getAllDiseases
      let startTime = performance.now();
      await diseaseService.getAllDiseases();
      let endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(benchmarks.getAllDiseases);

      // Test searchDiseases
      startTime = performance.now();
      await diseaseService.searchDiseases('test');
      endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(benchmarks.searchDiseases);

      // Test getDiseaseById
      startTime = performance.now();
      await diseaseService.getDiseaseById('test-disease');
      endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(benchmarks.getDiseaseById);

      // Test isBookmarked
      startTime = performance.now();
      await bookmarkService.isBookmarked(testUserId, 'test-disease');
      endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(benchmarks.isBookmarked);

      // Test cache get
      startTime = performance.now();
      await cacheManager.loadCachedDiseaseData();
      endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(benchmarks.cacheGet);
    });

    it('should maintain performance under load', async () => {
      const operationCount = 100;
      const maxAverageTime = 30; // 30ms average

      const startTime = performance.now();

      // Perform multiple operations
      const operations = Array.from({ length: operationCount }, () => 
        diseaseService.searchDiseases('test')
      );

      await Promise.all(operations);

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / operationCount;

      expect(averageTime).toBeLessThan(maxAverageTime);
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with dataset size', async () => {
      const smallDataset = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));

      // Test small dataset
      const smallStartTime = performance.now();
      const smallFiltered = smallDataset.filter(item => item.name.includes('1'));
      const smallEndTime = performance.now();
      const smallTime = smallEndTime - smallStartTime;

      // Test large dataset
      const largeStartTime = performance.now();
      const largeFiltered = largeDataset.filter(item => item.name.includes('1'));
      const largeEndTime = performance.now();
      const largeTime = largeEndTime - largeStartTime;

      // Performance should scale reasonably (not more than 20x slower for 10x data)
      const scalingFactor = largeTime / smallTime;
      expect(scalingFactor).toBeLessThan(20);

      expect(smallFiltered.length).toBeGreaterThan(0);
      expect(largeFiltered.length).toBeGreaterThan(0);
    });

    it('should handle increasing concurrent users efficiently', async () => {
      const userCounts = [1, 5, 10, 20];
      const results: number[] = [];

      for (const userCount of userCounts) {
        const startTime = performance.now();

        const userOperations = Array.from({ length: userCount }, (_, userIndex) => 
          Promise.all([
            diseaseService.getAllDiseases(),
            bookmarkService.getBookmarkedDiseases(`user-${userIndex}`),
            diseaseService.searchDiseases('test'),
          ])
        );

        await Promise.all(userOperations);

        const endTime = performance.now();
        results.push(endTime - startTime);
      }

      // Performance degradation should be reasonable
      // 20 concurrent users shouldn't take more than 5x longer than 1 user
      const performanceDegradation = results[3] / results[0];
      expect(performanceDegradation).toBeLessThan(5);
    });
  });
});