export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  retryable: boolean;
  userMessage: string;
  technicalDetails?: string;
}

export class ErrorHandler {
  /**
   * Maps common error scenarios to user-friendly messages
   */
  static mapError(error: any): AppError {
    // Handle string errors
    if (typeof error === 'string') {
      return this.createError(ErrorType.UNKNOWN, error, error);
    }

    // Handle Error objects
    if (error instanceof Error) {
      return this.mapErrorByMessage(error.message, error);
    }

    // Handle auth service errors
    if (error && typeof error === 'object' && 'success' in error && !error.success) {
      return this.mapAuthError(error.error || 'Authentication failed');
    }

    return this.createError(ErrorType.UNKNOWN, 'An unexpected error occurred', 'Please try again');
  }

  private static mapErrorByMessage(message: string, originalError: Error): AppError {
    const lowerMessage = message.toLowerCase();

    // Supabase-specific authentication errors
    if (lowerMessage.includes('invalid login credentials')) {
      return this.createError(
        ErrorType.AUTHENTICATION,
        'Invalid email or password',
        'Please check your email and password and try again',
        false,
        'AUTH_INVALID_CREDENTIALS'
      );
    }

    if (lowerMessage.includes('email not confirmed')) {
      return this.createError(
        ErrorType.AUTHENTICATION,
        'Email not verified',
        'Please verify your email address. Check your inbox for the verification link.',
        false,
        'AUTH_EMAIL_NOT_VERIFIED'
      );
    }

    if (lowerMessage.includes('user already registered')) {
      return this.createError(
        ErrorType.VALIDATION,
        'Email already in use',
        'An account with this email already exists. Try logging in instead.',
        false,
        'AUTH_EMAIL_EXISTS'
      );
    }

    if (lowerMessage.includes('email rate limit exceeded')) {
      return this.createError(
        ErrorType.NETWORK,
        'Too many requests',
        'Too many requests. Please try again in a few minutes.',
        true,
        'AUTH_RATE_LIMIT'
      );
    }

    if (lowerMessage.includes('password should be at least')) {
      return this.createError(
        ErrorType.VALIDATION,
        'Password too short',
        'Password must be at least 6 characters long',
        false,
        'AUTH_WEAK_PASSWORD'
      );
    }

    // Authentication errors
    if (lowerMessage.includes('invalid email or password')) {
      return this.createError(
        ErrorType.AUTHENTICATION,
        message,
        'Please check your email and password and try again',
        false,
        'AUTH_INVALID_CREDENTIALS'
      );
    }

    if (lowerMessage.includes('account with this email already exists')) {
      return this.createError(
        ErrorType.VALIDATION,
        message,
        'An account with this email already exists. Try logging in instead',
        false,
        'AUTH_EMAIL_EXISTS'
      );
    }

    if (lowerMessage.includes('password does not meet security requirements')) {
      return this.createError(
        ErrorType.VALIDATION,
        message,
        'Please choose a stronger password that meets the security requirements',
        false,
        'AUTH_WEAK_PASSWORD'
      );
    }

    if (lowerMessage.includes('passwords do not match')) {
      return this.createError(
        ErrorType.VALIDATION,
        message,
        'The passwords you entered do not match. Please try again',
        false,
        'AUTH_PASSWORD_MISMATCH'
      );
    }

    if (lowerMessage.includes('current password is incorrect')) {
      return this.createError(
        ErrorType.AUTHENTICATION,
        message,
        'Your current password is incorrect. Please try again',
        false,
        'AUTH_CURRENT_PASSWORD_WRONG'
      );
    }

    // Network errors
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return this.createError(
        ErrorType.NETWORK,
        message,
        'Network connection failed. Please check your internet connection and try again',
        true,
        'NETWORK_ERROR'
      );
    }

    // Storage errors
    if (lowerMessage.includes('storage') || lowerMessage.includes('asyncstorage') || lowerMessage.includes('securestore')) {
      return this.createError(
        ErrorType.STORAGE,
        message,
        'Unable to save data. Please ensure you have sufficient storage space and try again',
        true,
        'STORAGE_ERROR'
      );
    }

    // Permission errors
    if (lowerMessage.includes('permission') || lowerMessage.includes('denied')) {
      return this.createError(
        ErrorType.PERMISSION,
        message,
        'Permission denied. Please check your device settings and try again',
        false,
        'PERMISSION_DENIED'
      );
    }

    // Validation errors
    if (lowerMessage.includes('required') || lowerMessage.includes('invalid') || lowerMessage.includes('must be')) {
      return this.createError(
        ErrorType.VALIDATION,
        message,
        message, // Use original message for validation errors
        false,
        'VALIDATION_ERROR'
      );
    }

    // Default case
    return this.createError(
      ErrorType.UNKNOWN,
      message,
      'Something went wrong. Please try again',
      true,
      'UNKNOWN_ERROR',
      originalError.stack
    );
  }

  private static mapAuthError(errorMessage: string): AppError {
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes('email') && lowerMessage.includes('password')) {
      return this.createError(
        ErrorType.AUTHENTICATION,
        errorMessage,
        'Please check your email and password and try again',
        false,
        'AUTH_INVALID_CREDENTIALS'
      );
    }

    if (lowerMessage.includes('already exists')) {
      return this.createError(
        ErrorType.VALIDATION,
        errorMessage,
        'An account with this email already exists. Try logging in instead',
        false,
        'AUTH_EMAIL_EXISTS'
      );
    }

    return this.createError(
      ErrorType.AUTHENTICATION,
      errorMessage,
      errorMessage,
      false,
      'AUTH_ERROR'
    );
  }

  private static createError(
    type: ErrorType,
    message: string,
    userMessage: string,
    retryable: boolean = false,
    code?: string,
    technicalDetails?: string
  ): AppError {
    return {
      type,
      message,
      userMessage,
      retryable,
      code,
      technicalDetails,
    };
  }

  /**
   * Determines if an error should show a retry button
   */
  static isRetryable(error: AppError): boolean {
    return error.retryable;
  }

  /**
   * Gets appropriate user message for display
   */
  static getUserMessage(error: AppError): string {
    return error.userMessage;
  }

  /**
   * Logs error for debugging purposes
   */
  static logError(error: AppError, context?: string): void {
    const logData = {
      type: error.type,
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      context,
      technicalDetails: error.technicalDetails,
      timestamp: new Date().toISOString(),
    };

    if (__DEV__) {
      console.error('App Error:', logData);
    }

    // In production, you might want to send this to a logging service
    // Example: LoggingService.logError(logData);
  }
}

/**
 * Retry mechanism for operations that can be retried
 */
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<T> {
    let lastError: any;
    let currentDelay = delayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Check if error is retryable
        const appError = ErrorHandler.mapError(error);
        if (!appError.retryable) {
          throw error;
        }

        // Wait before retrying
        await this.delay(currentDelay);
        currentDelay *= backoffMultiplier;
      }
    }

    throw lastError;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Validation error helpers
 */
export class ValidationErrorHandler {
  static formatFieldErrors(errors: Record<string, any>): string[] {
    const messages: string[] = [];

    Object.entries(errors).forEach(([field, error]) => {
      if (error?.message) {
        messages.push(error.message);
      } else if (typeof error === 'string') {
        messages.push(error);
      }
    });

    return messages;
  }

  static getFirstError(errors: Record<string, any>): string | null {
    const messages = this.formatFieldErrors(errors);
    return messages.length > 0 ? messages[0] : null;
  }
}