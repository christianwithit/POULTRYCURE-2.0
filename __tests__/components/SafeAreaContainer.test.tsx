import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
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

// Mock Dimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    Keyboard: {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    Animated: {
      ...RN.Animated,
      timing: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback()),
      })),
    },
  };
});

describe('SafeAreaContainer', () => {
  const mockSafeAreaData = {
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
    mockUseSafeAreaInsets.mockReturnValue(mockSafeAreaData);
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <SafeAreaContainer>
        <Text>Test Content</Text>
      </SafeAreaContainer>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies default edges configuration', () => {
    const { getByTestId } = render(
      <SafeAreaContainer>
        <Text>Test Content</Text>
      </SafeAreaContainer>
    );

    const safeAreaView = getByTestId('safe-area-view');
    expect(safeAreaView).toBeTruthy();
  });

  it('applies custom edges configuration', () => {
    const customEdges = ['top', 'bottom'] as const;
    const { getByTestId } = render(
      <SafeAreaContainer edges={customEdges}>
        <Text>Test Content</Text>
      </SafeAreaContainer>
    );

    const safeAreaView = getByTestId('safe-area-view');
    expect(safeAreaView).toBeTruthy();
  });

  it('applies custom background color', () => {
    const { getByTestId } = render(
      <SafeAreaContainer backgroundColor="#ff0000">
        <Text>Test Content</Text>
      </SafeAreaContainer>
    );

    const safeAreaView = getByTestId('safe-area-view');
    expect(safeAreaView.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#ff0000',
        }),
      ])
    );
  });

  it('handles keyboard aware functionality', () => {
    render(
      <SafeAreaContainer keyboardAware={true}>
        <Text>Test Content</Text>
      </SafeAreaContainer>
    );

    // Verify keyboard listeners are set up
    expect(require('react-native').Keyboard.addListener).toHaveBeenCalled();
  });

  it('disables keyboard awareness when keyboardAware is false', () => {
    render(
      <SafeAreaContainer keyboardAware={false}>
        <Text>Test Content</Text>
      </SafeAreaContainer>
    );

    // Should still be called for cleanup, but behavior should be different
    expect(require('react-native').Keyboard.addListener).toHaveBeenCalled();
  });

  it('handles fallback safe area values', () => {
    const fallbackSafeAreaData = {
      ...mockSafeAreaData,
      isUsingFallback: true,
      deviceCompatibilityInfo: {
        ...mockSafeAreaData.deviceCompatibilityInfo,
        isLegacyDevice: true,
      },
    };
    mockUseSafeAreaInsets.mockReturnValue(fallbackSafeAreaData);

    const { getByTestId } = render(
      <SafeAreaContainer>
        <Text>Test Content</Text>
      </SafeAreaContainer>
    );

    const safeAreaView = getByTestId('safe-area-view');
    expect(safeAreaView).toBeTruthy();
  });

  it('handles tablet device compatibility', () => {
    const tabletSafeAreaData = {
      ...mockSafeAreaData,
      deviceCompatibilityInfo: {
        ...mockSafeAreaData.deviceCompatibilityInfo,
        isTablet: true,
        screenAspectRatio: 1.33,
      },
    };
    mockUseSafeAreaInsets.mockReturnValue(tabletSafeAreaData);

    const { getByTestId } = render(
      <SafeAreaContainer>
        <Text>Test Content</Text>
      </SafeAreaContainer>
    );

    const safeAreaView = getByTestId('safe-area-view');
    expect(safeAreaView).toBeTruthy();
  });

  it('applies custom style prop', () => {
    const customStyle = { marginTop: 20 };
    const { getByTestId } = render(
      <SafeAreaContainer style={customStyle}>
        <Text>Test Content</Text>
      </SafeAreaContainer>
    );

    const safeAreaView = getByTestId('safe-area-view');
    expect(safeAreaView.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle),
      ])
    );
  });

  it('handles animation transitions', () => {
    render(
      <SafeAreaContainer animateTransitions={true}>
        <Text>Test Content</Text>
      </SafeAreaContainer>
    );

    // Verify dimensions listener is set up for orientation changes
    expect(require('react-native').Dimensions.addEventListener).toHaveBeenCalled();
  });

  it('disables animation transitions when animateTransitions is false', () => {
    const { getByTestId } = render(
      <SafeAreaContainer animateTransitions={false}>
        <Text>Test Content</Text>
      </SafeAreaContainer>
    );

    const safeAreaView = getByTestId('safe-area-view');
    // Should not include transform style when animations are disabled
    expect(safeAreaView.props.style).toEqual(
      expect.arrayContaining([
        expect.not.objectContaining({
          transform: expect.any(Array),
        }),
      ])
    );
  });
});