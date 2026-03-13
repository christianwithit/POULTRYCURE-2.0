import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import TabsLayout from '../../app/(tabs)/_layout.tsx';
import SafeAreaContainer from '../../components/SafeAreaContainer';
import { useSafeAreaInsets } from '../../hooks/useSafeAreaInsets';

// Mock the safe area hook
jest.mock('../../hooks/useSafeAreaInsets');
const mockUseSafeAreaInsets = useSafeAreaInsets as jest.MockedFunction<typeof useSafeAreaInsets>;

// Mock __DEV__ global
(global as any).__DEV__ = true;

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, edges, style }: any) => {
    const { View } = require('react-native');
    return <View testID="safe-area-view" style={style}>{children}</View>;
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  Tabs: ({ children, screenOptions }: any) => {
    const { View } = require('react-native');
    return (
      <View testID="tabs-container" screenOptions={screenOptions}>
        {children}
      </View>
    );
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: any) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

// Mock theme constants
jest.mock('../../constants/theme', () => ({
  COLORS: {
    primary: '#007AFF',
    textMuted: '#8E8E93',
    white: '#FFFFFF',
    border: '#E5E5EA',
  },
}));

// Enhanced React Native mocks
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const mockListeners: { [key: string]: Function[] } = {};
  
  return {
    ...RN,
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn((event: string, callback: Function) => {
        if (!mockListeners[event]) mockListeners[event] = [];
        mockListeners[event].push(callback);
        return { remove: jest.fn() };
      }),
      _triggerChange: (newDimensions: any) => {
        if (mockListeners.change) {
          mockListeners.change.forEach(callback => callback({ window: newDimensions }));
        }
      },
    },
    Keyboard: {
      addListener: jest.fn((event: string, callback: Function) => {
        if (!mockListeners[event]) mockListeners[event] = [];
        mockListeners[event].push(callback);
        return { remove: jest.fn() };
      }),
      _triggerEvent: (event: string, data?: any) => {
        if (mockListeners[event]) {
          mockListeners[event].forEach(callback => callback(data));
        }
      },
    },
    Animated: {
      ...RN.Animated,
      timing: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback()),
      })),
    },
  };
});

describe('Safe Area Navigation Integration', () => {
  const baseSafeAreaData = {
    top: 47,
    right: 0,
    bottom: 34,
    left: 0,
    hasBottomInset: true,
    isGestureNavigation: true,
    navigationBarHeight: 34,
    getTabBarPadding: jest.fn(() => 24),
    getDynamicSpacing: jest.fn((base: number) => base * 1.2),
    isUsingFallback: false,
    deviceCompatibilityInfo: {
      isLegacyDevice: false,
      hasNotch: true,
      screenAspectRatio: 2.16,
      isTablet: false,
      platformVersion: 30,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSafeAreaInsets.mockReturnValue(baseSafeAreaData);
  });

  describe('Screen Transitions', () => {
    it('maintains consistent safe area handling across screen transitions', async () => {
      const { rerender, getByTestId } = render(
        <SafeAreaContainer>
          <TabsLayout />
        </SafeAreaContainer>
      );

      // Initial render
      const initialContainer = getByTestId('safe-area-view');
      expect(initialContainer).toBeTruthy();

      // Simulate screen transition with different safe area values
      mockUseSafeAreaInsets.mockReturnValue({
        ...baseSafeAreaData,
        bottom: 20, // Different bottom inset
        isGestureNavigation: false,
      });

      rerender(
        <SafeAreaContainer>
          <TabsLayout />
        </SafeAreaContainer>
      );

      await waitFor(() => {
        const updatedContainer = getByTestId('safe-area-view');
        expect(updatedContainer).toBeTruthy();
      });
    });

    it('handles safe area changes during navigation', async () => {
      const { getByTestId } = render(
        <SafeAreaContainer animateTransitions={true}>
          <TabsLayout />
        </SafeAreaContainer>
      );

      // Simulate navigation that changes safe area context
      act(() => {
        mockUseSafeAreaInsets.mockReturnValue({
          ...baseSafeAreaData,
          bottom: 0,
          hasBottomInset: false,
          isGestureNavigation: false,
        });
      });

      const container = getByTestId('safe-area-view');
      expect(container).toBeTruthy();
    });
  });

  describe('Tab Navigation Accessibility', () => {
    it('maintains tab navigation accessibility with gesture navigation', () => {
      mockUseSafeAreaInsets.mockReturnValue({
        ...baseSafeAreaData,
        isGestureNavigation: true,
        bottom: 34,
      });

      const { getByTestId } = render(<TabsLayout />);
      const tabsContainer = getByTestId('tabs-container');
      
      const screenOptions = tabsContainer.props.screenOptions;
      const tabBarStyle = screenOptions.tabBarStyle;

      // Verify accessibility requirements
      expect(tabBarStyle.minHeight).toBe(60);
      expect(tabBarStyle.height).toBeGreaterThanOrEqual(60);
      expect(tabBarStyle.paddingBottom).toBeGreaterThan(0);
    });

    it('maintains tab navigation accessibility with button navigation', () => {
      mockUseSafeAreaInsets.mockReturnValue({
        ...baseSafeAreaData,
        isGestureNavigation: false,
        bottom: 48,
      });

      const { getByTestId } = render(<TabsLayout />);
      const tabsContainer = getByTestId('tabs-container');
      
      const screenOptions = tabsContainer.props.screenOptions;
      const tabBarStyle = screenOptions.tabBarStyle;

      // Verify accessibility with button navigation
      expect(tabBarStyle.height).toBeGreaterThanOrEqual(60);
      expect(tabBarStyle.paddingBottom).toBeGreaterThan(0);
      expect(tabBarStyle.maxHeight).toBe(120);
    });

    it('maintains accessibility on devices without safe area', () => {
      mockUseSafeAreaInsets.mockReturnValue({
        ...baseSafeAreaData,
        bottom: 0,
        hasBottomInset: false,
        isGestureNavigation: false,
        deviceCompatibilityInfo: {
          ...baseSafeAreaData.deviceCompatibilityInfo,
          isLegacyDevice: true,
        },
      });

      const { getByTestId } = render(<TabsLayout />);
      const tabsContainer = getByTestId('tabs-container');
      
      const screenOptions = tabsContainer.props.screenOptions;
      const tabBarStyle = screenOptions.tabBarStyle;

      // Should provide adequate spacing even without safe area
      expect(tabBarStyle.height).toBe(76);
      expect(tabBarStyle.paddingBottom).toBe(16);
    });
  });

  describe('Orientation Changes', () => {
    it('handles orientation changes smoothly', async () => {
      const { getByTestId } = render(
        <SafeAreaContainer animateTransitions={true}>
          <TabsLayout />
        </SafeAreaContainer>
      );

      // Simulate orientation change
      act(() => {
        const mockDimensions = require('react-native').Dimensions;
        mockDimensions._triggerChange({ width: 812, height: 375 }); // Landscape
      });

      await waitFor(() => {
        const container = getByTestId('safe-area-view');
        expect(container).toBeTruthy();
      });

      // Verify animation was triggered
      expect(require('react-native').Animated.timing).toHaveBeenCalled();
    });

    it('updates safe area calculations after orientation change', async () => {
      mockUseSafeAreaInsets.mockReturnValue({
        ...baseSafeAreaData,
        top: 0, // Portrait
        bottom: 21, // Portrait gesture bar
      });

      const { getByTestId, rerender } = render(<TabsLayout />);

      // Simulate orientation change to landscape
      mockUseSafeAreaInsets.mockReturnValue({
        ...baseSafeAreaData,
        top: 0, // Landscape
        bottom: 21, // Landscape gesture bar
        left: 44, // Landscape safe area
        right: 44, // Landscape safe area
      });

      rerender(<TabsLayout />);

      await waitFor(() => {
        const tabsContainer = getByTestId('tabs-container');
        expect(tabsContainer).toBeTruthy();
      });
    });

    it('maintains consistent behavior during rapid orientation changes', async () => {
      const { getByTestId } = render(
        <SafeAreaContainer animateTransitions={true}>
          <TabsLayout />
        </SafeAreaContainer>
      );

      // Simulate rapid orientation changes
      act(() => {
        const mockDimensions = require('react-native').Dimensions;
        mockDimensions._triggerChange({ width: 812, height: 375 });
        mockDimensions._triggerChange({ width: 375, height: 812 });
        mockDimensions._triggerChange({ width: 812, height: 375 });
      });

      await waitFor(() => {
        const container = getByTestId('safe-area-view');
        expect(container).toBeTruthy();
      });
    });
  });

  describe('Keyboard Interactions', () => {
    it('adjusts safe area when keyboard appears', async () => {
      const { getByTestId } = render(
        <SafeAreaContainer keyboardAware={true}>
          <TabsLayout />
        </SafeAreaContainer>
      );

      // Simulate keyboard appearance
      act(() => {
        const mockKeyboard = require('react-native').Keyboard;
        mockKeyboard._triggerEvent('keyboardWillShow', {
          endCoordinates: { height: 300 }
        });
      });

      await waitFor(() => {
        const container = getByTestId('safe-area-view');
        expect(container).toBeTruthy();
      });
    });

    it('handles keyboard dismissal correctly', async () => {
      const { getByTestId } = render(
        <SafeAreaContainer keyboardAware={true}>
          <TabsLayout />
        </SafeAreaContainer>
      );

      // Show keyboard first
      act(() => {
        const mockKeyboard = require('react-native').Keyboard;
        mockKeyboard._triggerEvent('keyboardWillShow', {
          endCoordinates: { height: 300 }
        });
      });

      // Then hide keyboard
      act(() => {
        const mockKeyboard = require('react-native').Keyboard;
        mockKeyboard._triggerEvent('keyboardWillHide');
      });

      await waitFor(() => {
        const container = getByTestId('safe-area-view');
        expect(container).toBeTruthy();
      });
    });

    it('maintains tab bar accessibility with keyboard visible', async () => {
      const { getByTestId } = render(
        <SafeAreaContainer keyboardAware={true}>
          <TabsLayout />
        </SafeAreaContainer>
      );

      // Simulate keyboard appearance
      act(() => {
        const mockKeyboard = require('react-native').Keyboard;
        mockKeyboard._triggerEvent('keyboardWillShow', {
          endCoordinates: { height: 300 }
        });
      });

      await waitFor(() => {
        const tabsContainer = getByTestId('tabs-container');
        const screenOptions = tabsContainer.props.screenOptions;
        
        // Tab bar should remain accessible
        expect(screenOptions.tabBarStyle.minHeight).toBe(60);
      });
    });
  });

  describe('Device Compatibility Edge Cases', () => {
    it('handles tablet devices with different safe area patterns', () => {
      mockUseSafeAreaInsets.mockReturnValue({
        ...baseSafeAreaData,
        top: 24,
        bottom: 20,
        deviceCompatibilityInfo: {
          ...baseSafeAreaData.deviceCompatibilityInfo,
          isTablet: true,
          screenAspectRatio: 1.33,
        },
      });

      const { getByTestId } = render(
        <SafeAreaContainer>
          <TabsLayout />
        </SafeAreaContainer>
      );

      const container = getByTestId('safe-area-view');
      const tabsContainer = getByTestId('tabs-container');
      
      expect(container).toBeTruthy();
      expect(tabsContainer).toBeTruthy();
    });

    it('handles legacy devices with fallback safe areas', () => {
      mockUseSafeAreaInsets.mockReturnValue({
        ...baseSafeAreaData,
        top: 20,
        bottom: 0,
        hasBottomInset: false,
        isGestureNavigation: false,
        isUsingFallback: true,
        deviceCompatibilityInfo: {
          ...baseSafeAreaData.deviceCompatibilityInfo,
          isLegacyDevice: true,
          hasNotch: false,
          platformVersion: 25,
        },
      });

      const { getByTestId } = render(
        <SafeAreaContainer>
          <TabsLayout />
        </SafeAreaContainer>
      );

      const container = getByTestId('safe-area-view');
      const tabsContainer = getByTestId('tabs-container');
      
      expect(container).toBeTruthy();
      expect(tabsContainer).toBeTruthy();
    });

    it('handles devices with unusual aspect ratios', () => {
      mockUseSafeAreaInsets.mockReturnValue({
        ...baseSafeAreaData,
        deviceCompatibilityInfo: {
          ...baseSafeAreaData.deviceCompatibilityInfo,
          screenAspectRatio: 3.0, // Very tall/narrow device
          hasNotch: true,
        },
      });

      const { getByTestId } = render(
        <SafeAreaContainer>
          <TabsLayout />
        </SafeAreaContainer>
      );

      const container = getByTestId('safe-area-view');
      expect(container).toBeTruthy();
    });
  });

  describe('Error Recovery', () => {
    it('gracefully handles safe area detection failures', () => {
      mockUseSafeAreaInsets.mockReturnValue({
        ...baseSafeAreaData,
        isUsingFallback: true,
        top: 20, // Fallback values
        bottom: 16,
      });

      const { getByTestId } = render(
        <SafeAreaContainer>
          <TabsLayout />
        </SafeAreaContainer>
      );

      const container = getByTestId('safe-area-view');
      const tabsContainer = getByTestId('tabs-container');
      
      expect(container).toBeTruthy();
      expect(tabsContainer).toBeTruthy();
    });

    it('maintains functionality when animations fail', () => {
      // Mock animation failure
      const mockAnimated = require('react-native').Animated;
      mockAnimated.timing.mockImplementation(() => {
        throw new Error('Animation failed');
      });

      const { getByTestId } = render(
        <SafeAreaContainer animateTransitions={true}>
          <TabsLayout />
        </SafeAreaContainer>
      );

      const container = getByTestId('safe-area-view');
      expect(container).toBeTruthy();
    });
  });
});