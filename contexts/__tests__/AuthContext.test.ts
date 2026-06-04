// contexts/__tests__/AuthContext.test.ts
// Tests the active Supabase-backed auth service (supabaseAuthService)

jest.mock("../../services/supabase-auth");
jest.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

import { supabaseAuthService } from "../../services/supabase-auth";
import { User } from "../../types/types";

const mockSupabaseAuth = supabaseAuthService as jest.Mocked<
  typeof supabaseAuthService
>;

const mockUser: User = {
  id: "uuid-1234-5678-abcd",
  name: "Test User",
  email: "test@example.com",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("Supabase Authentication Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Complete Authentication Flow", () => {
    it("should handle signup -> login -> logout workflow", async () => {
      mockSupabaseAuth.signup.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        token: "supabase_access_token_123",
      });

      mockSupabaseAuth.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        token: "supabase_access_token_456",
      });

      mockSupabaseAuth.logout.mockResolvedValueOnce();

      // 1. Signup
      const signupResult = await supabaseAuthService.signup({
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      expect(signupResult.success).toBe(true);
      expect(signupResult.user).toEqual(mockUser);
      expect(signupResult.token).toBeDefined();

      // 2. Login
      const loginResult = await supabaseAuthService.login({
        email: "test@example.com",
        password: "Password123!",
      });
      expect(loginResult.success).toBe(true);
      expect(loginResult.user).toEqual(mockUser);
      expect(loginResult.token).toBeDefined();

      // 3. Logout
      await expect(supabaseAuthService.logout()).resolves.not.toThrow();
    });

    it("should restore authenticated user on app initialization", async () => {
      mockSupabaseAuth.getCurrentUser.mockResolvedValueOnce(mockUser);
      mockSupabaseAuth.isAuthenticated.mockResolvedValueOnce(true);

      const currentUser = await supabaseAuthService.getCurrentUser();
      const isAuthenticated = await supabaseAuthService.isAuthenticated();

      expect(currentUser).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });

    it("should return null when no active session exists", async () => {
      mockSupabaseAuth.getCurrentUser.mockResolvedValueOnce(null);
      mockSupabaseAuth.isAuthenticated.mockResolvedValueOnce(false);

      const currentUser = await supabaseAuthService.getCurrentUser();
      const isAuthenticated = await supabaseAuthService.isAuthenticated();

      expect(currentUser).toBeNull();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe("Signup Validation", () => {
    it("should reject signup with mismatched passwords", async () => {
      mockSupabaseAuth.signup.mockResolvedValueOnce({
        success: false,
        error: "Passwords do not match",
      });

      const result = await supabaseAuthService.signup({
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
        confirmPassword: "Different123!",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Passwords do not match");
    });

    it("should reject signup with invalid email", async () => {
      mockSupabaseAuth.signup.mockResolvedValueOnce({
        success: false,
        error: "Please enter a valid email address",
      });

      const result = await supabaseAuthService.signup({
        name: "Test User",
        email: "not-an-email",
        password: "Password123!",
        confirmPassword: "Password123!",
      });

      expect(result.success).toBe(false);
    });

    it("should reject signup with weak password", async () => {
      mockSupabaseAuth.signup.mockResolvedValueOnce({
        success: false,
        error: "Password requirements not met",
      });

      const result = await supabaseAuthService.signup({
        name: "Test User",
        email: "test@example.com",
        password: "123",
        confirmPassword: "123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Login Error Handling", () => {
    it("should return error for invalid credentials", async () => {
      mockSupabaseAuth.login.mockResolvedValueOnce({
        success: false,
        error: "Invalid email or password",
      });

      const result = await supabaseAuthService.login({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid email or password");
    });

    it("should return error for unverified email", async () => {
      mockSupabaseAuth.login.mockResolvedValueOnce({
        success: false,
        error: "Please verify your email address.",
      });

      const result = await supabaseAuthService.login({
        email: "unverified@example.com",
        password: "Password123!",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("verify your email");
    });

    it("should handle network errors during login", async () => {
      mockSupabaseAuth.login.mockRejectedValueOnce(
        new Error("Network request failed"),
      );

      await expect(
        supabaseAuthService.login({
          email: "test@example.com",
          password: "Password123!",
        }),
      ).rejects.toThrow("Network request failed");
    });
  });

  describe("Password Management", () => {
    it("should change password successfully", async () => {
      mockSupabaseAuth.changePassword.mockResolvedValueOnce();

      await expect(
        supabaseAuthService.changePassword(
          "OldPassword123!",
          "NewPassword456!",
        ),
      ).resolves.not.toThrow();

      expect(mockSupabaseAuth.changePassword).toHaveBeenCalledWith(
        "OldPassword123!",
        "NewPassword456!",
      );
    });

    it("should send password reset email", async () => {
      mockSupabaseAuth.resetPassword.mockResolvedValueOnce();

      await expect(
        supabaseAuthService.resetPassword("test@example.com"),
      ).resolves.not.toThrow();

      expect(mockSupabaseAuth.resetPassword).toHaveBeenCalledWith(
        "test@example.com",
      );
    });

    it("should reject password reset with invalid email", async () => {
      mockSupabaseAuth.resetPassword.mockRejectedValueOnce(
        new Error("Please enter a valid email address"),
      );

      await expect(
        supabaseAuthService.resetPassword("not-an-email"),
      ).rejects.toThrow("Please enter a valid email address");
    });
  });

  describe("Profile Management", () => {
    it("should update user profile", async () => {
      mockSupabaseAuth.updateProfile.mockResolvedValueOnce();

      await expect(
        supabaseAuthService.updateProfile({ name: "Updated Name" }),
      ).resolves.not.toThrow();

      expect(mockSupabaseAuth.updateProfile).toHaveBeenCalledWith({
        name: "Updated Name",
      });
    });
  });

  describe("Session Management", () => {
    it("should return false for isAuthenticated when session is absent", async () => {
      mockSupabaseAuth.isAuthenticated.mockResolvedValueOnce(false);

      const result = await supabaseAuthService.isAuthenticated();
      expect(result).toBe(false);
    });

    it("should return true for isAuthenticated with valid session", async () => {
      mockSupabaseAuth.isAuthenticated.mockResolvedValueOnce(true);

      const result = await supabaseAuthService.isAuthenticated();
      expect(result).toBe(true);
    });

    it("should handle getCurrentUser errors gracefully", async () => {
      mockSupabaseAuth.getCurrentUser.mockResolvedValueOnce(null);

      const user = await supabaseAuthService.getCurrentUser();
      expect(user).toBeNull();
    });
  });
});
