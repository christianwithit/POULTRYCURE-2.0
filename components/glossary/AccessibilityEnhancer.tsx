import { useAccessibility, useAccessibilityFocus } from '@/hooks/useAccessibility';
import {
    formatListForScreenReader,
    getCategoryAccessibilityLabel,
    getImageTypeAccessibilityLabel,
    getSeverityAccessibilityLabel,
    getTransmissionAccessibilityLabel
} from '@/utils/accessibility';
import React from 'react';
import { View, ViewProps } from 'react-native';

interface AccessibilityEnhancerProps extends ViewProps {
  children: React.ReactNode;
  announceOnMount?: string;
  focusOnMount?: boolean;
  role?: 'main' | 'navigation' | 'complementary' | 'banner' | 'contentinfo' | 'region';
  label?: string;
  hint?: string;
}

/**
 * Enhanced wrapper component that provides comprehensive accessibility features
 * for glossary components
 */
export const AccessibilityEnhancer: React.FC<AccessibilityEnhancerProps> = ({
  children,
  announceOnMount,
  focusOnMount = false,
  role,
  label,
  hint,
  accessible = true,
  ...viewProps
}) => {
  const { isScreenReaderEnabled, isHighContrastEnabled } = useAccessibility();
  const { announceChange } = useAccessibilityFocus();

  React.useEffect(() => {
    if (announceOnMount && isScreenReaderEnabled) {
      // Delay announcement to ensure screen reader is ready
      setTimeout(() => {
        announceChange(announceOnMount);
      }, 200);
    }
  }, [announceOnMount, isScreenReaderEnabled, announceChange]);

  // Map semantic roles to valid accessibility roles for React Native
  const getAccessibilityRole = (): ViewProps['accessibilityRole'] => {
    switch (role) {
      case 'main':
      case 'navigation':
      case 'banner':
      case 'complementary':
      case 'contentinfo':
      case 'region':
        return 'none'; // React Native doesn't support these semantic roles
      default:
        return undefined;
    }
  };

  return (
    <View
      accessible={accessible}
      accessibilityRole={getAccessibilityRole()}
      accessibilityLabel={label}
      accessibilityHint={hint}
      {...viewProps}
    >
      {children}
    </View>
  );
};

/**
 * Hook for generating comprehensive accessibility labels for disease information
 */
export const useDiseaseAccessibility = () => {
  const { isScreenReaderEnabled } = useAccessibility();

  const generateDiseaseLabel = (disease: {
    name: string;
    category: string;
    severity: string;
    commonIn: string[];
    symptoms: string[];
    transmission: {
      method: string;
      contagiousness: string;
    };
  }) => {
    if (!isScreenReaderEnabled) return disease.name;

    const parts = [
      disease.name,
      getCategoryAccessibilityLabel(disease.category),
      getSeverityAccessibilityLabel(disease.severity),
      `affects ${formatListForScreenReader(disease.commonIn, 2)}`,
      `${disease.symptoms.length} symptom${disease.symptoms.length !== 1 ? 's' : ''} listed`,
      getTransmissionAccessibilityLabel(disease.transmission.method, disease.transmission.contagiousness)
    ];

    return parts.join('. ');
  };

  const generateImageLabel = (image: {
    type: string;
    caption: string;
  }) => {
    return getImageTypeAccessibilityLabel(image.type, image.caption);
  };

  const generateFilterLabel = (filters: {
    categories: string[];
    severities: string[];
    species: string[];
  }, resultCount: number) => {
    const filterParts: string[] = [];
    
    if (filters.categories.length > 0) {
      filterParts.push(`${filters.categories.length} category filter${filters.categories.length !== 1 ? 's' : ''}`);
    }
    
    if (filters.severities.length > 0) {
      filterParts.push(`${filters.severities.length} severity filter${filters.severities.length !== 1 ? 's' : ''}`);
    }
    
    if (filters.species.length > 0) {
      filterParts.push(`${filters.species.length} species filter${filters.species.length !== 1 ? 's' : ''}`);
    }
    
    const filtersText = filterParts.length > 0 
      ? `with ${filterParts.join(', ')} applied` 
      : 'with no filters applied';
    
    return `Showing ${resultCount} disease${resultCount !== 1 ? 's' : ''} ${filtersText}`;
  };

  return {
    generateDiseaseLabel,
    generateImageLabel,
    generateFilterLabel,
    isScreenReaderEnabled,
  };
};

/**
 * Hook for managing keyboard navigation in glossary components
 */
export const useKeyboardNavigation = () => {
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);

  const handleKeyPress = React.useCallback((event: any, items: any[], onSelect: (item: any) => void) => {
    switch (event.nativeEvent.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          onSelect(items[focusedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setFocusedIndex(-1);
        break;
    }
  }, [focusedIndex]);

  const resetFocus = React.useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  return {
    focusedIndex,
    handleKeyPress,
    resetFocus,
  };
};

export default AccessibilityEnhancer;