// services/__tests__/imageService.test.ts
import { uploadDiagnosisImage, uploadProfilePhoto, validateImage, deleteImage, cleanupTempFiles } from '../imageService';
import { supabase } from '../../lib/supabase';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
      })),
    },
  },
}));

// Mock Expo FileSystem
jest.mock('expo-file-system', () => ({
  FileSystem: {
    getInfoAsync: jest.fn(),
    deleteAsync: jest.fn(),
    makeDirectoryAsync: jest.fn(),
    documentDirectory: '/mock/documents/',
  },
}));

// Mock Expo ImageManipulator
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: {
    manipulateAsync: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('ImageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadDiagnosisImage', () => {
    it('should upload diagnosis image successfully', async () => {
      const mockImageUri = 'file://mock/image.jpg';
      const mockDiagnosisId = 'diagnosis-123';
      const mockUserId = 'user-123';
      const mockUploadResult = { data: { path: 'mock-path' } };
      const mockPublicUrl = { data: { publicUrl: 'https://mock-url.com/image.jpg' } };

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockResolvedValue(mockUploadResult),
        getPublicUrl: jest.fn().mockReturnValue(mockPublicUrl),
      });

      const result = await uploadDiagnosisImage(mockImageUri, mockDiagnosisId, mockUserId);

      expect(result).toEqual({
        url: 'https://mock-url.com/image.jpg',
        path: 'mock-path',
        metadata: expect.objectContaining({
          size: expect.any(Number),
          format: expect.any(String),
          dimensions: expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
          }),
        }),
      });
    });

    it('should handle upload errors gracefully', async () => {
      const mockImageUri = 'file://mock/image.jpg';
      const mockDiagnosisId = 'diagnosis-123';
      const mockUserId = 'user-123';

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockRejectedValue(new Error('Upload failed')),
      });

      await expect(
        uploadDiagnosisImage(mockImageUri, mockDiagnosisId, mockUserId)
      ).rejects.toThrow('Upload failed');
    });

    it('should use correct bucket path', async () => {
      const mockImageUri = 'file://mock/image.jpg';
      const mockDiagnosisId = 'diagnosis-123';
      const mockUserId = 'user-123';

      const mockFrom = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'mock-path' } }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'mock-url' } }),
      });

      (supabase.storage.from as jest.Mock).mockImplementation(mockFrom);

      await uploadDiagnosisImage(mockImageUri, mockDiagnosisId, mockUserId);

      expect(supabase.storage.from).toHaveBeenCalledWith('diagnosis-images');
      expect(mockFrom().upload).toHaveBeenCalledWith(
        `${mockUserId}/${mockDiagnosisId}/image.jpg`,
        expect.any(Object),
        expect.objectContaining({
          cacheControl: '3600',
          upsert: false,
        })
      );
    });
  });

  describe('uploadProfilePhoto', () => {
    it('should upload profile photo successfully', async () => {
      const mockImageUri = 'file://mock/profile.jpg';
      const mockUserId = 'user-123';
      const mockUploadResult = { data: { path: 'mock-path' } };
      const mockPublicUrl = { data: { publicUrl: 'https://mock-url.com/profile.jpg' } };

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockResolvedValue(mockUploadResult),
        getPublicUrl: jest.fn().mockReturnValue(mockPublicUrl),
      });

      const result = await uploadProfilePhoto(mockImageUri, mockUserId);

      expect(result).toEqual({
        url: 'https://mock-url.com/profile.jpg',
        path: 'mock-path',
        metadata: expect.objectContaining({
          size: expect.any(Number),
          format: expect.any(String),
          dimensions: expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
          }),
        }),
      });
    });

    it('should use correct bucket path for profile photos', async () => {
      const mockImageUri = 'file://mock/profile.jpg';
      const mockUserId = 'user-123';

      const mockFrom = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'mock-path' } }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'mock-url' } }),
      });

      (supabase.storage.from as jest.Mock).mockImplementation(mockFrom);

      await uploadProfilePhoto(mockImageUri, mockUserId);

      expect(supabase.storage.from).toHaveBeenCalledWith('profile-photos');
      expect(mockFrom().upload).toHaveBeenCalledWith(
        `${mockUserId}/profile.jpg`,
        expect.any(Object),
        expect.objectContaining({
          cacheControl: '3600',
          upsert: true,
        })
      );
    });
  });

  describe('validateImage', () => {
    it('should validate a valid image', async () => {
      const mockImageUri = 'file://mock/valid-image.jpg';

      // Mock successful validation
      const result = await validateImage(mockImageUri);

      expect(result).toBe(true);
    });

    it('should reject invalid image format', async () => {
      const mockImageUri = 'file://mock/invalid-file.txt';

      // Mock validation failure
      await expect(validateImage(mockImageUri)).rejects.toThrow();
    });

    it('should reject oversized images', async () => {
      const mockImageUri = 'file://mock/huge-image.jpg';

      // Mock size validation failure
      await expect(validateImage(mockImageUri)).rejects.toThrow();
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const mockBucket = 'diagnosis-images';
      const mockPath = 'user-123/diagnosis-456/image.jpg';

      const mockFrom = jest.fn().mockReturnValue({
        remove: jest.fn().mockResolvedValue({ data: { success: true } }),
      });

      (supabase.storage.from as jest.Mock).mockImplementation(mockFrom);

      await deleteImage(mockBucket, mockPath);

      expect(supabase.storage.from).toHaveBeenCalledWith(mockBucket);
      expect(mockFrom().remove).toHaveBeenCalledWith([mockPath]);
    });

    it('should handle delete errors gracefully', async () => {
      const mockBucket = 'diagnosis-images';
      const mockPath = 'user-123/diagnosis-456/image.jpg';

      (supabase.storage.from as jest.Mock).mockReturnValue({
        remove: jest.fn().mockRejectedValue(new Error('Delete failed')),
      });

      await expect(deleteImage(mockBucket, mockPath)).rejects.toThrow('Delete failed');
    });
  });

  describe('cleanupTempFiles', () => {
    it('should cleanup temporary files successfully', async () => {
      const mockTempFiles = ['file://mock/temp1.jpg', 'file://mock/temp2.jpg'];

      const { FileSystem } = require('expo-file-system');
      FileSystem.deleteAsync = jest.fn().mockResolvedValue(undefined);

      await cleanupTempFiles(mockTempFiles);

      expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(2);
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file://mock/temp1.jpg');
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file://mock/temp2.jpg');
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockTempFiles = ['file://mock/temp1.jpg'];

      const { FileSystem } = require('expo-file-system');
      FileSystem.deleteAsync = jest.fn().mockRejectedValue(new Error('Delete failed'));

      // Should not throw error, just log it
      await expect(cleanupTempFiles(mockTempFiles)).resolves.toBeUndefined();
    });

    it('should handle empty file list', async () => {
      const mockTempFiles: string[] = [];

      await expect(cleanupTempFiles(mockTempFiles)).resolves.toBeUndefined();
    });
  });
});
