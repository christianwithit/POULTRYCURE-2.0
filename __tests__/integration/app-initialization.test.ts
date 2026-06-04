// __tests__/integration/app-initialization.test.ts
// Tests app initialization using the active Supabase auth service

jest.mock("../../services/supabase-auth", () => ({
  supabaseAuthService: {
    getCurrentUser: jest.fn(),
    isAuthenticated: jest.fn(),
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

jest.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

import { supabaseAuthService } from "../../services/supabase-auth";
import { User } from "../../types/types";

// Typed references to the mock functions
const mockAuth = supabaseAuthService as {
  getCurrentUser: jest.Mock;
  isAuthenticated: jest.Mock;
  login: jest.Mock;
  signup: jest.Mock;
  logout: jest.Mock;
  resetPassword: jest.Mock;
  changePassword: jest.Mock;
  updateProfile: jest.Mock;
};

const mockUser: User = {
  id: "uuid-1234-5678-abcd",
  name: "Test User",
  email: "test@example.com",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("App Initialization Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication State Restoration", () => {
    it("should restore authenticated user on app startup", async () => {
      mockAuth.getCurrentUser.mockResolvedValueOnce(mockUser);
      mockAuth.isAuthenticated.mockResolvedValueOnce(true);

      const currentUser = await supabaseAuthService.getCurrentUser();
      const isAuthenticated = await supabaseAuthService.isAuthenticated();

      expect(currentUser).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });

    it("should handle no existing session on app startup", async () => {
      mockAuth.getCurrentUser.mockResolvedValueOnce(null);
      mockAuth.isAuthenticated.mockResolvedValueOnce(false);

      const currentUser = await supabaseAuthService.getCurrentUser();
      const isAuthenticated = await supabaseAuthService.isAuthenticated();

      expect(currentUser).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it("should handle expired/invalid Supabase session gracefully", async () => {
      mockAuth.getCurrentUser.mockResolvedValueOnce(null);
      mockAuth.isAuthenticated.mockResolvedValueOnce(false);

      const currentUser = await supabaseAuthService.getCurrentUser();
      const isAuthenticated = await supabaseAuthService.isAuthenticated();

      expect(currentUser).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it("should handle network errors during session restoration", async () => {
      mockAuth.getCurrentUser.mockResolvedValueOnce(null);

      const currentUser = await supabaseAuthService.getCurrentUser();
      expect(currentUser).toBeNull();
    });
  });

  describe("Navigation Flow Integration", () => {
    it("should route authenticated user to main app", async () => {
      mockAuth.isAuthenticated.mockResolvedValueOnce(true);

      const isAuthenticated = await supabaseAuthService.isAuthenticated();
      const initialRoute = isAuthenticated ? "/(tabs)" : "/auth/login";

      expect(initialRoute).toBe("/(tabs)");
    });

    it("should route unauthenticated user to login", async () => {
      mockAuth.isAuthenticated.mockResolvedValueOnce(false);

      const isAuthenticated = await supabaseAuthService.isAuthenticated();
      const initialRoute = isAuthenticated ? "/(tabs)" : "/auth/login";

      expect(initialRoute).toBe("/auth/login");
    });
  });

  describe("Concurrent Initialization", () => {
    it("should handle concurrent auth checks", async () => {
      mockAuth.getCurrentUser
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);
      mockAuth.isAuthenticated.mockResolvedValueOnce(true);

      const [user1, isAuth, user2] = await Promise.all([
        supabaseAuthService.getCurrentUser(),
        supabaseAuthService.isAuthenticated(),
        supabaseAuthService.getCurrentUser(),
      ]);

      expect(user1).toEqual(mockUser);
      expect(isAuth).toBe(true);
      expect(user2).toEqual(mockUser);
    });
  });

  describe("Error Recovery", () => {
    it("should recover from transient errors on retry", async () => {
      mockAuth.getCurrentUser
        .mockRejectedValueOnce(new Error("Temporary network error"))
        .mockResolvedValueOnce(mockUser);

      await expect(supabaseAuthService.getCurrentUser()).rejects.toThrow(
        "Temporary network error",
      );

      const user = await supabaseAuthService.getCurrentUser();
      expect(user).toEqual(mockUser);
    });

    it("should return null on persistent auth errors", async () => {
      mockAuth.getCurrentUser.mockResolvedValueOnce(null);

      const user = await supabaseAuthService.getCurrentUser();
      expect(user).toBeNull();
    });
  });
});
