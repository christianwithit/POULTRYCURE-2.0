import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Keyboard, Platform, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from '../hooks/useSafeAreaInsets';

interface SafeAreaContainerProps {
  children: React.ReactNode;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  style?: ViewStyle;
  backgroundColor?: string;
  keyboardAware?: boolean;
  animateTransitions?: boolean;
}

// Log safe area container errors for debugging
const logContainerError = (error: Error, context: string) => {
  console.warn(`[SafeAreaContainer] ${context}:`, error.message);
  if (__DEV__) {
    console.error(`[SafeAreaContainer] Full error details:`, error);
  }
};

const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
  children,
  edges = ['top', 'bottom', 'left', 'right'], // Default to all edges
  style,
  backgroundColor = '#ffffff',
  keyboardAware = true,
  animateTransitions = true,
}) => {
  const safeAreaData = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const animatedValue = React.useRef(new Animated.Value(1)).current;

  // Log device compatibility and fallback information
  useEffect(() => {
    if (safeAreaData.isUsingFallback) {
      const deviceType = safeAreaData.deviceCompatibilityInfo.isTablet ? 'tablet' : 
                        safeAreaData.deviceCompatibilityInfo.isLegacyDevice ? 'legacy' : 'modern';
      console.warn(`[SafeAreaContainer] Using fallback safe area values for ${deviceType} device`);
    }
    
    if (__DEV__) {
      console.log('[SafeAreaContainer] Device compatibility info:', {
        isTablet: safeAreaData.deviceCompatibilityInfo.isTablet,
        isLegacyDevice: safeAreaData.deviceCompatibilityInfo.isLegacyDevice,
        hasNotch: safeAreaData.deviceCompatibilityInfo.hasNotch,
        aspectRatio: safeAreaData.deviceCompatibilityInfo.screenAspectRatio.toFixed(2),
        platformVersion: safeAreaData.deviceCompatibilityInfo.platformVersion,
      });
    }
  }, [safeAreaData.isUsingFallback, safeAreaData.deviceCompatibilityInfo]);

  useEffect(() => {
    const onChange = (result: { window: any }) => {
      try {
        setScreenData(result.window);
        
        // Animate orientation changes smoothly
        if (animateTransitions) {
          Animated.timing(animatedValue, {
            toValue: 0.98,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }).start();
          });
        }
      } catch (error) {
        logContainerError(
          error instanceof Error ? error : new Error('Orientation change handling failed'),
          'Orientation change handling'
        );
      }
    };

    try {
      const subscription = Dimensions.addEventListener('change', onChange);
      return () => subscription?.remove();
    } catch (error) {
      logContainerError(
        error instanceof Error ? error : new Error('Dimensions listener setup failed'),
        'Dimensions listener setup'
      );
    }
  }, [animatedValue, animateTransitions]);

  useEffect(() => {
    if (!keyboardAware) return;

    const keyboardWillShow = (event: { endCoordinates: { height: number } }) => {
      try {
        const { height } = event.endCoordinates;
        // Validate keyboard height is reasonable
        if (typeof height === 'number' && height >= 0 && height <= 1000) {
          setKeyboardHeight(height);
        } else {
          logContainerError(
            new Error(`Invalid keyboard height: ${height}`),
            'Keyboard height validation'
          );
        }
      } catch (error) {
        logContainerError(
          error instanceof Error ? error : new Error('Keyboard show handling failed'),
          'Keyboard show handling'
        );
      }
    };

    const keyboardWillHide = () => {
      try {
        setKeyboardHeight(0);
      } catch (error) {
        logContainerError(
          error instanceof Error ? error : new Error('Keyboard hide handling failed'),
          'Keyboard hide handling'
        );
      }
    };

    const keyboardDidShow = (event: { endCoordinates: { height: number } }) => {
      if (Platform.OS === 'android') {
        try {
          const { height } = event.endCoordinates;
          // Validate keyboard height is reasonable
          if (typeof height === 'number' && height >= 0 && height <= 1000) {
            setKeyboardHeight(height);
          } else {
            logContainerError(
              new Error(`Invalid keyboard height: ${height}`),
              'Android keyboard height validation'
            );
          }
        } catch (error) {
          logContainerError(
            error instanceof Error ? error : new Error('Android keyboard show handling failed'),
            'Android keyboard show handling'
          );
        }
      }
    };

    const keyboardDidHide = () => {
      if (Platform.OS === 'android') {
        try {
          setKeyboardHeight(0);
        } catch (error) {
          logContainerError(
            error instanceof Error ? error : new Error('Android keyboard hide handling failed'),
            'Android keyboard hide handling'
          );
        }
      }
    };

    try {
      const showSubscription = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        Platform.OS === 'ios' ? keyboardWillShow : keyboardDidShow
      );

      const hideSubscription = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        Platform.OS === 'ios' ? keyboardWillHide : keyboardDidHide
      );

      return () => {
        try {
          showSubscription.remove();
          hideSubscription.remove();
        } catch (error) {
          logContainerError(
            error instanceof Error ? error : new Error('Keyboard listener cleanup failed'),
            'Keyboard listener cleanup'
          );
        }
      };
    } catch (error) {
      logContainerError(
        error instanceof Error ? error : new Error('Keyboard listener setup failed'),
        'Keyboard listener setup'
      );
    }
  }, [keyboardAware]);

  // Calculate dynamic padding with device compatibility considerations
  const dynamicStyle: ViewStyle = (() => {
    try {
      const baseStyle: ViewStyle = {
        flex: 1,
        backgroundColor,
      };

      if (keyboardAware && keyboardHeight > 0) {
        const paddingBottom = Math.max(keyboardHeight - safeAreaData.bottom, 0);
        
        // Device-specific maximum padding bounds
        let maxPadding: number;
        if (safeAreaData.deviceCompatibilityInfo.isTablet) {
          maxPadding = 600; // Tablets can handle more padding
        } else if (safeAreaData.deviceCompatibilityInfo.isLegacyDevice) {
          maxPadding = 300; // Legacy devices should have conservative padding
        } else {
          maxPadding = 500; // Standard devices
        }
        
        baseStyle.paddingBottom = Math.min(paddingBottom, maxPadding);
      }

      return baseStyle;
    } catch (error) {
      logContainerError(
        error instanceof Error ? error : new Error('Dynamic style calculation failed'),
        'Dynamic style calculation'
      );
      // Return device-specific fallback style
      const fallbackPadding = safeAreaData.deviceCompatibilityInfo.isTablet ? 24 : 
                             safeAreaData.deviceCompatibilityInfo.isLegacyDevice ? 12 : 16;
      return {
        flex: 1,
        backgroundColor,
        paddingBottom: keyboardAware && keyboardHeight > 0 ? fallbackPadding : undefined,
      };
    }
  })();

  const containerStyle = (() => {
    try {
      return [dynamicStyle, style];
    } catch (error) {
      logContainerError(
        error instanceof Error ? error : new Error('Container style calculation failed'),
        'Container style calculation'
      );
      // Return safe fallback style
      return [dynamicStyle];
    }
  })();

  try {
    if (animateTransitions) {
      return (
        <SafeAreaView
          edges={edges}
          style={containerStyle}
        >
          <Animated.View style={{ flex: 1, transform: [{ scale: animatedValue }] }}>
            {children}
          </Animated.View>
        </SafeAreaView>
      );
    } else {
      return (
        <SafeAreaView
          edges={edges}
          style={containerStyle}
        >
          {children}
        </SafeAreaView>
      );
    }
  } catch (error) {
    logContainerError(
      error instanceof Error ? error : new Error('SafeAreaView rendering failed'),
      'SafeAreaView rendering'
    );
    // Fallback to basic View if SafeAreaView fails
    const { View } = require('react-native');
    return (
      <View style={containerStyle}>
        {children}
      </View>
    );
  }
};

export default SafeAreaContainer;