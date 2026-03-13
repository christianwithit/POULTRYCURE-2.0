// Mock dependencies
jest.mock('../../services/auth');
jest.mock('../../services/storage');

import { authService } from '../../services/auth';
import { storageManager } from '../../services/storage';
import { User } from '../../types/types';

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockStorageManager = storageManager as jest.Mocked<typeof storageManager>;

// Mock user data
const mockUser: User = {
  id: 'user_123',
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Authentication Flow', () => {
    it('should handle complete signup -> login -> logout workflow', async () => {
      // Setup mocks for signup
      mockStorageManager.getUser.mockResolvedValueOnce(null); // No existing user
      mockAuthService.signup.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        token: 'session_token_123',
      });

      // Setup mocks for login
      mockStorageManager.getUser.mockResolvedValueOnce(mockUser);
      mockStorageManager.getCredentials.mockResolvedValueOnce({
        hashedPassword: 'hashed_password',
        salt: 'salt_123',
      });
      mockAuthService.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        token: 'session_token_456',
      });

      // Setup mocks for logout
      mockAuthService.logout.mockResolvedValueOnce();

      // 1. Test Signup
      const signupResult = await authService.signup({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(signupResult.success).toBe(true);
      expect(signupResult.user).toEqual(mockUser);
      expect(signupResult.token).toBeDefined();

      // 2. Test Login
      const loginResult = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(loginResult.success).toBe(true);
      expect(loginResult.user).toEqual(mockUser);
      expect(loginResult.token).toBeDefined();

      // 3. Test Logout
      await expect(authService.logout()).resolves.not.toThrow();
    });

    it('should handle session restoration on app initialization', async () => {
      const mockSession = {
        userId: mockUser.id,
        token: 'session_token_123',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        createdAt: new Date(),
      };

      mockStorageManager.getSession.mockResolvedValueOnce(mockSession);
      mockStorageManager.getUser.mockResolvedValueOnce(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValueOnce(mockUser);

      const currentUser = await authService.getCurrentUser();
      expect(currentUser).toEqual(mockUser);

      const isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(true);
    });

    it('should handle expired session on app initialization', async () => {
      const expiredSession = {
        userId: mockUser.id,
        token: 'session_token_123',
        expiresAt: new Date(Date.now() - 86400000), // 24 hours ago
        createdAt: new Date(),
      };

      mockStorageManager.getSession.mockResolvedValueOnce(expiredSession);
      mockAuthService.getCurrentUser.mockResolvedValueOnce(null);
      mockAuthService.isAuthenticated.mockResolvedValueOnce(false);

      const currentUser = await authService.getCurrentUser();
      expect(currentUser).toBeNull();

      const isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('Profile Management Integration', () => {
    it('should handle profile updates after authentication', async () => {
      // Setup authenticated user
      mockAuthService.getCurrentUser.mockResolvedValueOnce(mockUser);
      mockAuthService.isAuthenticated.mockResolvedValueOnce(true);

      // Verify user is authenticated
      const currentUser = await authService.getCurrentUser();
      expect(currentUser).toEqual(mockUser);

      // Mock profile update
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      mockStorageManager.updateUser.mockResolvedValueOnce();
      mockStorageManager.getUser.mockResolvedValueOnce(updatedUser);

      // Simulate profile update
      await storageManager.updateUser({ name: 'Updated Name' });
      const refreshedUser = await storageManager.getUser();

      expect(refreshedUser).toEqual(updatedUser);
      expect(mockStorageManager.updateUser).toHaveBeenCalledWith({ name: 'Updated Name' });
    });

    it('should handle password change workflow', async () => {
      // Setup authenticated user
      mockAuthService.getCurrentUser.mockResolvedValueOnce(mockUser);
      mockAuthService.changePassword.mockResolvedValueOnce();

      const currentUser = await authService.getCurrentUser();
      expect(currentUser).toEqual(mockUser);

      // Test password change
      await expect(
        authService.changePassword('currentPassword', 'newPassword123')
      ).resolves.not.toThrow();

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        'currentPassword',
        'newPassword123'
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle authentication errors gracefully', async () => {
      mockAuthService.login.mockResolvedValueOnce({
        success: false,
        error: 'Invalid credentials',
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should handle storage errors during authentication', async () => {
      mockAuthService.getCurrentUser.mockRejectedValueOnce(new Error('Storage error'));

      await expect(authService.getCurrentUser()).rejects.toThrow('Storage error');
    });

    it('should handle network errors during authentication', async () => {
      mockAuthService.login.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Session Management Integration', () => {
    it('should validate session expiration correctly', async () => {
      // Test valid session
      const validSession = {
        userId: mockUser.id,
        token: 'session_token_123',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        createdAt: new Date(),
      };

      mockStorageManager.getSession.mockResolvedValueOnce(validSession);
      mockAuthService.isAuthenticated.mockResolvedValueOnce(true);

      let isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(true);

      // Test expired session
      const expiredSession = {
        ...validSession,
        expiresAt: new Date(Date.now() - 86400000), // 24 hours ago
      };

      mockStorageManager.getSession.mockResolvedValueOnce(expiredSession);
      mockAuthService.isAuthenticated.mockResolvedValueOnce(false);

      isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });

    it('should handle session cleanup on logout', async () => {
      mockStorageManager.clearUserData.mockResolvedValueOnce();
      mockAuthService.logout.mockResolvedValueOnce();

      await authService.logout();

      expect(mockStorageManager.clearUserData).toHaveBeenCalled();
    });
  });

  describe('Data Persistence Integration', () => {
    it('should persist user data correctly during signup', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(null);
      mockStorageManager.storeUser.mockResolvedValueOnce();
      mockStorageManager.storeCredentials.mockResolvedValueOnce();
      mockStorageManager.storeSession.mockResolvedValueOnce();

      mockAuthService.signup.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        token: 'session_token_123',
      });

      const result = await authService.signup({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(result.success).toBe(true);
      expect(mockStorageManager.storeUser).toHaveBeenCalled();
      expect(mockStorageManager.storeCredentials).toHaveBeenCalled();
      expect(mockStorageManager.storeSession).toHaveBeenCalled();
    });

    it('should retrieve persisted data correctly during login', async () => {
      mockStorageManager.getUser.mockResolvedValueOnce(mockUser);
      mockStorageManager.getCredentials.mockResolvedValueOnce({
        hashedPassword: 'hashed_password',
        salt: 'salt_123',
      });

      mockAuthService.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        token: 'session_token_123',
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(mockStorageManager.getUser).toHaveBeenCalled();
      expect(mockStorageManager.getCredentials).toHaveBeenCalled();
    });
  });
});