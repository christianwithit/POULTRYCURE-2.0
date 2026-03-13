import { useEffect, useState } from 'react';
import { AccessibilityInfo, Appearance } from 'react-native';
import {
  AccessibilityColors,
  getAccessibilityColors,
  isHighContrastEnabled,
  isReduceMotionEnabled,
  isScreenReaderEnabled
} from '../utils/accessibility';

interface AccessibilityState {
  isScreenReaderEnabled: boolean;
  isHighContrastEnabled: boolean;
  isReduceMotionEnabled: boolean;
  colors: AccessibilityColors;
  colorScheme: 'light' | 'dark' | null;
}

/**
 * Hook for managing accessibility state and preferences
 */
export const useAccessibility = () => {
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    isScreenReaderEnabled: false,
    isHighContrastEnabled: false,
    isReduceMotionEnabled: false,
    colors: getAccessibilityColors(),
    colorScheme: Appearance.getColorScheme() || null,
  });

  const updateAccessibilityState = async () => {
    try {
      const [screenReader, highContrast, reduceMotion] = await Promise.all([
        isScreenReaderEnabled(),
        isHighContrastEnabled(),
        isReduceMotionEnabled(),
      ]);

      const colorScheme = Appearance.getColorScheme();
      setAccessibilityState(prev => ({
        ...prev,
        isScreenReaderEnabled: screenReader,
        isHighContrastEnabled: highContrast,
        isReduceMotionEnabled: reduceMotion,
        colors: getAccessibilityColors(),
        colorScheme: colorScheme || null,
      }));
    } catch (error) {
      console.warn('Error updating accessibility state:', error);
    }
  };

  useEffect(() => {
    // Initial load
    updateAccessibilityState();

    // Set up listeners for accessibility changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (isEnabled) => {
        setAccessibilityState(prev => ({
          ...prev,
          isScreenReaderEnabled: isEnabled,
        }));
      }
    );

    const highContrastListener = AccessibilityInfo.addEventListener(
      'highTextContrastChanged',
      (isEnabled) => {
        setAccessibilityState(prev => ({
          ...prev,
          isHighContrastEnabled: isEnabled,
          colors: getAccessibilityColors(),
        }));
      }
    );

    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => {
        setAccessibilityState(prev => ({
          ...prev,
          isReduceMotionEnabled: isEnabled,
        }));
      }
    );

    const colorSchemeListener = Appearance.addChangeListener(({ colorScheme }) => {
      setAccessibilityState(prev => ({
        ...prev,
        colorScheme: colorScheme || null,
        colors: getAccessibilityColors(),
      }));
    });

    // Cleanup listeners
    return () => {
      screenReaderListener?.remove();
      highContrastListener?.remove();
      reduceMotionListener?.remove();
      colorSchemeListener?.remove();
    };
  }, []);

  return {
    ...accessibilityState,
    refreshAccessibilityState: updateAccessibilityState,
  };
};

/**
 * Hook for getting accessible text styles based on user preferences
 */
export const useAccessibleTextStyles = () => {
  const { isHighContrastEnabled, colors } = useAccessibility();

  const getTextStyle = (baseStyle: any, options?: {
    highContrastColor?: string;
    increasedSize?: boolean;
  }) => {
    const style = { ...baseStyle };

    if (isHighContrastEnabled) {
      if (options?.highContrastColor) {
        style.color = options.highContrastColor;
      }
      
      // Increase font weight for better contrast
      if (style.fontWeight === 'normal' || !style.fontWeight) {
        style.fontWeight = '600';
      } else if (style.fontWeight === '600') {
        style.fontWeight = 'bold';
      }
    }

    if (options?.increasedSize) {
      style.fontSize = (style.fontSize || 16) * 1.1;
    }

    return style;
  };

  return {
    getTextStyle,
    colors,
    isHighContrastEnabled,
  };
};

/**
 * Hook for managing focus and announcements
 */
export const useAccessibilityFocus = () => {
  const { isScreenReaderEnabled } = useAccessibility();

  const announceChange = (message: string) => {
    if (isScreenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const setFocus = (reactTag: number) => {
    if (isScreenReaderEnabled) {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  };

  return {
    announceChange,
    setFocus,
    isScreenReaderEnabled,
  };
};