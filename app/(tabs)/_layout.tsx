// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/theme';

import { useSafeAreaInsets } from '../../hooks/useSafeAreaInsets';

export default function TabsLayout() {
  const { bottom, hasBottomInset, isGestureNavigation } = useSafeAreaInsets();
  
  // Handle different device navigation styles
  const getNavigationStyleConfig = () => {
    if (isGestureNavigation) {
      // Gesture navigation: smaller bottom inset, needs minimal padding
      return {
        height: 60 + bottom,
        paddingBottom: bottom,
        paddingTop: 8,
        marginBottom: 0,
      };
    } else if (hasBottomInset && !isGestureNavigation) {
      // Button navigation with safe area: larger bottom inset
      return {
        height: 60 + bottom,
        paddingBottom: Math.max(bottom - 8, 8), // Reduce padding since buttons provide spacing
        paddingTop: 8,
        marginBottom: 0,
      };
    } else {
      // No safe area (older devices or devices without notch/gesture nav)
      return {
        height: 76, // Slightly taller to account for lack of system spacing
        paddingBottom: 16, // More padding for devices without safe area
        paddingTop: 8,
        marginBottom: 0,
      };
    }
  };
  
  const navigationConfig = getNavigationStyleConfig();
  
  // Handle edge cases for devices with unusual configurations
  const safeHeight = Math.max(navigationConfig.height, 60); // Ensure minimum height
  const safePaddingBottom = Math.max(navigationConfig.paddingBottom, 4); // Ensure minimum padding
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: safeHeight,
          paddingBottom: safePaddingBottom,
          paddingTop: navigationConfig.paddingTop,
          marginBottom: navigationConfig.marginBottom,
          // Ensure tab bar remains accessible and tappable
          minHeight: 60, // Minimum height for accessibility
          // Handle edge cases for unusual device configurations
          maxHeight: 120, // Prevent excessive height on unusual devices
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          // Adjust label positioning based on navigation style
          marginBottom: isGestureNavigation ? 1 : (hasBottomInset ? 2 : 0),
        },
        tabBarIconStyle: {
          // Ensure icons remain properly positioned for different navigation styles
          marginTop: isGestureNavigation ? 1 : 2,
          marginBottom: isGestureNavigation ? 1 : 0,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: '🐔 PoultryCure',
        }}
      />
      <Tabs.Screen
        name="glossary"
        options={{
          title: 'Glossary',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={size} color={color} />
          ),
          headerTitle: 'Disease Glossary',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
          headerTitle: 'Diagnosis History',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerTitle: 'Profile',
        }}
      />
    </Tabs>
  );
}