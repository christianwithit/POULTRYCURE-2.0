import { BORDER_RADIUS, COLORS, SPACING } from '@/constants/theme';
import { useAccessibility } from '@/hooks/useAccessibility';
import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from 'react-native';
import AccessibleText from './AccessibleText';

interface AccessibleButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    expanded?: boolean;
  };
}

/**
 * Enhanced button component with comprehensive accessibility features
 * Supports high contrast mode, proper touch targets, and semantic roles
 */
export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  style,
  disabled,
  ...touchableProps
}) => {
  const { colors, isHighContrastEnabled } = useAccessibility();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDER_RADIUS.md,
      minHeight: 44, // Minimum touch target size
    };

    // Size variations
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = SPACING.sm;
        baseStyle.paddingVertical = SPACING.xs;
        baseStyle.minHeight = 36;
        break;
      case 'medium':
        baseStyle.paddingHorizontal = SPACING.md;
        baseStyle.paddingVertical = SPACING.sm;
        break;
      case 'large':
        baseStyle.paddingHorizontal = SPACING.lg;
        baseStyle.paddingVertical = SPACING.md;
        baseStyle.minHeight = 52;
        break;
    }

    // Variant styles
    if (isHighContrastEnabled) {
      switch (variant) {
        case 'primary':
          baseStyle.backgroundColor = colors.primary;
          baseStyle.borderWidth = 2;
          baseStyle.borderColor = colors.text;
          break;
        case 'secondary':
          baseStyle.backgroundColor = colors.background;
          baseStyle.borderWidth = 2;
          baseStyle.borderColor = colors.primary;
          break;
        case 'outline':
          baseStyle.backgroundColor = 'transparent';
          baseStyle.borderWidth = 2;
          baseStyle.borderColor = colors.primary;
          break;
        case 'ghost':
          baseStyle.backgroundColor = 'transparent';
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = colors.border;
          break;
      }
    } else {
      switch (variant) {
        case 'primary':
          baseStyle.backgroundColor = COLORS.primary;
          break;
        case 'secondary':
          baseStyle.backgroundColor = COLORS.background;
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = COLORS.border;
          break;
        case 'outline':
          baseStyle.backgroundColor = 'transparent';
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = COLORS.primary;
          break;
        case 'ghost':
          baseStyle.backgroundColor = 'transparent';
          break;
      }
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }

    // Full width
    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextColor = () => {
    if (isHighContrastEnabled) {
      switch (variant) {
        case 'primary':
          return colors.background;
        case 'secondary':
        case 'outline':
        case 'ghost':
          return colors.text;
        default:
          return colors.text;
      }
    } else {
      switch (variant) {
        case 'primary':
          return COLORS.white;
        case 'secondary':
        case 'outline':
        case 'ghost':
          return COLORS.primary;
        default:
          return COLORS.text;
      }
    }
  };

  const buttonStyle = getButtonStyle();
  const textColor = getTextColor();

  const renderContent = () => {
    const textElement = (
      <AccessibleText
        variant={size === 'large' ? 'subheader' : 'body'}
        style={{ color: textColor, fontWeight: '600' }}
        accessible={false}
      >
        {children}
      </AccessibleText>
    );

    if (!icon) {
      return textElement;
    }

    const iconElement = React.cloneElement(icon as React.ReactElement, {
      // Icon should not be accessible as it's decorative
    });

    return (
      <View style={styles.contentContainer}>
        {iconPosition === 'left' && iconElement}
        {iconPosition === 'left' && <View style={styles.iconSpacing} />}
        {textElement}
        {iconPosition === 'right' && <View style={styles.iconSpacing} />}
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        ...accessibilityState,
      }}
      {...touchableProps}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacing: {
    width: SPACING.xs,
  },
});

export default AccessibleButton;