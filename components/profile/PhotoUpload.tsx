// components/profile/PhotoUpload.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePhoto } from '../../services/imageService';
import { BORDER_RADIUS, COLORS, FONT_SIZES, LINE_HEIGHT, SPACING, SHADOWS } from '../../constants/theme';

interface PhotoUploadProps {
  currentPhoto?: string;
  onPhotoUpdate: (photoUrl: string) => void;
  userId: string;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  currentPhoto,
  onPhotoUpdate,
  userId,
  size = 'medium',
  editable = true,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 60, height: 60 },
          image: { width: 60, height: 60 },
          initials: { fontSize: FONT_SIZES.lg },
        };
      case 'large':
        return {
          container: { width: 120, height: 120 },
          image: { width: 120, height: 120 },
          initials: { fontSize: FONT_SIZES.title },
        };
      default: // medium
        return {
          container: { width: 80, height: 80 },
          image: { width: 80, height: 80 },
          initials: { fontSize: FONT_SIZES.xl },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload a profile photo.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setShowModal(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow camera access to take a profile photo.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setShowModal(false);
    }
  };

  const uploadPhoto = async (uri: string) => {
    setIsUploading(true);
    try {
      console.log('📤 Uploading profile photo...');
      const result = await uploadProfilePhoto(uri, userId);
      onPhotoUpdate(result.url);
      console.log('✅ Profile photo uploaded successfully');
    } catch (error) {
      console.error('❌ Failed to upload profile photo:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to upload profile photo. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onPhotoUpdate('');
            setShowModal(false);
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderProfileImage = () => {
    if (isUploading) {
      return (
        <View style={[styles.photoContainer, sizeStyles.container, styles.uploadingContainer]}>
          <ActivityIndicator size="small" color={COLORS.white} />
        </View>
      );
    }

    if (currentPhoto) {
      return (
        <View style={[styles.photoContainer, sizeStyles.container]}>
          <Image source={{ uri: currentPhoto }} style={[styles.photo, sizeStyles.image]} />
          {editable && (
            <View style={styles.editOverlay}>
              <Ionicons name="camera" size={20} color={COLORS.white} />
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={[styles.photoContainer, sizeStyles.container, styles.placeholderContainer]}>
        <Text style={[styles.initials, sizeStyles.initials]}>
          {getInitials('User')}
        </Text>
        {editable && (
          <View style={styles.editOverlay}>
            <Ionicons name="add" size={20} color={COLORS.white} />
          </View>
        )}
      </View>
    );
  };

  const ProfileImage = () => {
    if (!editable) {
      return renderProfileImage();
    }

    return (
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        disabled={isUploading}
        activeOpacity={0.8}
      >
        {renderProfileImage()}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <ProfileImage />

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Photo</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalOptions}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={takePhoto}
                disabled={isUploading}
              >
                <View style={[styles.optionIcon, { backgroundColor: COLORS.success }]}>
                  <Ionicons name="camera" size={24} color={COLORS.white} />
                </View>
                <Text style={styles.optionText}>Take Photo</Text>
                <Text style={styles.optionSubtext}>Use camera to take a new photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={pickFromGallery}
                disabled={isUploading}
              >
                <View style={[styles.optionIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="image" size={24} color={COLORS.white} />
                </View>
                <Text style={styles.optionText}>Choose from Gallery</Text>
                <Text style={styles.optionSubtext}>Select from your photo library</Text>
              </TouchableOpacity>

              {currentPhoto && (
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={removePhoto}
                  disabled={isUploading}
                >
                  <View style={[styles.optionIcon, { backgroundColor: COLORS.error }]}>
                    <Ionicons name="trash" size={24} color={COLORS.white} />
                  </View>
                  <Text style={styles.optionText}>Remove Photo</Text>
                  <Text style={styles.optionSubtext}>Remove your current profile photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  photoContainer: {
    borderRadius: 999, // Circular
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.medium,
  },
  photo: {
    borderRadius: 999,
  },
  uploadingContainer: {
    backgroundColor: COLORS.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  modalOptions: {
    gap: SPACING.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  optionSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    flex: 1,
    marginTop: 2,
  },
  cancelButton: {
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: '500',
  },
});
