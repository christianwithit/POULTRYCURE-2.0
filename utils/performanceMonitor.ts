/**
 * Performance monitoring utilities for the Disease Glossary
 * Tracks and optimizes performance metrics for better user experience
 */

import React from 'react';
import { InteractionManager, Platform } from 'react-native';

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  timestamp: number;
}

export interface SearchPerformanceMetrics {
  queryLength: number;
  resultCount: number;
  searchTime: number;
  filterTime: number;
  renderTime: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private memorySnapshots: MemoryUsage[] = [];
  private searchMetrics: SearchPerformanceMetrics[] = [];
  private isMonitoring: boolean = false;

  /**
   * Start monitoring a performance metric
   */
  startMetric(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: Date.now(),
      metadata,
    };
    this.metrics.set(name, metric);
  }

  /**
   * End monitoring a performance metric
   */
  endMetric(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${metric.duration}ms`);
    }

    return metric.duration;
  }

  /**
   * Get performance metric
   */
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Monitor memory usage
   */
  captureMemorySnapshot(): MemoryUsage | null {
    try {
      // Note: React Native doesn't provide direct memory access
      // This is a placeholder for platform-specific memory monitoring
      if (Platform.OS === 'android') {
        // On Android, you might use native modules to get memory info
        return null;
      } else if (Platform.OS === 'ios') {
        // On iOS, you might use native modules to get memory info
        return null;
      }
      
      // Fallback: estimate based on component count and data size
      const estimatedUsage: MemoryUsage = {
        used: 0,
        total: 0,
        percentage: 0,
        timestamp: Date.now(),
      };
      
      this.memorySnapshots.push(estimatedUsage);
      
      // Keep only last 100 snapshots
      if (this.memorySnapshots.length > 100) {
        this.memorySnapshots = this.memorySnapshots.slice(-100);
      }
      
      return estimatedUsage;
    } catch (error) {
      console.warn('Error capturing memory snapshot:', error);
      return null;
    }
  }

  /**
   * Track search performance
   */
  trackSearchPerformance(metrics: SearchPerformanceMetrics): void {
    this.searchMetrics.push(metrics);
    
    // Keep only last 50 search metrics
    if (this.searchMetrics.length > 50) {
      this.searchMetrics = this.searchMetrics.slice(-50);
    }

    // Log slow searches
    const totalTime = metrics.searchTime + metrics.filterTime + metrics.renderTime;
    if (totalTime > 500) {
      console.warn(`Slow search detected: ${totalTime}ms for query "${metrics.queryLength}" chars`);
    }
  }

  /**
   * Get search performance statistics
   */
  getSearchStats(): {
    averageSearchTime: number;
    averageFilterTime: number;
    averageRenderTime: number;
    slowestSearch: SearchPerformanceMetrics | null;
  } {
    if (this.searchMetrics.length === 0) {
      return {
        averageSearchTime: 0,
        averageFilterTime: 0,
        averageRenderTime: 0,
        slowestSearch: null,
      };
    }

    const totalSearchTime = this.searchMetrics.reduce((sum, m) => sum + m.searchTime, 0);
    const totalFilterTime = this.searchMetrics.reduce((sum, m) => sum + m.filterTime, 0);
    const totalRenderTime = this.searchMetrics.reduce((sum, m) => sum + m.renderTime, 0);

    const slowestSearch = this.searchMetrics.reduce((slowest, current) => {
      const currentTotal = current.searchTime + current.filterTime + current.renderTime;
      const slowestTotal = slowest.searchTime + slowest.filterTime + slowest.renderTime;
      return currentTotal > slowestTotal ? current : slowest;
    });

    return {
      averageSearchTime: totalSearchTime / this.searchMetrics.length,
      averageFilterTime: totalFilterTime / this.searchMetrics.length,
      averageRenderTime: totalRenderTime / this.searchMetrics.length,
      slowestSearch,
    };
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Capture memory snapshots every 30 seconds
    const memoryInterval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(memoryInterval);
        return;
      }
      this.captureMemorySnapshot();
    }, 30000);
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const metrics = this.getAllMetrics();
    const searchStats = this.getSearchStats();
    
    let report = '=== Performance Report ===\n\n';
    
    // General metrics
    report += `Total Metrics Captured: ${metrics.length}\n`;
    
    if (metrics.length > 0) {
      const avgDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / metrics.length;
      const slowestMetric = metrics.reduce((slowest, current) => 
        (current.duration || 0) > (slowest.duration || 0) ? current : slowest
      );
      
      report += `Average Operation Time: ${avgDuration.toFixed(2)}ms\n`;
      report += `Slowest Operation: ${slowestMetric.name} (${slowestMetric.duration}ms)\n\n`;
    }
    
    // Search performance
    report += '--- Search Performance ---\n';
    report += `Search Queries Tracked: ${this.searchMetrics.length}\n`;
    if (this.searchMetrics.length > 0) {
      report += `Average Search Time: ${searchStats.averageSearchTime.toFixed(2)}ms\n`;
      report += `Average Filter Time: ${searchStats.averageFilterTime.toFixed(2)}ms\n`;
      report += `Average Render Time: ${searchStats.averageRenderTime.toFixed(2)}ms\n`;
      
      if (searchStats.slowestSearch) {
        const total = searchStats.slowestSearch.searchTime + 
                     searchStats.slowestSearch.filterTime + 
                     searchStats.slowestSearch.renderTime;
        report += `Slowest Search: ${total}ms (${searchStats.slowestSearch.resultCount} results)\n`;
      }
    }
    report += '\n';
    
    // Memory usage
    report += '--- Memory Usage ---\n';
    report += `Memory Snapshots: ${this.memorySnapshots.length}\n`;
    if (this.memorySnapshots.length > 0) {
      const latestSnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];
      report += `Latest Memory Usage: ${latestSnapshot.percentage.toFixed(1)}%\n`;
    }
    
    return report;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for monitoring component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const startTime = React.useRef<number>(Date.now());
  
  React.useEffect(() => {
    const renderTime = Date.now() - startTime.current;
    
    if (renderTime > 100) {
      console.warn(`Slow render detected: ${componentName} took ${renderTime}ms`);
    }
    
    performanceMonitor.startMetric(`${componentName}_render`);
    
    return () => {
      performanceMonitor.endMetric(`${componentName}_render`);
    };
  }, [componentName]);
};

/**
 * Hook for monitoring search performance
 */
export const useSearchPerformance = () => {
  const trackSearch = React.useCallback((
    query: string,
    results: any[],
    searchTime: number,
    filterTime: number = 0,
    renderTime: number = 0
  ) => {
    const metrics: SearchPerformanceMetrics = {
      queryLength: query.length,
      resultCount: results.length,
      searchTime,
      filterTime,
      renderTime,
    };
    
    performanceMonitor.trackSearchPerformance(metrics);
  }, []);
  
  return { trackSearch };
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * Optimize image loading for better performance
 */
export const optimizeImageLoading = (imageUri: string, quality: number = 0.8): string => {
  // This would typically involve image optimization services
  // For now, return the original URI with quality parameter if supported
  if (imageUri.includes('?')) {
    return `${imageUri}&quality=${Math.round(quality * 100)}`;
  }
  return `${imageUri}?quality=${Math.round(quality * 100)}`;
};

/**
 * Batch operations for better performance
 */
export const batchOperations = <T>(
  operations: (() => T)[],
  batchSize: number = 10
): Promise<T[]> => {
  return new Promise((resolve) => {
    const results: T[] = [];
    let currentIndex = 0;
    
    const processBatch = () => {
      const endIndex = Math.min(currentIndex + batchSize, operations.length);
      
      for (let i = currentIndex; i < endIndex; i++) {
        results.push(operations[i]());
      }
      
      currentIndex = endIndex;
      
      if (currentIndex < operations.length) {
        // Use InteractionManager to ensure smooth UI
        InteractionManager.runAfterInteractions().then(() => {
          setTimeout(processBatch, 0);
        });
      } else {
        resolve(results);
      }
    };
    
    processBatch();
  });
};

export default performanceMonitor;