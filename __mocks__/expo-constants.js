// Mock for expo-constants
export const defaultValues = {
  expoConfig: {
    extra: {
      eas: {},
    },
  },
  executionEnvironment: 'standalone',
  appOwnership: 'standalone',
};

export const manifest = defaultValues.expoConfig;
export const sessionId = 'mock-session-id';
export const installationId = 'mock-installation-id';
export const deviceName = 'mock-device';
export const platform = { ios: {}, android: {}, web: {} };

export default {
  ...defaultValues,
  manifest,
  sessionId,
  installationId,
  deviceName,
  platform,
};
