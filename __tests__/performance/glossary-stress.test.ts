import { bookmarkService } from '../../services/bookmarkService';
import { cacheManager } from '../../services/cacheManager';
import { DiseaseService } from '../../services/diseaseService';
import { searchHistoryService } from '../../services/searchHistoryService';
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
    fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
    addEventListener: jest.fn(() => jest.fn()),
}));

describe('Glossary Stress Tests', () => {
    let diseaseService: DiseaseService;
    const testUserId = 'stress-test-user';

    beforeEach(() => {
        jest.clearAllMocks();
        diseaseService = DiseaseService.getInstance();

        // Setup AsyncStorage mock for performance testing
        const mockAsyncStorage = require('@react-native-async-storage/async-storage');
        const storage = new Map();
        mockAsyncStorage.getItem.mockImplementation((key: string) => {
            return Promise.resolve(storage.get(key) || null);
        });
        mockAsyncStorage.setItem.mockImplementation((key: string, value: string) => {
            storage.set(key, value);
            return Promise.resolve();
        });
        mockAsyncStorage.removeItem.mockImplementation((key: string) => {
            storage.delete(key);
            return Promise.resolve();
        });
    });

    describe('High Volume Search Operations', () => {
        it('should handle rapid consecutive searches', async () => {
            const searchQueries = [
                'respiratory', 'viral', 'bacterial', 'fever', 'coughing',
                'newcastle', 'avian', 'influenza', 'salmonella', 'parasitic'
            ];

            const startTime = performance.now();

            // Perform rapid consecutive searches
            const searchPromises = searchQueries.map(query =>
                diseaseService.searchDiseases(query)
            );

            const results = await Promise.all(searchPromises);

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            expect(results).toHaveLength(searchQueries.length);
            results.forEach(result => {
                expect(Array.isArray(result)).toBe(true);
            });

            // Should handle 10 concurrent searches in under 500ms
            expect(totalTime).toBeLessThan(500);
        });

        it('should maintain performance with complex search patterns', async () => {
            const complexQueries = [
                'respiratory distress in chickens',
                'viral infection high mortality',
                'bacterial disease prevention methods',
                'parasitic symptoms treatment options',
                'nutritional deficiency young birds'
            ];

            const startTime = performance.now();

            for (const query of complexQueries) {
                const results = await diseaseService.searchDiseases(query);
                expect(Array.isArray(results)).toBe(true);
            }

            const endTime = performance.now();
            const averageTime = (endTime - startTime) / complexQueries.length;

            // Each complex search should complete in under 50ms on average
            expect(averageTime).toBeLessThan(50);
        });

        it('should handle search with large result sets efficiently', async () => {
            // Search for common terms that should return many results
            const broadQueries = ['disease', 'symptoms', 'treatment', 'prevention'];

            const startTime = performance.now();

            const results = await Promise.all(
                broadQueries.map(query => diseaseService.searchDiseases(query))
            );

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // Should handle broad searches returning large result sets
            results.forEach(result => {
                expect(Array.isArray(result)).toBe(true);
            });

            expect(totalTime).toBeLessThan(200);
        });
    });

    describe('High Volume Bookmark Operations', () => {
        it('should handle mass bookmark operations', async () => {
            const numberOfBookmarks = 500;
            const diseaseIds = Array.from({ length: numberOfBookmarks }, (_, i) => `stress-disease-${i}`);

            const startTime = performance.now();

            // Add bookmarks in batches to simulate realistic usage
            const batchSize = 50;
            for (let i = 0; i < diseaseIds.length; i += batchSize) {
                const batch = diseaseIds.slice(i, i + batchSize);
                const batchPromises = batch.map(id => bookmarkService.addBookmark(testUserId, id));
                await Promise.all(batchPromises);
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // Verify all bookmarks were added
            const bookmarks = await bookmarkService.getBookmarkedDiseases(testUserId);
            expect(bookmarks).toHaveLength(numberOfBookmarks);

            // Should complete mass bookmark operations in reasonable time
            expect(totalTime).toBeLessThan(2000); // 2 seconds for 500 bookmarks
        });

        it('should handle rapid bookmark status checks', async () => {
            // Add some bookmarks first
            const testDiseases = Array.from({ length: 100 }, (_, i) => `check-disease-${i}`);
            await Promise.all(
                testDiseases.slice(0, 50).map(id => bookmarkService.addBookmark(testUserId, id))
            );

            const startTime = performance.now();

            // Check bookmark status for all diseases
            const statusChecks = testDiseases.map(id =>
                bookmarkService.isBookmarked(testUserId, id)
            );

            const results = await Promise.all(statusChecks);

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            expect(results).toHaveLength(testDiseases.length);

            // First 50 should be bookmarked, rest should not be
            results.slice(0, 50).forEach(result => expect(result).toBe(true));
            results.slice(50).forEach(result => expect(result).toBe(false));

            // Should check 100 bookmark statuses in under 200ms
            expect(totalTime).toBeLessThan(200);
        });

        it('should handle concurrent bookmark modifications', async () => {
            const diseaseId = 'concurrent-modification-disease';

            // Add initial bookmark
            await bookmarkService.addBookmark(testUserId, diseaseId);

            const startTime = performance.now();

            // Perform concurrent modifications
            const operations = [
                bookmarkService.updateBookmarkNote(testUserId, diseaseId, 'Note 1'),
                bookmarkService.updateBookmarkNote(testUserId, diseaseId, 'Note 2'),
                bookmarkService.updateBookmarkNote(testUserId, diseaseId, 'Note 3'),
                bookmarkService.isBookmarked(testUserId, diseaseId),
                bookmarkService.getUserBookmarkNotes(testUserId, diseaseId),
            ];

            const results = await Promise.all(operations);

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            expect(results[3]).toBe(true); // isBookmarked should return true
            expect(totalTime).toBeLessThan(100);
        });
    });

    describe('Cache Performance Under Load', () => {
        it('should handle frequent cache operations', async () => {
            const cacheOperations = 100;
            const testData = Array.from({ length: 10 }, (_, i) => ({
                id: `cache-test-${i}`,
                name: `Cache Test Disease ${i}`,
                category: 'viral' as const,
                symptoms: [`symptom-${i}`],
                causes: [`cause-${i}`],
                treatment: `treatment-${i}`,
                prevention: `prevention-${i}`,
                severity: 'moderate' as const,
                description: `Test disease ${i}`,
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
            }));

            const startTime = performance.now();

            // Perform frequent cache operations
            for (let i = 0; i < cacheOperations; i++) {
                await cacheManager.cacheDiseaseData(testData);
                await cacheManager.loadCachedDiseaseData();
            }

            const endTime = performance.now();
            const averageTime = (endTime - startTime) / cacheOperations;

            // Each cache operation should be fast
            expect(averageTime).toBeLessThan(10);
        });

        it('should handle cache with large datasets', async () => {
            const largeDataset = Array.from({ length: 2000 }, (_, i) => ({
                id: `large-dataset-${i}`,
                name: `Disease ${i}`,
                category: (i % 4 === 0 ? 'viral' : i % 4 === 1 ? 'bacterial' : i % 4 === 2 ? 'parasitic' : 'nutritional') as DiseaseCategory,
                symptoms: [`symptom-${i}`, `symptom-${i + 1}`],
                causes: [`cause-${i}`],
                treatment: `treatment-${i}`,
                prevention: `prevention-${i}`,
                severity: (i % 3 === 0 ? 'low' : i % 3 === 1 ? 'moderate' : 'high') as 'low' | 'moderate' | 'high',
                description: `Large dataset test disease ${i}`,
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
            }));

            const startTime = performance.now();

            await cacheManager.cacheDiseaseData(largeDataset);
            const retrievedData = await cacheManager.loadCachedDiseaseData();

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            expect(retrievedData).toHaveLength(largeDataset.length);
            expect(totalTime).toBeLessThan(1000); // Should handle 2000 diseases in under 1 second
        });

        it('should maintain performance during cache cleanup', async () => {
            // Fill cache with data
            const datasets = Array.from({ length: 20 }, (_, i) =>
                Array.from({ length: 50 }, (_, j) => ({
                    id: `cleanup-test-${i}-${j}`,
                    name: `Cleanup Test ${i}-${j}`,
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
                }))
            );

            // Cache multiple datasets
            for (const dataset of datasets) {
                await cacheManager.cacheDiseaseData(dataset);
            }

            const startTime = performance.now();

            // Clear cache
            await cacheManager.clearCache();

            const endTime = performance.now();
            const cleanupTime = endTime - startTime;

            expect(cleanupTime).toBeLessThan(200); // Cache cleanup should be fast
        });
    });

    describe('Search History Performance', () => {
        it('should handle large search history efficiently', async () => {
            const numberOfSearches = 1000;
            const searchQueries = Array.from({ length: numberOfSearches }, (_, i) =>
                `search query ${i}`
            );

            const startTime = performance.now();

            // Add searches to history
            for (const query of searchQueries) {
                await searchHistoryService.addRecentSearch(query);
            }

            // Retrieve recent searches
            const recentSearches = await searchHistoryService.getRecentSearches();

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            expect(Array.isArray(recentSearches)).toBe(true);
            expect(totalTime).toBeLessThan(1000); // Should handle 1000 search history entries in under 1 second
        });

        it('should maintain performance with frequent history access', async () => {
            // Add some search history
            const queries = ['query1', 'query2', 'query3', 'query4', 'query5'];
            for (const query of queries) {
                await searchHistoryService.addRecentSearch(query);
            }

            const startTime = performance.now();

            // Perform frequent history access
            const accessOperations = Array.from({ length: 100 }, () =>
                searchHistoryService.getRecentSearches()
            );

            const results = await Promise.all(accessOperations);

            const endTime = performance.now();
            const averageTime = (endTime - startTime) / accessOperations.length;

            results.forEach(result => {
                expect(Array.isArray(result)).toBe(true);
            });

            expect(averageTime).toBeLessThan(5); // Each history access should be very fast
        });
    });

    describe('Memory Usage Under Load', () => {
        it('should not leak memory during repeated operations', async () => {
            const initialMemory = process.memoryUsage().heapUsed;

            // Perform many operations
            for (let i = 0; i < 200; i++) {
                await diseaseService.searchDiseases(`test query ${i}`);
                await bookmarkService.addBookmark(testUserId, `memory-test-${i}`);
                await bookmarkService.isBookmarked(testUserId, `memory-test-${i}`);

                // Clear references periodically
                if (i % 50 === 0 && global.gc) {
                    global.gc();
                }
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (less than 50MB)
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });

        it('should handle memory efficiently with large result sets', async () => {
            const initialMemory = process.memoryUsage().heapUsed;

            // Perform searches that return large result sets
            const broadSearches = ['', 'disease', 'symptoms', 'treatment'];

            for (let i = 0; i < 10; i++) {
                for (const query of broadSearches) {
                    const results = await diseaseService.searchDiseases(query);
                    // Process results to simulate real usage
                    results.forEach(disease => {
                        const _ = disease.name + disease.description;
                    });
                }
            }

            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // Should not accumulate excessive memory
            expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
        });
    });

    describe('Concurrent User Simulation', () => {
        it('should handle multiple concurrent users efficiently', async () => {
            const numberOfUsers = 20;
            const users = Array.from({ length: numberOfUsers }, (_, i) => `stress-user-${i}`);

            const startTime = performance.now();

            // Simulate concurrent user operations
            const userOperations = users.map(async (userId) => {
                // Each user performs multiple operations
                await diseaseService.searchDiseases('respiratory');
                await bookmarkService.addBookmark(userId, 'popular-disease');
                await bookmarkService.isBookmarked(userId, 'popular-disease');
                await searchHistoryService.addRecentSearch('user search');
                return userId;
            });

            const results = await Promise.all(userOperations);

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            expect(results).toHaveLength(numberOfUsers);
            expect(totalTime).toBeLessThan(1000); // 20 concurrent users should complete in under 1 second
        });

        it('should maintain data isolation under concurrent load', async () => {
            const users = ['isolation-user-1', 'isolation-user-2', 'isolation-user-3'];

            // Each user bookmarks different diseases concurrently
            const operations = users.map(async (userId, index) => {
                const diseaseId = `user-${index}-disease`;
                await bookmarkService.addBookmark(userId, diseaseId);
                return { userId, diseaseId };
            });

            const results = await Promise.all(operations);

            // Verify data isolation
            for (const { userId, diseaseId } of results) {
                const userBookmarks = await bookmarkService.getBookmarkedDiseases(userId);
                expect(userBookmarks).toContain(diseaseId);

                // Verify other users don't have this bookmark
                for (const otherUser of users) {
                    if (otherUser !== userId) {
                        const otherBookmarks = await bookmarkService.getBookmarkedDiseases(otherUser);
                        expect(otherBookmarks).not.toContain(diseaseId);
                    }
                }
            }
        });
    });

    describe('Error Recovery Under Load', () => {
        it('should recover gracefully from errors during high load', async () => {
            let errorCount = 0;
            const totalOperations = 100;

            // Simulate operations with occasional errors
            const operations = Array.from({ length: totalOperations }, async (_, i) => {
                try {
                    if (i % 10 === 0) {
                        // Simulate error every 10th operation
                        throw new Error(`Simulated error ${i}`);
                    }

                    await diseaseService.searchDiseases(`query ${i}`);
                    return 'success';
                } catch (error) {
                    errorCount++;
                    return 'error';
                }
            });

            const results = await Promise.all(operations);

            const successCount = results.filter(r => r === 'success').length;

            expect(errorCount).toBe(10); // Should have 10 simulated errors
            expect(successCount).toBe(90); // Should have 90 successful operations

            // System should continue functioning after errors
            const finalSearch = await diseaseService.searchDiseases('recovery test');
            expect(Array.isArray(finalSearch)).toBe(true);
        });
    });
});