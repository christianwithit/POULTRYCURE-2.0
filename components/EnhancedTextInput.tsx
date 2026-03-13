import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, LINE_HEIGHT, SHADOWS, SPACING } from '../constants/theme';
import { AccessibilityUtils } from '../utils/formValidation';

interface EnhancedTextInputProps extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  showPasswordToggle?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: any;
  labelStyle?: any;
  loading?: boolean;
}

export const EnhancedTextInput = forwardRef<TextInput, EnhancedTextInputProps>(
  (
    {
      label,
      error,
      hint,
      required = false,
      showPasswordToggle = false,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      inputStyle,
      labelStyle,
      loading = false,
      secureTextEntry,
      ...textInputProps
    },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [pressed, setPressed] = useState(false);
    const focusAnim = React.useRef(new Animated.Value(0)).current;

    const isSecureEntry = showPasswordToggle ? !isPasswordVisible : secureTextEntry;

    React.useEffect(() => {
      Animated.timing(focusAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, [isFocused]);

    const handlePasswordToggle = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    const handleFocus = (e: any) => {
      setIsFocused(true);
      textInputProps.onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      textInputProps.onBlur?.(e);
    };

    const getInputContainerStyle = () => {
      return [
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
        loading && styles.inputContainerLoading,
        pressed && styles.inputContainerPressed,
      ].filter(Boolean);
    };

    const accessibilityProps = AccessibilityUtils.getFieldAccessibilityProps(
      label,
      error,
      hint
    );

    return (
      <View style={[styles.container, containerStyle]}>
        {/* Label */}
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
          {hint && !error && (
            <Text style={styles.hint}>{hint}</Text>
          )}
        </View>

        {/* Input Container */}
        <Animated.View 
          style={[
            getInputContainerStyle(),
            {
              borderColor: focusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [COLORS.border, COLORS.primary],
              }),
            }
          ]}
        >
          {/* Left Icon */}
          {leftIcon && (
            <View style={styles.leftIconContainer}>
              <Animated.View
                style={{
                  transform: [{
                    scale: focusAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1],
                    })
                  }]
                }}
              >
                <Ionicons
                  name={leftIcon as any}
                  size={20}
                  color={isFocused ? COLORS.primary : COLORS.textMuted}
                />
              </Animated.View>
            </View>
          )}

          {/* Text Input */}
          <TextInput
            ref={ref}
            style={[styles.input, inputStyle]}
            secureTextEntry={isSecureEntry}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!loading}
            placeholderTextColor={COLORS.textMuted}
            {...accessibilityProps}
            {...textInputProps}
          />

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.rightIconContainer}>
              <Ionicons
                name="hourglass-outline"
                size={20}
                color={COLORS.textMuted}
              />
            </View>
          )}

          {/* Password Toggle */}
          {showPasswordToggle && !loading && (
            <TouchableOpacity
              style={styles.rightIconContainer}
              onPress={handlePasswordToggle}
              activeOpacity={0.7}
              {...AccessibilityUtils.getButtonAccessibilityProps(
                isPasswordVisible ? 'Hide password' : 'Show password'
              )}
            >
              <Animated.View
                style={{
                  transform: [{
                    rotate: focusAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    })
                  }]
                }}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off' : 'eye'}
                  size={20}
                  color={isFocused ? COLORS.primary : COLORS.textMuted}
                />
              </Animated.View>
            </TouchableOpacity>
          )}

          {/* Right Icon */}
          {rightIcon && !showPasswordToggle && !loading && (
            <TouchableOpacity
              style={styles.rightIconContainer}
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={rightIcon as any}
                size={20}
                color={isFocused ? COLORS.primary : COLORS.textMuted}
              />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Error Message */}
        {error && (
          <Text
            style={styles.errorText}
            {...AccessibilityUtils.getErrorAccessibilityProps(error)}
          >
            {error}
          </Text>
        )}
      </View>
    );
  }
);

EnhancedTextInput.displayName = 'EnhancedTextInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  labelContainer: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.sm,
  },
  required: {
    color: COLORS.error,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  inputContainerFocused: {
    borderWidth: 2,
    ...SHADOWS.medium,
  },
  inputContainerError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  inputContainerLoading: {
    opacity: 0.7,
  },
  inputContainerPressed: {
    transform: [{ scale: 0.98 }],
  },
  leftIconContainer: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 44,
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.md,
  },
  rightIconContainer: {
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
});