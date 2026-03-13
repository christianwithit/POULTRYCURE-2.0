// app/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SafeAreaContainer from '../../components/SafeAreaContainer';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SHADOWS, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { PhotoUpload } from '../../components/profile/PhotoUpload';

export default function ProfileScreen() {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [debugTapCount, setDebugTapCount] = useState(0);

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleChangePassword = () => {
    router.push('/profile/change-password');
  };
  const handlePhotoUpdate = async (photoUrl: string) => {
    // Update user profile photo in the backend
    console.log('📸 Updating profile photo:', photoUrl);
    // TODO: Update user profile in Supabase
    // For now, just update local state
    setPhoto(photoUrl);
    await refreshUser();
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled by AuthGuard
            } catch (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleVersionTap = () => {
    const newCount = debugTapCount + 1;
    setDebugTapCount(newCount);
    
    if (newCount === 5) {
      setDebugTapCount(0);
      Alert.alert(
        '🔧 Developer Mode',
        'Edge Function Test tools unlocked!',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Debug', 
            onPress: () => router.push('/debug/edge-test')
          }
        ]
      );
    }
    
    // Reset after 2 seconds if not reaching 5 taps
    setTimeout(() => {
      setDebugTapCount(0);
    }, 2000);
  };

  if (isLoading) {
    return (
      <SafeAreaContainer edges={['top', 'left', 'right']} backgroundColor={COLORS.background}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaContainer>
    );
  }

  if (!user) {
    return (
      <SafeAreaContainer edges={['top', 'left', 'right']} backgroundColor={COLORS.background}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Unable to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshUser}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer edges={['top', 'left', 'right']} backgroundColor={COLORS.background}>
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <PhotoUpload
          currentPhoto={user.profilePhoto || photo || undefined}
          onPhotoUpdate={handlePhotoUpdate}
          userId={user.id}
          size="large"
          editable={true}
        />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.memberSince}>
          Member since {user.createdAt.toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
          <Ionicons name="person-outline" size={24} color={COLORS.primary} />
          <Text style={styles.menuText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
          <Ionicons name="lock-closed-outline" size={24} color={COLORS.primary} />
          <Text style={styles.menuText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
          <Text style={styles.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Glossary</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/bookmarks')}>
          <Ionicons name="bookmark-outline" size={24} color={COLORS.primary} />
          <Text style={styles.menuText}>Bookmarked Diseases</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/cache-settings')}>
          <Ionicons name="server-outline" size={24} color={COLORS.primary} />
          <Text style={styles.menuText}>Offline & Cache</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/about')}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
          <Text style={styles.menuText}>About PoultryCure</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/help')}>
          <Ionicons name="help-circle-outline" size={24} color={COLORS.primary} />
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/terms')}>
          <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
          <Text style={styles.menuText}>Terms & Privacy</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleVersionTap}>
        <Text style={styles.version}>Version 1.0.0</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  profileImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  name: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  memberSince: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  section: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    ...SHADOWS.small,
  },
  logoutText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  version: {
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
  },
});