// Mock for expo-notifications
export const Notification = {
  Content: {
    DEFAULT_SOUND: 'default',
  },
};

export const NotificationChannel = jest.fn();
export const NotificationChannelGroup = jest.fn();

export const setNotificationChannelAsync = jest.fn();
export const getNotificationChannelAsync = jest.fn();
export const deleteNotificationChannelAsync = jest.fn();
export const getNotificationChannelsAsync = jest.fn();

export const setNotificationChannelGroupAsync = jest.fn();
export const getNotificationChannelGroupAsync = jest.fn();
export const deleteNotificationChannelGroupAsync = jest.fn();
export const getNotificationChannelGroupsAsync = jest.fn();

export const scheduleNotificationAsync = jest.fn();
export const scheduleNotificationWithKeyAsync = jest.fn();
export const cancelScheduledNotificationAsync = jest.fn();
export const cancelAllScheduledNotificationsAsync = jest.fn();
export const getScheduledNotificationAsync = jest.fn();
export const getAllScheduledNotificationsAsync = jest.fn();

export const presentNotificationAsync = jest.fn();
export const presentNotificationWithKeyAsync = jest.fn();
export const dismissNotificationAsync = jest.fn();
export const dismissAllNotificationsAsync = jest.fn();

export const getBadgeCountAsync = jest.fn();
export const setBadgeCountAsync = jest.fn();

export const requestPermissionsAsync = jest.fn();
export const getPermissionsAsync = jest.fn();
export const getDevicePushTokenAsync = jest.fn();
export const getExpoPushTokenAsync = jest.fn();

export const addNotificationResponseReceivedListener = jest.fn();
export const addNotificationReceivedListener = jest.fn();
export const removeNotificationSubscription = jest.fn();

export const setNotificationHandler = jest.fn();

export default {
  Notification,
  NotificationChannel,
  NotificationChannelGroup,
  setNotificationChannelAsync,
  getNotificationChannelAsync,
  deleteNotificationChannelAsync,
  getNotificationChannelsAsync,
  setNotificationChannelGroupAsync,
  getNotificationChannelGroupAsync,
  deleteNotificationChannelGroupAsync,
  getNotificationChannelGroupsAsync,
  scheduleNotificationAsync,
  scheduleNotificationWithKeyAsync,
  cancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  getScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  presentNotificationAsync,
  presentNotificationWithKeyAsync,
  dismissNotificationAsync,
  dismissAllNotificationsAsync,
  getBadgeCountAsync,
  setBadgeCountAsync,
  requestPermissionsAsync,
  getPermissionsAsync,
  getDevicePushTokenAsync,
  getExpoPushTokenAsync,
  addNotificationResponseReceivedListener,
  addNotificationReceivedListener,
  removeNotificationSubscription,
  setNotificationHandler,
};
