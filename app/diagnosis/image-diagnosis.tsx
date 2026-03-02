// app/diagnosis/image-diagnosis.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, LINE_HEIGHT, SHADOWS, SPACING } from '../../constants/theme';
import { useDiagnosis } from '../../contexts/DiagnosisContext';
import { DiagnosisAPI } from '../../services/api';
import { uploadDiagnosisImage, validateImage, cleanupTempFiles } from '../../services/imageService';
import { useAuth } from '../../contexts/AuthContext';

export default function ImageDiagnosis() {
  const [image, setImage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();
  const { addDiagnosis } = useDiagnosis();
  const { user } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleButtonPress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(callback, 100);
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const cameraResponse = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraResponse.status === 'granted');

      const galleryResponse = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermission(galleryResponse.status === 'granted');

      if (galleryResponse.status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Please allow access to your photo library to use this feature.'
        );
      }

      if (cameraResponse.status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Please allow camera access to take photos.'
        );
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions.');
    }
  };

  const takePhoto = async () => {
    try {
      if (hasCameraPermission === false) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Camera.requestCameraPermissionsAsync() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      if (hasGalleryPermission === false) {
        Alert.alert(
          'Gallery Permission Required',
          'Please grant photo library permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please take or select a photo first.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to analyze images.');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Step 1: Validate image
      console.log('🔍 Validating image...');
      const isValid = await validateImage(image);
      if (!isValid) {
        throw new Error('Invalid image format or size too large');
      }

      // Step 2: Analyze image locally first
      console.log('🧠 Analyzing image locally...');
      setUploadProgress(25);
      const response = await DiagnosisAPI.analyzeImage(image);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Analysis failed');
      }

      // Step 3: Upload image to Supabase Storage
      console.log('📤 Uploading image to storage...');
      setUploadProgress(50);
      
      // Generate a temporary diagnosis ID for upload
      const tempDiagnosisId = `temp-${Date.now()}`;
      const uploadResult = await uploadDiagnosisImage(image, tempDiagnosisId, user.id);
      
      setUploadProgress(75);

      // Step 4: Update diagnosis with image information
      const diagnosisWithImage = {
        ...response.data,
        imageUri: image,
        imageUrl: uploadResult.url,
        imagePath: uploadResult.path,
        imageMetadata: uploadResult.metadata,
      };

      console.log('💾 Saving diagnosis with image...');
      setUploadProgress(90);
      await addDiagnosis(diagnosisWithImage);

      // Step 5: Cleanup temporary files
      await cleanupTempFiles([image]);
      setUploadProgress(100);

      console.log('✅ Image analysis and upload complete!');
      
      router.push({
        pathname: '/diagnosis/result',
        params: { diagnosisId: response.data.id },
      });
    } catch (error) {
      console.error('❌ Image analysis error:', error);
      
      // Cleanup on error
      await cleanupTempFiles([image]);
      
      Alert.alert(
        'Analysis Failed',
        error instanceof Error ? error.message : 'Failed to analyze image. Please try again or use symptom diagnosis.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const retakePhoto = () => {
    setImage(null);
    setTimeout(takePhoto, 100);
  };

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }
    ]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="camera" size={40} color={COLORS.secondary} />
          </View>
          <Text style={styles.title}>📸 Image Diagnosis</Text>
          <Text style={styles.subtitle}>
            Take or upload a clear photo of the affected bird
          </Text>
        </View>

        {!image ? (
          <>
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Photo Guidelines:</Text>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.instructionText}>Good lighting</Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.instructionText}>Clear focus on affected area</Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.instructionText}>Close-up if possible</Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.instructionText}>Multiple angles help</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Animated.View
                style={[
                  styles.button,
                  styles.cameraButton,
                  { transform: [{ scale: buttonScaleAnim }] }
                ]}
              >
                <TouchableOpacity
                  style={styles.buttonInner}
                  onPress={() => handleButtonPress(takePhoto)}
                  activeOpacity={0.8}
                  disabled={hasCameraPermission === false}
                  accessible={true}
                  accessibilityLabel="Take photo"
                  accessibilityHint="Opens camera to take a photo"
                >
                  <MaterialIcons name="camera-alt" size={28} color={COLORS.white} />
                  <Text style={styles.buttonText}>Take Photo</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={[
                  styles.button,
                  styles.galleryButton,
                  { transform: [{ scale: buttonScaleAnim }] }
                ]}
              >
                <TouchableOpacity
                  style={styles.buttonInner}
                  onPress={() => handleButtonPress(pickImage)}
                  activeOpacity={0.8}
                  disabled={hasGalleryPermission === false}
                  accessible={true}
                  accessibilityLabel="Pick from gallery"
                  accessibilityHint="Opens gallery to select a photo"
                >
                  <MaterialIcons name="photo-library" size={28} color={COLORS.white} />
                  <Text style={styles.buttonText}>Pick from Gallery</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </>
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
            
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={[styles.imageActionButton, styles.retakeButton]}
                onPress={retakePhoto}
                disabled={isLoading}
              >
                <Ionicons name="camera-outline" size={24} color={COLORS.white} />
                <Text style={styles.imageActionText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.imageActionButton, styles.analyzeButton]}
                onPress={analyzeImage}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContent}>
                    <ActivityIndicator size="small" color={COLORS.white} />
                    <Text style={styles.imageActionText}>
                      {uploadProgress > 0 ? `Uploading... ${Math.round(uploadProgress)}%` : 'Analyzing...'}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="analytics-outline" size={24} color={COLORS.white} />
                    <Text style={styles.imageActionText}>Analyze</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={COLORS.warning} />
          <Text style={styles.infoText}>
            For best results, combine image diagnosis with symptom description
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
    lineHeight: FONT_SIZES.title * LINE_HEIGHT.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
  instructionsContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  instructionsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  instructionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginLeft: SPACING.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
  buttonContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cameraButton: {
    backgroundColor: COLORS.success,
  },
  galleryButton: {
    backgroundColor: COLORS.warning,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    marginLeft: SPACING.sm,
    fontWeight: '600',
    lineHeight: FONT_SIZES.lg * LINE_HEIGHT.sm,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  image: {
    width: '100%',
    height: 350,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  imageActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.medium,
  },
  retakeButton: {
    backgroundColor: COLORS.secondary,
    flex: 0.35,
  },
  imageActionText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    marginLeft: SPACING.xs,
    fontWeight: '600',
    lineHeight: FONT_SIZES.md * LINE_HEIGHT.sm,
  },
  analyzeButton: {
    backgroundColor: COLORS.secondary,
    flex: 0.65,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHT.sm,
  },
});
