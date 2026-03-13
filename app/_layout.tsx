// app/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthGuard } from '../components/AuthGuard';
import { AuthProvider } from '../contexts/AuthContext';
import { DiagnosisProvider } from '../contexts/DiagnosisContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DiagnosisProvider>
          <AuthGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen 
                name="auth" 
                options={{ 
                  headerShown: false,
                  gestureEnabled: false,
                }} 
              />
              <Stack.Screen 
                name="(tabs)" 
                options={{ 
                  headerShown: false,
                  gestureEnabled: false,
                }} 
              />
              <Stack.Screen 
                name="diagnosis" 
                options={{ 
                  headerShown: false,
                  presentation: 'card'
                }} 
              />
              <Stack.Screen 
                name="profile" 
                options={{ 
                  headerShown: false,
                  presentation: 'card'
                }} 
              />
              <Stack.Screen 
                name="glossary" 
                options={{ 
                  headerShown: false,
                  presentation: 'card'
                }} 
              />
              <Stack.Screen 
                name="settings" 
                options={{ headerShown: false }} 
              />
            </Stack>
          </AuthGuard>
        </DiagnosisProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}