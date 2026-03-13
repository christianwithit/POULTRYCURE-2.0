// app/settings/index.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="settings-outline" size={80} color={COLORS.textMuted} />
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.text}>Settings screen coming soon...</Text>
      <Text style={styles.description}>
        This section will include app preferences, notifications, account settings, and more.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  text: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.lg,
  },
});