import * as Crypto from 'expo-crypto';

export class EncryptionUtils {
  private static readonly ENCRYPTION_KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;

  /**
   * Generates a random encryption key
   */
  static generateKey(): string {
    const bytes = Crypto.getRandomBytes(this.ENCRYPTION_KEY_LENGTH);
    // Convert to base64 for consistent string representation
    return btoa(String.fromCharCode(...new Uint8Array(bytes)));
  }

  /**
   * Simple XOR-based encryption for basic data protection
   * Note: This is a basic implementation. For production, consider using more robust encryption
   */
  static async encrypt(data: string, key?: string): Promise<string> {
    try {
      const encryptionKey = key || this.generateKey();
      const dataBytes = new TextEncoder().encode(data);
      const keyBytes = new TextEncoder().encode(encryptionKey);
      
      const encrypted = new Uint8Array(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...encrypted));
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypts data encrypted with the encrypt method
   */
  static async decrypt(encryptedData: string, key: string): Promise<string> {
    try {
      // Decode from base64
      const encrypted = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const keyBytes = new TextEncoder().encode(key);
      const decrypted = new Uint8Array(encrypted.length);
      
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
      }
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Generates a hash of the input data using SHA-256
   */
  static async hash(data: string): Promise<string> {
    try {
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data
      );
    } catch (error) {
      throw new Error(`Hashing failed: ${error}`);
    }
  }

  /**
   * Generates a random salt for password hashing
   */
  static generateSalt(): string {
    const bytes = Crypto.getRandomBytes(16);
    // Convert to base64 for consistent string representation
    return btoa(String.fromCharCode(...new Uint8Array(bytes)));
  }
}