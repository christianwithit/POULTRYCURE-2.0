import { EncryptionUtils } from './encryption';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  requirements: {
    text: string;
    met: boolean;
  }[];
}

export interface PasswordHashResult {
  hash: string;
  salt: string;
}

export class PasswordUtils {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;
  private static readonly HASH_ITERATIONS = 1000;

  /**
   * Generates a cryptographically secure salt for password hashing
   */
  static generateSalt(): string {
    return EncryptionUtils.generateSalt();
  }

  /**
   * Hashes a password with a salt using PBKDF2-like approach
   */
  static async hashPassword(password: string, salt?: string): Promise<PasswordHashResult> {
    try {
      const passwordSalt = salt || this.generateSalt();
      
      // Combine password and salt
      let combined = password + passwordSalt;
      
      // Apply multiple rounds of hashing for security
      for (let i = 0; i < this.HASH_ITERATIONS; i++) {
        combined = await EncryptionUtils.hash(combined);
      }
      
      return {
        hash: combined,
        salt: passwordSalt,
      };
    } catch (error) {
      throw new Error(`Password hashing failed: ${error}`);
    }
  }

  /**
   * Verifies a password against a stored hash and salt
   */
  static async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    try {
      const { hash: computedHash } = await this.hashPassword(password, salt);
      return computedHash === hash;
    } catch (error) {
      console.warn('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Validates password strength according to security requirements
   */
  static validatePasswordStrength(password: string): PasswordValidationResult {
    const errors: string[] = [];
    const requirements = [
      {
        text: `At least ${this.MIN_LENGTH} characters long`,
        met: password.length >= this.MIN_LENGTH,
      },
      {
        text: 'Contains lowercase letter',
        met: /[a-z]/.test(password),
      },
      {
        text: 'Contains uppercase letter',
        met: /[A-Z]/.test(password),
      },
      {
        text: 'Contains number',
        met: /\d/.test(password),
      },
      {
        text: 'Contains special character',
        met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      },
    ];

    // Check minimum length
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }

    // Check maximum length
    if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must not exceed ${this.MAX_LENGTH} characters`);
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak patterns
    if (this.hasCommonWeakPatterns(password)) {
      errors.push('Password contains common weak patterns');
    }

    return {
      isValid: errors.length === 0,
      errors,
      requirements,
    };
  }

  /**
   * Checks for common weak password patterns
   */
  private static hasCommonWeakPatterns(password: string): boolean {
    const weakPatterns = [
      /^(.)\1+$/, // All same character (e.g., "aaaaaaaa")
      /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i, // Sequential characters
      /^(password|123456|qwerty|admin|user|guest|test)/i, // Common passwords
    ];

    return weakPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Generates a secure random password
   */
  static generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Calculates password strength score (0-100)
   */
  static calculatePasswordStrength(password: string): number {
    let score = 0;
    
    // Length bonus
    score += Math.min(password.length * 2, 25);
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
    
    // Length bonus for longer passwords
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    
    // Penalty for weak patterns
    if (this.hasCommonWeakPatterns(password)) score -= 20;
    
    // Penalty for repeated characters
    const uniqueChars = new Set(password).size;
    if (uniqueChars < password.length * 0.7) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Gets password strength description based on score
   */
  static getPasswordStrengthDescription(score: number): string {
    if (score < 30) return 'Very Weak';
    if (score < 50) return 'Weak';
    if (score < 70) return 'Fair';
    if (score < 85) return 'Good';
    return 'Strong';
  }
}