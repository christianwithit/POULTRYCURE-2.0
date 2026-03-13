import { render } from '@testing-library/react-native';
import React from 'react';
import TabsLayout from '../../app/(tabs)/_layout.tsx';
import { useSafeAreaInsets } from '../../hooks/useSafeAreaInsets';

// Mock the safe area hook
jest.mock('../../hooks/useSafeAreaInsets');
const mockUseSafeAreaInsets = useSafeAreaInsets as jest.MockedFunction<typeof useSafeAreaInsets>;

// Mock __DEV__ global
(global as any).__DEV__ = true;

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
  Ionicons: ({ name, size, color }: any) => {
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

describe('TabsLayout Tab Bar Configuration', () => {
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
  });

  it('configures tab bar for gesture navigation devices', () => {
    mockUseSafeAreaInsets.mockReturnValue({
      ...baseSafeAreaData,
      bottom: 34,
      hasBottomInset: true,
      isGestureNavigation: true,
    });

    const { getByTestId } = render(<TabsLayout />);
    const tabsContainer = getByTestId('tabs-container');
    
    const screenOptions = tabsContainer.props.screenOptions;
    const tabBarStyle = screenOptions.tabBarStyle;

    // Should have appropriate height for gesture navigation
    expect(tabBarStyle.height).toBe(94); // 60 + 34
    expect(tabBarStyle.paddingBottom).toBe(34);
    expect(tabBarStyle.marginBottom).toBe(0);
  });

  it('configures tab bar for button navigation devices', () => {
    mockUseSafeAreaInsets.mockReturnValue({
      ...baseSafeAreaData,
      bottom: 48,
      hasBottomInset: true,
      isGestureNavigation: false,
    });

    const { getByTestId } = render(<TabsLayout />);
    const tabsContainer = getByTestId('tabs-container');
    
    const screenOptions = tabsContainer.props.screenOptions;
    const tabBarStyle = screenOptions.tabBarStyle;

    // Should have appropriate height for button navigation
    expect(tabBarStyle.height).toBe(108); // 60 + 48
    expect(tabBarStyle.paddingBottom).toBe(40); // max(48 - 8, 8) = 40
  });

  it('configures tab bar for devices without safe area', () => {
    mockUseSafeAreaInsets.mockReturnValue({
      ...baseSafeAreaData,
      bottom: 0,
      hasBottomInset: false,
      isGestureNavigation: false,
    });

    const { getByTestId } = render(<TabsLayout />);
    const tabsContainer = getByTestId('tabs-container');
    
    const screenOptions = tabsContainer.props.screenOptions;
    const tabBarStyle = screenOptions.tabBarStyle;

    // Should use fallback configuration for older devices
    expect(tabBarStyle.height).toBe(76);
    expect(tabBarStyle.paddingBottom).toBe(16);
  });

  it('enforces minimum and maximum height constraints', () => {
    // Test with extremely large bottom inset
    mockUseSafeAreaInsets.mockReturnValue({
      ...baseSafeAreaData,
      bottom: 200, // Unrealistically large
      hasBottomInset: true,
      isGestureNavigation: false,
    });

    const { getByTestId } = render(<TabsLayout />);
    const tabsContainer = getByTestId('tabs-container');
    
    const screenOptions = tabsContainer.props.screenOptions;
    const tabBarStyle = screenOptions.tabBarStyle;

    // Should enforce maximum height constraint
    expect(tabBarStyle.height).toBeLessThanOrEqual(260); // 60 + 200
    expect(tabBarStyle.maxHeight).toBe(120);
    expect(tabBarStyle.minHeight).toBe(60);
  });

  it('enforces minimum padding constraints', () => {
    // Test with very small bottom inset
    mockUseSafeAreaInsets.mockReturnValue({
      ...baseSafeAreaData,
      bottom: 2,
      hasBottomInset: true,
      isGestureNavigation: true,
    });

    const { getByTestId } = render(<TabsLayout />);
    const tabsContainer = getByTestId('tabs-container');
    
    const screenOptions = tabsContainer.props.screenOptions;
    const tabBarStyle = screenOptions.tabBarStyle;

    // Should enforce minimum padding
    expect(tabBarStyle.paddingBottom).toBeGreaterThanOrEqual(2);
  });

  it('applies correct styling for tab bar elements', () => {
    mockUseSafeAreaInsets.mockReturnValue(baseSafeAreaData);

    const { getByTestId } = render(<TabsLayout />);
    const tabsContainer = getByTestId('tabs-container');
    
    const screenOptions = tabsContainer.props.screenOptions;

    // Check tab bar styling
    expect(screenOptions.tabBarStyle.backgroundColor).toBe('#FFFFFF');
    expect(screenOptions.tabBarStyle.borderTopWidth).toBe(1);
    expect(screenOptions.tabBarStyle.borderTopColor).toBe('#E5E5EA');

    // Check colors
    expect(screenOptions.tabBarActiveTintColor).toBe('#007AFF');
    expect(screenOptions.tabBarInactiveTintColor).toBe('#8E8E93');
  });

  it('adjusts label and icon positioning based on navigation style', () => {
    // Test gesture navigation
    mockUseSafeAreaInsets.mockReturnValue({
      ...baseSafeAreaData,
      isGestureNavigation: true,
    });

    const { getByTestId } = render(<TabsLayout />);
    const tabsContainer = getByTestId('tabs-container');
    
    const screenOptions = tabsContainer.props.screenOptions;

    // Check label positioning for gesture navigation
    expect(screenOptions.tabBarLabelStyle.marginBottom).toBe(1);
    expect(screenOptions.tabBarIconStyle.marginTop).toBe(1);
    expect(screenOptions.tabBarIconStyle.marginBottom).toBe(1);
  });

  it('handles tablet device configurations', () => {
    mockUseSafeAreaInsets.mockReturnValue({
      ...baseSafeAreaData,
      deviceCompatibilityInfo: {
        ...baseSafeAreaData.deviceCompatibilityInfo,
        isTablet: true,
      },
    });

    const { getByTestId } = render(<TabsLayout />);
    const tabsContainer = getByTestId('tabs-container');
    
    const screenOptions = tabsContainer.props.screenOptions;
    const tabBarStyle = screenOptions.tabBarStyle;

    // Should handle tablet configurations appropriately
    expect(tabBarStyle.height).toBeGreaterThan(60);
    expect(tabBarStyle.paddingBottom).toBeGreaterThan(0);
  });

  it('handles legacy device configurations', () => {
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

    // Should use appropriate configuration for legacy devices
    expect(tabBarStyle.height).toBe(76);
    expect(tabBarStyle.paddingBottom).toBe(16);
  });
});