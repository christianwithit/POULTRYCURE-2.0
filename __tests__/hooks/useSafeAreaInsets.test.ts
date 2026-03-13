import { renderHook } from '@testing-library/react-native';
import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets as useNativeSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from '../../hooks/useSafeAreaInsets';

// Mock __DEV__ global
(global as any).__DEV__ = true;

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}));

const mockUseNativeSafeAreaInsets = useNativeSafeAreaInsets as jest.MockedFunction<typeof useNativeSafeAreaInsets>;

// Mock react-native modules
jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    Version: 14,
  },
}));

const mockDimensions = Dimensions.get as jest.MockedFunction<typeof Dimensions.get>;

describe('useSafeAreaInsets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock values
    mockDimensions.mockReturnValue({ width: 375, height: 812 });
    mockUseNativeSafeAreaInsets.mockReturnValue({
      top: 47,
      right: 0,
      bottom: 34,
      left: 0,
    });
  });

  it('returns correct inset values from native hook', () => {
    const { result } = renderHook(() => useSafeAreaInsets());

    expect(result.current.top).toBe(47);
    expect(result.current.right).toBe(0);
    expect(result.current.bottom).toBe(34);
    expect(result.current.left).toBe(0);
  });

  it('detects bottom inset correctly', () => {
    const { result } = renderHook(() => useSafeAreaInsets());

    expect(result.current.hasBottomInset).toBe(true);
  });

  it('detects gesture navigation correctly', () => {
    const { result } = renderHook(() => useSafeAreaInsets());

    // Bottom inset of 34 should indicate gesture navigation
    expect(result.current.isGestureNavigation).toBe(true);
  });

  it('calculates navigation bar height correctly', () => {
    const { result } = renderHook(() => useSafeAreaInsets());

    expect(result.current.navigationBarHeight).toBe(34);
  });

  it('returns correct tab bar padding', () => {
    const { result } = renderHook(() => useSafeAreaInsets());

    const padding = result.current.getTabBarPadding();
    expect(typeof padding).toBe('number');
    expect(padding).toBeGreaterThan(0);
  });

  it('calculates dynamic spacing correctly', () => {
    const { result } = renderHook(() => useSafeAreaInsets());

    const baseSpacing = 16;
    const dynamicSpacing = result.current.getDynamicSpacing(baseSpacing);
    expect(typeof dynamicSpacing).toBe('number');
    expect(dynamicSpacing).toBeGreaterThanOrEqual(baseSpacing);
  });

  it('handles invalid native insets with fallback', () => {
    mockUseNativeSafeAreaInsets.mockReturnValue({
      top: -1, // Invalid negative value
      right: 0,
      bottom: 1000, // Invalid large value
      left: 0,
    });

    const { result } = renderHook(() => useSafeAreaInsets());

    expect(result.current.isUsingFallback).toBe(true);
    expect(result.current.top).toBeGreaterThanOrEqual(0);
    expect(result.current.bottom).toBeLessThan(1000);
  });

  it('detects tablet devices correctly', () => {
    // Mock tablet dimensions (iPad-like aspect ratio)
    mockDimensions.mockReturnValue({ width: 768, height: 1024 });

    const { result } = renderHook(() => useSafeAreaInsets());

    expect(result.current.deviceCompatibilityInfo.isTablet).toBe(true);
  });

  it('detects legacy devices correctly', () => {
    // Mock legacy device (Android API < 28)
    (Platform as any).OS = 'android';
    (Platform as any).Version = 27;
    mockDimensions.mockReturnValue({ width: 320, height: 568 });

    const { result } = renderHook(() => useSafeAreaInsets());

    expect(result.current.deviceCompatibilityInfo.isLegacyDevice).toBe(true);
  });

  it('detects devices with notch correctly', () => {
    // Mock device with high aspect ratio (notch indicator)
    mockDimensions.mockReturnValue({ width: 375, height: 812 }); // iPhone X-like

    const { result } = renderHook(() => useSafeAreaInsets());

    expect(result.current.deviceCompatibilityInfo.hasNotch).toBe(true);
  });

  it('handles button navigation devices', () => {
    mockUseNativeSafeAreaInsets.mockReturnValue({
      top: 24,
      right: 0,
      bottom: 48, // Larger bottom inset indicates button navigation
      left: 0,
    });

    const { result } = renderHook(() => useSafeAreaInsets());

    expect(result.current.hasBottomInset).toBe(true);
    expect(result.current.isGestureNavigation).toBe(false); // Should be false for button nav
  });

  it('handles devices without safe area', () => {
    mockUseNativeSafeAreaInsets.mockReturnValue({
      top: 20,
      right: 0,
      bottom: 0, // No bottom inset
      left: 0,
    });

    const { result } = renderHook(() => useSafeAreaInsets());

    expect(result.current.hasBottomInset).toBe(false);
    expect(result.current.isGestureNavigation).toBe(false);
    expect(result.current.navigationBarHeight).toBe(0);
  });

  it('provides appropriate fallback for tablet devices', () => {
    mockDimensions.mockReturnValue({ width: 768, height: 1024 });
    mockUseNativeSafeAreaInsets.mockImplementation(() => {
      throw new Error('Safe area detection failed');
    });

    const { result } = renderHook(() => useSafeAreaInsets());

    expect(result.current.isUsingFallback).toBe(true);
    expect(result.current.deviceCompatibilityInfo.isTablet).toBe(true);
    // Should use tablet fallback values
    expect(result.current.top).toBe(24);
    expect(result.current.bottom).toBe(20);
  });

  it('validates and sanitizes extreme inset values', () => {
    mockUseNativeSafeAreaInsets.mockReturnValue({
      top: 500, // Extremely large value
      right: -10, // Negative value
      bottom: 300, // Large value
      left: 0,
    });

    const { result } = renderHook(() => useSafeAreaInsets());

    // Values should be sanitized to reasonable bounds
    expect(result.current.top).toBeLessThan(500);
    expect(result.current.right).toBeGreaterThanOrEqual(0);
    expect(result.current.bottom).toBeLessThan(300);
  });

  it('handles dynamic spacing with invalid input', () => {
    const { result } = renderHook(() => useSafeAreaInsets());

    // Test with invalid base spacing
    const spacing1 = result.current.getDynamicSpacing(-5);
    const spacing2 = result.current.getDynamicSpacing(NaN);

    expect(spacing1).toBeGreaterThan(0);
    expect(spacing2).toBeGreaterThan(0);
  });
});