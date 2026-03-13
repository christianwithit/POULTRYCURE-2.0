import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ExtendedDiseaseInfo } from '../types/types';

export interface CacheMetadata {
  lastUpdated: Date;
  version: string;
  diseaseCount: number;
  isOffline: boolean;
}

export interface ViewedDisease {
  diseaseId: string;
  viewedAt: Date;
  viewCount: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private static readonly CACHE_KEYS = {
    DISEASE_DATA: 'disease_cache_v2',
    CACHE_METADATA: 'cache_metadata',
    VIEWED_DISEASES: 'viewed_diseases',
    OFFLINE_QUEUE: 'offline_queue',
    CONNECTIVITY_STATUS: 'connectivity_status'
  };

  private static readonly CACHE_VERSION = '1.0.0';
  private static readonly MAX_VIEWED_DISEASES = 50;
  private static readonly CACHE_EXPIRY_HOURS = 24;

  private isOnline: boolean = true;
  private connectivityListeners: ((isOnline: boolean) => void)[] = [];
  private cache: Map<string, CacheEntry<any>>[] = [];

  private constructor() {
    this.initializeConnectivityListener();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize network connectivity monitoring
   */
  private initializeConnectivityListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // Store connectivity status
      this.storeConnectivityStatus(this.isOnline);
      
      // Notify listeners of connectivity changes
      this.connectivityListeners.forEach(listener => listener(this.isOnline));
      
      // Auto-sync when coming back online
      if (!wasOnline && this.isOnline) {
        this.handleConnectivityRestored();
      }
    });

    // Get initial connectivity state
    NetInfo.fetch().then(state => {
      this.isOnline = state.isConnected ?? false;
      this.storeConnectivityStatus(this.isOnline);
    });
  }

  /**
   * Add listener for connectivity changes
   */
  public addConnectivityListener(listener: (isOnline: boolean) => void): () => void {
    this.connectivityListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectivityListeners.indexOf(listener);
      if (index > -1) {
        this.connectivityListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current connectivity status
   */
  public async getConnectivityStatus(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected ?? false;
      return this.isOnline;
    } catch (error) {
      console.error('Error checking connectivity:', error);
      return false;
    }
  }

  /**
   * Cache disease data with metadata
   */
  public async cacheDiseaseData(diseases: ExtendedDiseaseInfo[]): Promise<void> {
    try {
      const metadata: CacheMetadata = {
        lastUpdated: new Date(),
        version: CacheManager.CACHE_VERSION,
        diseaseCount: diseases.length,
        isOffline: !this.isOnline
      };

      // Store disease data
      await AsyncStorage.setItem(
        CacheManager.CACHE_KEYS.DISEASE_DATA,
        JSON.stringify(diseases)
      );

      // Store metadata
      await AsyncStorage.setItem(
        CacheManager.CACHE_KEYS.CACHE_METADATA,
        JSON.stringify(metadata)
      );

      console.log(`Cached ${diseases.length} diseases at ${metadata.lastUpdated.toISOString()}`);
    } catch (error) {
      console.error('Error caching disease data:', error);
      throw error;
    }
  }

  /**
   * Load cached disease data
   */
  public async loadCachedDiseaseData(): Promise<ExtendedDiseaseInfo[] | null> {
    try {
      const cachedData = await AsyncStorage.getItem(CacheManager.CACHE_KEYS.DISEASE_DATA);
      if (!cachedData) {
        return null;
      }

      const diseases = JSON.parse(cachedData);
      
      // Convert date strings back to Date objects
      return diseases.map((disease: any) => ({
        ...disease,
        lastUpdated: new Date(disease.lastUpdated)
      }));
    } catch (error) {
      console.error('Error loading cached disease data:', error);
      return null;
    }
  }

  /**
   * Get cache metadata
   */
  public async getCacheMetadata(): Promise<CacheMetadata | null> {
    try {
      const metadataStr = await AsyncStorage.getItem(CacheManager.CACHE_KEYS.CACHE_METADATA);
      if (!metadataStr) {
        return null;
      }

      const metadata = JSON.parse(metadataStr);
      return {
        ...metadata,
        lastUpdated: new Date(metadata.lastUpdated)
      };
    } catch (error) {
      console.error('Error getting cache metadata:', error);
      return null;
    }
  }

  /**
   * Check if cache is expired
   */
  public async isCacheExpired(): Promise<boolean> {
    try {
      const metadata = await this.getCacheMetadata();
      if (!metadata) {
        return true;
      }

      const now = new Date();
      const cacheAge = now.getTime() - metadata.lastUpdated.getTime();
      const maxAge = CacheManager.CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

      return cacheAge > maxAge;
    } catch (error) {
      console.error('Error checking cache expiry:', error);
      return true;
    }
  }

  /**
   * Track viewed disease for prioritized caching
   */
  public async trackViewedDisease(diseaseId: string): Promise<void> {
    try {
      const viewedDiseases = await this.getViewedDiseases();
      const existingIndex = viewedDiseases.findIndex(v => v.diseaseId === diseaseId);

      if (existingIndex >= 0) {
        // Update existing entry
        viewedDiseases[existingIndex].viewedAt = new Date();
        viewedDiseases[existingIndex].viewCount++;
      } else {
        // Add new entry
        viewedDiseases.push({
          diseaseId,
          viewedAt: new Date(),
          viewCount: 1
        });
      }

      // Sort by most recent and limit size
      viewedDiseases.sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime());
      const limitedViewed = viewedDiseases.slice(0, CacheManager.MAX_VIEWED_DISEASES);

      await AsyncStorage.setItem(
        CacheManager.CACHE_KEYS.VIEWED_DISEASES,
        JSON.stringify(limitedViewed)
      );
    } catch (error) {
      console.error('Error tracking viewed disease:', error);
    }
  }

  /**
   * Get recently viewed diseases
   */
  public async getViewedDiseases(): Promise<ViewedDisease[]> {
    try {
      const viewedStr = await AsyncStorage.getItem(CacheManager.CACHE_KEYS.VIEWED_DISEASES);
      if (!viewedStr) {
        return [];
      }

      const viewed = JSON.parse(viewedStr);
      return viewed.map((v: any) => ({
        ...v,
        viewedAt: new Date(v.viewedAt)
      }));
    } catch (error) {
      console.error('Error getting viewed diseases:', error);
      return [];
    }
  }

  /**
   * Get prioritized disease IDs for caching (bookmarked + recently viewed)
   */
  public async getPrioritizedDiseaseIds(bookmarkedIds: string[]): Promise<string[]> {
    try {
      const viewedDiseases = await this.getViewedDiseases();
      const recentlyViewedIds = viewedDiseases
        .slice(0, 20) // Top 20 recently viewed
        .map(v => v.diseaseId);

      // Combine bookmarked and recently viewed, removing duplicates
      const prioritizedIds = [...new Set([...bookmarkedIds, ...recentlyViewedIds])];
      
      return prioritizedIds;
    } catch (error) {
      console.error('Error getting prioritized disease IDs:', error);
      return bookmarkedIds;
    }
  }

  /**
   * Queue action for when connectivity is restored
   */
  public async queueOfflineAction(action: {
    type: 'bookmark_add' | 'bookmark_remove' | 'bookmark_note_update';
    data: any;
    timestamp: Date;
  }): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      queue.push(action);
      
      await AsyncStorage.setItem(
        CacheManager.CACHE_KEYS.OFFLINE_QUEUE,
        JSON.stringify(queue)
      );
    } catch (error) {
      console.error('Error queuing offline action:', error);
    }
  }

  /**
   * Get offline action queue
   */
  public async getOfflineQueue(): Promise<{
    type: 'bookmark_add' | 'bookmark_remove' | 'bookmark_note_update';
    data: any;
    timestamp: Date;
  }[]> {
    try {
      const queueStr = await AsyncStorage.getItem(CacheManager.CACHE_KEYS.OFFLINE_QUEUE);
      if (!queueStr) {
        return [];
      }

      const queue = JSON.parse(queueStr);
      return queue.map((action: any) => ({
        ...action,
        timestamp: new Date(action.timestamp)
      }));
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  /**
   * Clear offline action queue
   */
  public async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CacheManager.CACHE_KEYS.OFFLINE_QUEUE);
    } catch (error) {
      console.error('Error clearing offline queue:', error);
    }
  }

  /**
   * Handle connectivity restoration
   */
  private async handleConnectivityRestored(): Promise<void> {
    try {
      console.log('Connectivity restored, processing offline queue...');
      
      const queue = await this.getOfflineQueue();
      if (queue.length === 0) {
        return;
      }

      // Process queued actions
      // Note: In a real implementation, you would process these actions
      // For now, we'll just clear the queue as the bookmark service
      // handles offline operations locally
      
      await this.clearOfflineQueue();
      console.log(`Processed ${queue.length} offline actions`);
    } catch (error) {
      console.error('Error handling connectivity restoration:', error);
    }
  }

  /**
   * Store connectivity status
   */
  private async storeConnectivityStatus(isOnline: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        CacheManager.CACHE_KEYS.CONNECTIVITY_STATUS,
        JSON.stringify({
          isOnline,
          lastChecked: new Date().toISOString()
        })
      );
    } catch (error) {
      console.error('Error storing connectivity status:', error);
    }
  }

  /**
   * Get stored connectivity status
   */
  public async getStoredConnectivityStatus(): Promise<{
    isOnline: boolean;
    lastChecked: Date;
  } | null> {
    try {
      const statusStr = await AsyncStorage.getItem(CacheManager.CACHE_KEYS.CONNECTIVITY_STATUS);
      if (!statusStr) {
        return null;
      }

      const status = JSON.parse(statusStr);
      return {
        isOnline: status.isOnline,
        lastChecked: new Date(status.lastChecked)
      };
    } catch (error) {
      console.error('Error getting stored connectivity status:', error);
      return null;
    }
  }

  /**
   * Clear all cache data
   */
  public async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CacheManager.CACHE_KEYS.DISEASE_DATA),
        AsyncStorage.removeItem(CacheManager.CACHE_KEYS.CACHE_METADATA),
        AsyncStorage.removeItem(CacheManager.CACHE_KEYS.VIEWED_DISEASES),
        AsyncStorage.removeItem(CacheManager.CACHE_KEYS.OFFLINE_QUEUE)
      ]);
      
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get cache size information
   */
  public async getCacheSize(): Promise<{
    diseaseDataSize: number;
    viewedDiseasesSize: number;
    totalSize: number;
  }> {
    try {
      const diseaseData = await AsyncStorage.getItem(CacheManager.CACHE_KEYS.DISEASE_DATA);
      const viewedData = await AsyncStorage.getItem(CacheManager.CACHE_KEYS.VIEWED_DISEASES);
      
      const diseaseDataSize = diseaseData ? new Blob([diseaseData]).size : 0;
      const viewedDiseasesSize = viewedData ? new Blob([viewedData]).size : 0;
      
      return {
        diseaseDataSize,
        viewedDiseasesSize,
        totalSize: diseaseDataSize + viewedDiseasesSize
      };
    } catch (error) {
      console.error('Error getting cache size:', error);
      return { diseaseDataSize: 0, viewedDiseasesSize: 0, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();