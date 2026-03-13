// services/notificationService.ts
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export interface NotificationData {
  type: 'diagnosis_complete' | 'sync_complete' | 'reminder' | 'system_update';
  title: string;
  body: string;
  data?: Record<string, any>;
  userId?: string;
}

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  created_at: string;
  updated_at: string;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request push notification permissions
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('⚠️ Push notifications require a physical device');
      return false;
    }

    // In Expo Go, we can only request basic permissions
    if (isExpoGo) {
      console.log('📱 Running in Expo Go - limited notification support');
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        return newStatus === 'granted';
      }
      return true;
    }

    // Full permissions for development builds
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('⚠️ Failed to get push token for push notification!');
      return false;
    }

    console.log('✅ Notification permissions granted');
    return true;
  }

  // Get device push token
  async getDeviceToken(): Promise<string | null> {
    try {
      // Skip push token in Expo Go (not supported)
      if (isExpoGo) {
        console.log('⚠️ Push tokens not supported in Expo Go');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      let token: string;

      if (Platform.OS === 'android') {
        token = (await Notifications.getDevicePushTokenAsync()).data;
      } else {
        token = (await Notifications.getDevicePushTokenAsync()).data;
      }

      console.log('📱 Device push token obtained');
      return token;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  // Register device token with Supabase
  async registerDeviceToken(userId: string): Promise<boolean> {
    try {
      // Skip registration in Expo Go
      if (isExpoGo) {
        console.log('⚠️ Device token registration skipped in Expo Go');
        return false;
      }

      const token = await this.getDeviceToken();
      if (!token) return false;

      const platform = Platform.OS as 'ios' | 'android';

      // Upsert device token in Supabase
      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: userId,
          token: token,
          platform: platform,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('❌ Failed to register device token:', error);
        return false;
      }

      console.log('✅ Device token registered successfully');
      return true;
    } catch (error) {
      console.error('❌ Error registering device token:', error);
      return false;
    }
  }

  // Send local notification (works in Expo Go)
  async sendLocalNotification(notification: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: null, // Show immediately
      });

      console.log('📢 Local notification sent:', notification.title);
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  }

  // Schedule notification with delay
  async scheduleNotification(
    notification: NotificationData, 
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger,
      });

      console.log('⏰ Notification scheduled:', identifier);
      return identifier;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      return null;
    }
  }

  // Cancel scheduled notification
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('🚫 Notification cancelled:', identifier);
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
    }
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('🧹 All notifications cleared');
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  }

  // Get notification badge count
  async getBadgeCount(): Promise<number> {
    try {
      const badgeCount = await Notifications.getBadgeCountAsync();
      return badgeCount;
    } catch (error) {
      console.error('❌ Error getting badge count:', error);
      return 0;
    }
  }

  // Set notification badge count
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log('🏷️ Badge count set to:', count);
    } catch (error) {
      console.error('❌ Error setting badge count:', error);
    }
  }

  // Initialize notification service
  async initialize(userId: string): Promise<void> {
    try {
      console.log('🔔 Initializing notification service...');
      
      if (isExpoGo) {
        console.log('📱 Expo Go mode - Local notifications only');
      }
      
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('⚠️ Notification permissions not granted');
        return;
      }

      // Register device token (only in dev builds)
      await this.registerDeviceToken(userId);

      // Set up notification listeners
      this.setupNotificationListeners();

      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
    }
  }

  // Set up notification listeners
  private setupNotificationListeners(): void {
    // Handle notification received when app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('📨 Notification received in foreground:', notification);
      this.handleNotificationResponse(notification);
    });

    // Handle notification interaction
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationResponse(response.notification);
    });
  }

  // Handle notification response
  private handleNotificationResponse(notification: Notifications.Notification): void {
    const data = notification.request.content.data as unknown as NotificationData;
    
    switch (data?.type) {
      case 'diagnosis_complete':
        console.log('🔬 Diagnosis completed notification handled');
        // Navigate to diagnosis results
        break;
      case 'sync_complete':
        console.log('🔄 Sync completed notification handled');
        // Refresh local data
        break;
      case 'reminder':
        console.log('⏰ Reminder notification handled');
        // Handle reminder action
        break;
      case 'system_update':
        console.log('🔧 System update notification handled');
        // Handle system update
        break;
      default:
        console.log('📢 Generic notification handled');
    }
  }

  // Check if push notifications are fully supported
  isPushSupported(): boolean {
    return !isExpoGo;
  }

  // Get notification capability info
  getCapabilities(): {
    localNotifications: boolean;
    pushNotifications: boolean;
    platform: string;
  } {
    return {
      localNotifications: true, // Always supported
      pushNotifications: !isExpoGo, // Only in dev builds
      platform: Platform.OS,
    };
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
