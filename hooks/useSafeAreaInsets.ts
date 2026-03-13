import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets as useNativeSafeAreaInsets } from 'react-native-safe-area-context';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SafeAreaHelpers {
  hasBottomInset: boolean;
  isGestureNavigation: boolean;
  navigationBarHeight: number;
  getTabBarPadding: () => number;
  getDynamicSpacing: (baseSpacing: number) => number;
  isUsingFallback: boolean;
  deviceCompatibilityInfo: DeviceCompatibilityInfo;
}

export interface DeviceCompatibilityInfo {
  isLegacyDevice: boolean;
  hasNotch: boolean;
  screenAspectRatio: number;
  isTablet: boolean;
  platformVersion: number;
}

// Fallback safe area values for different device types
const FALLBACK_SAFE_AREA_INSETS = {
  // Modern devices with notch/dynamic island
  modern: {
    top: 47, // iPhone 14+ status bar
    right: 0,
    bottom: 34, // Home indicator
    left: 0,
  },
  // Legacy devices without notch
  legacy: {
    top: 20, // Standard status bar
    right: 0,
    bottom: 0, // No home indicator
    left: 0,
  },
  // Tablet devices
  tablet: {
    top: 24, // Tablet status bar
    right: 0,
    bottom: 20, // Tablet home indicator
    left: 0,
  },
};

// Device compatibility detection
const getDeviceCompatibilityInfo = (): DeviceCompatibilityInfo => {
  const { width, height } = Dimensions.get('window');
  const screenAspectRatio = Math.max(width, height) / Math.min(width, height);
  
  // Detect if device is likely a tablet (aspect ratio closer to 4:3 or larger screen)
  const isTablet = screenAspectRatio < 1.6 || Math.min(width, height) > 600;
  
  // Detect if device likely has a notch (high aspect ratio)
  const hasNotch = screenAspectRatio > 2.0;
  
  // Detect legacy devices (older Android versions or smaller screens)
  const platformVersion = Platform.OS === 'android' ? Platform.Version as number : 0;
  const isLegacyDevice = (Platform.OS === 'android' && platformVersion < 28) || 
                        (!hasNotch && Math.min(width, height) < 400);
  
  return {
    isLegacyDevice,
    hasNotch,
    screenAspectRatio,
    isTablet,
    platformVersion,
  };
};

// Get appropriate fallback insets based on device type
const getFallbackInsets = (deviceInfo: DeviceCompatibilityInfo): SafeAreaInsets => {
  if (deviceInfo.isTablet) {
    return FALLBACK_SAFE_AREA_INSETS.tablet;
  } else if (deviceInfo.isLegacyDevice) {
    return FALLBACK_SAFE_AREA_INSETS.legacy;
  } else {
    return FALLBACK_SAFE_AREA_INSETS.modern;
  }
};

// Validate and sanitize inset values
const validateAndSanitizeInsets = (insets: SafeAreaInsets, deviceInfo: DeviceCompatibilityInfo): SafeAreaInsets => {
  const { width, height } = Dimensions.get('window');
  const maxDimension = Math.max(width, height);
  
  // Define reasonable bounds based on device type
  const maxInset = deviceInfo.isTablet ? maxDimension * 0.1 : maxDimension * 0.15;
  const minInset = 0;
  
  return {
    top: Math.max(minInset, Math.min(insets.top, maxInset)),
    right: Math.max(minInset, Math.min(insets.right, maxInset)),
    bottom: Math.max(minInset, Math.min(insets.bottom, maxInset)),
    left: Math.max(minInset, Math.min(insets.left, maxInset)),
  };
};

// Performance throttling for safe area calculations
let lastCalculationTime = 0;
const CALCULATION_THROTTLE_MS = 16; // ~60fps

const shouldThrottleCalculation = (): boolean => {
  const now = Date.now();
  if (now - lastCalculationTime < CALCULATION_THROTTLE_MS) {
    return true;
  }
  lastCalculationTime = now;
  return false;
};

// Log safe area errors for debugging
const logSafeAreaError = (error: Error, context: string) => {
  console.warn(`[SafeArea] ${context}:`, error.message);
  // In production, you might want to send this to a crash reporting service
  if (__DEV__) {
    console.error(`[SafeArea] Full error details:`, error);
  }
};

export const useSafeAreaInsets = (): SafeAreaInsets & SafeAreaHelpers => {
  let insets: SafeAreaInsets;
  let isUsingFallback = false;
  
  // Get device compatibility information
  const deviceCompatibilityInfo = getDeviceCompatibilityInfo();

  try {
    const nativeInsets = useNativeSafeAreaInsets();
    
    // Enhanced validation based on device type
    const maxInsetForDevice = deviceCompatibilityInfo.isTablet ? 100 : 200;
    const isValidInsets = (
      typeof nativeInsets.top === 'number' && nativeInsets.top >= 0 && nativeInsets.top <= maxInsetForDevice &&
      typeof nativeInsets.right === 'number' && nativeInsets.right >= 0 && nativeInsets.right <= maxInsetForDevice &&
      typeof nativeInsets.bottom === 'number' && nativeInsets.bottom >= 0 && nativeInsets.bottom <= maxInsetForDevice &&
      typeof nativeInsets.left === 'number' && nativeInsets.left >= 0 && nativeInsets.left <= maxInsetForDevice
    );

    if (isValidInsets) {
      // Validate and sanitize the insets for boundary conditions
      insets = validateAndSanitizeInsets(nativeInsets, deviceCompatibilityInfo);
    } else {
      logSafeAreaError(
        new Error(`Invalid insets detected: ${JSON.stringify(nativeInsets)} for device type: ${deviceCompatibilityInfo.isTablet ? 'tablet' : deviceCompatibilityInfo.isLegacyDevice ? 'legacy' : 'modern'}`),
        'Invalid safe area values'
      );
      insets = getFallbackInsets(deviceCompatibilityInfo);
      isUsingFallback = true;
    }
  } catch (error) {
    logSafeAreaError(
      error instanceof Error ? error : new Error('Unknown safe area detection error'),
      'Safe area detection failed'
    );
    insets = getFallbackInsets(deviceCompatibilityInfo);
    isUsingFallback = true;
  }
  
  // Determine if device has bottom inset (indicates gesture navigation or notch)
  const hasBottomInset = insets.bottom > 0;
  
  // Estimate if device uses gesture navigation
  // Gesture navigation typically has smaller bottom insets (20-34px)
  // Button navigation typically has larger bottom insets (48px+) or none
  const isGestureNavigation = hasBottomInset && insets.bottom <= 34;
  
  // Calculate navigation bar height
  const navigationBarHeight = hasBottomInset ? insets.bottom : 0;
  
  // Helper function to calculate tab bar padding with device-specific handling
  const getTabBarPadding = (): number => {
    try {
      // Throttle calculations for performance
      if (shouldThrottleCalculation()) {
        return 24; // Return cached/default value during throttling
      }

      let basePadding: number;
      let safeAreaPadding: number;

      // Adjust padding based on device type
      if (deviceCompatibilityInfo.isTablet) {
        basePadding = 12; // Larger base padding for tablets
        safeAreaPadding = hasBottomInset ? insets.bottom : 20;
      } else if (deviceCompatibilityInfo.isLegacyDevice) {
        basePadding = 6; // Smaller base padding for legacy devices
        safeAreaPadding = hasBottomInset ? insets.bottom : 12;
      } else {
        basePadding = 8; // Standard base padding
        safeAreaPadding = hasBottomInset ? insets.bottom : 16;
      }

      const calculatedPadding = basePadding + safeAreaPadding;
      
      // Device-specific bounds
      const maxPadding = deviceCompatibilityInfo.isTablet ? 120 : 100;
      const minPadding = deviceCompatibilityInfo.isLegacyDevice ? 6 : 8;
      
      return Math.max(minPadding, Math.min(calculatedPadding, maxPadding));
    } catch (error) {
      logSafeAreaError(
        error instanceof Error ? error : new Error('Tab bar padding calculation failed'),
        'Tab bar padding calculation'
      );
      // Device-specific fallback padding
      return deviceCompatibilityInfo.isTablet ? 32 : deviceCompatibilityInfo.isLegacyDevice ? 18 : 24;
    }
  };
  
  // Helper function to calculate dynamic spacing with device compatibility
  const getDynamicSpacing = (baseSpacing: number): number => {
    try {
      if (typeof baseSpacing !== 'number' || baseSpacing < 0) {
        logSafeAreaError(
          new Error(`Invalid base spacing: ${baseSpacing}`),
          'Dynamic spacing calculation'
        );
        return deviceCompatibilityInfo.isTablet ? 20 : 16; // Device-specific fallback
      }
      
      // Throttle calculations for performance
      if (shouldThrottleCalculation()) {
        return Math.max(baseSpacing, 16);
      }

      let multiplier: number;
      
      // Device-specific multipliers
      if (deviceCompatibilityInfo.isTablet) {
        multiplier = hasBottomInset ? 1.3 : 1.1; // Tablets need more spacing
      } else if (deviceCompatibilityInfo.isLegacyDevice) {
        multiplier = hasBottomInset ? 1.1 : 0.9; // Legacy devices need less spacing
      } else {
        multiplier = hasBottomInset ? 1.2 : 1.0; // Standard devices
      }
      
      const calculatedSpacing = Math.round(baseSpacing * multiplier);
      
      // Device-specific bounds
      const maxSpacing = deviceCompatibilityInfo.isTablet ? 300 : 200;
      const minSpacing = deviceCompatibilityInfo.isLegacyDevice ? 4 : 0;
      
      return Math.max(minSpacing, Math.min(calculatedSpacing, maxSpacing));
    } catch (error) {
      logSafeAreaError(
        error instanceof Error ? error : new Error('Dynamic spacing calculation failed'),
        'Dynamic spacing calculation'
      );
      // Device-specific fallback
      const fallbackSpacing = deviceCompatibilityInfo.isTablet ? 24 : deviceCompatibilityInfo.isLegacyDevice ? 12 : 16;
      return Math.max(fallbackSpacing, baseSpacing || fallbackSpacing);
    }
  };
  
  return {
    top: insets.top,
    right: insets.right,
    bottom: insets.bottom,
    left: insets.left,
    hasBottomInset,
    isGestureNavigation,
    navigationBarHeight,
    getTabBarPadding,
    getDynamicSpacing,
    isUsingFallback,
    deviceCompatibilityInfo,
  };
};

export default useSafeAreaInsets;