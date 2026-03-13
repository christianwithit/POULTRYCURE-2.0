import { useAccessibilityFocus } from '@/hooks/useAccessibility';
import { useComponentPerformance, useOptimizedList } from '@/hooks/usePerformanceOptimization';
import { useMemoryTracking } from '@/utils/memoryMonitor';
import performanceMonitor from '@/utils/performanceMonitor';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { bookmarkService } from '../../services/bookmarkService';
import { ExtendedDiseaseInfo, FilterCriteria } from '../../types/types';
import { ErrorHandler } from '../../utils/errorHandling';
import DiseaseCard from './DiseaseCard';
import SkeletonLoader from './SkeletonLoader';
import VirtualizedDiseaseList from './VirtualizedDiseaseList';

interface DiseaseListViewProps {
  diseases: ExtendedDiseaseInfo[];
  onDiseaseSelect: (diseaseId: string) => void;
  loading: boolean;
  searchQuery: string;
  activeFilters: FilterCriteria;
  onRefresh?: () => Promise<void>;
}

export default function DiseaseListView({
  diseases,
  onDiseaseSelect,
  loading,
  searchQuery,
  activeFilters,
  onRefresh,
}: DiseaseListViewProps) {
  const { renderCount } = useComponentPerformance('DiseaseListView');
  const { user } = useAuth();
  const { announceChange } = useAccessibilityFocus();
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedDiseases, setBookmarkedDiseases] = useState<Set<string>>(new Set());
  const [useVirtualization, setUseVirtualization] = useState(diseases.length > 100);

  // Memory tracking
  useMemoryTracking('DiseaseListView');

  // Load bookmarks on component mount
  React.useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    if (!user) return;

    try {
      const bookmarks = await bookmarkService.getBookmarkedDiseases(user.id);
      setBookmarkedDiseases(new Set(bookmarks));
    } catch (err) {
      const appError = ErrorHandler.mapError(err);
      ErrorHandler.logError(appError, 'DiseaseListView.loadBookmarks');
      console.error('Error loading bookmarks:', err);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
        await loadBookmarks(); // Refresh bookmarks too
      } catch (err) {
        const appError = ErrorHandler.mapError(err);
        ErrorHandler.logError(appError, 'DiseaseListView.handleRefresh');
        console.error('Error refreshing:', err);
      } finally {
        setRefreshing(false);
      }
    }
  }, [onRefresh]);

  // Optimized bookmark toggle with optimistic updates
  const handleBookmarkToggle = useCallback(async (diseaseId: string) => {
    if (!user) return;

    // Optimistic UI update - immediately update the UI
    const isCurrentlyBookmarked = bookmarkedDiseases.has(diseaseId);
    const disease = diseases.find(d => d.id === diseaseId);
    const diseaseName = disease?.name || 'disease';

    // Update UI immediately
    setBookmarkedDiseases(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyBookmarked) {
        newSet.delete(diseaseId);
      } else {
        newSet.add(diseaseId);
      }
      return newSet;
    });

    // Announce the change immediately for better UX
    announceChange(isCurrentlyBookmarked
      ? `${diseaseName} removed from bookmarks`
      : `${diseaseName} added to bookmarks`
    );

    try {
      // Perform the actual API call
      if (isCurrentlyBookmarked) {
        await bookmarkService.removeBookmark(user.id, diseaseId);
      } else {
        await bookmarkService.addBookmark(user.id, diseaseId);
      }
    } catch (err) {
      // Revert the optimistic update on error
      setBookmarkedDiseases(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyBookmarked) {
          newSet.add(diseaseId);
        } else {
          newSet.delete(diseaseId);
        }
        return newSet;
      });

      const appError = ErrorHandler.mapError(err);
      ErrorHandler.logError(appError, 'DiseaseListView.handleBookmarkToggle');
      console.error('Error toggling bookmark:', err);
      announceChange('Error updating bookmark. Please try again.');
    }
  }, [bookmarkedDiseases, user, diseases, announceChange]);

  const filteredDiseases = useMemo(() => {
    performanceMonitor.startMetric('disease_list_filter');

    // The diseases prop should already be filtered by the parent component
    // We only need to apply additional search query filtering if needed
    let filtered = [...diseases];

    // Apply search query if it's different from what's already applied
    if (searchQuery && searchQuery.trim() && !activeFilters.searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(disease => {
        const searchableText = [
          disease.name,
          disease.description,
          ...disease.symptoms,
          ...disease.causes,
          ...disease.tags,
        ].join(' ').toLowerCase();
        return searchableText.includes(query);
      });
    }

    // Update virtualization based on list size
    setUseVirtualization(filtered.length > 100);

    performanceMonitor.endMetric('disease_list_filter');
    return filtered;
  }, [diseases, searchQuery, activeFilters]);

  const renderDiseaseCard = useCallback(({ item }: { item: ExtendedDiseaseInfo }) => (
    <DiseaseCard
      disease={item}
      onPress={() => onDiseaseSelect(item.id)}
      isBookmarked={user ? bookmarkedDiseases.has(item.id) : false}
      onBookmarkToggle={user ? () => handleBookmarkToggle(item.id) : undefined}
      showShareButton={true}
      onShareComplete={(success) => {
        if (success) {
          console.log(`Disease ${item.name} shared successfully`);
        }
      }}
    />
  ), [onDiseaseSelect, bookmarkedDiseases, handleBookmarkToggle, user]);

  const renderEmptyState = () => {
    if (loading) {
      return null;
    }

    const hasActiveFilters = searchQuery ||
      (activeFilters.categories && activeFilters.categories.length > 0) ||
      (activeFilters.severities && activeFilters.severities.length > 0) ||
      (activeFilters.species && activeFilters.species.length > 0);

    return (
      <View
        style={styles.emptyContainer}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={hasActiveFilters ? 'No matching diseases found' : 'No diseases available'}
      >
        <Ionicons
          name={hasActiveFilters ? "search-outline" : "document-text-outline"}
          size={64}
          color={COLORS.textMuted}
          accessible={false}
        />
        <Text
          style={styles.emptyTitle}
          accessibilityRole="header"
        >
          {hasActiveFilters ? 'No matching diseases' : 'No diseases found'}
        </Text>
        <Text style={styles.emptyText}>
          {hasActiveFilters
            ? 'Try adjusting your search or filters to find more results.'
            : 'No diseases available in the database.'
          }
        </Text>
      </View>
    );
  };

  const renderLoadingState = () => {
    // Show skeleton loader for better UX during initial load
    if (diseases.length === 0) {
      return <SkeletonLoader count={5} showHeader={true} />;
    }

    // Show simple loading indicator for refreshes
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading diseases...</Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (loading || filteredDiseases.length === 0) {
      return null;
    }

    const hasActiveFilters = searchQuery ||
      (activeFilters.categories && activeFilters.categories.length > 0) ||
      (activeFilters.severities && activeFilters.severities.length > 0) ||
      (activeFilters.species && activeFilters.species.length > 0);

    return (
      <View
        style={styles.headerContainer}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`${filteredDiseases.length} disease${filteredDiseases.length !== 1 ? 's' : ''} found${hasActiveFilters ? ` from ${diseases.length} total` : ''}${searchQuery ? ` for search term ${searchQuery}` : ''}`}
      >
        <Text
          style={styles.resultCount}
          accessibilityRole="header"
        >
          {filteredDiseases.length} disease{filteredDiseases.length !== 1 ? 's' : ''} found
          {hasActiveFilters && ` (filtered from ${diseases.length})`}
        </Text>
        {searchQuery && (
          <Text style={styles.searchInfo}>
            Searching for: &quot;{searchQuery}&quot;
          </Text>
        )}
      </View>
    );
  };

  const keyExtractor = useCallback((item: ExtendedDiseaseInfo) => item.id, []);

  const getItemLayout = useCallback((_data: ArrayLike<ExtendedDiseaseInfo> | null | undefined, index: number) => ({
    length: 200, // Approximate height of each card
    offset: 200 * index,
    index,
  }), []);

  // Use optimized list props
  const optimizedListProps = useOptimizedList(
    filteredDiseases,
    keyExtractor,
    (item: ExtendedDiseaseInfo) => renderDiseaseCard({ item })
  );

  if (loading && diseases.length === 0) {
    return renderLoadingState();
  }

  // Use virtualized list for large datasets
  if (useVirtualization) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <VirtualizedDiseaseList
          diseases={filteredDiseases}
          onDiseaseSelect={onDiseaseSelect}
          bookmarkedDiseases={bookmarkedDiseases}
          onBookmarkToggle={handleBookmarkToggle}
          loading={loading}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        {...optimizedListProps}
        getItemLayout={getItemLayout}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          filteredDiseases.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
              title="Pull to refresh"
              titleColor={COLORS.textMuted}
              accessibilityLabel="Pull to refresh disease list"
            />
          ) : undefined
        }
        // Add loading footer when refreshing with skeleton
        ListFooterComponent={
          loading && diseases.length > 0 ? (
            <View
              style={styles.footerLoading}
              accessible={true}
              accessibilityRole="progressbar"
              accessibilityLabel="Updating disease list"
            >
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                accessible={false}
              />
              <Text
                style={styles.footerLoadingText}
                accessible={false}
              >
                Updating...
              </Text>
            </View>
          ) : null
        }
        // Add optimistic UI updates
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel={`Disease list with ${filteredDiseases.length} items`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: SPACING.md,
  },
  resultCount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  searchInfo: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  footerLoadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },
});