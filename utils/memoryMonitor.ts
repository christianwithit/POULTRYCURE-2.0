/**
 * Memory Usage Monitoring and Optimization
 * Tracks memory usage and provides cleanup utilities
 */

import React from 'react';
import { performanceMonitor } from './performanceMonitor';

export interface MemorySnapshot {
  timestamp: number;
  jsHeapSizeUsed: number;
  jsHeapSizeTotal: number;
  jsHeapSizeLimit: number;
  componentCount: number;
  imageCount: number;
  cacheSize: number;
}

export interface MemoryThresholds {
  warning: number; // Percentage of heap limit
  critical: number; // Percentage of heap limit
  cleanup: number; // Percentage of heap limit to trigger cleanup
}

class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private componentRegistry: Map<string, number> = new Map();
  private imageRegistry: Set<string> = new Set();
  private cleanupCallbacks: (() => void)[] = [];
  
  private thresholds: MemoryThresholds = {
    warning: 70,
    critical: 85,
    cleanup: 90,
  };

  /**
   * Start memory monitoring
   */
  public startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(() => {
      this.captureSnapshot();
    }, intervalMs);
    
    console.log('Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('Memory monitoring stopped');
  }

  /**
   * Capture memory snapshot
   */
  public captureSnapshot(): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      jsHeapSizeUsed: this.getJSHeapSize().used,
      jsHeapSizeTotal: this.getJSHeapSize().total,
      jsHeapSizeLimit: this.getJSHeapSize().limit,
      componentCount: this.getTotalComponentCount(),
      imageCount: this.imageRegistry.size,
      cacheSize: this.estimateCacheSize(),
    };
    
    this.snapshots.push(snapshot);
    
    // Keep only last 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots = this.snapshots.slice(-100);
    }
    
    // Check thresholds
    this.checkMemoryThresholds(snapshot);
    
    return snapshot;
  }

  /**
   * Get JavaScript heap size information
   */
  private getJSHeapSize(): { used: number; total: number; limit: number } {
    // React Native doesn't provide direct access to heap size
    // This is a simulation based on component and data tracking
    const baseMemory = 50 * 1024 * 1024; // 50MB base
    const componentMemory = this.getTotalComponentCount() * 1024; // 1KB per component
    const imageMemory = this.imageRegistry.size * 100 * 1024; // 100KB per image
    const cacheMemory = this.estimateCacheSize();
    
    const used = baseMemory + componentMemory + imageMemory + cacheMemory;
    const total = used * 1.2; // 20% overhead
    const limit = 512 * 1024 * 1024; // 512MB limit (typical for mobile)
    
    return { used, total, limit };
  }

  /**
   * Get total component count
   */
  private getTotalComponentCount(): number {
    return Array.from(this.componentRegistry.values()).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Estimate cache size
   */
  private estimateCacheSize(): number {
    // This would integrate with actual cache services
    // For now, return an estimate
    return 10 * 1024 * 1024; // 10MB estimate
  }

  /**
   * Check memory thresholds and trigger actions
   */
  private checkMemoryThresholds(snapshot: MemorySnapshot): void {
    const usagePercentage = (snapshot.jsHeapSizeUsed / snapshot.jsHeapSizeLimit) * 100;
    
    if (usagePercentage >= this.thresholds.cleanup) {
      console.warn(`Memory usage critical (${usagePercentage.toFixed(1)}%), triggering cleanup`);
      this.triggerCleanup();
    } else if (usagePercentage >= this.thresholds.critical) {
      console.warn(`Memory usage critical (${usagePercentage.toFixed(1)}%)`);
      performanceMonitor.startMetric('memory_pressure');
    } else if (usagePercentage >= this.thresholds.warning) {
      console.warn(`Memory usage high (${usagePercentage.toFixed(1)}%)`);
    }
  }

  /**
   * Register a component
   */
  public registerComponent(componentName: string): void {
    const current = this.componentRegistry.get(componentName) || 0;
    this.componentRegistry.set(componentName, current + 1);
  }

  /**
   * Unregister a component
   */
  public unregisterComponent(componentName: string): void {
    const current = this.componentRegistry.get(componentName) || 0;
    if (current > 1) {
      this.componentRegistry.set(componentName, current - 1);
    } else {
      this.componentRegistry.delete(componentName);
    }
  }

  /**
   * Register an image
   */
  public registerImage(imageUri: string): void {
    this.imageRegistry.add(imageUri);
  }

  /**
   * Unregister an image
   */
  public unregisterImage(imageUri: string): void {
    this.imageRegistry.delete(imageUri);
  }

  /**
   * Add cleanup callback
   */
  public addCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Remove cleanup callback
   */
  public removeCleanupCallback(callback: () => void): void {
    const index = this.cleanupCallbacks.indexOf(callback);
    if (index > -1) {
      this.cleanupCallbacks.splice(index, 1);
    }
  }

  /**
   * Trigger memory cleanup
   */
  public triggerCleanup(): void {
    performanceMonitor.startMetric('memory_cleanup');
    
    // Run all cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Error in cleanup callback:', error);
      }
    });
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Clear old snapshots
    if (this.snapshots.length > 50) {
      this.snapshots = this.snapshots.slice(-50);
    }
    
    performanceMonitor.endMetric('memory_cleanup');
    console.log('Memory cleanup completed');
  }

  /**
   * Get memory statistics
   */
  public getMemoryStats(): {
    current: MemorySnapshot;
    peak: MemorySnapshot;
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    componentBreakdown: Record<string, number>;
  } {
    if (this.snapshots.length === 0) {
      const current = this.captureSnapshot();
      return {
        current,
        peak: current,
        average: current.jsHeapSizeUsed,
        trend: 'stable',
        componentBreakdown: Object.fromEntries(this.componentRegistry),
      };
    }
    
    const current = this.snapshots[this.snapshots.length - 1];
    const peak = this.snapshots.reduce((max, snapshot) => 
      snapshot.jsHeapSizeUsed > max.jsHeapSizeUsed ? snapshot : max
    );
    
    const average = this.snapshots.reduce((sum, snapshot) => 
      sum + snapshot.jsHeapSizeUsed, 0
    ) / this.snapshots.length;
    
    // Calculate trend from last 10 snapshots
    const recentSnapshots = this.snapshots.slice(-10);
    const trend = this.calculateTrend(recentSnapshots);
    
    return {
      current,
      peak,
      average,
      trend,
      componentBreakdown: Object.fromEntries(this.componentRegistry),
    };
  }

  /**
   * Calculate memory usage trend
   */
  private calculateTrend(snapshots: MemorySnapshot[]): 'increasing' | 'decreasing' | 'stable' {
    if (snapshots.length < 2) return 'stable';
    
    const first = snapshots[0].jsHeapSizeUsed;
    const last = snapshots[snapshots.length - 1].jsHeapSizeUsed;
    const difference = last - first;
    const threshold = first * 0.1; // 10% threshold
    
    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate memory report
   */
  public generateReport(): string {
    const stats = this.getMemoryStats();
    const usagePercentage = (stats.current.jsHeapSizeUsed / stats.current.jsHeapSizeLimit) * 100;
    
    let report = '=== Memory Usage Report ===\n\n';
    
    report += `Current Usage: ${(stats.current.jsHeapSizeUsed / 1024 / 1024).toFixed(2)} MB\n`;
    report += `Peak Usage: ${(stats.peak.jsHeapSizeUsed / 1024 / 1024).toFixed(2)} MB\n`;
    report += `Average Usage: ${(stats.average / 1024 / 1024).toFixed(2)} MB\n`;
    report += `Usage Percentage: ${usagePercentage.toFixed(1)}%\n`;
    report += `Trend: ${stats.trend}\n\n`;
    
    report += '--- Component Breakdown ---\n';
    Object.entries(stats.componentBreakdown).forEach(([component, count]) => {
      report += `${component}: ${count} instances\n`;
    });
    
    report += `\nTotal Components: ${stats.current.componentCount}\n`;
    report += `Cached Images: ${stats.current.imageCount}\n`;
    report += `Cache Size: ${(stats.current.cacheSize / 1024 / 1024).toFixed(2)} MB\n`;
    
    return report;
  }

  /**
   * Update memory thresholds
   */
  public updateThresholds(newThresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Clear all monitoring data
   */
  public clearData(): void {
    this.snapshots = [];
    this.componentRegistry.clear();
    this.imageRegistry.clear();
  }
}

/**
 * React hook for component memory tracking
 */
export const useMemoryTracking = (componentName: string) => {
  React.useEffect(() => {
    memoryMonitor.registerComponent(componentName);
    
    return () => {
      memoryMonitor.unregisterComponent(componentName);
    };
  }, [componentName]);
};

/**
 * React hook for image memory tracking
 */
export const useImageMemoryTracking = (imageUri: string) => {
  React.useEffect(() => {
    if (imageUri) {
      memoryMonitor.registerImage(imageUri);
      
      return () => {
        memoryMonitor.unregisterImage(imageUri);
      };
    }
  }, [imageUri]);
};

/**
 * React hook for memory cleanup
 */
export const useMemoryCleanup = (cleanupFunction: () => void) => {
  React.useEffect(() => {
    memoryMonitor.addCleanupCallback(cleanupFunction);
    
    return () => {
      memoryMonitor.removeCleanupCallback(cleanupFunction);
    };
  }, [cleanupFunction]);
};

// Singleton instance
export const memoryMonitor = new MemoryMonitor();

export default memoryMonitor;