/**
 * Virtualized Disease List Component
 * Optimized for handling large datasets with virtual scrolling
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    Text,
    View,
    VirtualizedList,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { ExtendedDiseaseInfo } from '../../types/types';
import { performanceMonitor } from '../../utils/performanceMonitor';
import DiseaseCard from './DiseaseCard';

interface VirtualizedDiseaseListProps {
  diseases: ExtendedDiseaseInfo[];
  onDiseaseSelect: (diseaseId: string) => void;
  bookmarkedDiseases: Set<string>;
  onBookmarkToggle: (diseaseId: string) => void;
  loading?: boolean;
  itemHeight?: number;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DEFAULT_ITEM_HEIGHT = 200;
const BUFFER_SIZE = 5; // Number of items to render outside visible area

export default function VirtualizedDiseaseList({
  diseases,
  onDiseaseSelect,
  bookmarkedDiseases,
  onBookmarkToggle,
  loading = false,
  itemHeight = DEFAULT_ITEM_HEIGHT,
}: VirtualizedDiseaseListProps) {
  const [viewableItems, setViewableItems] = useState<Set<number>>(new Set());
  const renderTimeRef = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);

  // Calculate how many items can fit on screen
  const itemsPerScreen = Math.ceil(SCREEN_HEIGHT / itemHeight);
  const maxToRenderPerBatch = Math.max(5, Math.floor(itemsPerScreen / 2));

  const getItem = useCallback((data: ExtendedDiseaseInfo[], index: number) => {
    return data[index];
  }, []);

  const getItemCount = useCallback((data: ExtendedDiseaseInfo[]) => {
    return data.length;
  }, []);

  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  }), [itemHeight]);

  const keyExtractor = useCallback((item: ExtendedDiseaseInfo, index: number) => {
    return item?.id || `item-${index}`;
  }, []);

  const renderItem = useCallback(({ item, index }: { item: ExtendedDiseaseInfo; index: number }) => {
    if (!item) {
      return (
        <View style={[styles.itemContainer, { height: itemHeight }]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }

    const startTime = Date.now();
    
    const component = (
      <View style={styles.itemContainer}>
        <DiseaseCard
          disease={item}
          onPress={() => onDiseaseSelect(item.id)}
          isBookmarked={bookmarkedDiseases.has(item.id)}
          onBookmarkToggle={() => onBookmarkToggle(item.id)}
          showShareButton={true}
          onShareComplete={(success) => {
            if (success) {
              console.log(`Disease ${item.name} shared successfully`);
            }
          }}
        />
      </View>
    );

    const renderTime = Date.now() - startTime;
    renderTimeRef.current = renderTime;

    // Log slow renders
    if (renderTime > 50) {
      console.warn(`Slow item render: ${renderTime}ms for item ${index}`);
    }

    return component;
  }, [onDiseaseSelect, bookmarkedDiseases, onBookmarkToggle, itemHeight]);

  const onViewableItemsChanged = useCallback(({ viewableItems: newViewableItems }: any) => {
    const viewableIndices = new Set<number>(newViewableItems.map((item: any) => item.index as number));
    setViewableItems(viewableIndices);
    
    // Track performance metrics
    performanceMonitor.startMetric('viewable_items_update');
    performanceMonitor.endMetric('viewable_items_update');
  }, []);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }), []);

  const onScrollBeginDrag = useCallback(() => {
    lastScrollTime.current = Date.now();
    performanceMonitor.startMetric('scroll_performance');
  }, []);

  const onScrollEndDrag = useCallback(() => {
    const scrollDuration = Date.now() - lastScrollTime.current;
    performanceMonitor.endMetric('scroll_performance');
    
    if (scrollDuration > 100) {
      console.warn(`Slow scroll detected: ${scrollDuration}ms`);
    }
  }, []);

  const renderLoadingFooter = useCallback(() => {
    if (!loading) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading more diseases...</Text>
      </View>
    );
  }, [loading]);

  const renderEmptyComponent = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No diseases found</Text>
      </View>
    );
  }, [loading]);

  // Performance monitoring
  React.useEffect(() => {
    const averageRenderTime = renderTimeRef.current;
    if (averageRenderTime > 30) {
      console.warn(`Average render time is high: ${averageRenderTime}ms`);
    }
  }, [diseases.length]);

  return (
    <View style={styles.container}>
      <VirtualizedList
        data={diseases}
        initialNumToRender={itemsPerScreen + BUFFER_SIZE}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemCount={getItemCount}
        getItem={getItem}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        ListFooterComponent={renderLoadingFooter}
        ListEmptyComponent={renderEmptyComponent}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={maxToRenderPerBatch}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        // Accessibility
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel={`Virtualized disease list with ${diseases.length} items`}
        // Style
        style={styles.list}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
  },
  itemContainer: {
    marginBottom: SPACING.sm,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});