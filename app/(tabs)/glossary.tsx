import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import DiseaseListView from '../../components/glossary/DiseaseListView';
import FilterPanel from '../../components/glossary/FilterPanel';
import { OfflineIndicator } from '../../components/glossary/OfflineIndicator';
import SearchInterface from '../../components/glossary/SearchInterface';
import SafeAreaContainer from '../../components/SafeAreaContainer';
import { BORDER_RADIUS, COLORS, FONT_SIZES, LINE_HEIGHT, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { bookmarkService } from '../../services/bookmarkService';
import { diseaseService } from '../../services/diseaseService';
import { DiseaseCategory, ExtendedDiseaseInfo, FilterCriteria } from '../../types/types';
import { ErrorHandler } from '../../utils/errorHandling';

type TabCategory = 'all' | 'bookmarks' | DiseaseCategory;

export default function GlossaryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [diseases, setDiseases] = useState<ExtendedDiseaseInfo[]>([]);
  const [bookmarkedDiseases, setBookmarkedDiseases] = useState<ExtendedDiseaseInfo[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria>({
    categories: [],
    severities: [],
    species: [],
  });
  const [stats, setStats] = useState({ total: 0, bookmarks: 0, viral: 0, bacterial: 0, parasitic: 0, nutritional: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;

  // Function declarations
  const loadDiseases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allDiseases = await diseaseService.getAllDiseases();
      const statistics = await diseaseService.getDiseaseStatistics();
      
      setDiseases(allDiseases);
      setStats({
        total: statistics.total || 0,
        bookmarks: bookmarkedDiseases.length || 0,
        viral: statistics.byCategory?.viral || 0,
        bacterial: statistics.byCategory?.bacterial || 0,
        parasitic: statistics.byCategory?.parasitic || 0,
        nutritional: statistics.byCategory?.nutritional || 0,
      });

      // Load bookmarked diseases if user is logged in
      // Note: Bookmarks are loaded separately in useEffect to avoid circular dependencies
    } catch (err) {
      const appError = ErrorHandler.mapError(err);
      ErrorHandler.logError(appError, 'GlossaryScreen.loadDiseases');
      setError(appError.message);
      console.error('Error loading diseases:', err);
    } finally {
      setLoading(false);
    }
  }, [bookmarkedDiseases.length]);

  const loadBookmarkedDiseases = useCallback(async (allDiseases?: ExtendedDiseaseInfo[]) => {
    if (!user) return;

    try {
      const bookmarkIds = await bookmarkService.getBookmarkedDiseases(user.id);
      const diseasesToUse = allDiseases || diseases;
      const bookmarked = diseasesToUse.filter(disease => bookmarkIds.includes(disease.id));
      setBookmarkedDiseases(bookmarked);
    } catch (err) {
      const appError = ErrorHandler.mapError(err);
      ErrorHandler.logError(appError, 'GlossaryScreen.loadBookmarkedDiseases');
      console.error('Error loading bookmarked diseases:', err);
      // Don't set main error state for bookmark loading failures
    }
  }, [user, diseases]);

  const updateFiltersForTab = useCallback(() => {
    if (activeTab === 'all' || activeTab === 'bookmarks') {
      setActiveFilters((prev: FilterCriteria) => ({ ...prev, categories: [] }));
    } else {
      setActiveFilters((prev: FilterCriteria) => ({ ...prev, categories: [activeTab as DiseaseCategory] }));
    }
  }, [activeTab]);

  const tabs: { key: TabCategory; label: string; icon: string }[] = useMemo(() => [
    { key: 'all', label: 'All', icon: 'grid' },
    ...(user ? [{ key: 'bookmarks' as TabCategory, label: 'Bookmarks', icon: 'bookmark' }] : []),
    { key: 'viral', label: 'Viral', icon: 'bug' },
    { key: 'bacterial', label: 'Bacterial', icon: 'cellular' },
    { key: 'parasitic', label: 'Parasitic', icon: 'eye' },
    { key: 'nutritional', label: 'Nutritional', icon: 'nutrition' },
  ], [user]);

  // Initial load animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    loadDiseases();
  }, [fadeAnim, slideAnim, loadDiseases]);

  // Tab animation
  useEffect(() => {
    Animated.timing(tabAnim, {
      toValue: tabs.findIndex(tab => tab.key === activeTab),
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabAnim, tabs]);

  useEffect(() => {
    if (user) {
      loadBookmarkedDiseases();
    } else {
      setBookmarkedDiseases([]);
    }
  }, [user, diseases, loadBookmarkedDiseases]);

  useEffect(() => {
    updateFiltersForTab();
  }, [activeTab, updateFiltersForTab]);

  const handleRefresh = async () => {
    await loadDiseases();
  };

  const handleErrorRetry = () => {
    loadDiseases();
  };

  const handleErrorDismiss = () => {
    setError(null);
  };

  const handleDiseaseSelect = (diseaseId: string) => {
    router.push(`/glossary/${diseaseId}` as any);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleDiseaseSelectFromSearch = (disease: ExtendedDiseaseInfo) => {
    handleDiseaseSelect(disease.id);
  };

  const handleFiltersChange = (newFilters: FilterCriteria) => {
    setActiveFilters(newFilters);
    
    // Update active tab based on category filters (but not if on bookmarks tab)
    if (activeTab !== 'bookmarks') {
      if (newFilters.categories.length === 1) {
        setActiveTab(newFilters.categories[0]);
      } else if (newFilters.categories.length === 0) {
        setActiveTab('all');
      }
    }
  };

  const getActiveFilterCount = () => {
    return activeFilters.categories.length + activeFilters.severities.length + activeFilters.species.length;
  };

  const getFilteredDiseases = () => {
    let filtered: ExtendedDiseaseInfo[];
    
    // Start with appropriate dataset based on active tab
    if (activeTab === 'bookmarks') {
      filtered = [...bookmarkedDiseases];
    } else if (activeTab === 'all') {
      filtered = [...diseases];
    } else {
      // Apply tab-based category filter
      filtered = diseases.filter(disease => disease.category === activeTab);
    }
    
    // Apply additional filters (only if not on bookmarks tab)
    if (activeTab !== 'bookmarks') {
      if (activeFilters.categories && activeFilters.categories.length > 0) {
        filtered = filtered.filter(disease => 
          activeFilters.categories.includes(disease.category)
        );
      }

      if (activeFilters.severities && activeFilters.severities.length > 0) {
        filtered = filtered.filter(disease => 
          activeFilters.severities.includes(disease.severity)
        );
      }

      if (activeFilters.species && activeFilters.species.length > 0) {
        filtered = filtered.filter(disease => 
          disease.commonIn.some(species => 
            activeFilters.species.some(filterSpecies => 
              species.toLowerCase().includes(filterSpecies.toLowerCase())
            )
          )
        );
      }
    }

    return filtered;
  };

  const renderTabBar = () => (
    <View style={styles.tabsContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContainer}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={`${tab.label} tab`}
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={isActive ? COLORS.white : COLORS.textMuted}
                style={styles.tabIcon}
              />
              <Text style={[
                styles.tabText,
                { color: isActive ? COLORS.white : COLORS.textMuted }
              ]}>
                {tab.label}
              </Text>
              {searchQuery && activeTab === tab.key && (
                <Text style={styles.filteredCountText}>
                  {' '}({getFilteredDiseases().length})
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => {
    if (activeTab === 'bookmarks' && bookmarkedDiseases.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons 
            name="bookmark-outline" 
            size={48} 
            color={COLORS.textMuted} 
            accessible={false}
          />
          <Text style={styles.emptyStateTitle}>
            No Bookmarked Diseases
          </Text>
          <Text style={styles.emptyStateDescription}>
            Save diseases for quick access by tapping the bookmark icon on any disease card.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setActiveTab('all')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Browse all diseases"
            accessibilityHint="Switch to all diseases view to find and bookmark diseases"
          >
            <Text style={styles.emptyStateButtonText}>
              Browse Diseases
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (searchQuery && getFilteredDiseases().length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons 
            name="search-outline" 
            size={48} 
            color={COLORS.textMuted} 
            accessible={false}
          />
          <Text style={styles.emptyStateTitle}>
            No Diseases Found
          </Text>
          <Text style={styles.emptyStateDescription}>
            No diseases match &quot;{searchQuery}&quot;. Try different keywords or browse categories.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => {
              setSearchQuery('');
              handleSearchChange('');
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            accessibilityHint="Clear the search query and show all diseases"
          >
            <Text style={styles.emptyStateButtonText}>
              Clear Search
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (getActiveFilterCount() > 0 && getFilteredDiseases().length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons 
            name="filter-outline" 
            size={48} 
            color={COLORS.textMuted} 
            accessible={false}
          />
          <Text style={styles.emptyStateTitle}>
            No Diseases Match Filters
          </Text>
          <Text style={styles.emptyStateDescription}>
            Try adjusting your filters or search criteria to find more results.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => {
              setActiveFilters({
                categories: [],
                severities: [],
                species: [],
                searchQuery: ''
              });
              handleFiltersChange({
                categories: [],
                severities: [],
                species: [],
                searchQuery: ''
              });
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
            <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaContainer edges={['top', 'left', 'right']} backgroundColor={COLORS.background}>
      <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text 
              style={styles.headerTitle}
              accessibilityRole="header"
            >
              Disease Glossary
            </Text>
            <Text
              style={styles.headerSubtitle}
              accessibilityLabel="Comprehensive poultry disease information database"
            >
              {searchQuery 
                ? `${getFilteredDiseases().length} of ${diseases.length} diseases found`
                : `${diseases.length} diseases available`
              }
            </Text>
          </View>
          <View 
            style={styles.headerActions}
            accessible={true}
            accessibilityRole="toolbar"
            accessibilityLabel="Glossary actions"
          >
            {user && (
              <TouchableOpacity
                style={styles.bookmarkButton}
                onPress={() => router.push('/profile/bookmarks')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="View bookmarked diseases"
                accessibilityHint="Navigate to your saved disease bookmarks"
              >
                <Ionicons 
                  name="bookmark-outline" 
                  size={20} 
                  color={COLORS.primary}
                  accessible={false}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.filterButton,
                getActiveFilterCount() > 0 && styles.activeFilterButton,
              ]}
              onPress={() => setShowFilters(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Filter diseases${getActiveFilterCount() > 0 ? `, ${getActiveFilterCount()} filters active` : ''}`}
              accessibilityHint="Open filter panel to narrow down disease results"
              accessibilityState={{ expanded: showFilters }}
            >
              <Ionicons
                name="filter"
                size={20}
                color={getActiveFilterCount() > 0 ? COLORS.white : COLORS.primary}
                accessible={false}
              />
              {getActiveFilterCount() > 0 && (
                <View 
                  style={styles.filterBadge}
                  accessible={false}
                >
                  <Text 
                    style={styles.filterBadgeText}
                    accessible={false}
                  >
                    {getActiveFilterCount()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <ErrorDisplay
            error={error}
            onRetry={handleErrorRetry}
            onDismiss={handleErrorDismiss}
          />
        </View>
      )}
      
      {renderTabBar()}
      
      <OfflineIndicator onRefresh={handleRefresh} />
      
      <View 
        style={styles.searchContainer}
        accessible={true}
        accessibilityRole="search"
        accessibilityLabel="Disease search"
      >
        <SearchInterface
          onSearchChange={handleSearchChange}
          onDiseaseSelect={handleDiseaseSelectFromSearch}
          placeholder="Search diseases, symptoms, or keywords..."
        />
      </View>
      
      <View style={styles.content}>
        {renderEmptyState() || (
          <DiseaseListView
            diseases={getFilteredDiseases()}
            onDiseaseSelect={handleDiseaseSelect}
            loading={loading}
            searchQuery={searchQuery}
            activeFilters={activeFilters}
            onRefresh={handleRefresh}
          />
        )}
      </View>

      <FilterPanel
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={activeFilters}
        onFiltersChange={handleFiltersChange}
        diseaseStats={{
          total: stats.total,
          byCategory: {
            viral: stats.viral,
            bacterial: stats.bacterial,
            parasitic: stats.parasitic,
            nutritional: stats.nutritional,
            genetic: 0,
            environmental: 0,
          },
          bySeverity: {},
          bySpecies: {},
        }}
        allDiseases={diseases}
      />
      </View>
    </SafeAreaContainer>
  );
}

// ... (rest of the code remains the same)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: FONT_SIZES.title * LINE_HEIGHT.sm,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'relative',
  },
  tabsScrollContainer: {
    paddingHorizontal: SPACING.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabIcon: {
    marginRight: SPACING.xs,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
  filteredCountText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  tabCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 100,
    height: 2,
    backgroundColor: COLORS.primary,
  },
  activeCountBadge: {
    backgroundColor: COLORS.white,
  },
  countText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  activeCountText: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    lineHeight: FONT_SIZES.xs * LINE_HEIGHT.sm,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyStateButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});