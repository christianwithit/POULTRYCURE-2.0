import { PasswordUtils } from '../password';

// Mock the encryption utils
jest.mock('../encryption', () => ({
  EncryptionUtils: {
    generateSalt: jest.fn(() => 'mock-salt-123'),
    hash: jest.fn((data) => Promise.resolve(`hashed-${data}`))
  }
}));

describe('PasswordUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSalt', () => {
    it('should generate a salt', () => {
      const salt = PasswordUtils.generateSalt();
      expect(salt).toBe('mock-salt-123');
    });
  });

  describe('hashPassword', () => {
    it('should hash password with provided salt', async () => {
      const password = 'testPassword123!';
      const salt = 'test-salt';
      
      const result = await PasswordUtils.hashPassword(password, salt);
      
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(result.salt).toBe(salt);
      expect(typeof result.hash).toBe('string');
    });

    it('should generate salt if not provided', async () => {
      const password = 'testPassword123!';
      
      const result = await PasswordUtils.hashPassword(password);
      
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(result.salt).toBe('mock-salt-123');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123!';
      const salt = 'test-salt';
      
      // First hash the password
      const { hash } = await PasswordUtils.hashPassword(password, salt);
      
      // Then verify it
      const isValid = await PasswordUtils.verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const correctPassword = 'testPassword123!';
      const wrongPassword = 'wrongPassword456!';
      const salt = 'test-salt';
      
      const { hash } = await PasswordUtils.hashPassword(correctPassword, salt);
      const isValid = await PasswordUtils.verifyPassword(wrongPassword, hash, salt);
      
      expect(isValid).toBe(false);
    });

    it('should handle verification errors gracefully', async () => {
      const { EncryptionUtils } = require('../encryption');
      EncryptionUtils.hash.mockRejectedValueOnce(new Error('Hash failed'));
      
      const isValid = await PasswordUtils.verifyPassword('test', 'hash', 'salt');
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const strongPassword = 'StrongPass123!';
      const result = PasswordUtils.validatePasswordStrength(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', () => {
      const shortPassword = 'Abc1!';
      const result = PasswordUtils.validatePasswordStrength(shortPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without lowercase letter', () => {
      const password = 'PASSWORD123!';
      const result = PasswordUtils.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without uppercase letter', () => {
      const password = 'password123!';
      const result = PasswordUtils.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without number', () => {
      const password = 'Password!';
      const result = PasswordUtils.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const password = 'Password123';
      const result = PasswordUtils.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject common weak passwords', () => {
      const weakPasswords = ['password123!', 'Password123', '12345678'];
      
      weakPasswords.forEach(password => {
        const result = PasswordUtils.validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('calculatePasswordStrength', () => {
    it('should return higher score for stronger passwords', () => {
      const weakPassword = 'abc';
      const strongPassword = 'StrongPassword123!@#';
      
      const weakScore = PasswordUtils.calculatePasswordStrength(weakPassword);
      const strongScore = PasswordUtils.calculatePasswordStrength(strongPassword);
      
      expect(strongScore).toBeGreaterThan(weakScore);
      expect(weakScore).toBeLessThan(50);
      expect(strongScore).toBeGreaterThan(70);
    });

    it('should return score between 0 and 100', () => {
      const passwords = ['a', 'StrongPassword123!@#$%^&*()'];
      
      passwords.forEach(password => {
        const score = PasswordUtils.calculatePasswordStrength(password);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('getPasswordStrengthDescription', () => {
    it('should return correct descriptions for different scores', () => {
      expect(PasswordUtils.getPasswordStrengthDescription(20)).toBe('Very Weak');
      expect(PasswordUtils.getPasswordStrengthDescription(40)).toBe('Weak');
      expect(PasswordUtils.getPasswordStrengthDescription(60)).toBe('Fair');
      expect(PasswordUtils.getPasswordStrengthDescription(80)).toBe('Good');
      expect(PasswordUtils.getPasswordStrengthDescription(95)).toBe('Strong');
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password with default length', () => {
      const password = PasswordUtils.generateSecurePassword();
      expect(password).toHaveLength(12);
    });

    it('should generate password with specified length', () => {
      const length = 16;
      const password = PasswordUtils.generateSecurePassword(length);
      expect(password).toHaveLength(length);
    });

    it('should generate password that meets strength requirements', () => {
      const password = PasswordUtils.generateSecurePassword(12);
      const validation = PasswordUtils.validatePasswordStrength(password);
      
      expect(validation.isValid).toBe(true);
    });
  });
});