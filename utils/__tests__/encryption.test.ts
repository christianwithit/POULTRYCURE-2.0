import { EncryptionUtils } from '../encryption';

// Mock expo-crypto for testing
jest.mock('expo-crypto', () => ({
  getRandomBytes: jest.fn(() => ({
    toString: () => 'mock-random-bytes-12345678901234567890123456789012'
  })),
  digestStringAsync: jest.fn((algorithm, data) => 
    Promise.resolve(`hashed-${data}`)
  ),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256'
  }
}));

describe('EncryptionUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateKey', () => {
    it('should generate a key', () => {
      const key = EncryptionUtils.generateKey();
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
    });
  });

  describe('generateSalt', () => {
    it('should generate a salt', () => {
      const salt = EncryptionUtils.generateSalt();
      expect(salt).toBeDefined();
      expect(typeof salt).toBe('string');
    });
  });

  describe('hash', () => {
    it('should hash data using SHA-256', async () => {
      const data = 'test-data';
      const hash = await EncryptionUtils.hash(data);
      
      expect(hash).toBe('hashed-test-data');
    });

    it('should handle hashing errors', async () => {
      const crypto = require('expo-crypto');
      crypto.digestStringAsync.mockRejectedValueOnce(new Error('Hash failed'));
      
      await expect(EncryptionUtils.hash('test')).rejects.toThrow('Hashing failed');
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const originalData = 'sensitive-data';
      const key = 'test-key-123';
      
      const encrypted = await EncryptionUtils.encrypt(originalData, key);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalData);
      
      const decrypted = await EncryptionUtils.decrypt(encrypted, key);
      expect(decrypted).toBe(originalData);
    });

    it('should generate key if not provided', async () => {
      const originalData = 'test-data';
      
      const encrypted = await EncryptionUtils.encrypt(originalData);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalData);
    });

    it('should handle encryption errors', async () => {
      // Mock TextEncoder to throw an error
      const originalTextEncoder = global.TextEncoder;
      global.TextEncoder = class {
        encode() {
          throw new Error('TextEncoder failed');
        }
      } as any;
      
      await expect(EncryptionUtils.encrypt('test')).rejects.toThrow('Encryption failed');
      
      // Restore original TextEncoder
      global.TextEncoder = originalTextEncoder;
    });

    it('should handle decryption errors', async () => {
      // Mock atob to throw an error
      const originalAtob = global.atob;
      global.atob = () => {
        throw new Error('Invalid base64');
      };
      
      const invalidEncryptedData = 'invalid-base64-data';
      const key = 'test-key';
      
      await expect(EncryptionUtils.decrypt(invalidEncryptedData, key)).rejects.toThrow('Decryption failed');
      
      // Restore original atob
      global.atob = originalAtob;
    });
  });
});