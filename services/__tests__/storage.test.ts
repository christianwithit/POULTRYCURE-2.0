jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-secure-store');
jest.mock('../../utils/encryption');

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { EncryptedCredentials, User } from '../../types/types';
import { EncryptionUtils } from '../../utils/encryption';
import { StorageManager } from '../storage';

// Get the mocked modules
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockEncryptionUtils = EncryptionUtils as jest.Mocked<typeof EncryptionUtils>;

describe('StorageManager', () => {
  let storageManager: StorageManager;
  
  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  const mockCredentials: EncryptedCredentials = {
    hashedPassword: 'hashed-password-123',
    salt: 'salt-123',
  };

  beforeEach(() => {
    storageManager = new StorageManager();
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockEncryptionUtils.generateKey.mockReturnValue('mock-encryption-key');
    mockEncryptionUtils.encrypt.mockImplementation((data) => Promise.resolve(`encrypted-${data}`));
    mockEncryptionUtils.decrypt.mockImplementation((data) => Promise.resolve(data.replace('encrypted-', '')));
  });

  describe('storeUser', () => {
    it('should store user data with encryption', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce('existing-key');
      
      await storageManager.storeUser(mockUser);
      
      expect(mockEncryptionUtils.encrypt).toHaveBeenCalled();
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'user_data',
        expect.stringContaining('encrypted-')
      );
    });

    it('should generate encryption key if not exists', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce(null);
      
      await storageManager.storeUser(mockUser);
      
      expect(mockEncryptionUtils.generateKey).toHaveBeenCalled();
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'encryption_key',
        'mock-encryption-key'
      );
    });
  });

  describe('getUser', () => {
    it('should retrieve and decrypt user data', async () => {
      const encryptedUserData = JSON.stringify({
        ...mockUser,
        createdAt: mockUser.createdAt.toISOString(),
        updatedAt: mockUser.updatedAt.toISOString(),
      });
      
      mockAsyncStorage.getItem.mockResolvedValueOnce(`encrypted-${encryptedUserData}`);
      mockSecureStore.getItemAsync.mockResolvedValueOnce('encryption-key');
      
      const result = await storageManager.getUser();
      
      expect(mockEncryptionUtils.decrypt).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null if no user data exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      
      const result = await storageManager.getUser();
      
      expect(result).toBeNull();
    });
  });

  describe('storeCredentials', () => {
    it('should store credentials in secure storage', async () => {
      await storageManager.storeCredentials(mockCredentials);
      
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'user_credentials',
        JSON.stringify(mockCredentials)
      );
    });
  });

  describe('getCredentials', () => {
    it('should retrieve credentials from secure storage', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(mockCredentials));
      
      const result = await storageManager.getCredentials();
      
      expect(result).toEqual(mockCredentials);
    });

    it('should return null if no credentials exist', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce(null);
      
      const result = await storageManager.getCredentials();
      
      expect(result).toBeNull();
    });
  });

  describe('clearUserData', () => {
    it('should clear all user-related data', async () => {
      await storageManager.clearUserData();
      
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user_data');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user_session');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('user_credentials');
    });
  });
});