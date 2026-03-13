import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { EncryptedCredentials, SessionData, User } from "../types/types";
import { EncryptionUtils } from "../utils/encryption";

export class StorageManager {
  private static readonly STORAGE_KEYS = {
    USER_DATA: "user_data",
    CREDENTIALS: "user_credentials",
    SESSION: "user_session",
    ENCRYPTION_KEY: "encryption_key",
  };

  /**
   * Gets or creates an encryption key for data protection
   */
  private async getEncryptionKey(): Promise<string> {
    try {
      let key = await SecureStore.getItemAsync(
        StorageManager.STORAGE_KEYS.ENCRYPTION_KEY
      );
      if (!key) {
        key = EncryptionUtils.generateKey();
        await SecureStore.setItemAsync(
          StorageManager.STORAGE_KEYS.ENCRYPTION_KEY,
          key
        );
      }
      return key;
    } catch (error) {
      throw new Error(`Failed to get encryption key: ${error}`);
    }
  }

  /**
   * Stores user data securely
   */
  async storeUser(user: User): Promise<void> {
    try {
      const userData = JSON.stringify({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
      await AsyncStorage.setItem(
        StorageManager.STORAGE_KEYS.USER_DATA,
        userData
      );
    } catch (error) {
      throw new Error(`Failed to store user data: ${error}`);
    }
  }

  /**
   * Retrieves user data
   */
  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(
        StorageManager.STORAGE_KEYS.USER_DATA
      );
      if (!userData) {
        return null;
      }

      const parsedData = JSON.parse(userData);

      return {
        ...parsedData,
        createdAt: new Date(parsedData.createdAt),
        updatedAt: new Date(parsedData.updatedAt),
      };
    } catch (error) {
      console.warn("Failed to retrieve user data:", error);
      return null;
    }
  }

  /**
   * Stores encrypted credentials in secure storage
   */
  async storeCredentials(credentials: EncryptedCredentials): Promise<void> {
    try {
      const credentialsData = JSON.stringify(credentials);
      await SecureStore.setItemAsync(
        StorageManager.STORAGE_KEYS.CREDENTIALS,
        credentialsData
      );
    } catch (error) {
      throw new Error(`Failed to store credentials: ${error}`);
    }
  }

  /**
   * Retrieves encrypted credentials from secure storage
   */
  async getCredentials(): Promise<EncryptedCredentials | null> {
    try {
      const credentialsData = await SecureStore.getItemAsync(
        StorageManager.STORAGE_KEYS.CREDENTIALS
      );
      if (!credentialsData) {
        return null;
      }
      return JSON.parse(credentialsData);
    } catch (error) {
      console.warn("Failed to retrieve credentials:", error);
      return null;
    }
  }

  /**
   * Stores session data
   */
  async storeSession(sessionData: SessionData): Promise<void> {
    try {
      const sessionJson = JSON.stringify({
        ...sessionData,
        expiresAt: sessionData.expiresAt.toISOString(),
        createdAt: sessionData.createdAt.toISOString(),
      });
      await AsyncStorage.setItem(
        StorageManager.STORAGE_KEYS.SESSION,
        sessionJson
      );
    } catch (error) {
      throw new Error(`Failed to store session data: ${error}`);
    }
  }

  /**
   * Retrieves session data
   */
  async getSession(): Promise<SessionData | null> {
    try {
      const sessionJson = await AsyncStorage.getItem(
        StorageManager.STORAGE_KEYS.SESSION
      );
      if (!sessionJson) {
        return null;
      }

      const sessionData = JSON.parse(sessionJson);

      return {
        ...sessionData,
        expiresAt: new Date(sessionData.expiresAt),
        createdAt: new Date(sessionData.createdAt),
      };
    } catch (error) {
      console.warn("Failed to retrieve session data:", error);
      return null;
    }
  }

  /**
   * Clears only the session data (used on logout)
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageManager.STORAGE_KEYS.SESSION);
    } catch (error) {
      throw new Error(`Failed to clear session: ${error}`);
    }
  }

  /**
   * Clears only the user data
   */
  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageManager.STORAGE_KEYS.USER_DATA);
    } catch (error) {
      throw new Error(`Failed to clear user: ${error}`);
    }
  }

  /**
   * Clears only the credentials
   */
  async clearCredentials(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(
        StorageManager.STORAGE_KEYS.CREDENTIALS
      );
    } catch (error) {
      throw new Error(`Failed to clear credentials: ${error}`);
    }
  }

  /**
   * Clears all user-related data from storage (only use for account deletion)
   */
  async clearUserData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(StorageManager.STORAGE_KEYS.USER_DATA),
        AsyncStorage.removeItem(StorageManager.STORAGE_KEYS.SESSION),
        SecureStore.deleteItemAsync(StorageManager.STORAGE_KEYS.CREDENTIALS),
      ]);
    } catch (error) {
      throw new Error(`Failed to clear user data: ${error}`);
    }
  }

  /**
   * Checks if session data exists and is valid
   */
  async hasValidSession(): Promise<boolean> {
    try {
      const session = await this.getSession();
      if (!session) {
        return false;
      }

      // Check if session has expired
      return session.expiresAt > new Date();
    } catch (error) {
      return false;
    }
  }

  /**
   * Updates user data by merging with existing data
   */
  async updateUser(updates: Partial<User>): Promise<void> {
    try {
      const existingUser = await this.getUser();
      if (!existingUser) {
        throw new Error("No user data found to update");
      }

      const updatedUser: User = {
        ...existingUser,
        ...updates,
        updatedAt: new Date(),
      };

      await this.storeUser(updatedUser);
    } catch (error) {
      throw new Error(`Failed to update user data: ${error}`);
    }
  }
}

export const storageManager = new StorageManager();
