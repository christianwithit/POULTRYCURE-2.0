/**
 * Accessibility testing utilities for the Disease Glossary
 * These utilities help validate and test accessibility features
 */

import { AccessibilityInfo } from 'react-native';

export interface AccessibilityTestResult {
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Test if a component has proper accessibility labels
 */
export const testAccessibilityLabels = (
  component: any,
  expectedLabel?: string
): AccessibilityTestResult => {
  if (!component.props.accessibilityLabel && !component.props.accessible) {
    return {
      passed: false,
      message: 'Component is missing accessibility label and is not marked as non-accessible',
      severity: 'error'
    };
  }

  if (expectedLabel && component.props.accessibilityLabel !== expectedLabel) {
    return {
      passed: false,
      message: `Expected accessibility label "${expectedLabel}" but got "${component.props.accessibilityLabel}"`,
      severity: 'warning'
    };
  }

  return {
    passed: true,
    message: 'Component has proper accessibility labels',
    severity: 'info'
  };
};

/**
 * Test if interactive components have proper roles
 */
export const testAccessibilityRoles = (component: any): AccessibilityTestResult => {
  const interactiveElements = ['TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'Pressable'];
  const componentType = component.type?.displayName || component.type?.name || 'Unknown';

  if (interactiveElements.includes(componentType)) {
    if (!component.props.accessibilityRole) {
      return {
        passed: false,
        message: `Interactive component ${componentType} is missing accessibilityRole`,
        severity: 'error'
      };
    }

    const validRoles = ['button', 'link', 'search', 'image', 'keyboardkey', 'text', 'adjustable', 'imagebutton', 'header', 'summary', 'alert', 'checkbox', 'combobox', 'menu', 'menubar', 'menuitem', 'progressbar', 'radio', 'radiogroup', 'scrollbar', 'spinbutton', 'switch', 'tab', 'tablist', 'timer', 'toolbar'];
    
    if (!validRoles.includes(component.props.accessibilityRole)) {
      return {
        passed: false,
        message: `Invalid accessibilityRole "${component.props.accessibilityRole}" for ${componentType}`,
        severity: 'error'
      };
    }
  }

  return {
    passed: true,
    message: 'Component has proper accessibility role',
    severity: 'info'
  };
};

/**
 * Test if components have proper touch target sizes
 */
export const testTouchTargetSize = (component: any): AccessibilityTestResult => {
  const style = component.props.style;
  if (!style) {
    return {
      passed: true,
      message: 'No style found to test touch target size',
      severity: 'info'
    };
  }

  const minTouchTarget = 44; // Minimum recommended touch target size
  const width = style.width || style.minWidth;
  const height = style.height || style.minHeight;

  if (width && width < minTouchTarget) {
    return {
      passed: false,
      message: `Touch target width ${width}px is below recommended minimum of ${minTouchTarget}px`,
      severity: 'warning'
    };
  }

  if (height && height < minTouchTarget) {
    return {
      passed: false,
      message: `Touch target height ${height}px is below recommended minimum of ${minTouchTarget}px`,
      severity: 'warning'
    };
  }

  return {
    passed: true,
    message: 'Touch target size meets accessibility guidelines',
    severity: 'info'
  };
};

/**
 * Test if text has sufficient color contrast
 */
export const testColorContrast = (
  backgroundColor: string,
  textColor: string,
  fontSize: number = 16
): AccessibilityTestResult => {
  // This is a simplified contrast test
  // In a real implementation, you would use a proper color contrast calculation
  
  const isLargeText = fontSize >= 18;
  const requiredRatio = isLargeText ? 3.0 : 4.5;
  
  // Simplified contrast calculation (in real implementation, use proper algorithm)
  const bgLuminance = getLuminance(backgroundColor);
  const textLuminance = getLuminance(textColor);
  const contrast = (Math.max(bgLuminance, textLuminance) + 0.05) / (Math.min(bgLuminance, textLuminance) + 0.05);
  
  if (contrast < requiredRatio) {
    return {
      passed: false,
      message: `Color contrast ratio ${contrast.toFixed(2)} is below required ${requiredRatio} for ${isLargeText ? 'large' : 'normal'} text`,
      severity: 'error'
    };
  }

  return {
    passed: true,
    message: `Color contrast ratio ${contrast.toFixed(2)} meets accessibility guidelines`,
    severity: 'info'
  };
};

/**
 * Simplified luminance calculation
 */
function getLuminance(color: string): number {
  // This is a very simplified implementation
  // In a real app, you would use a proper color parsing and luminance calculation library
  
  // Convert hex to RGB (simplified)
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Simplified luminance calculation
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Test if form inputs have proper labels
 */
export const testFormAccessibility = (component: any): AccessibilityTestResult => {
  const inputTypes = ['TextInput'];
  const componentType = component.type?.displayName || component.type?.name || 'Unknown';

  if (inputTypes.includes(componentType)) {
    if (!component.props.accessibilityLabel && !component.props.placeholder) {
      return {
        passed: false,
        message: 'Form input is missing accessibility label or placeholder',
        severity: 'error'
      };
    }

    if (!component.props.accessibilityHint) {
      return {
        passed: false,
        message: 'Form input is missing accessibility hint to explain its purpose',
        severity: 'warning'
      };
    }
  }

  return {
    passed: true,
    message: 'Form input has proper accessibility attributes',
    severity: 'info'
  };
};

/**
 * Run a comprehensive accessibility test suite on a component
 */
export const runAccessibilityTests = (component: any): AccessibilityTestResult[] => {
  const results: AccessibilityTestResult[] = [];

  results.push(testAccessibilityLabels(component));
  results.push(testAccessibilityRoles(component));
  results.push(testTouchTargetSize(component));
  results.push(testFormAccessibility(component));

  return results;
};

/**
 * Generate an accessibility report
 */
export const generateAccessibilityReport = (results: AccessibilityTestResult[]): string => {
  const errors = results.filter(r => r.severity === 'error' && !r.passed);
  const warnings = results.filter(r => r.severity === 'warning' && !r.passed);
  const passed = results.filter(r => r.passed);

  let report = '=== Accessibility Test Report ===\n\n';
  
  report += `Total Tests: ${results.length}\n`;
  report += `Passed: ${passed.length}\n`;
  report += `Warnings: ${warnings.length}\n`;
  report += `Errors: ${errors.length}\n\n`;

  if (errors.length > 0) {
    report += '🚨 ERRORS:\n';
    errors.forEach((error, index) => {
      report += `${index + 1}. ${error.message}\n`;
    });
    report += '\n';
  }

  if (warnings.length > 0) {
    report += '⚠️  WARNINGS:\n';
    warnings.forEach((warning, index) => {
      report += `${index + 1}. ${warning.message}\n`;
    });
    report += '\n';
  }

  if (errors.length === 0 && warnings.length === 0) {
    report += '✅ All accessibility tests passed!\n';
  }

  return report;
};

/**
 * Check current accessibility settings on the device
 */
export const checkAccessibilitySettings = async (): Promise<{
  screenReaderEnabled: boolean;
  highContrastEnabled: boolean;
  reduceMotionEnabled: boolean;
}> => {
  try {
    const [screenReader, highContrast, reduceMotion] = await Promise.all([
      AccessibilityInfo.isScreenReaderEnabled(),
      AccessibilityInfo.isHighTextContrastEnabled(),
      AccessibilityInfo.isReduceMotionEnabled(),
    ]);

    return {
      screenReaderEnabled: screenReader,
      highContrastEnabled: highContrast,
      reduceMotionEnabled: reduceMotion,
    };
  } catch (error) {
    console.warn('Error checking accessibility settings:', error);
    return {
      screenReaderEnabled: false,
      highContrastEnabled: false,
      reduceMotionEnabled: false,
    };
  }
};

/**
 * Announce a message to screen readers
 */
export const announceToScreenReader = (message: string): void => {
  try {
    AccessibilityInfo.announceForAccessibility(message);
  } catch (error) {
    console.warn('Error announcing to screen reader:', error);
  }
};

/**
 * Set focus to a specific element (for screen readers)
 */
export const setAccessibilityFocus = (reactTag: number): void => {
  try {
    AccessibilityInfo.setAccessibilityFocus(reactTag);
  } catch (error) {
    console.warn('Error setting accessibility focus:', error);
  }
};