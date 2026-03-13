import * as Crypto from "expo-crypto";
import {
  AuthResult,
  LoginCredentials,
  SessionData,
  SignupData,
  User,
  UserProfile,
} from "../types/types";
import { PasswordUtils } from "../utils/password";
import { storageManager } from "./storage";

export class AuthService {
  private static readonly SESSION_DURATION_HOURS = 24 * 7; // 7 days

  /**
   * Creates a new user account with validation and secure storage
   */
  async signup(userData: SignupData): Promise<AuthResult> {
    try {
      // Validate input data
      const validationResult = this.validateSignupData(userData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(", "),
        };
      }

      // Check if user already exists
      const existingUser = await this.findUserByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: "An account with this email already exists",
        };
      }

      // Hash password
      const { hash, salt } = await PasswordUtils.hashPassword(
        userData.password
      );

      // Create user profile
      const userId = this.generateUserId();
      const now = new Date();
      const userProfile: UserProfile = {
        id: userId,
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        hashedPassword: hash,
        salt: salt,
        createdAt: now,
        updatedAt: now,
      };

      // Store user data
      const user: User = {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
      };

      await storageManager.storeUser(user);
      await storageManager.storeCredentials({
        hashedPassword: hash,
        salt: salt,
      });

      // Create session
      const sessionToken = await this.createSession(userId);

      return {
        success: true,
        user: user,
        token: sessionToken,
      };
    } catch (error) {
      return {
        success: false,
        error: `Signup failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Authenticates user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: "Email and password are required",
        };
      }

      // Get stored user data
      const user = await storageManager.getUser();
      if (
        !user ||
        user.email.toLowerCase() !== credentials.email.toLowerCase().trim()
      ) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      // Get stored credentials
      const storedCredentials = await storageManager.getCredentials();
      if (!storedCredentials) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.verifyPassword(
        credentials.password,
        storedCredentials.hashedPassword,
        storedCredentials.salt
      );

      if (!isPasswordValid) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      // Update last login time
      const updatedUser = {
        ...user,
        updatedAt: new Date(),
      };
      await storageManager.storeUser(updatedUser);

      // Create session
      const sessionToken = await this.createSession(user.id);

      return {
        success: true,
        user: updatedUser,
        token: sessionToken,
      };
    } catch (error) {
      return {
        success: false,
        error: `Login failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Logs out the current user and clears session data
   */
  async logout(): Promise<void> {
    try {
      await storageManager.clearSession();
    } catch (error) {
      throw new Error(
        `Logout failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Creates a new session for the user
   */
  private async createSession(userId: string): Promise<string> {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setHours(
      expiresAt.getHours() + AuthService.SESSION_DURATION_HOURS
    );

    const sessionData: SessionData = {
      userId,
      token: sessionToken,
      expiresAt,
      createdAt: new Date(),
    };

    await storageManager.storeSession(sessionData);
    return sessionToken;
  }

  /**
   * Validates the current session
   */
  private async validateSession(): Promise<SessionData | null> {
    try {
      const session = await storageManager.getSession();
      if (!session) {
        return null;
      }

      // Check if session has expired
      if (session.expiresAt <= new Date()) {
        await storageManager.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      return null;
    }
  }

  /**
   * Destroys the current session
   */
  private async destroySession(): Promise<void> {
    await storageManager.clearSession();
  }

  /**
   * Validates signup data
   */
  private validateSignupData(userData: SignupData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate name
    if (!userData.name || userData.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }

    // Validate email
    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.push("Please enter a valid email address");
    }

    // Validate password
    const passwordValidation = PasswordUtils.validatePasswordStrength(
      userData.password
    );
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Validate password confirmation
    if (userData.password !== userData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Finds user by email (simulated - in real app this would query a database)
   */
  private async findUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await storageManager.getUser();
      if (user && user.email.toLowerCase() === email.toLowerCase().trim()) {
        return user;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generates a unique user ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a cryptographically secure session token
   */
  private generateSessionToken(): string {
    const bytes = Crypto.getRandomBytes(32);
    // Convert to hex
    const hex = Array.from(new Uint8Array(bytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `session_${hex}`;
  }

  /**
   * Resets user password with secure reset mechanism
   */
  async resetPassword(email: string): Promise<void> {
    try {
      // Validate email format
      if (!email || !this.isValidEmail(email)) {
        throw new Error("Please enter a valid email address");
      }

      // Check if user exists
      const user = await this.findUserByEmail(email);
      if (!user) {
        // For security, don't reveal if email exists or not
        // In a real app, this would send a reset email
        return;
      }

      // Generate a secure temporary password
      const temporaryPassword = PasswordUtils.generateSecurePassword(12);

      // Hash the temporary password
      const { hash, salt } = await PasswordUtils.hashPassword(
        temporaryPassword
      );

      // Update stored credentials
      await storageManager.storeCredentials({
        hashedPassword: hash,
        salt: salt,
      });

      // In a real app, you would send the temporary password via email
      // TODO: Implement email service to send temporary password

      // Clear any existing sessions for security (but keep credentials)
      await storageManager.clearSession();
    } catch (error) {
      throw new Error(
        `Password reset failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Changes user password with current password verification
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Validate inputs
      if (!currentPassword || !newPassword) {
        throw new Error("Current password and new password are required");
      }

      // Validate new password strength
      const passwordValidation =
        PasswordUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(
          `Password requirements not met: ${passwordValidation.errors.join(
            ", "
          )}`
        );
      }

      // Get current user and credentials
      const user = await storageManager.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      const storedCredentials = await storageManager.getCredentials();
      if (!storedCredentials) {
        throw new Error("User credentials not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await PasswordUtils.verifyPassword(
        currentPassword,
        storedCredentials.hashedPassword,
        storedCredentials.salt
      );

      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Check if new password is different from current
      const isSamePassword = await PasswordUtils.verifyPassword(
        newPassword,
        storedCredentials.hashedPassword,
        storedCredentials.salt
      );

      if (isSamePassword) {
        throw new Error("New password must be different from current password");
      }

      // Hash new password
      const { hash, salt } = await PasswordUtils.hashPassword(newPassword);

      // Update stored credentials
      await storageManager.storeCredentials({
        hashedPassword: hash,
        salt: salt,
      });

      // Update user's updatedAt timestamp
      await storageManager.updateUser({
        updatedAt: new Date(),
      });
    } catch (error) {
      throw new Error(
        `Password change failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Gets the currently authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      // Validate session first
      const session = await this.validateSession();
      if (!session) {
        return null;
      }

      // Get user data
      const user = await storageManager.getUser();
      if (!user || user.id !== session.userId) {
        // Session user ID doesn't match stored user, clear session
        await this.destroySession();
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Checks if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.validateSession();
      return session !== null;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();
