import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: Date;
}

class SearchHistoryService {
  private static instance: SearchHistoryService;
  private cacheKey = 'search_history';
  private maxHistoryItems = 10;

  private constructor() {}

  public static getInstance(): SearchHistoryService {
    if (!SearchHistoryService.instance) {
      SearchHistoryService.instance = new SearchHistoryService();
    }
    return SearchHistoryService.instance;
  }

  public async getRecentSearches(): Promise<RecentSearch[]> {
    try {
      const historyData = await AsyncStorage.getItem(this.cacheKey);
      if (historyData) {
        const parsed = JSON.parse(historyData);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  public async addRecentSearch(query: string): Promise<void> {
    if (!query.trim()) return;

    try {
      const currentHistory = await this.getRecentSearches();
      
      // Remove duplicate if exists
      const filteredHistory = currentHistory.filter(
        search => search.query.toLowerCase() !== query.toLowerCase()
      );

      // Add new search at the beginning
      const newSearch: RecentSearch = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: new Date(),
      };

      const updatedHistory = [newSearch, ...filteredHistory].slice(0, this.maxHistoryItems);
      
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  public async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }

  public async removeRecentSearch(searchId: string): Promise<void> {
    try {
      const currentHistory = await this.getRecentSearches();
      const filteredHistory = currentHistory.filter(search => search.id !== searchId);
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('Error removing search from history:', error);
    }
  }
}

export const searchHistoryService = SearchHistoryService.getInstance();