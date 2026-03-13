import { FONT_SIZES } from '@/constants/theme';
import { useAccessibleTextStyles } from '@/hooks/useAccessibility';
import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

interface AccessibleTextProps extends TextProps {
  children: React.ReactNode;
  variant?: 'header' | 'subheader' | 'body' | 'caption' | 'label';
  scalable?: boolean;
  highContrastColor?: string;
  semanticRole?: 'header' | 'text' | 'label';
}

/**
 * Enhanced text component with accessibility features
 * Supports scalable text, high contrast mode, and semantic roles
 */
export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  variant = 'body',
  scalable = true,
  highContrastColor,
  semanticRole,
  style,
  accessible = true,
  accessibilityRole,
  ...textProps
}) => {
  const { getTextStyle } = useAccessibleTextStyles();

  const getBaseStyle = () => {
    switch (variant) {
      case 'header':
        return styles.header;
      case 'subheader':
        return styles.subheader;
      case 'body':
        return styles.body;
      case 'caption':
        return styles.caption;
      case 'label':
        return styles.label;
      default:
        return styles.body;
    }
  };

  const baseStyle = getBaseStyle();
  const accessibleStyle = getTextStyle(baseStyle, {
    highContrastColor,
    increasedSize: scalable,
  });

  const finalStyle = Array.isArray(style) 
    ? [accessibleStyle, ...style]
    : [accessibleStyle, style];

  // Map semantic roles to valid accessibility roles
  const getAccessibilityRole = (): TextProps['accessibilityRole'] => {
    if (accessibilityRole) return accessibilityRole;
    
    switch (semanticRole) {
      case 'header':
        return 'header';
      case 'text':
        return 'text';
      case 'label':
        return 'text'; // 'label' is not a valid accessibilityRole for Text
      default:
        return 'text';
    }
  };

  return (
    <Text
      style={finalStyle}
      accessible={accessible}
      accessibilityRole={getAccessibilityRole()}
      {...textProps}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    lineHeight: FONT_SIZES.lg * 1.3,
  },
  subheader: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    lineHeight: FONT_SIZES.md * 1.3,
  },
  body: {
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * 1.4,
  },
  caption: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.3,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    lineHeight: FONT_SIZES.sm * 1.3,
  },
});

export default AccessibleText;