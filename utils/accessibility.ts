import { AccessibilityInfo, Appearance } from 'react-native';

/**
 * Accessibility utility functions for the Disease Glossary
 */

export interface AccessibilityColors {
  primary: string;
  background: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

/**
 * Get high contrast colors for better accessibility
 */
export const getAccessibilityColors = (): AccessibilityColors => {
  const colorScheme = Appearance.getColorScheme();
  const isDark = colorScheme === 'dark';

  // High contrast colors for better accessibility
  return {
    primary: isDark ? '#4A9EFF' : '#0066CC',
    background: isDark ? '#000000' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textMuted: isDark ? '#CCCCCC' : '#666666',
    border: isDark ? '#666666' : '#CCCCCC',
    success: isDark ? '#00CC66' : '#006633',
    warning: isDark ? '#FFAA00' : '#CC6600',
    error: isDark ? '#FF4444' : '#CC0000',
  };
};

/**
 * Check if high contrast mode is enabled
 */
export const isHighContrastEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isHighTextContrastEnabled();
  } catch (error) {
    console.warn('Could not check high contrast mode:', error);
    return false;
  }
};

/**
 * Check if screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    console.warn('Could not check screen reader status:', error);
    return false;
  }
};

/**
 * Check if reduce motion is enabled
 */
export const isReduceMotionEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch (error) {
    console.warn('Could not check reduce motion status:', error);
    return false;
  }
};

/**
 * Generate accessible label for disease severity
 */
export const getSeverityAccessibilityLabel = (severity: string): string => {
  const severityMap: Record<string, string> = {
    low: 'Low severity - minimal risk to flock health',
    moderate: 'Moderate severity - requires attention and monitoring',
    high: 'High severity - immediate veterinary care recommended',
  };
  
  return severityMap[severity] || `${severity} severity`;
};

/**
 * Generate accessible label for disease category
 */
export const getCategoryAccessibilityLabel = (category: string): string => {
  const categoryMap: Record<string, string> = {
    viral: 'Viral disease - caused by virus infection',
    bacterial: 'Bacterial disease - caused by bacterial infection',
    parasitic: 'Parasitic disease - caused by parasites',
    nutritional: 'Nutritional disorder - related to diet and nutrition',
    genetic: 'Genetic condition - inherited disorder',
    environmental: 'Environmental condition - caused by environmental factors',
  };
  
  return categoryMap[category] || `${category} disease`;
};

/**
 * Generate accessible label for transmission method
 */
export const getTransmissionAccessibilityLabel = (method: string, contagiousness: string): string => {
  const methodMap: Record<string, string> = {
    direct: 'Direct contact transmission',
    indirect: 'Indirect transmission through contaminated surfaces',
    vector: 'Vector-borne transmission through insects or other carriers',
    airborne: 'Airborne transmission through respiratory droplets',
    waterborne: 'Waterborne transmission through contaminated water',
  };
  
  const contagiousnessMap: Record<string, string> = {
    low: 'low contagiousness',
    moderate: 'moderate contagiousness',
    high: 'high contagiousness - spreads easily',
  };
  
  const methodLabel = methodMap[method] || method;
  const contagiousnessLabel = contagiousnessMap[contagiousness] || contagiousness;
  
  return `${methodLabel} with ${contagiousnessLabel}`;
};

/**
 * Generate accessible hint for disease actions
 */
export const getDiseaseActionHint = (action: string, diseaseName: string): string => {
  const actionMap: Record<string, string> = {
    view: `View detailed information about ${diseaseName} including symptoms, treatment, and prevention measures`,
    bookmark: `Save ${diseaseName} to your bookmarks for quick access later`,
    unbookmark: `Remove ${diseaseName} from your bookmarks`,
    share: `Share information about ${diseaseName} with others`,
  };
  
  return actionMap[action] || `Perform ${action} on ${diseaseName}`;
};

/**
 * Format list for screen readers
 */
export const formatListForScreenReader = (items: string[], maxItems: number = 3): string => {
  if (items.length === 0) return 'No items';
  if (items.length === 1) return items[0];
  
  const displayItems = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;
  
  if (remainingCount > 0) {
    return `${displayItems.join(', ')} and ${remainingCount} more`;
  }
  
  if (displayItems.length === 2) {
    return `${displayItems[0]} and ${displayItems[1]}`;
  }
  
  return `${displayItems.slice(0, -1).join(', ')}, and ${displayItems[displayItems.length - 1]}`;
};

/**
 * Generate accessible announcement for filter changes
 */
export const getFilterChangeAnnouncement = (
  activeFilters: {
    categories: string[];
    severities: string[];
    species: string[];
  },
  resultCount: number
): string => {
  const filterParts: string[] = [];
  
  if (activeFilters.categories.length > 0) {
    filterParts.push(`${activeFilters.categories.length} category filter${activeFilters.categories.length !== 1 ? 's' : ''}`);
  }
  
  if (activeFilters.severities.length > 0) {
    filterParts.push(`${activeFilters.severities.length} severity filter${activeFilters.severities.length !== 1 ? 's' : ''}`);
  }
  
  if (activeFilters.species.length > 0) {
    filterParts.push(`${activeFilters.species.length} species filter${activeFilters.species.length !== 1 ? 's' : ''}`);
  }
  
  const filtersText = filterParts.length > 0 
    ? `with ${filterParts.join(', ')} applied` 
    : 'with no filters applied';
  
  return `Showing ${resultCount} disease${resultCount !== 1 ? 's' : ''} ${filtersText}`;
};

/**
 * Generate accessible label for image types
 */
export const getImageTypeAccessibilityLabel = (type: string, caption: string): string => {
  const typeMap: Record<string, string> = {
    symptom: 'Symptom photograph',
    lesion: 'Lesion or pathological image',
    microscopic: 'Microscopic view',
    treatment: 'Treatment procedure image',
  };
  
  const typeLabel = typeMap[type] || 'Disease image';
  return `${typeLabel}: ${caption}`;
};

/**
 * Check if text scaling is enabled and get scale factor
 */
export const getTextScaleFactor = async (): Promise<number> => {
  try {
    // This would need platform-specific implementation
    // For now, return default scale
    return 1.0;
  } catch (error) {
    console.warn('Could not get text scale factor:', error);
    return 1.0;
  }
};

/**
 * Announce content changes to screen readers
 */
export const announceForAccessibility = (message: string): void => {
  try {
    AccessibilityInfo.announceForAccessibility(message);
  } catch (error) {
    console.warn('Could not announce for accessibility:', error);
  }
};