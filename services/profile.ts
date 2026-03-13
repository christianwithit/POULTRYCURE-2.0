// @ts-ignore - FileSystem types issue
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { User } from '../types/types';
import { storageManager } from './storage';

export class ProfileService {
  /**
   * Gets the current user's profile data
   */
  async getProfile(): Promise<User> {
    try {
      const user = await storageManager.getUser();
      if (!user) {
        throw new Error('No user profile found');
      }
      return user;
    } catch (error) {
      throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates the user's profile data
   */
  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      // Validate input data
      if (profileData.name !== undefined) {
        const trimmedName = profileData.name.trim();
        if (trimmedName.length < 2) {
          throw new Error('Name must be at least 2 characters long');
        }
        profileData.name = trimmedName;
      }

      if (profileData.email !== undefined) {
        const trimmedEmail = profileData.email.toLowerCase().trim();
        if (!this.isValidEmail(trimmedEmail)) {
          throw new Error('Please enter a valid email address');
        }
        profileData.email = trimmedEmail;
      }

      // Update user data
      await storageManager.updateUser(profileData);
      
      // Return updated user data
      const updatedUser = await storageManager.getUser();
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated profile');
      }
      
      return updatedUser;
    } catch (error) {
      throw new Error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Uploads and processes a profile photo
   */
  async uploadProfilePhoto(imageUri: string): Promise<string> {
    try {
      // Validate image URI
      if (!imageUri) {
        throw new Error('Image URI is required');
      }

      // Check if file exists
      const fileInfo = await (FileSystem as any).getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Selected image file does not exist');
      }

      // Resize and crop image to square format
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 300, height: 300 } }
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Create a permanent file path in the app's document directory
      const fileName = `profile_photo_${Date.now()}.jpg`;
      const permanentUri = `${(FileSystem as any).documentDirectory}${fileName}`;

      // Copy the manipulated image to permanent storage
      await (FileSystem as any).copyAsync({
        from: manipulatedImage.uri,
        to: permanentUri,
      });

      // Update user profile with new photo URI
      await this.updateProfile({ profilePhoto: permanentUri });

      return permanentUri;
    } catch (error) {
      throw new Error(`Failed to upload profile photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes the user's profile photo
   */
  async deleteProfilePhoto(): Promise<void> {
    try {
      const user = await this.getProfile();
      
      if (user.profilePhoto) {
        // Delete the physical file if it exists
        try {
          const fileInfo = await (FileSystem as any).getInfoAsync(user.profilePhoto);
          if (fileInfo.exists) {
            await (FileSystem as any).deleteAsync(user.profilePhoto);
          }
        } catch (fileError) {
          // Continue even if file deletion fails
          console.warn('Failed to delete profile photo file:', fileError);
        }

        // Update user profile to remove photo reference
        await this.updateProfile({ profilePhoto: undefined });
      }
    } catch (error) {
      throw new Error(`Failed to delete profile photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Requests camera and media library permissions
   */
  async requestImagePermissions(): Promise<boolean> {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraPermission.status === 'granted' && mediaLibraryPermission.status === 'granted';
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Shows image picker with camera and gallery options
   */
  async pickImage(): Promise<string | null> {
    try {
      const hasPermissions = await this.requestImagePermissions();
      if (!hasPermissions) {
        throw new Error('Camera and photo library permissions are required');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      throw new Error(`Failed to pick image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Shows camera for taking a new photo
   */
  async takePhoto(): Promise<string | null> {
    try {
      const hasPermissions = await this.requestImagePermissions();
      if (!hasPermissions) {
        throw new Error('Camera permissions are required');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      throw new Error(`Failed to take photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const profileService = new ProfileService();