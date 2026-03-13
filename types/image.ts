// types/image.ts

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

export interface ImageValidationError {
  code: string;
  message: string;
  details?: Record<string, any>;
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

export interface ImageUploadState {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  previewUri: string | null;
}

export interface ImageCache {
  uri: string;
  timestamp: number;
  size: number;
  path: string;
}

export interface ImageProcessingOptions {
  enableCompression: boolean;
  enableCaching: boolean;
  maxCacheSize: number; // in bytes
  cacheTTL: number; // in milliseconds
}

// Image validation rules
export const IMAGE_VALIDATION = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
  MAX_DIMENSIONS: {
    WIDTH: 1920,
    HEIGHT: 1080,
  },
  COMPRESSION: {
    DEFAULT_QUALITY: 0.8,
    PROFILE_QUALITY: 0.9,
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    PROFILE_MAX_WIDTH: 512,
    PROFILE_MAX_HEIGHT: 512,
  },
} as const;

// Error types
export class ImageError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ImageError';
  }
}

export const IMAGE_ERROR_CODES = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  COMPRESSION_FAILED: 'COMPRESSION_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;
