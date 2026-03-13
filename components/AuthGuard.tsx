import { router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoading) {
      handleNavigation();
    }
  }, [isLoading, isAuthenticated, segments]);

  const handleNavigation = () => {
    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';
    const inProfileGroup = segments[0] === 'profile';
    const inDiagnosisGroup = segments[0] === 'diagnosis';
    const inSettingsGroup = segments[0] === 'settings';
    
    // Protected routes that require authentication
    const inProtectedRoute = inTabsGroup || inProfileGroup || inDiagnosisGroup || inSettingsGroup;

    if (!isAuthenticated && inProtectedRoute) {
      // User is not authenticated and trying to access protected routes
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but in auth screens, redirect to main app
      router.replace('/(tabs)');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});