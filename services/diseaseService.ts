import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENHANCED_POULTRY_DISEASES } from '../data/disease';
import { DiseaseCategory, ExtendedDiseaseInfo, FilterCriteria } from '../types/types';

export class DiseaseService {
  private static instance: DiseaseService;
  private diseases: ExtendedDiseaseInfo[] = [];
  private cacheKey = 'disease_cache';
  private lastCacheUpdate = 'last_disease_cache_update';

  private constructor() {
    this.initializeData();
  }

  public static getInstance(): DiseaseService {
    if (!DiseaseService.instance) {
      DiseaseService.instance = new DiseaseService();
    }
    return DiseaseService.instance;
  }

  private async initializeData(): Promise<void> {
    try {
      // Try to use cache manager if available
      try {
        const { cacheManager } = await import('./cacheManager');

        // Check connectivity status
        const isOnline = await cacheManager.getConnectivityStatus();

        // Try to load from enhanced cache first
        const cachedData = await cacheManager.loadCachedDiseaseData();
        const cacheMetadata = await cacheManager.getCacheMetadata();
        const isCacheExpired = await cacheManager.isCacheExpired();

        if (cachedData && cachedData.length > 0 && (!isCacheExpired || !isOnline)) {
          this.diseases = cachedData;
          console.log(`Loaded ${cachedData.length} diseases from cache (${isOnline ? 'online' : 'offline'})`);
          return;
        } else {
          // Load static data and cache it
          this.diseases = Object.values(ENHANCED_POULTRY_DISEASES);
          await cacheManager.cacheDiseaseData(this.diseases);
          console.log(`Loaded ${this.diseases.length} diseases from static data and cached`);
          return;
        }
      } catch (cacheError) {
        console.debug('Cache manager not available, using fallback');
      }

      // Fallback to legacy cache or static data
      const cachedData = await this.loadFromCache();
      if (cachedData && cachedData.length > 0) {
        this.diseases = cachedData;
      } else {
        this.diseases = Object.values(ENHANCED_POULTRY_DISEASES);
        await this.saveToCache(this.diseases);
      }
    } catch (error) {
      console.error('Error initializing disease data:', error);
      // Fallback to static data
      this.diseases = Object.values(ENHANCED_POULTRY_DISEASES);
    }
  }

  public async getAllDiseases(): Promise<ExtendedDiseaseInfo[]> {
    if (this.diseases.length === 0) {
      await this.initializeData();
    }
    return [...this.diseases];
  }

  public async getDiseaseById(id: string): Promise<ExtendedDiseaseInfo | null> {
    if (this.diseases.length === 0) {
      await this.initializeData();
    }

    const disease = this.diseases.find(disease => disease.id === id) || null;

    // Track viewed disease for prioritized caching
    if (disease) {
      try {
        const { cacheManager } = await import('./cacheManager');
        await cacheManager.trackViewedDisease(id);
      } catch (error) {
        console.debug('Cache manager not available for tracking viewed disease');
      }
    }

    return disease;
  }

  public async searchDiseases(query: string, filters?: FilterCriteria): Promise<ExtendedDiseaseInfo[]> {
    if (this.diseases.length === 0) {
      await this.initializeData();
    }

    let results = [...this.diseases];

    // Apply text search with scoring
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      const searchResults = results.map(disease => {
        let score = 0;

        // Exact name match gets highest score
        if (disease.name.toLowerCase() === searchTerm) {
          score += 100;
        } else if (disease.name.toLowerCase().includes(searchTerm)) {
          score += 50;
        }

        // Symptom matches
        const symptomMatches = disease.symptoms.filter(symptom =>
          symptom.toLowerCase().includes(searchTerm)
        ).length;
        score += symptomMatches * 10;

        // Description match
        if (disease.description.toLowerCase().includes(searchTerm)) {
          score += 20;
        }

        // Cause matches
        const causeMatches = disease.causes.filter(cause =>
          cause.toLowerCase().includes(searchTerm)
        ).length;
        score += causeMatches * 15;

        // Tag matches
        const tagMatches = disease.tags.filter(tag =>
          tag.toLowerCase().includes(searchTerm)
        ).length;
        score += tagMatches * 8;

        // Category match
        if (disease.category.toLowerCase().includes(searchTerm)) {
          score += 25;
        }

        return { disease, score };
      });

      // Filter out diseases with no matches and sort by score
      results = searchResults
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(result => result.disease);
    }

    // Apply filters
    if (filters) {
      results = this.applyFilters(results, filters);
    }

    return results;
  }

  public async getDiseasesbyCategory(category: DiseaseCategory): Promise<ExtendedDiseaseInfo[]> {
    if (this.diseases.length === 0) {
      await this.initializeData();
    }
    return this.diseases.filter(disease => disease.category === category);
  }

  public async getRelatedDiseases(diseaseId: string): Promise<ExtendedDiseaseInfo[]> {
    const disease = await this.getDiseaseById(diseaseId);
    if (!disease) return [];

    const relatedIds = disease.relatedDiseases;
    const relatedDiseases = this.diseases.filter(d => relatedIds.includes(d.id));

    // If no explicit related diseases, find diseases with similar symptoms or category
    if (relatedDiseases.length === 0) {
      return this.diseases
        .filter(d => d.id !== diseaseId && d.category === disease.category)
        .slice(0, 3);
    }

    return relatedDiseases;
  }

  public async updateDiseaseCache(): Promise<void> {
    try {
      try {
        const { cacheManager } = await import('./cacheManager');
        const isOnline = await cacheManager.getConnectivityStatus();

        if (!isOnline) {
          console.log('Cannot update cache while offline');
          return;
        }

        // In a real app, this would fetch from a remote API
        // For now, we'll refresh the cache with current static data
        this.diseases = Object.values(ENHANCED_POULTRY_DISEASES);
        await cacheManager.cacheDiseaseData(this.diseases);

        console.log('Disease cache updated successfully');
      } catch (cacheError) {
        // Fallback to legacy cache update
        await AsyncStorage.setItem(this.lastCacheUpdate, new Date().toISOString());
        console.log('Legacy cache updated successfully');
      }
    } catch (error) {
      console.error('Error updating disease cache:', error);
    }
  }

  private applyFilters(diseases: ExtendedDiseaseInfo[], filters: FilterCriteria): ExtendedDiseaseInfo[] {
    let filtered = diseases;

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(disease => filters.categories.includes(disease.category));
    }

    // Filter by severities
    if (filters.severities && filters.severities.length > 0) {
      filtered = filtered.filter(disease => filters.severities.includes(disease.severity));
    }

    // Filter by species
    if (filters.species && filters.species.length > 0) {
      filtered = filtered.filter(disease =>
        disease.commonIn.some(species => filters.species.includes(species))
      );
    }

    return filtered;
  }

  private async loadFromCache(): Promise<ExtendedDiseaseInfo[] | null> {
    try {
      const cachedData = await AsyncStorage.getItem(this.cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        // Convert date strings back to Date objects
        return parsed.map((disease: any) => ({
          ...disease,
          lastUpdated: new Date(disease.lastUpdated)
        }));
      }
      return null;
    } catch (error) {
      console.error('Error loading from cache:', error);
      return null;
    }
  }

  private async saveToCache(diseases: ExtendedDiseaseInfo[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(diseases));
      await AsyncStorage.setItem(this.lastCacheUpdate, new Date().toISOString());
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  public async getCacheInfo(): Promise<{
    lastUpdate: Date | null;
    diseaseCount: number;
    isOffline: boolean;
    cacheSize: number;
  }> {
    try {
      try {
        const { cacheManager } = await import('./cacheManager');
        const metadata = await cacheManager.getCacheMetadata();
        const isOnline = await cacheManager.getConnectivityStatus();
        const cacheSize = await cacheManager.getCacheSize();

        return {
          lastUpdate: metadata?.lastUpdated || null,
          diseaseCount: this.diseases.length,
          isOffline: !isOnline,
          cacheSize: cacheSize.totalSize
        };
      } catch (cacheError) {
        // Fallback to legacy cache info
        const lastUpdateStr = await AsyncStorage.getItem(this.lastCacheUpdate);
        const lastUpdate = lastUpdateStr ? new Date(lastUpdateStr) : null;
        return {
          lastUpdate,
          diseaseCount: this.diseases.length,
          isOffline: false,
          cacheSize: 0
        };
      }
    } catch (error) {
      console.error('Error getting cache info:', error);
      return { lastUpdate: null, diseaseCount: 0, isOffline: false, cacheSize: 0 };
    }
  }

  // Helper method for getting disease statistics
  public async getDiseaseStatistics(): Promise<{
    total: number;
    byCategory: Record<DiseaseCategory, number>;
    bySeverity: Record<string, number>;
    bySpecies: Record<string, number>;
  }> {
    if (this.diseases.length === 0) {
      await this.initializeData();
    }

    const byCategory: Record<DiseaseCategory, number> = {
      viral: 0,
      bacterial: 0,
      parasitic: 0,
      nutritional: 0,
      genetic: 0,
      environmental: 0
    };

    const bySeverity: Record<string, number> = {
      low: 0,
      moderate: 0,
      high: 0
    };

    const bySpecies: Record<string, number> = {
      chickens: 0,
      turkeys: 0,
      ducks: 0,
      geese: 0
    };

    this.diseases.forEach(disease => {
      byCategory[disease.category]++;
      bySeverity[disease.severity]++;

      // Count species occurrences
      disease.commonIn.forEach(species => {
        const normalizedSpecies = species.toLowerCase();
        if (bySpecies.hasOwnProperty(normalizedSpecies)) {
          bySpecies[normalizedSpecies]++;
        }
      });
    });

    return {
      total: this.diseases.length,
      byCategory,
      bySeverity,
      bySpecies
    };
  }

  // Advanced search with fuzzy matching and suggestions
  public async getSearchSuggestions(query: string, limit: number = 8): Promise<{
    text: string;
    type: 'disease' | 'symptom' | 'tag' | 'cause';
    disease?: ExtendedDiseaseInfo;
    score: number;
  }[]> {
  if (this.diseases.length === 0) {
    await this.initializeData();
  }

  if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const suggestions: {
      text: string;
      type: 'disease' | 'symptom' | 'tag' | 'cause';
      disease?: ExtendedDiseaseInfo;
      score: number;
    }[] = [];

    this.diseases.forEach(disease => {
      // Disease name matches
      if (disease.name.toLowerCase().includes(searchTerm)) {
        const isExactMatch = disease.name.toLowerCase() === searchTerm;
        const startsWithMatch = disease.name.toLowerCase().startsWith(searchTerm);
        let score = isExactMatch ? 100 : startsWithMatch ? 80 : 60;

        suggestions.push({
          text: disease.name,
          type: 'disease',
          disease,
          score
        });
      }

      // Symptom matches
      disease.symptoms.forEach(symptom => {
        if (symptom.toLowerCase().includes(searchTerm)) {
          const isExactMatch = symptom.toLowerCase() === searchTerm;
          const startsWithMatch = symptom.toLowerCase().startsWith(searchTerm);
          let score = isExactMatch ? 90 : startsWithMatch ? 70 : 50;

          suggestions.push({
            text: symptom,
            type: 'symptom',
            score
          });
        }
      });

      // Cause matches
      disease.causes.forEach(cause => {
        if (cause.toLowerCase().includes(searchTerm)) {
          const isExactMatch = cause.toLowerCase() === searchTerm;
          const startsWithMatch = cause.toLowerCase().startsWith(searchTerm);
          let score = isExactMatch ? 85 : startsWithMatch ? 65 : 45;

          suggestions.push({
            text: cause,
            type: 'cause',
            score
          });
        }
      });

      // Tag matches
      disease.tags.forEach(tag => {
        if (tag.toLowerCase().includes(searchTerm)) {
          const isExactMatch = tag.toLowerCase() === searchTerm;
          const startsWithMatch = tag.toLowerCase().startsWith(searchTerm);
          let score = isExactMatch ? 75 : startsWithMatch ? 55 : 35;

          suggestions.push({
            text: tag,
            type: 'tag',
            score
          });
        }
      });
    });

    // Remove duplicates and sort by score
    const uniqueSuggestions = suggestions.reduce((acc, current) => {
      const existing = acc.find(item => item.text.toLowerCase() === current.text.toLowerCase());
      if (!existing || current.score > existing.score) {
        return [...acc.filter(item => item.text.toLowerCase() !== current.text.toLowerCase()), current];
      }
      return acc;
    }, [] as typeof suggestions);

    return uniqueSuggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Get highlighted search results for matching terms
  public getSearchHighlights(text: string, searchQuery: string): {
    text: string;
    isHighlighted: boolean;
  }[] {
    if (!searchQuery.trim()) {
      return [{ text, isHighlighted: false }];
    }

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map(part => ({
      text: part,
      isHighlighted: regex.test(part)
    }));
  }

  // Get popular search terms based on disease data
  public async getPopularSearchTerms(limit: number = 10): Promise<string[]> {
    if (this.diseases.length === 0) {
      await this.initializeData();
    }

    const termFrequency: Record<string, number> = {};

    this.diseases.forEach(disease => {
      // Count disease names
      termFrequency[disease.name] = (termFrequency[disease.name] || 0) + 3;

      // Count common symptoms
      disease.symptoms.forEach(symptom => {
        termFrequency[symptom] = (termFrequency[symptom] || 0) + 1;
      });

      // Count categories
      termFrequency[disease.category] = (termFrequency[disease.category] || 0) + 2;
    });

    return Object.entries(termFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([term]) => term);
  }

  // Get diseases by multiple criteria with scoring
  public async getRecommendedDiseases(
    symptoms: string[],
    species?: string,
    severity?: string
  ): Promise<{ disease: ExtendedDiseaseInfo; score: number }[]> {
    if (this.diseases.length === 0) {
      await this.initializeData();
    }

    const results = this.diseases.map(disease => {
      let score = 0;

      // Score based on symptom matches
      const matchingSymptoms = symptoms.filter(symptom =>
        disease.symptoms.some(diseaseSymptom =>
          diseaseSymptom.toLowerCase().includes(symptom.toLowerCase())
        )
      );
      score += (matchingSymptoms.length / symptoms.length) * 50;

      // Score based on species match
      if (species && disease.commonIn.includes(species)) {
        score += 25;
      }

      // Score based on severity match
      if (severity && disease.severity === severity) {
        score += 15;
      }

      // Bonus for high-confidence matches
      if (matchingSymptoms.length >= symptoms.length * 0.7) {
        score += 10;
      }

      return { disease, score };
    });

    return results
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * Get offline status and cache information
   */
  public async getOfflineStatus(): Promise<{
    isOffline: boolean;
    lastSync: Date | null;
    cachedDiseaseCount: number;
    prioritizedDiseaseCount: number;
  }> {
    try {
      try {
        const { cacheManager } = await import('./cacheManager');
        const { bookmarkService } = await import('./bookmarkService');

        const isOnline = await cacheManager.getConnectivityStatus();
        const metadata = await cacheManager.getCacheMetadata();

        // Get prioritized diseases (bookmarked + recently viewed)
        const bookmarkedIds = await bookmarkService.getBookmarkedDiseases('current_user'); // In real app, use actual user ID
        const prioritizedIds = await cacheManager.getPrioritizedDiseaseIds(bookmarkedIds);

        return {
          isOffline: !isOnline,
          lastSync: metadata?.lastUpdated || null,
          cachedDiseaseCount: this.diseases.length,
          prioritizedDiseaseCount: prioritizedIds.length
        };
      } catch (cacheError) {
        // Fallback without cache manager
        return {
          isOffline: false,
          lastSync: null,
          cachedDiseaseCount: this.diseases.length,
          prioritizedDiseaseCount: 0
        };
      }
    } catch (error) {
      console.error('Error getting offline status:', error);
      return {
        isOffline: false,
        lastSync: null,
        cachedDiseaseCount: 0,
        prioritizedDiseaseCount: 0
      };
    }
  }

  /**
   * Force cache refresh when online
   */
  public async refreshCache(): Promise<boolean> {
    try {
      try {
        const { cacheManager } = await import('./cacheManager');
        const isOnline = await cacheManager.getConnectivityStatus();

        if (!isOnline) {
          console.log('Cannot refresh cache while offline');
          return false;
        }
      } catch (cacheError) {
        console.debug('Cache manager not available, proceeding with refresh');
      }

      // Refresh with latest data
      await this.updateDiseaseCache();
      await this.initializeData();

      return true;
    } catch (error) {
      console.error('Error refreshing cache:', error);
      return false;
    }
  }

  /**
   * Get recently viewed diseases for offline priority
   */
  public async getRecentlyViewedDiseases(limit: number = 10): Promise<ExtendedDiseaseInfo[]> {
    try {
      try {
        const { cacheManager } = await import('./cacheManager');
        const viewedDiseases = await cacheManager.getViewedDiseases();
        const recentIds = viewedDiseases.slice(0, limit).map(v => v.diseaseId);

        if (this.diseases.length === 0) {
          await this.initializeData();
        }

        return this.diseases.filter(disease => recentIds.includes(disease.id));
      } catch (cacheError) {
        console.debug('Cache manager not available for recently viewed diseases');
        return [];
      }
    } catch (error) {
      console.error('Error getting recently viewed diseases:', error);
      return [];
    }
  }

  /**
   * Add connectivity listener
   */
  public addConnectivityListener(listener: (isOnline: boolean) => void): () => void {
    try {
      // Use dynamic import to avoid circular dependency
      import('./cacheManager').then(({ cacheManager }) => {
        return cacheManager.addConnectivityListener(listener);
      }).catch(() => {
        console.debug('Cache manager not available for connectivity listener');
      });

      // Return a no-op unsubscribe function as fallback
      return () => { };
    } catch (error) {
      console.debug('Error setting up connectivity listener:', error);
      return () => { };
    }
  }

  /**
   * Check if cache needs update
   */
  public async needsCacheUpdate(): Promise<boolean> {
    try {
      try {
        const { cacheManager } = await import('./cacheManager');
        const isOnline = await cacheManager.getConnectivityStatus();
        const isCacheExpired = await cacheManager.isCacheExpired();

        return isOnline && isCacheExpired;
      } catch (cacheError) {
        console.debug('Cache manager not available for cache update check');
        return false;
      }
    } catch (error) {
      console.error('Error checking cache update need:', error);
      return false;
    }
  }
}

// Export singleton instance
export const diseaseService = DiseaseService.getInstance();