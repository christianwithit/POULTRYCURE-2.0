import { bookmarkService } from '../../services/bookmarkService';
import { DiseaseService } from '../../services/diseaseService';
import { searchHistoryService } from '../../services/searchHistoryService';
import { DiseaseCategory, FilterCriteria } from '../../types/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = require('@react-native-async-storage/async-storage');

describe('Glossary Search Integration Tests', () => {
  let diseaseService: DiseaseService;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    diseaseService = DiseaseService.getInstance();
    
    // Setup AsyncStorage mock to work with bookmark service
    const bookmarkStorage = new Map();
    mockAsyncStorage.getItem.mockImplementation((key: string) => {
      return Promise.resolve(bookmarkStorage.get(key) || null);
    });
    mockAsyncStorage.setItem.mockImplementation((key: string, value: string) => {
      bookmarkStorage.set(key, value);
      return Promise.resolve();
    });
    mockAsyncStorage.removeItem.mockImplementation((key: string) => {
      bookmarkStorage.delete(key);
      return Promise.resolve();
    });
  });

  describe('Search and Bookmark Integration', () => {
    it('should integrate search results with bookmark status', async () => {
      // Add a bookmark first
      await bookmarkService.addBookmark(testUserId, 'newcastle-disease');
      
      // Search for diseases
      const searchResults = await diseaseService.searchDiseases('newcastle');
      
      // Check if the bookmarked disease is in results
      const newcastleDisease = searchResults.find(d => d.id === 'newcastle-disease');
      if (newcastleDisease) {
        const isBookmarked = await bookmarkService.isBookmarked(testUserId, 'newcastle-disease');
        expect(isBookmarked).toBe(true);
      }
    });

    it('should maintain bookmark status across different search queries', async () => {
      // Bookmark a disease
      await bookmarkService.addBookmark(testUserId, 'avian-influenza');
      
      // Search with different queries that should return the same disease
      const queries = ['avian', 'influenza', 'flu', 'respiratory'];
      
      for (const query of queries) {
        const results = await diseaseService.searchDiseases(query);
        const avianFlu = results.find(d => d.id === 'avian-influenza');
        
        if (avianFlu) {
          const isBookmarked = await bookmarkService.isBookmarked(testUserId, 'avian-influenza');
          expect(isBookmarked).toBe(true);
        }
      }
    });

    it('should handle bookmark operations during active search sessions', async () => {
      // Perform a search
      const initialResults = await diseaseService.searchDiseases('viral');
      expect(initialResults.length).toBeGreaterThan(0);
      
      // Bookmark a disease from the results
      const firstDisease = initialResults[0];
      await bookmarkService.addBookmark(testUserId, firstDisease.id);
      
      // Verify bookmark was added
      const isBookmarked = await bookmarkService.isBookmarked(testUserId, firstDisease.id);
      expect(isBookmarked).toBe(true);
      
      // Search again and verify bookmark status persists
      const newResults = await diseaseService.searchDiseases('viral');
      const sameDisease = newResults.find(d => d.id === firstDisease.id);
      expect(sameDisease).toBeDefined();
    });
  });

  describe('Search History Integration', () => {
    it('should track search queries in history', async () => {
      const searchQuery = 'respiratory distress';
      
      // Perform search
      await diseaseService.searchDiseases(searchQuery);
      
      // Add to search history
      await searchHistoryService.addRecentSearch(searchQuery);
      
      // Verify search was recorded
      const recentSearches = await searchHistoryService.getRecentSearches();
      const queryStrings = recentSearches.map(s => s.query);
      expect(queryStrings).toContain(searchQuery);
    });

    it('should provide search suggestions based on history', async () => {
      const historicalQueries = [
        'respiratory distress',
        'respiratory infection',
        'respiratory symptoms'
      ];
      
      // Add queries to history
      for (const query of historicalQueries) {
        await searchHistoryService.addRecentSearch(query);
      }
      
      // Get suggestions for partial query
      const suggestions = await diseaseService.getSearchSuggestions('resp');
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // Should include historical queries in suggestions
      const historicalSuggestions = suggestions.filter(s => 
        historicalQueries.some(hq => hq.includes(s.text))
      );
      expect(historicalSuggestions.length).toBeGreaterThan(0);
    });

    it('should limit search history to prevent storage bloat', async () => {
      // Add many search queries
      const manyQueries = Array.from({ length: 50 }, (_, i) => `query ${i}`);
      
      for (const query of manyQueries) {
        await searchHistoryService.addRecentSearch(query);
      }
      
      const recentSearches = await searchHistoryService.getRecentSearches();
      
      // Should limit to reasonable number (e.g., 20 most recent)
      expect(recentSearches.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Search Performance Integration', () => {
    it('should maintain performance when combining search with bookmarks', async () => {
      // Add multiple bookmarks
      const diseases = await diseaseService.getAllDiseases();
      const bookmarkPromises = diseases.slice(0, 10).map(d => 
        bookmarkService.addBookmark(testUserId, d.id)
      );
      await Promise.all(bookmarkPromises);
      
      // Perform search and check bookmarks
      const startTime = Date.now();
      
      const searchResults = await diseaseService.searchDiseases('');
      const bookmarkChecks = searchResults.map(d => 
        bookmarkService.isBookmarked(testUserId, d.id)
      );
      await Promise.all(bookmarkChecks);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(200); // Should complete in under 200ms
    });

    it('should handle concurrent search and bookmark operations', async () => {
      const operations = [
        diseaseService.searchDiseases('viral'),
        diseaseService.searchDiseases('bacterial'),
        bookmarkService.addBookmark(testUserId, 'test-disease-1'),
        bookmarkService.addBookmark(testUserId, 'test-disease-2'),
        searchHistoryService.addRecentSearch('concurrent test'),
      ];
      
      const startTime = Date.now();
      const results = await Promise.all(operations);
      const endTime = Date.now();
      
      expect(results).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(300); // All operations should complete quickly
    });
  });

  describe('Search Result Consistency', () => {
    it('should return consistent results for identical queries', async () => {
      const query = 'respiratory distress';
      
      const results1 = await diseaseService.searchDiseases(query);
      const results2 = await diseaseService.searchDiseases(query);
      
      expect(results1.length).toBe(results2.length);
      
      // Results should be in the same order
      for (let i = 0; i < results1.length; i++) {
        expect(results1[i].id).toBe(results2[i].id);
      }
    });

    it('should handle case-insensitive searches consistently', async () => {
      const queries = ['Newcastle', 'newcastle', 'NEWCASTLE', 'NewCastle'];
      
      const results = await Promise.all(
        queries.map(q => diseaseService.searchDiseases(q))
      );
      
      // All queries should return the same results
      for (let i = 1; i < results.length; i++) {
        expect(results[i].length).toBe(results[0].length);
        
        for (let j = 0; j < results[i].length; j++) {
          expect(results[i][j].id).toBe(results[0][j].id);
        }
      }
    });

    it('should maintain result relevance across multiple searches', async () => {
      const baseQuery = 'respiratory';
      const extendedQuery = 'respiratory distress';
      
      const baseResults = await diseaseService.searchDiseases(baseQuery);
      const extendedResults = await diseaseService.searchDiseases(extendedQuery);
      
      // Extended query should return subset or equal results
      expect(extendedResults.length).toBeLessThanOrEqual(baseResults.length);
      
      // All extended results should be in base results
      extendedResults.forEach(extendedResult => {
        const foundInBase = baseResults.some(baseResult => 
          baseResult.id === extendedResult.id
        );
        expect(foundInBase).toBe(true);
      });
    });
  });

  describe('Filter and Search Integration', () => {
    it('should apply filters correctly to search results', async () => {
      const searchQuery = 'disease';
      const filters: FilterCriteria = {
        categories: ['viral' as DiseaseCategory],
        severities: ['high' as 'high'],
        species: ['chickens']
      };
      
      const filteredResults = await diseaseService.searchDiseases(searchQuery, filters);
      
      filteredResults.forEach(disease => {
        expect(disease.category).toBe('viral');
        expect(disease.severity).toBe('high');
        expect(disease.commonIn).toContain('chickens');
        
        // Should also match search query
        const matchesQuery = 
          disease.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          disease.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
          disease.description.toLowerCase().includes(searchQuery.toLowerCase());
        expect(matchesQuery).toBe(true);
      });
    });

    it('should handle empty search with filters', async () => {
      const filters: FilterCriteria = {
        categories: ['bacterial' as DiseaseCategory],
        severities: [],
        species: []
      };
      
      const results = await diseaseService.searchDiseases('', filters);
      
      results.forEach(disease => {
        expect(disease.category).toBe('bacterial');
      });
    });

    it('should handle search with empty filters', async () => {
      const emptyFilters = {
        categories: [],
        severities: [],
        species: []
      };
      
      const searchResults = await diseaseService.searchDiseases('viral', emptyFilters);
      const unfiltered = await diseaseService.searchDiseases('viral');
      
      expect(searchResults.length).toBe(unfiltered.length);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle search errors gracefully without affecting bookmarks', async () => {
      // Add a bookmark
      await bookmarkService.addBookmark(testUserId, 'test-disease');
      
      // Attempt invalid search (this should not crash)
      try {
        await diseaseService.searchDiseases(null as any);
      } catch (error) {
        // Error is expected, but bookmarks should still work
      }
      
      // Verify bookmark still exists
      const isBookmarked = await bookmarkService.isBookmarked(testUserId, 'test-disease');
      expect(isBookmarked).toBe(true);
    });

    it('should recover from bookmark service errors during search', async () => {
      // Mock bookmark service to throw error
      const originalIsBookmarked = bookmarkService.isBookmarked;
      bookmarkService.isBookmarked = jest.fn().mockRejectedValue(new Error('Bookmark error'));
      
      // Search should still work
      const results = await diseaseService.searchDiseases('test');
      expect(Array.isArray(results)).toBe(true);
      
      // Restore original function
      bookmarkService.isBookmarked = originalIsBookmarked;
    });

    it('should handle search history errors without affecting search', async () => {
      // Mock search history to throw error
      const originalAddRecentSearch = searchHistoryService.addRecentSearch;
      searchHistoryService.addRecentSearch = jest.fn().mockRejectedValue(new Error('History error'));
      
      // Search should still work
      const results = await diseaseService.searchDiseases('test query');
      expect(Array.isArray(results)).toBe(true);
      
      // Restore original function
      searchHistoryService.addRecentSearch = originalAddRecentSearch;
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency between search and direct access', async () => {
      const searchResults = await diseaseService.searchDiseases('newcastle');
      
      if (searchResults.length > 0) {
        const firstResult = searchResults[0];
        const directAccess = await diseaseService.getDiseaseById(firstResult.id);
        
        expect(directAccess).toBeDefined();
        expect(directAccess!.id).toBe(firstResult.id);
        expect(directAccess!.name).toBe(firstResult.name);
        expect(directAccess!.category).toBe(firstResult.category);
      }
    });

    it('should ensure bookmark consistency across different access methods', async () => {
      const diseaseId = 'test-disease-consistency';
      
      // Add bookmark
      await bookmarkService.addBookmark(testUserId, diseaseId);
      
      // Check bookmark status through different methods
      const isBookmarked1 = await bookmarkService.isBookmarked(testUserId, diseaseId);
      const bookmarkedList = await bookmarkService.getBookmarkedDiseases(testUserId);
      const userBookmarks = await bookmarkService.getUserBookmarks(testUserId);
      
      expect(isBookmarked1).toBe(true);
      expect(bookmarkedList).toContain(diseaseId);
      expect(userBookmarks.some(b => b.diseaseId === diseaseId)).toBe(true);
    });
  });
});