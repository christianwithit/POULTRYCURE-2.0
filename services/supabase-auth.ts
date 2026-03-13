import { supabase } from '../lib/supabase';
import {
  AuthResult,
  LoginCredentials,
  SignupData,
  User,
} from '../types/types';
import { PasswordUtils } from '../utils/password';

export class SupabaseAuthService {
  async signup(userData: SignupData): Promise<AuthResult> {
    try {
      const validationResult = this.validateSignupData(userData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', '),
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        options: {
          data: {
            name: userData.name.trim(),
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: this.mapSupabaseError(error.message),
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Failed to create account',
        };
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.warn('Profile fetch error:', profileError);
      }

      const user: User = {
        id: data.user.id,
        name: profileData?.name || userData.name.trim(),
        email: data.user.email!,
        profilePhoto: profileData?.profile_photo || undefined,
        createdAt: new Date(data.user.created_at),
        updatedAt: new Date(profileData?.updated_at || data.user.created_at),
      };

      return {
        success: true,
        user: user,
        token: data.session?.access_token,
      };
    } catch (error) {
      return {
        success: false,
        error: `Signup failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: 'Email and password are required',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: this.mapSupabaseError(error.message),
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'Login failed',
        };
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.warn('Profile fetch error:', profileError);
      }

      const user: User = {
        id: data.user.id,
        name: profileData?.name || 'User',
        email: data.user.email!,
        profilePhoto: profileData?.profile_photo || undefined,
        createdAt: new Date(data.user.created_at),
        updatedAt: new Date(profileData?.updated_at || data.user.created_at),
      };

      return {
        success: true,
        user: user,
        token: data.session.access_token,
      };
    } catch (error) {
      return {
        success: false,
        error: `Login failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      throw new Error(
        `Logout failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return null;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return null;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Profile fetch error:', profileError);
      }

      return {
        id: user.id,
        name: profileData?.name || user.user_metadata?.name || 'User',
        email: user.email!,
        profilePhoto: profileData?.profile_photo || undefined,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(profileData?.updated_at || user.created_at),
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session !== null;
    } catch (error) {
      return false;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      if (!email || !this.isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'poultrycure://reset-password',
      });

      if (error) {
        throw new Error(this.mapSupabaseError(error.message));
      }
    } catch (error) {
      throw new Error(
        `Password reset failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
      }

      const passwordValidation =
        PasswordUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(
          `Password requirements not met: ${passwordValidation.errors.join(
            ', '
          )}`
        );
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(this.mapSupabaseError(error.message));
      }
    } catch (error) {
      throw new Error(
        `Password change failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async updateProfile(updates: { name?: string; profilePhoto?: string }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          profile_photo: updates.profilePhoto,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      if (updates.name) {
        await supabase.auth.updateUser({
          data: { name: updates.name },
        });
      }
    } catch (error) {
      throw new Error(
        `Profile update failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  private validateSignupData(userData: SignupData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!userData.name || userData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.push('Please enter a valid email address');
    }

    const passwordValidation = PasswordUtils.validatePasswordStrength(
      userData.password
    );
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    if (userData.password !== userData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private mapSupabaseError(errorMessage: string): string {
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Invalid email or password';
    }
    if (errorMessage.includes('Email not confirmed')) {
      return 'Please verify your email address. Check your inbox for the verification link.';
    }
    if (errorMessage.includes('User already registered')) {
      return 'An account with this email already exists';
    }
    if (errorMessage.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long';
    }
    if (errorMessage.includes('Unable to validate email address')) {
      return 'Please enter a valid email address';
    }
    if (errorMessage.includes('Email rate limit exceeded')) {
      return 'Too many requests. Please try again later.';
    }
    return errorMessage;
  }
}

export const supabaseAuthService = new SupabaseAuthService();
