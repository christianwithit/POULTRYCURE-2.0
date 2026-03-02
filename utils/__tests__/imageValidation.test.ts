// utils/__tests__/imageValidation.test.ts
import {
  validateImageFile,
  validateImagePickerResult,
  getErrorMessage,
  formatFileSize,
  getImageFormat,
  ValidationResult,
} from '../imageValidation';
import * as ImagePicker from 'expo-image-picker';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  ImagePicker: {
    getAssetInfoAsync: jest.fn(),
    MediaTypeOptions: {
      Images: 'images',
    },
  },
}));

describe('Image Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateImageFile', () => {
    it('should validate a valid JPEG image', async () => {
      const mockUri = 'file://mock/valid-image.jpg';
      
      const result = await validateImageFile(mockUri);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata).toBeDefined();
    });

    it('should reject invalid format', async () => {
      const mockUri = 'file://mock/invalid-file.txt';
      
      const result = await validateImageFile(mockUri);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
      expect(getErrorMessage(result.errors[0])).toContain('Invalid image format');
    });

    it('should handle validation with custom options', async () => {
      const mockUri = 'file://mock/image.jpg';
      const options = {
        maxSizeBytes: 1000, // 1KB
        allowedFormats: ['png'],
        requireSquare: true,
      };
      
      const result = await validateImageFile(mockUri, options);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide warnings for oversized images', async () => {
      const mockUri = 'file://mock/large-image.jpg';
      const options = {
        maxWidth: 100,
        maxHeight: 100,
      };
      
      const result = await validateImageFile(mockUri, options);

      // Should have warnings but still be valid
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle validation errors gracefully', async () => {
      const mockUri = 'file://mock/error-image.jpg';
      
      // Mock an error during validation
      const result = await validateImageFile(mockUri);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('VALIDATION_ERROR');
    });
  });

  describe('validateImagePickerResult', () => {
    it('should validate successful picker result', () => {
      const mockResult: ImagePicker.ImagePickerResult = {
        canceled: false,
        assets: [{
          uri: 'file://mock/image.jpg',
          width: 100,
          height: 100,
        }],
      };

      const result = validateImagePickerResult(mockResult);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle canceled picker result', () => {
      const mockResult: ImagePicker.ImagePickerResult = {
        canceled: true,
        assets: null,
      };

      const result = validateImagePickerResult(mockResult);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('USER_CANCELED');
    });

    it('should handle empty assets', () => {
      const mockResult: ImagePicker.ImagePickerResult = {
        canceled: false,
        assets: null,
      };

      const result = validateImagePickerResult(mockResult);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('NO_ASSETS');
    });

    it('should warn about multiple assets', () => {
      const mockResult: ImagePicker.ImagePickerResult = {
        canceled: false,
        assets: [
          { uri: 'file://mock/image1.jpg', width: 100, height: 100 },
          { uri: 'file://mock/image2.jpg', width: 100, height: 100 },
        ],
      };

      const result = validateImagePickerResult(mockResult);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Multiple images selected');
    });
  });

  describe('getErrorMessage', () => {
    it('should return user-friendly messages for known error codes', () => {
      const testCases = [
        {
          code: 'FILE_TOO_LARGE',
          expectedMessage: 'Image file is too large',
        },
        {
          code: 'INVALID_FORMAT',
          expectedMessage: 'Invalid image format',
        },
        {
          code: 'DIMENSIONS_TOO_SMALL',
          expectedMessage: 'Image is too small',
        },
        {
          code: 'INVALID_ASPECT_RATIO',
          expectedMessage: 'Image aspect ratio is not supported',
        },
        {
          code: 'NOT_SQUARE',
          expectedMessage: 'Please use a square image',
        },
        {
          code: 'USER_CANCELED',
          expectedMessage: 'Image selection was canceled',
        },
        {
          code: 'NO_ASSETS',
          expectedMessage: 'No image was selected',
        },
      ];

      testCases.forEach(({ code, expectedMessage }) => {
        const error = { code, message: 'Technical message' };
        const message = getErrorMessage(error);
        expect(message).toContain(expectedMessage);
      });
    });

    it('should return custom message for unknown errors', () => {
      const error = {
        code: 'UNKNOWN_ERROR',
        message: 'Custom error message',
      };

      const message = getErrorMessage(error);
      expect(message).toBe('Custom error message');
    });

    it('should return default message for missing message', () => {
      const error = {
        code: 'UNKNOWN_ERROR',
        message: '',
      };

      const message = getErrorMessage(error);
      expect(message).toBe('Unknown image error occurred.');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      const testCases = [
        { bytes: 0, expected: '0 B' },
        { bytes: 500, expected: '500 B' },
        { bytes: 1024, expected: '1.0 KB' },
        { bytes: 1536, expected: '1.5 KB' },
        { bytes: 1048576, expected: '1.0 MB' },
        { bytes: 1073741824, expected: '1.0 GB' },
      ];

      testCases.forEach(({ bytes, expected }) => {
        const result = formatFileSize(bytes);
        expect(result).toBe(expected);
      });
    });

    it('should handle large numbers', () => {
      const result = formatFileSize(5368709120); // 5GB
      expect(result).toBe('5.0 GB');
    });
  });

  describe('getImageFormat', () => {
    it('should extract format from URI', () => {
      const testCases = [
        { uri: 'file://mock/image.jpg', expected: 'jpg' },
        { uri: 'file://mock/image.jpeg', expected: 'jpeg' },
        { uri: 'file://mock/image.png', expected: 'png' },
        { uri: 'file://mock/image.webp', expected: 'webp' },
        { uri: 'https://example.com/image.JPG', expected: 'jpg' },
      ];

      testCases.forEach(({ uri, expected }) => {
        const result = getImageFormat(uri);
        expect(result).toBe(expected);
      });
    });

    it('should handle URIs without extension', () => {
      const result = getImageFormat('file://mock/image');
      expect(result).toBe('unknown');
    });

    it('should handle empty URI', () => {
      const result = getImageFormat('');
      expect(result).toBe('unknown');
    });

    it('should be case insensitive', () => {
      const result = getImageFormat('file://mock/image.JPG');
      expect(result).toBe('jpg');
    });
  });
});
