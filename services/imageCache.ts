// services/imageCache.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { ImageCache, ImageProcessingOptions } from '../types/image';

const CACHE_KEY = '@poultrycure_image_cache';
const CACHE_METADATA_KEY = '@poultrycure_cache_metadata';

// Default cache settings
const DEFAULT_CACHE_OPTIONS: ImageProcessingOptions = {
  enableCompression: true,
  enableCaching: true,
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Image Cache Service
 * Handles local caching of images for performance optimization
 */
export class ImageCacheService {
  private cache: Map<string, ImageCache> = new Map();
  private options: ImageProcessingOptions;

  constructor(options: Partial<ImageProcessingOptions> = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
    this.loadCacheMetadata();
  }

  /**
   * Load cache metadata from AsyncStorage
   */
  private async loadCacheMetadata(): Promise<void> {
    try {
      const metadata = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      if (metadata) {
        const cacheData: ImageCache[] = JSON.parse(metadata);
        this.cache = new Map(cacheData.map(item => [item.uri, item]));
      }
    } catch (error) {
      console.error('❌ Failed to load cache metadata:', error);
    }
  }

  /**
   * Save cache metadata to AsyncStorage
   */
  private async saveCacheMetadata(): Promise<void> {
    try {
      const cacheData = Array.from(this.cache.values());
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Failed to save cache metadata:', error);
    }
  }

  /**
   * Check if an image is cached
   */
  public async isCached(uri: string): Promise<boolean> {
    const cached = this.cache.get(uri);
    if (!cached) return false;

    // Check if cache entry has expired
    if (Date.now() - cached.timestamp > this.options.cacheTTL) {
      await this.removeFromCache(uri);
      return false;
    }

    // Check if file still exists
    try {
      const fileInfo = await FileSystem.getInfoAsync(cached.uri);
      return fileInfo.exists;
    } catch {
      await this.removeFromCache(uri);
      return false;
    }
  }

  /**
   * Get cached image URI
   */
  public async getCachedImage(uri: string): Promise<string | null> {
    const isCached = await this.isCached(uri);
    return isCached ? uri : null;
  }

  /**
   * Add image to cache
   */
  public async addToCache(
    originalUri: string,
    cachedUri: string,
    size: number
  ): Promise<void> {
    if (!this.options.enableCaching) return;

    try {
      // Check cache size limit
      await this.enforceCacheSizeLimit(size);

      const cacheEntry: ImageCache = {
        uri: originalUri,
        timestamp: Date.now(),
        size,
        path: cachedUri,
      };

      this.cache.set(originalUri, cacheEntry);
      await this.saveCacheMetadata();

      console.log('✅ Image added to cache:', { originalUri, size });
    } catch (error) {
      console.error('❌ Failed to add image to cache:', error);
    }
  }

  /**
   * Remove image from cache
   */
  public async removeFromCache(uri: string): Promise<void> {
    try {
      const cached = this.cache.get(uri);
      if (cached) {
        // Delete the cached file
        await FileSystem.deleteAsync(cached.path, { idempotent: true });
        
        // Remove from cache map
        this.cache.delete(uri);
        await this.saveCacheMetadata();

        console.log('🗑️ Image removed from cache:', uri);
      }
    } catch (error) {
      console.error('❌ Failed to remove image from cache:', error);
    }
  }

  /**
   * Clear all cached images
   */
  public async clearCache(): Promise<void> {
    try {
      // Delete all cached files
      const deletePromises = Array.from(this.cache.values()).map(async (cached) => {
        try {
          await FileSystem.deleteAsync(cached.path, { idempotent: true });
        } catch (error) {
          console.warn('⚠️ Failed to delete cached file:', cached.path);
        }
      });

      await Promise.all(deletePromises);

      // Clear cache map
      this.cache.clear();
      await this.saveCacheMetadata();

      console.log('🧹 Image cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<{
    size: number;
    count: number;
    maxSize: number;
    usagePercentage: number;
  }> {
    const totalSize = Array.from(this.cache.values()).reduce(
      (sum, cached) => sum + cached.size,
      0
    );

    return {
      size: totalSize,
      count: this.cache.size,
      maxSize: this.options.maxCacheSize,
      usagePercentage: (totalSize / this.options.maxCacheSize) * 100,
    };
  }

  /**
   * Clean up expired cache entries
   */
  public async cleanupExpiredEntries(): Promise<void> {
    try {
      const expiredEntries: string[] = [];

      for (const [uri, cached] of this.cache.entries()) {
        const isExpired = Date.now() - cached.timestamp > this.options.cacheTTL;
        
        if (isExpired) {
          expiredEntries.push(uri);
        }
      }

      // Remove expired entries
      await Promise.all(expiredEntries.map(uri => this.removeFromCache(uri)));

      if (expiredEntries.length > 0) {
        console.log(`🧹 Cleaned up ${expiredEntries.length} expired cache entries`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup expired entries:', error);
    }
  }

  /**
   * Enforce cache size limit by removing oldest entries
   */
  private async enforceCacheSizeLimit(newImageSize: number): Promise<void> {
    const currentSize = Array.from(this.cache.values()).reduce(
      (sum, cached) => sum + cached.size,
      0
    );

    if (currentSize + newImageSize <= this.options.maxCacheSize) {
      return; // Within limit
    }

    // Sort by timestamp (oldest first)
    const sortedEntries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    let sizeToFree = currentSize + newImageSize - this.options.maxCacheSize;
    const entriesToRemove: string[] = [];

    for (const [uri, cached] of sortedEntries) {
      if (sizeToFree <= 0) break;
      
      entriesToRemove.push(uri);
      sizeToFree -= cached.size;
    }

    // Remove oldest entries
    await Promise.all(entriesToRemove.map(uri => this.removeFromCache(uri)));

    if (entriesToRemove.length > 0) {
      console.log(`🗑️ Removed ${entriesToRemove.length} oldest cache entries to free space`);
    }
  }

  /**
   * Get cached image with automatic refresh
   */
  public async getCachedImageWithRefresh(
    originalUri: string,
    refreshCallback?: () => Promise<string>
  ): Promise<string> {
    const cached = await this.getCachedImage(originalUri);
    
    if (cached) {
      return cached;
    }

    // Image not cached, download and cache it
    if (refreshCallback) {
      try {
        const newUri = await refreshCallback();
        
        // Get file info for caching
        const fileInfo = await FileSystem.getInfoAsync(newUri);
        const size = fileInfo.size || 0;

        await this.addToCache(originalUri, newUri, size);
        
        return newUri;
      } catch (error) {
        console.error('❌ Failed to refresh and cache image:', error);
        throw error;
      }
    }

    throw new Error('Image not cached and no refresh callback provided');
  }

  /**
   * Preload images into cache
   */
  public async preloadImages(
    uris: string[],
    downloadCallback: (uri: string) => Promise<string>
  ): Promise<void> {
    console.log(`📦 Preloading ${uris.length} images into cache...`);

    const preloadPromises = uris.map(async (uri) => {
      try {
        const isAlreadyCached = await this.isCached(uri);
        if (isAlreadyCached) return;

        const downloadedUri = await downloadCallback(uri);
        const fileInfo = await FileSystem.getInfoAsync(downloadedUri);
        const size = fileInfo.size || 0;

        await this.addToCache(uri, downloadedUri, size);
      } catch (error) {
        console.warn('⚠️ Failed to preload image:', uri, error);
      }
    });

    await Promise.all(preloadPromises);
    console.log('✅ Image preloading completed');
  }
}

// Export singleton instance
export const imageCache = new ImageCacheService();

// Export convenience functions
export const isImageCached = (uri: string) => imageCache.isCached(uri);
export const getCachedImage = (uri: string) => imageCache.getCachedImage(uri);
export const addImageToCache = (originalUri: string, cachedUri: string, size: number) => 
  imageCache.addToCache(originalUri, cachedUri, size);
export const removeImageFromCache = (uri: string) => imageCache.removeFromCache(uri);
export const clearImageCache = () => imageCache.clearCache();
export const getCacheStats = () => imageCache.getCacheStats();
export const cleanupExpiredCache = () => imageCache.cleanupExpiredEntries();
