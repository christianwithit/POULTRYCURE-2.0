/**
 * Performance optimization hooks for the Disease Glossary
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { debounce, performanceMonitor, throttle } from '../utils/performanceMonitor';

/**
 * Hook for optimizing list rendering performance
 */
export const useOptimizedList = <T>(
  data: T[],
  keyExtractor: (item: T, index: number) => string,
  renderItem: (item: T, index: number) => React.ReactElement
) => {
  const memoizedKeyExtractor = useCallback(keyExtractor, []);
  
  const memoizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => renderItem(item, index),
    [renderItem]
  );

  const getItemLayout = useCallback(
    (data: T[] | null | undefined, index: number) => ({
      length: 200, // Estimated item height
      offset: 200 * index,
      index,
    }),
    []
  );

  const optimizedProps = useMemo(() => ({
    data,
    keyExtractor: memoizedKeyExtractor,
    renderItem: memoizedRenderItem,
    getItemLayout,
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 10,
    windowSize: 10,
  }), [data, memoizedKeyExtractor, memoizedRenderItem, getItemLayout]);

  return optimizedProps;
};

/**
 * Hook for optimizing search functionality
 */
export const useOptimizedSearch = <T>(
  data: T[],
  searchFunction: (items: T[], query: string) => T[],
  debounceDelay: number = 300
) => {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<T[]>(data);
  const [isSearching, setIsSearching] = React.useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      const startTime = Date.now();
      performanceMonitor.startMetric('search_operation');
      
      setIsSearching(true);
      
      // Use InteractionManager to ensure smooth UI during search
      InteractionManager.runAfterInteractions().then(() => {
        try {
          const searchResults = searchFunction(data, searchQuery);
          const searchTime = Date.now() - startTime;
          
          setResults(searchResults);
          performanceMonitor.endMetric('search_operation');
          
          // Track search performance
          performanceMonitor.trackSearchPerformance({
            queryLength: searchQuery.length,
            resultCount: searchResults.length,
            searchTime,
            filterTime: 0,
            renderTime: 0,
          });
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      });
    }, debounceDelay),
    [data, searchFunction, debounceDelay]
  );

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.trim() === '') {
      setResults(data);
      setIsSearching(false);
      return;
    }
    
    debouncedSearch(searchQuery);
  }, [data, debouncedSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(data);
    setIsSearching(false);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, [data]);

  return {
    query,
    results,
    isSearching,
    handleSearch,
    clearSearch,
  };
};

/**
 * Hook for optimizing image loading
 */
export const useOptimizedImages = () => {
  const imageCache = useRef<Map<string, string>>(new Map());
  const loadingImages = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((uri: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (imageCache.current.has(uri)) {
        resolve();
        return;
      }

      if (loadingImages.current.has(uri)) {
        // Image is already being loaded, wait for it
        const checkLoaded = () => {
          if (imageCache.current.has(uri)) {
            resolve();
          } else if (loadingImages.current.has(uri)) {
            setTimeout(checkLoaded, 100);
          } else {
            reject(new Error('Image loading failed'));
          }
        };
        checkLoaded();
        return;
      }

      loadingImages.current.add(uri);

      // Simulate image loading (in real app, use Image.prefetch)
      setTimeout(() => {
        imageCache.current.set(uri, uri);
        loadingImages.current.delete(uri);
        resolve();
      }, 100);
    });
  }, []);

  const preloadImages = useCallback((uris: string[]): Promise<void[]> => {
    return Promise.all(uris.map(preloadImage));
  }, [preloadImage]);

  const isImageCached = useCallback((uri: string): boolean => {
    return imageCache.current.has(uri);
  }, []);

  const clearImageCache = useCallback(() => {
    imageCache.current.clear();
    loadingImages.current.clear();
  }, []);

  return {
    preloadImage,
    preloadImages,
    isImageCached,
    clearImageCache,
  };
};

/**
 * Hook for optimizing filter operations
 */
export const useOptimizedFilters = <T>(
  data: T[],
  filterFunctions: Record<string, (items: T[], value: any) => T[]>
) => {
  const [activeFilters, setActiveFilters] = React.useState<Record<string, any>>({});
  const [filteredData, setFilteredData] = React.useState<T[]>(data);

  const applyFilters = useCallback(
    throttle((filters: Record<string, any>) => {
      const startTime = Date.now();
      performanceMonitor.startMetric('filter_operation');

      let result = [...data];

      Object.entries(filters).forEach(([filterKey, filterValue]) => {
        if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
          const filterFunction = filterFunctions[filterKey];
          if (filterFunction) {
            result = filterFunction(result, filterValue);
          }
        }
      });

      const filterTime = Date.now() - startTime;
      performanceMonitor.endMetric('filter_operation');

      setFilteredData(result);

      // Log slow filter operations
      if (filterTime > 200) {
        console.warn(`Slow filter operation: ${filterTime}ms for ${Object.keys(filters).length} filters`);
      }
    }, 100),
    [data, filterFunctions]
  );

  const updateFilter = useCallback((key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    applyFilters(newFilters);
  }, [activeFilters, applyFilters]);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
    setFilteredData(data);
  }, [data]);

  const removeFilter = useCallback((key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    applyFilters(newFilters);
  }, [activeFilters, applyFilters]);

  // Apply filters when data changes
  React.useEffect(() => {
    applyFilters(activeFilters);
  }, [data, applyFilters, activeFilters]);

  return {
    filteredData,
    activeFilters,
    updateFilter,
    clearFilters,
    removeFilter,
  };
};

/**
 * Hook for monitoring component performance
 */
export const useComponentPerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());

  React.useEffect(() => {
    renderCount.current += 1;
    
    const renderTime = Date.now() - mountTime.current;
    
    if (renderCount.current === 1) {
      // First render (mount)
      performanceMonitor.startMetric(`${componentName}_mount`);
      performanceMonitor.endMetric(`${componentName}_mount`);
    } else {
      // Subsequent renders
      if (renderTime > 16) { // More than one frame at 60fps
        console.warn(`Slow render in ${componentName}: ${renderTime}ms (render #${renderCount.current})`);
      }
    }
  });

  React.useEffect(() => {
    return () => {
      // Component unmount
      const totalTime = Date.now() - mountTime.current;
      console.log(`${componentName} was mounted for ${totalTime}ms with ${renderCount.current} renders`);
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
  };
};

/**
 * Hook for optimizing expensive calculations
 */
export const useOptimizedCalculation = <T, R>(
  data: T,
  calculation: (data: T) => R,
  dependencies: React.DependencyList
): R => {
  return useMemo(() => {
    const startTime = Date.now();
    const result = calculation(data);
    const calculationTime = Date.now() - startTime;
    
    if (calculationTime > 50) {
      console.warn(`Expensive calculation detected: ${calculationTime}ms`);
    }
    
    return result;
  }, dependencies);
};

/**
 * Hook for batch processing operations
 */
export const useBatchProcessor = <T, R>(
  processor: (item: T) => R,
  batchSize: number = 10
) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const processBatch = useCallback(async (items: T[]): Promise<R[]> => {
    setIsProcessing(true);
    setProgress(0);

    const results: R[] = [];
    const totalBatches = Math.ceil(items.length / batchSize);

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Process batch
      const batchResults = batch.map(processor);
      results.push(...batchResults);
      
      // Update progress
      const currentBatch = Math.floor(i / batchSize) + 1;
      setProgress((currentBatch / totalBatches) * 100);
      
      // Yield to main thread
      await new Promise<void>(resolve => {
        InteractionManager.runAfterInteractions().then(() => {
          setTimeout(resolve, 0);
        });
      });
    }

    setIsProcessing(false);
    setProgress(100);

    return results;
  }, [processor, batchSize]);

  return {
    processBatch,
    isProcessing,
    progress,
  };
};