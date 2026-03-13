import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom hook for debounced validation
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for form field validation with proper timing
 */
export function useFieldValidation(
  value: string,
  validator: (value: string) => string | true,
  options: {
    validateOnBlur?: boolean;
    validateOnChange?: boolean;
    debounceMs?: number;
  } = {}
) {
  const {
    validateOnBlur = true,
    validateOnChange = false,
    debounceMs = 300,
  } = options;

  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const debouncedValue = useDebounce(value, debounceMs);

  // Validate on debounced value change (if enabled)
  useEffect(() => {
    if (validateOnChange && touched && debouncedValue) {
      const result = validator(debouncedValue);
      setError(typeof result === 'string' ? result : null);
    }
  }, [debouncedValue, validator, validateOnChange, touched]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (validateOnBlur) {
      const result = validator(value);
      setError(typeof result === 'string' ? result : null);
    }
  }, [value, validator, validateOnBlur]);

  const handleChange = useCallback((newValue: string) => {
    if (!validateOnChange) {
      // Clear error when user starts typing (if not validating on change)
      if (error) {
        setError(null);
      }
    }
  }, [error, validateOnChange]);

  const validate = useCallback(() => {
    const result = validator(value);
    const errorMessage = typeof result === 'string' ? result : null;
    setError(errorMessage);
    return errorMessage === null;
  }, [value, validator]);

  return {
    error,
    touched,
    handleBlur,
    handleChange,
    validate,
    clearError: () => setError(null),
  };
}

/**
 * Auto-focus management for forms
 */
export function useAutoFocus(dependencies: any[] = []) {
  const inputRef = useRef<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current?.focus) {
        inputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, dependencies);

  return inputRef;
}

/**
 * Form submission state management
 */
export function useFormSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = useCallback(async (submitFn: () => Promise<void>) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);
      
      await submitFn();
      
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    handleSubmit,
    reset,
  };
}

/**
 * Keyboard handling utilities
 */
export const KeyboardUtils = {
  /**
   * Get appropriate return key type based on field position
   */
  getReturnKeyType: (isLastField: boolean): 'next' | 'done' => {
    return isLastField ? 'done' : 'next';
  },

  /**
   * Handle return key press for form navigation
   */
  handleReturnKey: (
    isLastField: boolean,
    nextFieldRef?: React.RefObject<any>,
    onSubmit?: () => void
  ) => {
    return () => {
      if (isLastField && onSubmit) {
        onSubmit();
      } else if (nextFieldRef?.current?.focus) {
        nextFieldRef.current.focus();
      }
    };
  },
};

/**
 * Accessibility helpers
 */
export const AccessibilityUtils = {
  /**
   * Get accessibility props for form fields
   */
  getFieldAccessibilityProps: (
    label: string,
    error?: string | null,
    hint?: string
  ) => {
    const accessibilityLabel = label;
    let accessibilityHint = hint;
    
    if (error) {
      accessibilityHint = error + (hint ? `. ${hint}` : '');
    }

    return {
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole: 'text' as const,
      accessible: true,
    };
  },

  /**
   * Get accessibility props for buttons
   */
  getButtonAccessibilityProps: (
    label: string,
    disabled?: boolean,
    loading?: boolean
  ) => {
    let accessibilityHint = '';
    
    if (loading) {
      accessibilityHint = 'Loading, please wait';
    } else if (disabled) {
      accessibilityHint = 'Button is disabled';
    }

    return {
      accessibilityLabel: label,
      accessibilityHint,
      accessibilityRole: 'button' as const,
      accessible: true,
      accessibilityState: {
        disabled: disabled || loading,
        busy: loading,
      },
    };
  },

  /**
   * Get accessibility props for error messages
   */
  getErrorAccessibilityProps: (error: string) => ({
    accessibilityLabel: `Error: ${error}`,
    accessibilityRole: 'alert' as const,
    accessible: true,
    accessibilityLiveRegion: 'polite' as const,
  }),

  /**
   * Get accessibility props for success messages
   */
  getSuccessAccessibilityProps: (message: string) => ({
    accessibilityLabel: `Success: ${message}`,
    accessibilityRole: 'alert' as const,
    accessible: true,
    accessibilityLiveRegion: 'polite' as const,
  }),
};