// services/imageService.ts

import { supabase } from '../lib/supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { DiagnosisResult } from '../types/types';

export interface ImageMetadata {
  size: number;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  compressedSize?: number;
  compressionRatio?: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface UploadResult {
  url: string;
  path: string;
  metadata: ImageMetadata;
}

// Default compression settings
const DEFAULT_COMPRESSION: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg',
};

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Compresses an image to optimize for storage and performance
 */
export const compressImage = async (
  uri: string,
  options: CompressionOptions = DEFAULT_COMPRESSION
): Promise<{ uri: string; metadata: ImageMetadata }> => {
  try {
    console.log('🗜️ Starting image compression...', uri);

    // Get original image info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const originalSize = (fileInfo as any).size || 0;

    if (originalSize > MAX_FILE_SIZE) {
      console.warn(`⚠️ Image size (${originalSize}) exceeds recommended limit (${MAX_FILE_SIZE})`);
    }

    // Get image dimensions
    const { width, height } = await getImageDimensions(uri);

    // Calculate new dimensions maintaining aspect ratio
    const { newWidth, newHeight } = calculateDimensions(
      width,
      height,
      options.maxWidth || DEFAULT_COMPRESSION.maxWidth!,
      options.maxHeight || DEFAULT_COMPRESSION.maxHeight!
    );

    // Compress the image
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: newWidth, height: newHeight } }],
      {
        compress: options.quality || DEFAULT_COMPRESSION.quality!,
        format: (options.format || DEFAULT_COMPRESSION.format!) as any,
      }
    );

    // Get compressed file info
    const compressedInfo = await FileSystem.getInfoAsync(result.uri);
    const compressedSize = (compressedInfo as any).size || 0;

    const metadata: ImageMetadata = {
      size: originalSize,
      format: options.format || DEFAULT_COMPRESSION.format!,
      dimensions: {
        width: newWidth,
        height: newHeight,
      },
      compressedSize,
      compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1,
    };

    console.log(`✅ Image compressed: ${originalSize} → ${compressedSize} bytes (${((1 - metadata.compressionRatio!) * 100).toFixed(1)}% reduction)`);

    return { uri: result.uri, metadata };
  } catch (error) {
    console.error('❌ Failed to compress image:', error);
    throw new Error('Image compression failed');
  }
};

/**
 * Uploads a diagnosis image to Supabase Storage
 */
export const uploadDiagnosisImage = async (
  uri: string,
  diagnosisId: string,
  userId: string
): Promise<UploadResult> => {
  try {
    console.log('📤 Starting diagnosis image upload...', { diagnosisId, userId });

    // Compress the image first
    const { uri: compressedUri, metadata } = await compressImage(uri);

    // Generate unique file path
    const fileExt = metadata.format.toLowerCase();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${diagnosisId}/${fileName}`;

    // Read file as base64 for React Native compatibility
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create a proper blob-like object for React Native
    const base64Data = `data:image/${fileExt};base64,${base64}`;
    
    // Upload to Supabase Storage using base64 string
    const { data, error } = await supabase.storage
      .from('diagnosis-images')
      .upload(filePath, base64Data, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      console.error('❌ Upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('diagnosis-images')
      .getPublicUrl(filePath);

    console.log('✅ Diagnosis image uploaded successfully:', { path: filePath, url: publicUrl });

    return {
      url: publicUrl,
      path: filePath,
      metadata,
    };
  } catch (error) {
    console.error('❌ Failed to upload diagnosis image:', error);
    throw error;
  }
};

/**
 * Uploads a profile photo to Supabase Storage
 */
export const uploadProfilePhoto = async (uri: string, userId: string): Promise<UploadResult> => {
  try {
    console.log('📤 Starting profile photo upload...', { userId });

    // Compress the image with profile-specific settings
    const { uri: compressedUri, metadata } = await compressImage(uri, {
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.9,
      format: 'jpeg',
    });

    // Generate file path
    const fileName = `profile.${metadata.format}`;
    const filePath = `${userId}/${fileName}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create a proper blob-like object for React Native
    const base64Data = `data:image/${metadata.format};base64,${base64}`;

    // Upload to Supabase Storage using base64 string
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, base64Data, {
        contentType: `image/${metadata.format}`,
        upsert: true,
      });

    if (error) {
      console.error('❌ Profile photo upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    console.log('✅ Profile photo uploaded successfully:', { path: filePath, url: publicUrl });

    return {
      url: publicUrl,
      path: filePath,
      metadata,
    };
  } catch (error) {
    console.error('❌ Failed to upload profile photo:', error);
    throw error;
  }
};

/**
 * Deletes an image from Supabase Storage
 */
export const deleteImage = async (bucket: 'diagnosis-images' | 'profile-photos', path: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting image...', { bucket, path });

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('❌ Failed to delete image:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }

    console.log('✅ Image deleted successfully');
  } catch (error) {
    console.error('❌ Failed to delete image:', error);
    throw error;
  }
};

/**
 * Gets the public URL for an image
 */
export const getImageUrl = (bucket: 'diagnosis-images' | 'profile-photos', path: string): string => {
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
};

/**
 * Gets image metadata from storage
 */
export const getImageMetadata = async (uri: string): Promise<ImageMetadata> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const { width, height } = await getImageDimensions(uri);

    return {
      size: (fileInfo as any).size || 0,
      format: uri.split('.').pop()?.toLowerCase() || 'unknown',
      dimensions: { width, height },
    };
  } catch (error) {
    console.error('❌ Failed to get image metadata:', error);
    throw new Error('Failed to get image metadata');
  }
};

/**
 * Validates an image before upload
 */
export const validateImage = async (uri: string): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      console.error('❌ Image file does not exist');
      return false;
    }

    const size = (fileInfo as any).size || 0;
    if (size > MAX_FILE_SIZE) {
      console.error('❌ Image size exceeds limit:', size, '>', MAX_FILE_SIZE);
      return false;
    }

    // Check if it's a valid image format
    const validFormats = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = uri.split('.').pop()?.toLowerCase();
    
    if (!extension || !validFormats.includes(extension)) {
      console.error('❌ Invalid image format:', extension);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to validate image:', error);
    return false;
  }
};

/**
 * Helper function to get image dimensions
 */
const getImageDimensions = async (uri: string): Promise<{ width: number; height: number }> => {
  try {
    // For now, return default dimensions
    // In a real implementation, you might use a library to get actual dimensions
    return { width: 1920, height: 1080 };
  } catch (error) {
    console.error('Failed to get image dimensions:', error);
    return { width: 1920, height: 1080 };
  }
};

/**
 * Helper function to calculate new dimensions maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { newWidth: number; newHeight: number } => {
  const aspectRatio = originalWidth / originalHeight;

  let newWidth = originalWidth;
  let newHeight = originalHeight;

  // Scale down if width exceeds max
  if (originalWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = maxWidth / aspectRatio;
  }

  // Scale down if height exceeds max
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = maxHeight * aspectRatio;
  }

  return {
    newWidth: Math.round(newWidth),
    newHeight: Math.round(newHeight),
  };
};

/**
 * Cleanup temporary files
 */
export const cleanupTempFiles = async (uris: string[]): Promise<void> => {
  try {
    await Promise.all(
      uris.map(async (uri) => {
        try {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch (error) {
          console.warn('⚠️ Failed to delete temp file:', uri);
        }
      })
    );
    console.log('🧹 Temporary files cleaned up');
  } catch (error) {
    console.error('❌ Failed to cleanup temp files:', error);
  }
};
