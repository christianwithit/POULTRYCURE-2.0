export default {
  expo: {
    name: "PoultryCure",
    slug: "PoultryCure",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "poultrycure",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.christianwithit.PoultryCure",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.WRITE_EXTERNAL_STORAGE",
      ],
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-camera",
        {
          cameraPermission:
            "Allow PoultryCure to access your camera to take photos for disease diagnosis.",
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow PoultryCure to access your photos to select images for disease diagnosis.",
          cameraPermission:
            "Allow PoultryCure to access your camera to take photos for disease diagnosis.",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "07433470-772f-4c90-99d7-67d707480f2c",
      },
      // This will read from environment variables during build
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    },
  },
};
