// app/profile/notification-settings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../../constants/theme';

interface NotificationSettings {
  diagnosisComplete: boolean;
  syncComplete: boolean;
  reminders: boolean;
  systemUpdates: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export default function NotificationSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    diagnosisComplete: true,
    syncComplete: true,
    reminders: true,
    systemUpdates: false,
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  useEffect(() => {
    checkNotificationPermissions();
    loadSettings();
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      const hasPermission = await notificationService.requestPermissions();
      setPermissionStatus(hasPermission ? 'granted' : 'denied');
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissionStatus('error');
    }
  };

  const loadSettings = async () => {
    try {
      // In a real app, load from AsyncStorage or backend
      // For now, using default settings
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      // In a real app, save to AsyncStorage or backend
      console.log('Saving notification settings:', settings);
      
      // If user just enabled notifications and permissions are denied, prompt again
      if (permissionStatus === 'denied' && Object.values(settings).some(v => v)) {
        await checkNotificationPermissions();
      }
      
      Alert.alert('Success', 'Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const testNotification = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Permission Required', 'Please enable notifications in your device settings to test notifications.');
      return;
    }

    try {
      await notificationService.sendLocalNotification({
        type: 'system_update',
        title: 'Test Notification',
        body: 'This is a test notification from PoultryCure!',
        data: { test: true },
      });
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const renderPermissionStatus = () => {
    const statusConfig = {
      granted: { color: COLORS.success, text: 'Enabled' },
      denied: { color: COLORS.error, text: 'Disabled' },
      unknown: { color: COLORS.textSecondary, text: 'Checking...' },
      error: { color: COLORS.error, text: 'Error' },
    };

    const config = statusConfig[permissionStatus as keyof typeof statusConfig] || statusConfig.unknown;

    return (
      <View style={styles.permissionStatus}>
        <Text style={styles.permissionLabel}>Notification Status:</Text>
        <Text style={[styles.permissionText, { color: config.color }]}>
          {config.text}
        </Text>
        {permissionStatus === 'denied' && (
          <Text style={styles.permissionHelp}>
            Enable notifications in your device settings to receive alerts.
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Notification Settings</Text>
          <Text style={styles.subtitle}>
            Manage your notification preferences for PoultryCure
          </Text>
        </View>

        {renderPermissionStatus()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Diagnosis Complete</Text>
              <Text style={styles.settingDescription}>
                Get notified when your symptom or image analysis is ready
              </Text>
            </View>
            <Switch
              value={settings.diagnosisComplete}
              onValueChange={(value) => updateSetting('diagnosisComplete', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sync Complete</Text>
              <Text style={styles.settingDescription}>
                Notifications when your data syncs across devices
              </Text>
            </View>
            <Switch
              value={settings.syncComplete}
              onValueChange={(value) => updateSetting('syncComplete', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Reminders</Text>
              <Text style={styles.settingDescription}>
                Helpful reminders for check-ups and follow-ups
              </Text>
            </View>
            <Switch
              value={settings.reminders}
              onValueChange={(value) => updateSetting('reminders', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>System Updates</Text>
              <Text style={styles.settingDescription}>
                Important updates and announcements from PoultryCure
              </Text>
            </View>
            <Switch
              value={settings.systemUpdates}
              onValueChange={(value) => updateSetting('systemUpdates', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Options</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sound</Text>
              <Text style={styles.settingDescription}>
                Play sound for notifications
              </Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => updateSetting('soundEnabled', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Vibration</Text>
              <Text style={styles.settingDescription}>
                Vibrate for notifications
              </Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => updateSetting('vibrationEnabled', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Test Notifications</Text>
              <Text style={styles.settingDescription}>
                Send a test notification to verify everything is working
              </Text>
            </View>
            <View style={styles.testButton}>
              <Text style={styles.testButtonText} onPress={testNotification}>
                Test Now
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.saveButton}>
            <Text style={styles.saveButtonText} onPress={saveSettings}>
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  permissionStatus: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  permissionLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  permissionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  permissionHelp: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  actions: {
    marginTop: SPACING.lg,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
