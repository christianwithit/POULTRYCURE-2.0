/**
 * Bundle Size Optimization Utilities
 * Helps reduce bundle size and improve loading performance
 */

import React from 'react';

/**
 * Lazy load components to reduce initial bundle size
 */
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFunction);
  
  const ForwardedComponent = React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    return React.createElement(
      React.Suspense,
      { fallback: fallback ? React.createElement(fallback) : null },
      React.createElement(LazyComponent, { ...props, ref } as any)
    );
  });
  
  ForwardedComponent.displayName = `LazyComponent(${importFunction.name || 'Unknown'})`;
  
  return ForwardedComponent;
};

/**
 * Code splitting for glossary components
 */
export const GlossaryComponents = {
  // Lazy load heavy components
  DiseaseDetailView: createLazyComponent(
    () => import('../app/glossary/[diseaseId]'),
  ),
  
  FilterPanel: createLazyComponent(
    () => import('../components/glossary/FilterPanel'),
  ),
  
  ImageGallery: createLazyComponent(
    () => import('../components/glossary/ImageGallery'),
  ),
  
  ShareModal: createLazyComponent(
    () => import('../components/glossary/ShareModal'),
  ),
};

/**
 * Dynamic imports for services
 */
export const loadService = {
  diseaseService: () => import('../services/diseaseService'),
  bookmarkService: () => import('../services/bookmarkService'),
  shareService: () => import('../services/shareService'),
  cacheManager: () => import('../services/cacheManager'),
  imageCacheService: () => import('../services/imageCacheService'),
};

/**
 * Tree-shakable utility functions
 */
export const utils = {
  // Only import specific functions when needed
  debounce: () => import('../utils/performanceMonitor').then(m => m.debounce),
  throttle: () => import('../utils/performanceMonitor').then(m => m.throttle),
  performanceMonitor: () => import('../utils/performanceMonitor').then(m => m.performanceMonitor),
};

/**
 * Conditional loading based on platform or feature flags
 */
export const conditionalImports = {
  // Load platform-specific components
  loadPlatformComponent: (component: string) => {
    const platform = require('react-native').Platform.OS;
    
    switch (component) {
      case 'ShareButton':
        return import('../components/glossary/ShareButton');
      default:
        return import(`../components/glossary/${component}`);
    }
  },
  
  // Load feature-specific modules
  loadFeatureModule: (feature: string) => {
    switch (feature) {
      case 'accessibility':
        return import('../utils/accessibility');
      case 'performance':
        return import('../utils/performanceMonitor');
      case 'offline':
        return import('../services/cacheManager');
      default:
        throw new Error(`Unknown feature: ${feature}`);
    }
  },
};

/**
 * Preload critical components
 */
export const preloadCriticalComponents = async () => {
  // Preload components that are likely to be used soon
  const criticalImports = [
    import('../components/glossary/DiseaseCard'),
    import('../components/glossary/DiseaseListView'),
    import('../components/glossary/SearchInterface'),
  ];
  
  try {
    await Promise.all(criticalImports);
    console.log('Critical components preloaded successfully');
  } catch (error) {
    console.warn('Error preloading critical components:', error);
  }
};

/**
 * Bundle analysis helper
 */
export const bundleAnalysis = {
  // Track component usage for optimization insights
  trackComponentUsage: (componentName: string) => {
    if (__DEV__) {
      const usage = JSON.parse(
        require('@react-native-async-storage/async-storage').getItem('component_usage') || '{}'
      );
      usage[componentName] = (usage[componentName] || 0) + 1;
      require('@react-native-async-storage/async-storage').setItem(
        'component_usage', 
        JSON.stringify(usage)
      );
    }
  },
  
  // Get usage statistics
  getUsageStats: async () => {
    if (__DEV__) {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const usage = await AsyncStorage.getItem('component_usage');
      return usage ? JSON.parse(usage) : {};
    }
    return {};
  },
  
  // Clear usage statistics
  clearUsageStats: async () => {
    if (__DEV__) {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      await AsyncStorage.removeItem('component_usage');
    }
  },
};

/**
 * Memory optimization utilities
 */
export const memoryOptimization = {
  // Cleanup unused imports
  cleanupImports: () => {
    // This would be handled by bundler tree-shaking
    // But we can provide hints for manual cleanup
    if (__DEV__) {
      console.log('Consider removing unused imports to reduce bundle size');
    }
  },
  
  // Optimize image imports
  optimizeImageImports: () => {
    // Use require.context for dynamic image loading
    const imageContext = require.context('../assets/images', false, /\.(png|jpg|jpeg|gif)$/);
    return imageContext.keys().reduce((images: Record<string, any>, item: string) => {
      const key = item.replace('./', '').replace(/\.(png|jpg|jpeg|gif)$/, '');
      images[key] = imageContext(item);
      return images;
    }, {});
  },
};

/**
 * Progressive loading strategy
 */
export const progressiveLoading = {
  // Load components in order of priority
  loadByPriority: async (components: string[]) => {
    const loadPromises = components.map(async (component, index) => {
      // Add delay based on priority (lower index = higher priority)
      await new Promise(resolve => setTimeout(resolve, index * 100));
      
      try {
        return await import(`../components/glossary/${component}`);
      } catch (error) {
        console.warn(`Failed to load component ${component}:`, error);
        return null;
      }
    });
    
    return Promise.allSettled(loadPromises);
  },
  
  // Load based on user interaction patterns
  loadBasedOnUsage: async () => {
    const usage = await bundleAnalysis.getUsageStats();
    const sortedComponents = Object.entries(usage)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([component]) => component);
    
    return progressiveLoading.loadByPriority(sortedComponents);
  },
};

/**
 * Webpack/Metro bundler hints
 */
export const bundlerHints = {
  // Mark modules for code splitting
  splitChunk: (chunkName: string, importFunction: () => Promise<any>) => {
    return import(
      /* webpackChunkName: "[request]" */
      /* webpackMode: "lazy" */
      importFunction.toString()
    );
  },
  
  // Prefetch modules
  prefetchModule: (modulePath: string) => {
    return import(
      /* webpackPrefetch: true */
      modulePath
    );
  },
  
  // Preload modules
  preloadModule: (modulePath: string) => {
    return import(
      /* webpackPreload: true */
      modulePath
    );
  },
};

export default {
  createLazyComponent,
  GlossaryComponents,
  loadService,
  utils,
  conditionalImports,
  preloadCriticalComponents,
  bundleAnalysis,
  memoryOptimization,
  progressiveLoading,
  bundlerHints,
};