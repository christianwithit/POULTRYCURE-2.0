import React, { useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, LINE_HEIGHT, SHADOWS, SPACING } from '../constants/theme';

interface LoadingButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  loadingText?: string;
}

export function LoadingButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
  loadingText,
}: LoadingButtonProps) {
  const isDisabled = loading || disabled;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (loading) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const handlePressIn = () => {
    if (!isDisabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!isDisabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const getButtonStyle = () => {
    return [
      styles.button,
      styles[size],
      variant === 'primary' && styles.primary,
      variant === 'primary' && isDisabled && styles.primaryDisabled,
      variant === 'secondary' && styles.secondary,
      variant === 'secondary' && isDisabled && styles.secondaryDisabled,
      variant === 'outline' && styles.outline,
      variant === 'outline' && isDisabled && styles.outlineDisabled,
    ].filter(Boolean);
  };

  const getTextStyle = () => {
    return [
      styles.text,
      styles[`${size}Text` as keyof typeof styles],
      variant === 'primary' && styles.primaryText,
      variant === 'secondary' && styles.secondaryText,
      variant === 'outline' && styles.outlineText,
      variant === 'outline' && isDisabled && styles.outlineTextDisabled,
    ].filter(Boolean);
  };

  const getLoadingColor = () => {
    switch (variant) {
      case 'primary':
        return COLORS.white;
      case 'secondary':
        return COLORS.white;
      case 'outline':
        return COLORS.primary;
      default:
        return COLORS.white;
    }
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <TouchableOpacity
        style={[...getButtonStyle(), style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        {loading ? (
          <>
            <ActivityIndicator 
              size="small" 
              color={getLoadingColor()} 
              style={styles.loadingIndicator}
            />
            {loadingText && (
              <Text style={getTextStyle()}>{loadingText}</Text>
            )}
          </>
        ) : (
          <Text style={getTextStyle()}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  
  // Sizes
  small: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 36,
  },
  medium: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 44,
  },
  large: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    minHeight: 52,
  },

  // Variants
  primary: {
    backgroundColor: COLORS.primary,
  },
  primaryDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  secondaryDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  outlineDisabled: {
    borderColor: COLORS.textMuted,
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
  mediumText: {
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.sm,
  },
  largeText: {
    fontSize: FONT_SIZES.lg,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHT.sm,
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primary,
  },
  outlineTextDisabled: {
    color: COLORS.textMuted,
  },

  loadingIndicator: {
    marginRight: SPACING.sm,
  },
});