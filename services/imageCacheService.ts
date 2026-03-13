/**
 * Enhanced Image Caching Service
 * Optimizes image loading and caching for better performance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { performanceMonitor } from '../utils/performanceMonitor';

export interface CachedImage {
  uri: string;
  localPath?: string;
  size: number;
  lastAccessed: number;
  expiresAt: number;
}

export interface ImageCacheConfig {
  maxCacheSize: number; // in bytes
  maxAge: number; // in milliseconds
  compressionQuality: number; // 0-1
  enablePrefetch: boolean;
}

class ImageCacheService {
  private cache: Map<string, CachedImage> = new Map();
  private loadingPromises: Map<string, Promise<string>> = new Map();
  private config: ImageCacheConfig = {
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    compressionQuality: 0.8,
    enablePrefetch: true,
  };
  private currentCacheSize: number = 0;

  constructor(config?: Partial<ImageCacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.loadCacheFromStorage();
  }

  /**
   * Load cache metadata from AsyncStorage
   */
  private async loadCacheFromStorage(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem('image_cache_metadata');
      if (cacheData) {
        const parsedCache = JSON.parse(cacheData);
        this.cache = new Map(Object.entries(parsedCache));
        this.calculateCacheSize();
        this.cleanExpiredImages();
      }
    } catch (error) {
      console.warn('Error loading image cache metadata:', error);
    }
  }

  /**
   * Save cache metadata to AsyncStorage
   */
  private async saveCacheToStorage(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem('image_cache_metadata', JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Error saving image cache metadata:', error);
    }
  }

  /**
   * Calculate current cache size
   */
  private calculateCacheSize(): void {
    this.currentCacheSize = Array.from(this.cache.values())
      .reduce((total, item) => total + item.size, 0);
  }

  /**
   * Clean expired images from cache
   */
  private async cleanExpiredImages(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache) {
      if (item.expiresAt < now) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.removeFromCache(key);
    }
  }

  /**
   * Remove least recently used items to make space
   */
  private async evictLRU(spaceNeeded: number): Promise<void> {
    const sortedItems = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let freedSpace = 0;
    for (const [key, item] of sortedItems) {
      if (freedSpace >= spaceNeeded) break;
      
      await this.removeFromCache(key);
      freedSpace += item.size;
    }
  }

  /**
   * Remove item from cache
   */
  private async removeFromCache(key: string): Promise<void> {
    const item = this.cache.get(key);
    if (item) {
      this.cache.delete(key);
      this.currentCacheSize -= item.size;
      
      // In a real implementation, you would also delete the local file
      // For now, we just remove from memory cache
    }
  }

  /**
   * Get optimized image URI
   */
  public getOptimizedImageUri(uri: string, width?: number, height?: number): string {
    // Add optimization parameters to URI
    const separator = uri.includes('?') ? '&' : '?';
    let optimizedUri = uri;

    if (width && height) {
      optimizedUri += `${separator}w=${width}&h=${height}`;
    }

    optimizedUri += `&q=${Math.round(this.config.compressionQuality * 100)}`;
    
    return optimizedUri;
  }

  /**
   * Preload image and add to cache
   */
  public async preloadImage(uri: string): Promise<string> {
    performanceMonitor.startMetric(`image_preload_${uri}`);
    
    // Check if already cached
    const cached = this.cache.get(uri);
    if (cached && cached.expiresAt > Date.now()) {
      cached.lastAccessed = Date.now();
      performanceMonitor.endMetric(`image_preload_${uri}`);
      return cached.localPath || uri;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(uri);
    if (existingPromise) {
      return existingPromise;
    }

    // Start loading
    const loadingPromise = this.loadAndCacheImage(uri);
    this.loadingPromises.set(uri, loadingPromise);

    try {
      const result = await loadingPromise;
      performanceMonitor.endMetric(`image_preload_${uri}`);
      return result;
    } finally {
      this.loadingPromises.delete(uri);
    }
  }

  /**
   * Load and cache image
   */
  private async loadAndCacheImage(uri: string): Promise<string> {
    try {
      // Use React Native's Image.prefetch for actual loading
      await Image.prefetch(uri);
      
      // Estimate image size (in a real implementation, you'd get actual size)
      const estimatedSize = 100 * 1024; // 100KB estimate
      
      // Check if we need to make space
      if (this.currentCacheSize + estimatedSize > this.config.maxCacheSize) {
        await this.evictLRU(estimatedSize);
      }

      // Add to cache
      const cachedImage: CachedImage = {
        uri,
        size: estimatedSize,
        lastAccessed: Date.now(),
        expiresAt: Date.now() + this.config.maxAge,
      };

      this.cache.set(uri, cachedImage);
      this.currentCacheSize += estimatedSize;
      
      // Save cache metadata
      await this.saveCacheToStorage();
      
      return uri;
    } catch (error) {
      console.warn(`Error loading image ${uri}:`, error);
      return uri; // Return original URI as fallback
    }
  }

  /**
   * Preload multiple images in batches
   */
  public async preloadImages(uris: string[], batchSize: number = 3): Promise<void> {
    if (!this.config.enablePrefetch) return;

    performanceMonitor.startMetric('batch_image_preload');
    
    for (let i = 0; i < uris.length; i += batchSize) {
      const batch = uris.slice(i, i + batchSize);
      
      // Load batch in parallel
      await Promise.allSettled(
        batch.map(uri => this.preloadImage(uri))
      );
      
      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < uris.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    performanceMonitor.endMetric('batch_image_preload');
  }

  /**
   * Check if image is cached
   */
  public isImageCached(uri: string): boolean {
    const cached = this.cache.get(uri);
    return cached !== undefined && cached.expiresAt > Date.now();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalItems: number;
    totalSize: number;
    maxSize: number;
    hitRate: number;
    oldestItem: number;
    newestItem: number;
  } {
    const items = Array.from(this.cache.values());
    
    return {
      totalItems: items.length,
      totalSize: this.currentCacheSize,
      maxSize: this.config.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses for this
      oldestItem: items.length > 0 ? Math.min(...items.map(i => i.lastAccessed)) : 0,
      newestItem: items.length > 0 ? Math.max(...items.map(i => i.lastAccessed)) : 0,
    };
  }

  /**
   * Clear entire cache
   */
  public async clearCache(): Promise<void> {
    this.cache.clear();
    this.currentCacheSize = 0;
    await AsyncStorage.removeItem('image_cache_metadata');
  }

  /**
   * Update cache configuration
   */
  public updateConfig(newConfig: Partial<ImageCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // If max cache size was reduced, clean up if necessary
    if (this.currentCacheSize > this.config.maxCacheSize) {
      this.evictLRU(this.currentCacheSize - this.config.maxCacheSize);
    }
  }

  /**
   * Get cache usage percentage
   */
  public getCacheUsagePercentage(): number {
    return (this.currentCacheSize / this.config.maxCacheSize) * 100;
  }

  /**
   * Optimize image URI for specific dimensions
   */
  public getOptimizedUri(uri: string, targetWidth: number, targetHeight: number): string {
    return this.getOptimizedImageUri(uri, targetWidth, targetHeight);
  }
}

// Singleton instance
export const imageCacheService = new ImageCacheService();

export default imageCacheService;