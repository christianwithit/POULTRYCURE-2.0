import { useAccessibility, useAccessibilityFocus } from '@/hooks/useAccessibility';
import { useComponentPerformance } from '@/hooks/usePerformanceOptimization';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Dimensions
} from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, LINE_HEIGHT, SHADOWS, SPACING } from '../../constants/theme';
import { diseaseService } from '../../services/diseaseService';
import { RecentSearch, searchHistoryService } from '../../services/searchHistoryService';
import { ExtendedDiseaseInfo } from '../../types/types';
import { ErrorHandler } from '../../utils/errorHandling';

interface SearchInterfaceProps {
  onSearchChange: (query: string) => void;
  onDiseaseSelect?: (disease: ExtendedDiseaseInfo) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'disease' | 'symptom' | 'tag' | 'recent';
  disease?: ExtendedDiseaseInfo;
}

const SearchInterface = React.memo(function SearchInterface({
  onSearchChange,
  onDiseaseSelect,
  placeholder = 'Search diseases, symptoms, or keywords...',
  autoFocus = false,
}: SearchInterfaceProps) {
  const { renderCount } = useComponentPerformance('SearchInterface');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const { colors, isHighContrastEnabled } = useAccessibility();
  const { announceChange } = useAccessibilityFocus();
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const { height: screenHeight } = Dimensions.get('window');

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (query.trim().length >= 2) {
        generateSuggestions(query);
      } else {
        setSuggestions([]);
      }
      onSearchChange(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearchChange]);

  // Animate suggestions modal
  useEffect(() => {
    if (showSuggestions) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSuggestions]);

  const loadRecentSearches = async () => {
    try {
      const history = await searchHistoryService.getRecentSearches();
      setRecentSearches(history);
    } catch (err) {
      const appError = ErrorHandler.mapError(err);
      ErrorHandler.logError(appError, 'SearchInterface.loadRecentSearches');
      console.error('Error loading recent searches:', err);
    }
  };

  const saveRecentSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      await searchHistoryService.addRecentSearch(searchQuery);
      await loadRecentSearches(); // Refresh the list
    } catch (err) {
      const appError = ErrorHandler.mapError(err);
      ErrorHandler.logError(appError, 'SearchInterface.saveRecentSearch');
      console.error('Error saving recent search:', err);
    }
  };

  const generateSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const serviceSuggestions = await diseaseService.getSearchSuggestions(searchQuery, 8);

      const newSuggestions: SearchSuggestion[] = serviceSuggestions.map((suggestion, index) => ({
        id: `${suggestion.type}-${index}-${suggestion.text}`,
        text: suggestion.text,
        type: suggestion.type as 'disease' | 'symptom' | 'tag',
        disease: suggestion.disease,
      }));

      setSuggestions(newSuggestions);

      // Announce search results for screen readers
      if (newSuggestions.length > 0) {
        announceChange(`${newSuggestions.length} search suggestion${newSuggestions.length !== 1 ? 's' : ''} found`);
      } else {
        announceChange('No search suggestions found');
      }
    } catch (err) {
      const appError = ErrorHandler.mapError(err);
      ErrorHandler.logError(appError, 'SearchInterface.generateSuggestions');
      console.error('Error generating suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (text: string) => {
    setQuery(text);
    setShowSuggestions(text.length >= 2);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (query.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow tap on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    saveRecentSearch(suggestion.text);

    if (suggestion.disease && onDiseaseSelect) {
      onDiseaseSelect(suggestion.disease);
    }

    Keyboard.dismiss();
  };

  const handleRecentSearchPress = (recentSearch: RecentSearch) => {
    setQuery(recentSearch.query);
    setShowSuggestions(false);
    onSearchChange(recentSearch.query);
    Keyboard.dismiss();
  };

  const handleClearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    onSearchChange('');
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (query.trim()) {
      saveRecentSearch(query);
      setShowSuggestions(false);
      announceChange(`Searching for ${query}`);
      Keyboard.dismiss();
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    const now = Date.now();
    const diff = now - timestamp.getTime();

    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
  };

  const handleDeleteRecentSearch = async (searchId: string) => {
    try {
      await searchHistoryService.removeRecentSearch(searchId);
      await loadRecentSearches();
    } catch (err) {
      const appError = ErrorHandler.mapError(err);
      ErrorHandler.logError(appError, 'SearchInterface.handleDeleteRecentSearch');
      console.error('Error deleting recent search:', err);
    }
  };

  const getLiveResultCount = (): number => {
    return suggestions.length;
  };

  const clearRecentSearches = async () => {
    try {
      await searchHistoryService.clearRecentSearches();
      setRecentSearches([]);
    } catch (err) {
      const appError = ErrorHandler.mapError(err);
      ErrorHandler.logError(appError, 'SearchInterface.clearRecentSearches');
      console.error('Error clearing recent searches:', err);
    }
  };

  const getSuggestionIcon = (type: string): string => {
    switch (type) {
      case 'disease':
        return 'medical';
      case 'symptom':
        return 'pulse';
      case 'tag':
        return 'pricetag';
      case 'cause':
        return 'bug';
      case 'recent':
        return 'time';
      default:
        return 'search';
    }
  };

  const highlightMatch = (text: string, searchQuery: string): React.ReactNode => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <Text key={index} style={styles.highlightedText}>
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  const renderSuggestion = ({ item, index }: { item: SearchSuggestion; index: number }) => {
  return (
    <View
      style={styles.suggestionItem}
    >
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress(item)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${item.text}, ${item.type}${item.disease ? ', tap to view disease details' : ', tap to search'}`}
        accessibilityHint={item.disease ? `View detailed information about ${item.text}` : `Search for ${item.text}`}
      >
        <Ionicons
          name={getSuggestionIcon(item.type) as any}
          size={16}
          color={COLORS.textMuted}
          style={styles.suggestionIcon}
          accessible={false}
        />
        <View style={styles.suggestionContent} accessible={false}>
          <Text style={styles.suggestionText} accessible={false}>
            {highlightMatch(item.text, query)}
          </Text>
          {item.type !== 'disease' && (
            <Text style={styles.suggestionType} accessible={false}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          )}
        </View>
        <Ionicons
          name="arrow-up-outline"
          size={16}
          color={COLORS.textMuted}
          style={styles.fillIcon}
          accessible={false}
        />
      </TouchableOpacity>
    </View>
  );
};

  const renderRecentSearch = ({ item, index }: { item: RecentSearch; index: number }) => {
  return (
    <View
      style={styles.suggestionItem}
    >
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleRecentSearchPress(item)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Recent search: ${item.query}`}
        accessibilityHint={`Tap to search again for ${item.query}`}
      >
        <Ionicons
          name="time"
          size={16}
          color={COLORS.textMuted}
          style={styles.suggestionIcon}
          accessible={false}
        />
        <View style={styles.suggestionContent} accessible={false}>
          <Text style={styles.suggestionText} accessible={false}>
            {item.query}
          </Text>
          <View style={styles.recentSearchMeta}>
            <Text style={styles.suggestionType} accessible={false}>
              Recent search
            </Text>
            <Text style={styles.timestampText} accessible={false}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>
        <View style={styles.recentSearchActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteRecentSearch(item.id)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Delete recent search: ${item.query}`}
            accessibilityHint="Remove this search from history"
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={COLORS.error}
              accessible={false}
            />
          </TouchableOpacity>
          <Ionicons
            name="arrow-up-outline"
            size={16}
            color={COLORS.textMuted}
            style={styles.fillIcon}
            accessible={false}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

  const renderSuggestionsContent = () => {
    const hasQuery = query.trim().length >= 2;
    const hasSuggestions = suggestions.length > 0;
    const hasRecentSearches = recentSearches.length > 0;

    if (!hasQuery && !hasRecentSearches) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyStateText}>
            Start typing to search diseases, symptoms, or keywords
          </Text>
        </View>
      );
    }

    if (hasQuery && !hasSuggestions && !loading) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyStateTitle}>No suggestions found</Text>
          <Text style={styles.emptyStateText}>
            Try searching for:
          </Text>
          <View style={styles.suggestionsList}>
            <Text style={styles.suggestionExample}>• Disease names (e.g., &quot;Newcastle Disease&quot;)</Text>
            <Text style={styles.suggestionExample}>• Symptoms (e.g., &quot;respiratory distress&quot;)</Text>
            <Text style={styles.suggestionExample}>• Keywords (e.g., &quot;viral&quot;, &quot;bacterial&quot;)</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.suggestionsContainer}>
        {hasQuery && hasSuggestions && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Suggestions</Text>
                <Text style={styles.resultCount}>
                  {getLiveResultCount()} results
                </Text>
              </View>
            </View>
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}

        {!hasQuery && hasRecentSearches && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <Text style={styles.resultCount}>
                  {recentSearches.length} items
                </Text>
              </View>
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentSearches}
              renderItem={renderRecentSearch}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchInputContainer, 
        isFocused && styles.searchInputContainerFocused
      ]} accessible={true} accessibilityRole="search">
        <Animated.View
          style={{
            transform: [{
              scale: focusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.05],
              })
            }]
          }}
        >
          <Ionicons
            name="search"
            size={20}
            color={isFocused ? COLORS.primary : COLORS.textMuted}
            style={styles.searchIcon}
            accessible={false}
          />
        </Animated.View>
        <TextInput
          ref={inputRef}
          style={[
            styles.searchInput,
            isHighContrastEnabled && {
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={isHighContrastEnabled ? colors.textMuted : COLORS.textMuted}
          value={query}
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onSubmitEditing={handleSubmit}
          autoFocus={autoFocus}
          returnKeyType="search"
          clearButtonMode="never"
          accessible={true}
          accessibilityRole="search"
          accessibilityLabel="Search diseases"
          accessibilityHint="Type to search for diseases, symptoms, or keywords. Suggestions will appear as you type"
          accessibilityValue={{ text: query }}
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearButtonIcon}
            onPress={handleClearSearch}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            accessibilityHint="Clear the current search query"
          >
            <Animated.View
              style={{
                transform: [{
                  rotate: focusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '90deg'],
                  })
                }]
              }}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={isFocused ? COLORS.primary : COLORS.textMuted}
                accessible={false}
              />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showSuggestions}
        transparent
        animationType="none"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuggestions(false)}
        >
          <Animated.View
            style={[
              styles.suggestionsModal,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                maxHeight: screenHeight * 0.6,
              }
            ]}
          >
            {renderSuggestionsContent()}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

export default SearchInterface;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  searchInputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    ...SHADOWS.medium,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: 0,
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.md,
  },
  clearButtonIcon: {
    marginLeft: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
  suggestionsModal: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    maxHeight: 400,
    ...SHADOWS.medium,
  },
  suggestionsContainer: {
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitleContainer: {
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.sm,
  },
  resultCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
  clearButton: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  suggestionIcon: {
    marginRight: SPACING.sm,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: 2,
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.sm,
  },
  suggestionType: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  fillIcon: {
    marginLeft: SPACING.sm,
  },
  highlightedText: {
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    lineHeight: FONT_SIZES.lg * LINE_HEIGHT.sm,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.md,
  },
  suggestionsList: {
    alignSelf: 'stretch',
  },
  suggestionExample: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
  recentSearchMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  recentSearchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
});