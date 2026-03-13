jest.mock('../storage');
jest.mock('../../utils/password');

import { EncryptedCredentials, LoginCredentials, SignupData, User } from '../../types/types';
import { PasswordUtils } from '../../utils/password';
import { AuthService } from '../auth';
import { storageManager } from '../storage';

// Get the mocked modules
const mockStorageManager = storageManager as jest.Mocked<typeof storageManager>;
const mockPasswordUtils = PasswordUtils as jest.Mocked<typeof PasswordUtils>;

describe('AuthService', () => {
  let authService: AuthService;
  
  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  const mockSignupData: SignupData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
  };

  const mockLoginCredentials: LoginCredentials = {
    email: 'test@example.com',
    password: 'SecurePass123!',
  };

  const mockCredentials: EncryptedCredentials = {
    hashedPassword: 'hashed-password-123',
    salt: 'salt-123',
  };

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockPasswordUtils.validatePasswordStrength.mockReturnValue({
      isValid: true,
      errors: [],
      requirements: [],
    });
    mockPasswordUtils.hashPassword.mockResolvedValue({
      hash: 'hashed-password-123',
      salt: 'salt-123',
    });
    mockPasswordUtils.verifyPassword.mockResolvedValue(true);
    mockPasswordUtils.generateSecurePassword.mockReturnValue('TempPass123!');
  });

  describe('signup', () => {
    it('should create new user account successfully', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(null); // No existing user
      
      const result = await authService.signup(mockSignupData);
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(mockSignupData.email.toLowerCase());
      expect(result.token).toBeDefined();
      expect(mockStorageManager.storeUser).toHaveBeenCalled();
      expect(mockStorageManager.storeCredentials).toHaveBeenCalled();
      expect(mockStorageManager.storeSession).toHaveBeenCalled();
    });

    it('should fail if user already exists', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(mockUser);
      
      const result = await authService.signup(mockSignupData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should fail with invalid password', async () => {
      mockPasswordUtils.validatePasswordStrength.mockReturnValueOnce({
        isValid: false,
        errors: ['Password too weak'],
        requirements: [],
      });
      
      const result = await authService.signup(mockSignupData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Password too weak');
    });

    it('should fail when passwords do not match', async () => {
      const invalidSignupData = {
        ...mockSignupData,
        confirmPassword: 'DifferentPassword123!',
      };
      
      const result = await authService.signup(invalidSignupData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Passwords do not match');
    });

    it('should fail with invalid email format', async () => {
      const invalidSignupData = {
        ...mockSignupData,
        email: 'invalid-email',
      };
      
      const result = await authService.signup(invalidSignupData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('valid email address');
    });
  });

  describe('login', () => {
    it('should authenticate user successfully', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(mockUser);
      mockStorageManager.getCredentials.mockResolvedValueOnce(mockCredentials);
      
      const result = await authService.login(mockLoginCredentials);
      
      expect(result.success).toBe(true);
      expect(result.user).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
      }));
      expect(result.token).toBeDefined();
      expect(mockPasswordUtils.verifyPassword).toHaveBeenCalledWith(
        mockLoginCredentials.password,
        mockCredentials.hashedPassword,
        mockCredentials.salt
      );
    });

    it('should fail with invalid email', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(null);
      
      const result = await authService.login(mockLoginCredentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email or password');
    });

    it('should fail with invalid password', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(mockUser);
      mockStorageManager.getCredentials.mockResolvedValueOnce(mockCredentials);
      mockPasswordUtils.verifyPassword.mockResolvedValueOnce(false);
      
      const result = await authService.login(mockLoginCredentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email or password');
    });

    it('should fail when credentials not found', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(mockUser);
      mockStorageManager.getCredentials.mockResolvedValueOnce(null);
      
      const result = await authService.login(mockLoginCredentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('should clear user data successfully', async () => {
      await authService.logout();
      
      expect(mockStorageManager.clearUserData).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(mockUser);
      mockStorageManager.getCredentials.mockResolvedValueOnce(mockCredentials);
      mockPasswordUtils.verifyPassword
        .mockResolvedValueOnce(true)  // Current password verification
        .mockResolvedValueOnce(false); // New password is different
      
      await authService.changePassword('currentPass', 'NewSecurePass123!');
      
      expect(mockPasswordUtils.verifyPassword).toHaveBeenCalledTimes(2);
      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith('NewSecurePass123!');
      expect(mockStorageManager.storeCredentials).toHaveBeenCalled();
      expect(mockStorageManager.updateUser).toHaveBeenCalled();
    });

    it('should fail with incorrect current password', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(mockUser);
      mockStorageManager.getCredentials.mockResolvedValueOnce(mockCredentials);
      mockPasswordUtils.verifyPassword.mockResolvedValueOnce(false);
      
      await expect(authService.changePassword('wrongPass', 'NewSecurePass123!'))
        .rejects.toThrow('Current password is incorrect');
    });

    it('should fail when new password is same as current', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(mockUser);
      mockStorageManager.getCredentials.mockResolvedValueOnce(mockCredentials);
      mockPasswordUtils.verifyPassword
        .mockResolvedValueOnce(true)  // Current password verification
        .mockResolvedValueOnce(true); // New password is same
      
      await expect(authService.changePassword('currentPass', 'currentPass'))
        .rejects.toThrow('New password must be different');
    });

    it('should fail with weak new password', async () => {
      mockPasswordUtils.validatePasswordStrength.mockReturnValueOnce({
        isValid: false,
        errors: ['Password too weak'],
        requirements: [],
      });
      
      await expect(authService.changePassword('currentPass', 'weak'))
        .rejects.toThrow('Password requirements not met');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(mockUser);
      
      await authService.resetPassword('test@example.com');
      
      expect(mockPasswordUtils.generateSecurePassword).toHaveBeenCalled();
      expect(mockPasswordUtils.hashPassword).toHaveBeenCalled();
      expect(mockStorageManager.storeCredentials).toHaveBeenCalled();
    });

    it('should fail with invalid email format', async () => {
      await expect(authService.resetPassword('invalid-email'))
        .rejects.toThrow('valid email address');
    });

    it('should not reveal if email exists or not', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(null);
      
      // Should not throw error even if user doesn't exist
      await expect(authService.resetPassword('nonexistent@example.com'))
        .resolves.not.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      const mockSession = {
        userId: mockUser.id,
        token: 'session-token',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        createdAt: new Date(),
      };
      
      mockStorageManager.getSession.mockResolvedValueOnce(mockSession);
      mockStorageManager.getUser.mockResolvedValueOnce(mockUser);
      
      const result = await authService.getCurrentUser();
      
      expect(result).toEqual(mockUser);
    });

    it('should return null when session expired', async () => {
      const expiredSession = {
        userId: mockUser.id,
        token: 'session-token',
        expiresAt: new Date(Date.now() - 86400000), // 24 hours ago
        createdAt: new Date(),
      };
      
      mockStorageManager.getSession.mockResolvedValueOnce(expiredSession);
      
      const result = await authService.getCurrentUser();
      
      expect(result).toBeNull();
    });

    it('should return null when no session exists', async () => {
      mockStorageManager.getSession.mockResolvedValueOnce(null);
      
      const result = await authService.getCurrentUser();
      
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      const validSession = {
        userId: mockUser.id,
        token: 'session-token',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        createdAt: new Date(),
      };
      
      mockStorageManager.getSession.mockResolvedValueOnce(validSession);
      
      const result = await authService.isAuthenticated();
      
      expect(result).toBe(true);
    });

    it('should return false when session expired', async () => {
      const expiredSession = {
        userId: mockUser.id,
        token: 'session-token',
        expiresAt: new Date(Date.now() - 86400000), // 24 hours ago
        createdAt: new Date(),
      };
      
      mockStorageManager.getSession.mockResolvedValueOnce(expiredSession);
      
      const result = await authService.isAuthenticated();
      
      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      mockStorageManager.getSession.mockResolvedValueOnce(null);
      
      const result = await authService.isAuthenticated();
      
      expect(result).toBe(false);
    });
  });
});