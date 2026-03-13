/**
 * Performance Optimization Tests
 * Tests for the performance monitoring and optimization features
 */

import { imageCacheService } from '../../services/imageCacheService';
import { ExtendedDiseaseInfo } from '../../types/types';
import { memoryMonitor } from '../../utils/memoryMonitor';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { searchOptimizer } from '../../utils/searchOptimization';

// Mock data for testing
const mockDiseases: ExtendedDiseaseInfo[] = Array.from({ length: 1000 }, (_, index) => ({
  id: `disease-${index}`,
  name: `Disease ${index}`,
  description: `Description for disease ${index}`,
  symptoms: [`Symptom ${index}A`, `Symptom ${index}B`],
  causes: [`Cause ${index}A`, `Cause ${index}B`],
  treatment: `Treatment for disease ${index}`,
  prevention: `Prevention for disease ${index}`,
  severity: index % 3 === 0 ? 'high' : index % 2 === 0 ? 'moderate' : 'low',
  affectedSpecies: ['chickens'],
  commonIn: ['poultry farms', 'backyard flocks'],
  category: 'viral',
  transmission: {
    method: 'direct',
    contagiousness: 'moderate',
    quarantinePeriod: '7 days',
  },
  incubationPeriod: '3-5 days',
  mortality: {
    rate: '5-10%',
    timeframe: '1-2 weeks',
    ageGroups: [],
  },
  images: [],
  relatedDiseases: [],
  lastUpdated: new Date(),
  sources: [],
  tags: [`tag${index}`, 'test'],
}));

describe('Performance Optimization', () => {
  beforeEach(() => {
    // Clear all monitoring data before each test
    performanceMonitor.clearMetrics();
    memoryMonitor.clearData();
    searchOptimizer.clearCache();
  });

  describe('Performance Monitor', () => {
    it('should track operation metrics', () => {
      performanceMonitor.startMetric('test_operation');
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      
      const duration = performanceMonitor.endMetric('test_operation');
      
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should be reasonable
      
      const metric = performanceMonitor.getMetric('test_operation');
      expect(metric).toBeDefined();
      expect(metric?.duration).toBe(duration);
    });

    it('should track search performance', () => {
      const searchMetrics = {
        queryLength: 5,
        resultCount: 10,
        searchTime: 50,
        filterTime: 20,
        renderTime: 30,
      };
      
      performanceMonitor.trackSearchPerformance(searchMetrics);
      
      const stats = performanceMonitor.getSearchStats();
      expect(stats.averageSearchTime).toBe(50);
      expect(stats.averageFilterTime).toBe(20);
      expect(stats.averageRenderTime).toBe(30);
    });

    it('should generate performance report', () => {
      performanceMonitor.startMetric('operation1');
      performanceMonitor.endMetric('operation1');
      
      performanceMonitor.trackSearchPerformance({
        queryLength: 3,
        resultCount: 5,
        searchTime: 25,
        filterTime: 10,
        renderTime: 15,
      });
      
      const report = performanceMonitor.generateReport();
      
      expect(report).toContain('Performance Report');
      expect(report).toContain('Search Performance');
      expect(report).toContain('Memory Usage');
    });
  });

  describe('Memory Monitor', () => {
    it('should track component registration', () => {
      memoryMonitor.registerComponent('TestComponent');
      memoryMonitor.registerComponent('TestComponent');
      memoryMonitor.registerComponent('AnotherComponent');
      
      const stats = memoryMonitor.getMemoryStats();
      
      expect(stats.componentBreakdown.TestComponent).toBe(2);
      expect(stats.componentBreakdown.AnotherComponent).toBe(1);
    });

    it('should track image registration', () => {
      memoryMonitor.registerImage('image1.jpg');
      memoryMonitor.registerImage('image2.jpg');
      
      const snapshot = memoryMonitor.captureSnapshot();
      
      expect(snapshot.imageCount).toBe(2);
    });

    it('should handle component unregistration', () => {
      memoryMonitor.registerComponent('TestComponent');
      memoryMonitor.registerComponent('TestComponent');
      memoryMonitor.unregisterComponent('TestComponent');
      
      const stats = memoryMonitor.getMemoryStats();
      
      expect(stats.componentBreakdown.TestComponent).toBe(1);
    });

    it('should trigger cleanup callbacks', () => {
      let cleanupCalled = false;
      const cleanupCallback = () => {
        cleanupCalled = true;
      };
      
      memoryMonitor.addCleanupCallback(cleanupCallback);
      memoryMonitor.triggerCleanup();
      
      expect(cleanupCalled).toBe(true);
    });
  });

  describe('Image Cache Service', () => {
    it('should track cache statistics', () => {
      const stats = imageCacheService.getCacheStats();
      
      expect(stats).toHaveProperty('totalItems');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('maxSize');
    });

    it('should optimize image URIs', () => {
      const originalUri = 'https://example.com/image.jpg';
      const optimizedUri = imageCacheService.getOptimizedUri(originalUri, 300, 200);
      
      expect(optimizedUri).toContain('w=300');
      expect(optimizedUri).toContain('h=200');
      expect(optimizedUri).toContain('q=');
    });

    it('should handle cache clearing', async () => {
      await imageCacheService.clearCache();
      
      const stats = imageCacheService.getCacheStats();
      expect(stats.totalItems).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe('Search Optimizer', () => {
    beforeEach(() => {
      searchOptimizer.buildIndex(mockDiseases);
    });

    it('should build search index efficiently', () => {
      const startTime = Date.now();
      searchOptimizer.buildIndex(mockDiseases);
      const buildTime = Date.now() - startTime;
      
      // Building index for 1000 diseases should be fast
      expect(buildTime).toBeLessThan(1000); // Less than 1 second
      
      const stats = searchOptimizer.getSearchStats();
      expect(stats.totalDiseases).toBe(1000);
      expect(stats.indexSize).toBeGreaterThan(0);
    });

    it('should perform fast searches', () => {
      const startTime = Date.now();
      const results = searchOptimizer.search('disease');
      const searchTime = Date.now() - startTime;
      
      // Search should be fast
      expect(searchTime).toBeLessThan(300); // Less than 300ms (reasonable for 1000 items)
      expect(results.length).toBeGreaterThan(0);
      
      // Results should be scored
      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0);
        expect(result.disease).toBeDefined();
        expect(result.matchedFields).toBeDefined();
      });
    });

    it('should provide search suggestions', () => {
      const suggestions = searchOptimizer.getSuggestions('dis', 5);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should cache search results', () => {
      // First search
      const startTime1 = Date.now();
      const results1 = searchOptimizer.search('test query');
      const searchTime1 = Date.now() - startTime1;
      
      // Second search (should be cached)
      const startTime2 = Date.now();
      const results2 = searchOptimizer.search('test query');
      const searchTime2 = Date.now() - startTime2;
      
      // Cached search should be faster
      expect(searchTime2).toBeLessThan(searchTime1);
      expect(results1).toEqual(results2);
    });

    it('should handle fuzzy search', () => {
      const results = searchOptimizer.search('diseas'); // Missing 'e'
      
      expect(results.length).toBeGreaterThan(0);
      
      // Should find diseases even with typo
      const hasRelevantResults = results.some(result => 
        result.disease.name.toLowerCase().includes('disease')
      );
      expect(hasRelevantResults).toBe(true);
    });
  });

  describe('Performance Thresholds', () => {
    it('should detect slow operations', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      performanceMonitor.startMetric('slow_operation');
      
      // Simulate slow operation
      const start = Date.now();
      while (Date.now() - start < 1100) {
        // Wait more than 1 second
      }
      
      performanceMonitor.endMetric('slow_operation');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow operation detected')
      );
      
      consoleSpy.mockRestore();
    });

    it('should detect slow searches', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      performanceMonitor.trackSearchPerformance({
        queryLength: 10,
        resultCount: 100,
        searchTime: 600, // Slow search
        filterTime: 0,
        renderTime: 0,
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow search detected')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Bundle Optimization', () => {
    it('should handle lazy component creation', async () => {
      const { createLazyComponent } = await import('../../utils/bundleOptimization');
      
      const LazyComponent = createLazyComponent(
        () => Promise.resolve({ default: () => null })
      );
      
      expect(LazyComponent).toBeDefined();
    });

    it('should provide service loading functions', async () => {
      const { loadService } = await import('../../utils/bundleOptimization');
      
      expect(loadService.diseaseService).toBeDefined();
      expect(loadService.bookmarkService).toBeDefined();
      expect(loadService.shareService).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle large dataset performance', () => {
      const largeDiseases = Array.from({ length: 5000 }, (_, index) => ({
        ...mockDiseases[0],
        id: `large-disease-${index}`,
        name: `Large Disease ${index}`,
      }));
      
      const startTime = Date.now();
      searchOptimizer.buildIndex(largeDiseases);
      const buildTime = Date.now() - startTime;
      
      // Should handle large datasets efficiently
      expect(buildTime).toBeLessThan(5000); // Less than 5 seconds
      
      const searchStartTime = Date.now();
      const results = searchOptimizer.search('large');
      const searchTime = Date.now() - searchStartTime;
      
      // Search should still be fast
      expect(searchTime).toBeLessThan(500); // Less than 500ms
      expect(results.length).toBeGreaterThan(0);
    });

    it('should maintain performance under memory pressure', () => {
      // Simulate memory pressure
      for (let i = 0; i < 100; i++) {
        memoryMonitor.registerComponent(`Component${i}`);
        memoryMonitor.registerImage(`image${i}.jpg`);
      }
      
      const snapshot = memoryMonitor.captureSnapshot();
      expect(snapshot.componentCount).toBe(100);
      expect(snapshot.imageCount).toBe(100);
      
      // Trigger cleanup
      memoryMonitor.triggerCleanup();
      
      // Should still function normally
      const stats = memoryMonitor.getMemoryStats();
      expect(stats.current).toBeDefined();
    });
  });
});