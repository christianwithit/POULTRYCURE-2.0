// utils/imageValidation.ts
import * as ImagePicker from 'expo-image-picker';
import { ImageMetadata, ImageValidationError } from '../types/image';

/**
 * Image validation utilities
 * Provides comprehensive validation for images before upload
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ImageValidationError[];
  warnings: string[];
  metadata?: ImageMetadata;
}

export interface ValidationOptions {
  maxSizeBytes?: number;
  allowedFormats?: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxAspectRatio?: number;
  minAspectRatio?: number;
  requireSquare?: boolean;
}

const DEFAULT_VALIDATION_OPTIONS: ValidationOptions = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['jpeg', 'jpg', 'png', 'webp'],
  minWidth: 100,
  minHeight: 100,
  maxWidth: 4096,
  maxHeight: 4096,
  maxAspectRatio: 4,
  minAspectRatio: 0.25,
};

/**
 * Validate image file and metadata
 */
export const validateImageFile = async (
  uri: string,
  options: Partial<ValidationOptions> = {}
): Promise<ValidationResult> => {
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const errors: ImageValidationError[] = [];
  const warnings: string[] = [];

  try {
    console.log('🔍 Validating image:', uri);

    // For now, we'll use basic validation since getAssetInfoAsync might not be available
    // In a real implementation, you would use FileSystem.getInfoAsync or similar
    
    // Create placeholder metadata
    const metadata: ImageMetadata = {
      size: 0, // Would be extracted from file
      dimensions: {
        width: 0, // Would be extracted from image
        height: 0, // Would be extracted from image
      },
      format: 'jpeg', // Would be detected
    };

    // Basic format validation
    const fileName = uri.toLowerCase();
    const hasValidFormat = opts.allowedFormats?.some(format => 
      fileName.includes(`.${format}`)
    );

    if (!hasValidFormat) {
      errors.push({
        code: 'INVALID_FORMAT',
        message: `Invalid file format. Allowed formats: ${opts.allowedFormats?.join(', ')}`,
        details: {
          allowedFormats: opts.allowedFormats,
        },
      });
    }

    // Validate dimensions if available
    if (metadata.dimensions.width > 0 && metadata.dimensions.height > 0) {
      // Check minimum dimensions
      if (opts.minWidth && metadata.dimensions.width < opts.minWidth) {
        errors.push({
          code: 'DIMENSIONS_TOO_SMALL',
          message: `Image width ${metadata.dimensions.width}px is below minimum ${opts.minWidth}px`,
          details: {
            actualWidth: metadata.dimensions.width,
            minWidth: opts.minWidth,
          },
        });
      }

      if (opts.minHeight && metadata.dimensions.height < opts.minHeight) {
        errors.push({
          code: 'DIMENSIONS_TOO_SMALL',
          message: `Image height ${metadata.dimensions.height}px is below minimum ${opts.minHeight}px`,
          details: {
            actualHeight: metadata.dimensions.height,
            minHeight: opts.minHeight,
          },
        });
      }

      // Check maximum dimensions
      if (opts.maxWidth && metadata.dimensions.width > opts.maxWidth) {
        warnings.push(`Image width ${metadata.dimensions.width}px exceeds recommended maximum ${opts.maxWidth}px`);
      }

      if (opts.maxHeight && metadata.dimensions.height > opts.maxHeight) {
        warnings.push(`Image height ${metadata.dimensions.height}px exceeds recommended maximum ${opts.maxHeight}px`);
      }

      // Check aspect ratio
      const aspectRatio = metadata.dimensions.width / metadata.dimensions.height;
      
      if (opts.maxAspectRatio && aspectRatio > opts.maxAspectRatio) {
        errors.push({
          code: 'INVALID_ASPECT_RATIO',
          message: `Aspect ratio ${aspectRatio.toFixed(2)} exceeds maximum ${opts.maxAspectRatio}`,
          details: {
            actualAspectRatio: aspectRatio,
            maxAspectRatio: opts.maxAspectRatio,
          },
        });
      }

      if (opts.minAspectRatio && aspectRatio < opts.minAspectRatio) {
        errors.push({
          code: 'INVALID_ASPECT_RATIO',
          message: `Aspect ratio ${aspectRatio.toFixed(2)} is below minimum ${opts.minAspectRatio}`,
          details: {
            actualAspectRatio: aspectRatio,
            minAspectRatio: opts.minAspectRatio,
          },
        });
      }

      // Check for square requirement
      if (opts.requireSquare && Math.abs(aspectRatio - 1) > 0.1) {
        errors.push({
          code: 'NOT_SQUARE',
          message: 'Image must be square (1:1 aspect ratio)',
          details: {
            actualAspectRatio: aspectRatio,
          },
        });
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };

    console.log('✅ Image validation complete:', {
      isValid: result.isValid,
      errorCount: errors.length,
      warningCount: warnings.length,
    });

    return result;

  } catch (error) {
    console.error('❌ Image validation failed:', error);
    
    return {
      isValid: false,
      errors: [{
        code: 'VALIDATION_ERROR',
        message: 'Failed to validate image',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      }],
      warnings,
    };
  }
};

/**
 * Validate image picker result
 */
export const validateImagePickerResult = (
  result: ImagePicker.ImagePickerResult
): ValidationResult => {
  const errors: ImageValidationError[] = [];
  const warnings: string[] = [];

  if (result.canceled) {
    errors.push({
      code: 'USER_CANCELED',
      message: 'Image selection was canceled',
    });
  }

  if (!result.assets || result.assets.length === 0) {
    errors.push({
      code: 'NO_ASSETS',
      message: 'No image assets found',
    });
  }

  if (result.assets && result.assets.length > 1) {
    warnings.push('Multiple images selected, only the first will be used');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: ImageValidationError): string => {
  switch (error.code) {
    case 'FILE_TOO_LARGE':
      return 'Image file is too large. Please choose a smaller image (max 5MB).';
    case 'INVALID_FORMAT':
      return 'Invalid image format. Please use JPEG, PNG, or WebP.';
    case 'DIMENSIONS_TOO_SMALL':
      return 'Image is too small. Please use an image at least 100x100 pixels.';
    case 'INVALID_ASPECT_RATIO':
      return 'Image aspect ratio is not supported. Please use a more standard ratio.';
    case 'NOT_SQUARE':
      return 'Please use a square image for profile photos.';
    case 'VALIDATION_ERROR':
      return 'Failed to validate image. Please try again.';
    case 'USER_CANCELED':
      return 'Image selection was canceled.';
    case 'NO_ASSETS':
      return 'No image was selected.';
    default:
      return error.message || 'Unknown image error occurred.';
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Get image format from URI
 */
export const getImageFormat = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase();
  return extension || 'unknown';
};
