import { useAccessibility, useAccessibilityFocus } from '@/hooks/useAccessibility';
import { useComponentPerformance } from '@/hooks/usePerformanceOptimization';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { DiseaseCategory, FilterCriteria, ExtendedDiseaseInfo } from '../../types/types';

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
  diseaseStats?: {
    total: number;
    byCategory: Record<DiseaseCategory, number>;
    bySeverity: Record<string, number>;
    bySpecies: Record<string, number>;
  };
  allDiseases?: ExtendedDiseaseInfo[];
  liveResultCount?: number;
}

interface FilterOption {
  key: string;
  label: string;
  count?: number;
  icon?: string;
}

const FilterPanel = React.memo(function FilterPanel({
  visible,
  onClose,
  filters,
  onFiltersChange,
  diseaseStats,
  allDiseases = [],
  liveResultCount = 0,
}: FilterPanelProps) {
  const { renderCount } = useComponentPerformance('FilterPanel');
  const { colors, isHighContrastEnabled } = useAccessibility();
  const { announceChange } = useAccessibilityFocus();

  const categoryOptions: FilterOption[] = useMemo(() => [
    { key: 'viral', label: 'Viral', count: diseaseStats?.byCategory.viral, icon: 'bug-outline' },
    { key: 'bacterial', label: 'Bacterial', count: diseaseStats?.byCategory.bacterial, icon: 'cellular-outline' },
    { key: 'parasitic', label: 'Parasitic', count: diseaseStats?.byCategory.parasitic, icon: 'eye-outline' },
    { key: 'nutritional', label: 'Nutritional', count: diseaseStats?.byCategory.nutritional, icon: 'nutrition-outline' },
    { key: 'genetic', label: 'Genetic', count: diseaseStats?.byCategory.genetic, icon: 'git-branch-outline' },
    { key: 'environmental', label: 'Environmental', count: diseaseStats?.byCategory.environmental, icon: 'leaf-outline' },
  ], [diseaseStats]);

  const severityOptions: FilterOption[] = useMemo(() => [
    { key: 'low', label: 'Low', count: diseaseStats?.bySeverity.low, icon: 'checkmark-circle-outline' },
    { key: 'moderate', label: 'Moderate', count: diseaseStats?.bySeverity.moderate, icon: 'warning-outline' },
    { key: 'high', label: 'High', count: diseaseStats?.bySeverity.high, icon: 'alert-circle-outline' },
  ], [diseaseStats]);

  const speciesOptions: FilterOption[] = useMemo(() => [
    { key: 'chickens', label: 'Chickens', count: diseaseStats?.bySpecies.chickens, icon: 'egg-outline' },
    { key: 'turkeys', label: 'Turkeys', count: diseaseStats?.bySpecies.turkeys, icon: 'egg-outline' },
    { key: 'ducks', label: 'Ducks', count: diseaseStats?.bySpecies.ducks, icon: 'water-outline' },
    { key: 'geese', label: 'Geese', count: diseaseStats?.bySpecies.geese, icon: 'water-outline' },
    { key: 'all poultry', label: 'All Poultry', count: diseaseStats?.bySpecies['all poultry'], icon: 'apps-outline' },
  ], [diseaseStats]);

  const handleCategoryToggle = useCallback((category: string) => {
    const typedCategory = category as DiseaseCategory;
    const newCategories = filters.categories.includes(typedCategory)
      ? filters.categories.filter(c => c !== typedCategory)
      : [...filters.categories, typedCategory];

    const newFilters = {
      ...filters,
      categories: newCategories,
    };

    onFiltersChange(newFilters);

    // Announce filter change
    const action = filters.categories.includes(typedCategory) ? 'removed' : 'added';
    announceChange(`${category} category ${action} to filters`);
  }, [filters, onFiltersChange, announceChange]);

  const handleSeverityToggle = useCallback((severity: string) => {
    const typedSeverity = severity as 'low' | 'moderate' | 'high';
    const newSeverities = filters.severities.includes(typedSeverity)
      ? filters.severities.filter(s => s !== typedSeverity)
      : [...filters.severities, typedSeverity];

    const newFilters = {
      ...filters,
      severities: newSeverities,
    };

    onFiltersChange(newFilters);

    // Announce filter change
    const action = filters.severities.includes(typedSeverity) ? 'removed' : 'added';
    announceChange(`${severity} severity ${action} to filters`);
  }, [filters, onFiltersChange, announceChange]);

  const handleSpeciesToggle = useCallback((species: string) => {
    const newSpecies = filters.species.includes(species)
      ? filters.species.filter(s => s !== species)
      : [...filters.species, species];

    const newFilters = {
      ...filters,
      species: newSpecies,
    };

    onFiltersChange(newFilters);

    // Announce filter change
    const action = filters.species.includes(species) ? 'removed' : 'added';
    announceChange(`${species} species ${action} to filters`);
  }, [filters, onFiltersChange, announceChange]);

  const handleClearAll = useCallback(() => {
    const clearedFilters = {
      categories: [],
      severities: [],
      species: [],
      searchQuery: filters.searchQuery,
    };

    onFiltersChange(clearedFilters);
    announceChange('All filters cleared');
  }, [filters.searchQuery, onFiltersChange, announceChange]);

  const calculateLiveResultCount = useCallback(() => {
    if (!allDiseases.length) return 0;

    let filtered = allDiseases;

    if (filters.categories.length > 0) {
      filtered = filtered.filter(disease =>
        filters.categories.includes(disease.category)
      );
    }

    if (filters.severities.length > 0) {
      filtered = filtered.filter(disease =>
        filters.severities.includes(disease.severity)
      );
    }

    if (filters.species.length > 0) {
      filtered = filtered.filter(disease =>
        disease.commonIn.some(species =>
          filters.species.some(filterSpecies =>
            species.toLowerCase().includes(filterSpecies.toLowerCase())
          )
        )
      );
    }

    return filtered.length;
  }, [allDiseases, filters]);

  const currentResultCount = calculateLiveResultCount();

  const getActiveFilterCount = useMemo(() => {
    return filters.categories.length + filters.severities.length + filters.species.length;
  }, [filters]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return COLORS.success;
      case 'moderate':
        return COLORS.warning;
      case 'high':
        return COLORS.error;
      default:
        return COLORS.textMuted;
    }
  };

  const handleSelectAll = useCallback((section: 'categories' | 'severities' | 'species') => {
    switch (section) {
      case 'categories':
        onFiltersChange({
          ...filters,
          categories: categoryOptions.map(opt => opt.key as DiseaseCategory),
        });
        break;
      case 'severities':
        onFiltersChange({
          ...filters,
          severities: severityOptions.map(opt => opt.key as 'low' | 'moderate' | 'high'),
        });
        break;
      case 'species':
        onFiltersChange({
          ...filters,
          species: speciesOptions.map(opt => opt.key),
        });
        break;
    }
  }, [filters, onFiltersChange, categoryOptions, severityOptions, speciesOptions]);

  const handleDeselectAll = useCallback((section: 'categories' | 'severities' | 'species') => {
    switch (section) {
      case 'categories':
        onFiltersChange({ ...filters, categories: [] });
        break;
      case 'severities':
        onFiltersChange({ ...filters, severities: [] });
        break;
      case 'species':
        onFiltersChange({ ...filters, species: [] });
        break;
    }
  }, [filters, onFiltersChange]);

  const renderFilterSection = (
    title: string,
    options: FilterOption[],
    selectedValues: string[],
    onToggle: (value: string) => void,
    getColor?: (value: string) => string,
    section?: 'categories' | 'severities' | 'species'
  ) => (
    <View
      style={styles.filterSection}
      accessible={true}
      accessibilityLabel={`${title} filter section`}
    >
      <View style={styles.sectionHeader}>
        <Text
          style={styles.sectionTitle}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {section && (
          <View
            style={styles.sectionActions}
            accessible={true}
            accessibilityLabel={`${title} selection actions`}
          >
            <TouchableOpacity
              style={styles.sectionAction}
              onPress={() => handleSelectAll(section)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Select all ${title.toLowerCase()}`}
              accessibilityHint={`Select all options in the ${title.toLowerCase()} section`}
            >
              <Text
                style={styles.sectionActionText}
                accessible={false}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sectionAction}
              onPress={() => handleDeselectAll(section)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Deselect all ${title.toLowerCase()}`}
              accessibilityHint={`Clear all selections in the ${title.toLowerCase()} section`}
            >
              <Text
                style={styles.sectionActionText}
                accessible={false}
              >
                None
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View
        style={styles.optionsContainer}
        accessible={true}
        accessibilityLabel={`${title} options`}
      >
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.key);
          const color = getColor ? getColor(option.key) : COLORS.primary;

          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterOption,
                isSelected && { ...styles.selectedOption, borderColor: color },
              ]}
              onPress={() => onToggle(option.key)}
              accessible={true}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${option.label}${option.count !== undefined ? `, ${option.count} diseases` : ''}`}
              accessibilityHint={isSelected ? `Tap to deselect ${option.label}` : `Tap to select ${option.label}`}
            >
              {option.icon && (
                <Ionicons
                  name={option.icon as any}
                  size={18}
                  color={isSelected ? color : COLORS.textMuted}
                  style={styles.optionIcon}
                  accessible={false}
                />
              )}
              <Text
                style={[
                  styles.optionText,
                  isSelected && { ...styles.selectedOptionText, color },
                ]}
                accessible={false}
              >
                {option.label}
              </Text>
              {option.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    isSelected && { backgroundColor: color },
                  ]}
                  accessible={false}
                >
                  <Text
                    style={[
                      styles.countText,
                      isSelected && styles.selectedCountText,
                    ]}
                    accessible={false}
                  >
                    {option.count}
                  </Text>
                </View>
              )}
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={color}
                  style={styles.checkIcon}
                  accessible={false}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text
              style={styles.headerTitle}
              accessibilityRole="header"
            >
              Filter Diseases
            </Text>
            {getActiveFilterCount > 0 && (
              <View
                style={styles.activeFiltersBadge}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`${getActiveFilterCount} filters currently active`}
              >
                <Text
                  style={styles.activeFiltersText}
                  accessible={false}
                >
                  {getActiveFilterCount} active
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close filter panel"
            accessibilityHint="Return to disease list with current filters applied"
          >
            <Ionicons
              name="close"
              size={24}
              color={COLORS.text}
              accessible={false}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Filter Presets */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Quick Filters</Text>
            <View style={styles.presetsContainer}>
              <TouchableOpacity
                style={[
                  styles.presetButton,
                  filters.categories.includes('viral') && filters.severities.includes('high') && styles.activePreset
                ]}
                onPress={() => onFiltersChange({
                  categories: ['viral'],
                  severities: ['high'],
                  species: [],
                  searchQuery: filters.searchQuery,
                })}
              >
                <Ionicons name="warning" size={16} color={COLORS.error} />
                <Text style={styles.presetText}>High Risk Viral</Text>
                <Text style={styles.presetCount}>
                  {diseaseStats?.byCategory?.viral && diseaseStats?.bySeverity?.high ?
                    Math.min(diseaseStats.byCategory.viral, diseaseStats.bySeverity.high) : 0} items
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetButton,
                  filters.categories.includes('bacterial') && filters.species.includes('chickens') && styles.activePreset
                ]}
                onPress={() => onFiltersChange({
                  categories: ['bacterial'],
                  severities: [],
                  species: ['chickens'],
                  searchQuery: filters.searchQuery,
                })}
              >
                <Ionicons name="medical" size={16} color={COLORS.primary} />
                <Text style={styles.presetText}>Chicken Bacterial</Text>
                <Text style={styles.presetCount}>
                  {diseaseStats?.byCategory?.bacterial && diseaseStats?.bySpecies?.chickens ?
                    Math.min(diseaseStats.byCategory.bacterial, diseaseStats.bySpecies.chickens) : 0} items
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetButton,
                  filters.categories.includes('parasitic') &&
                  (filters.severities.includes('moderate') || filters.severities.includes('high')) && styles.activePreset
                ]}
                onPress={() => onFiltersChange({
                  categories: ['parasitic'],
                  severities: ['moderate', 'high'],
                  species: [],
                  searchQuery: filters.searchQuery,
                })}
              >
                <Ionicons name="bug" size={16} color={COLORS.warning} />
                <Text style={styles.presetText}>Serious Parasites</Text>
                <Text style={styles.presetCount}>
                  {diseaseStats?.byCategory?.parasitic || 0} items
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {renderFilterSection(
            'Disease Categories',
            categoryOptions,
            filters.categories,
            handleCategoryToggle,
            undefined,
            'categories'
          )}

          {renderFilterSection(
            'Severity Levels',
            severityOptions,
            filters.severities,
            handleSeverityToggle,
            getSeverityColor,
            'severities'
          )}

          {renderFilterSection(
            'Affected Species',
            speciesOptions,
            filters.species,
            handleSpeciesToggle,
            undefined,
            'species'
          )}

          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Filter Summary</Text>
            <View style={styles.liveResultContainer}>
              <Text style={styles.liveResultCount}>
                {currentResultCount} of {diseaseStats?.total || 0} diseases
              </Text>
              <Text style={styles.liveResultLabel}>
                {getActiveFilterCount === 0
                  ? 'Showing all diseases'
                  : `${getActiveFilterCount} filter${getActiveFilterCount !== 1 ? 's' : ''} applied`
                }
              </Text>
            </View>
            {getActiveFilterCount > 0 && (
              <View style={styles.activeFiltersContainer}>
                {filters.categories.length > 0 && (
                  <Text style={styles.activeFilterText}>
                    Categories: {filters.categories.join(', ')}
                  </Text>
                )}
                {filters.severities.length > 0 && (
                  <Text style={styles.activeFilterText}>
                    Severities: {filters.severities.join(', ')}
                  </Text>
                )}
                {filters.species.length > 0 && (
                  <Text style={styles.activeFilterText}>
                    Species: {filters.species.join(', ')}
                  </Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        <View
          style={styles.footer}
          accessible={true}
          accessibilityLabel="Filter actions"
        >
          <TouchableOpacity
            style={[
              styles.clearButton,
              getActiveFilterCount === 0 && styles.disabledButton,
            ]}
            onPress={handleClearAll}
            disabled={getActiveFilterCount === 0}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            accessibilityHint="Remove all currently applied filters"
            accessibilityState={{ disabled: getActiveFilterCount === 0 }}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={getActiveFilterCount === 0 ? COLORS.textMuted : COLORS.error}
              accessible={false}
            />
            <Text
              style={[
                styles.clearButtonText,
                getActiveFilterCount === 0 && styles.disabledButtonText,
              ]}
              accessible={false}
            >
              Clear All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={onClose}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Apply filters and return to disease list${currentResultCount > 0 ? ` showing ${currentResultCount} results` : ''}`}
            accessibilityHint="Close filter panel and show filtered results"
          >
            <Text
              style={styles.applyButtonText}
              accessible={false}
            >
              Show Results ({currentResultCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

export default FilterPanel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  activeFiltersBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginLeft: SPACING.sm,
  },
  activeFiltersText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  filterSection: {
    marginVertical: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sectionAction: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionActionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedOption: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
  },
  optionIcon: {
    marginRight: SPACING.sm,
  },
  optionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    marginRight: SPACING.sm,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  selectedCountText: {
    color: COLORS.white,
  },
  checkIcon: {
    marginLeft: SPACING.xs,
  },
  summarySection: {
    marginVertical: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  summaryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  liveResultContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  liveResultCount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  liveResultLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  summaryCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  activeFiltersContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  activeFilterText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    fontStyle: 'italic',
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  presetButton: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 60,
    justifyContent: 'center',
  },
  activePreset: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  presetText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  presetCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: COLORS.white,
  },
  disabledButton: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  clearButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.error,
    marginLeft: SPACING.xs,
  },
  disabledButtonText: {
    color: COLORS.textMuted,
  },
  applyButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});