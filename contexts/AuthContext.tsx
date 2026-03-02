import { ErrorHandler, RetryHandler } from '../utils/errorHandling';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseAuthService } from '../services/supabase-auth';
import { User } from '../types/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Helper: convert Supabase user → your app's User shape
const mapSupabaseUser = (supabaseUser: any): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email ?? '',
  name: supabaseUser.user_metadata?.full_name ?? '',
  createdAt: supabaseUser.created_at,
  updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
});

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const currentUser = await RetryHandler.withRetry(
          () => supabaseAuthService.getCurrentUser(),
          2,
          500
        );
        setUser(currentUser);
      } catch (error) {
        const appError = ErrorHandler.mapError(error);
        ErrorHandler.logError(appError, 'AuthContext.initializeAuth');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const currentUser = await supabaseAuthService.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            console.error('Error fetching user on sign in:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          try {
            const currentUser = await supabaseAuthService.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            console.error('Error fetching user on token refresh:', error);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const result = await supabaseAuthService.login({ email, password });
      
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        const error = new Error(result.error || 'Login failed');
        const appError = ErrorHandler.mapError(error);
        ErrorHandler.logError(appError, 'AuthContext.login');
        throw error;
      }
    } catch (error) {
      setUser(null);
      const appError = ErrorHandler.mapError(error);
      ErrorHandler.logError(appError, 'AuthContext.login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const result = await supabaseAuthService.signup({ 
        name, 
        email, 
        password, 
        confirmPassword: password 
      });
      
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        const error = new Error(result.error || 'Signup failed');
        const appError = ErrorHandler.mapError(error);
        ErrorHandler.logError(appError, 'AuthContext.signup');
        throw error;
      }
    } catch (error) {
      setUser(null);
      const appError = ErrorHandler.mapError(error);
      ErrorHandler.logError(appError, 'AuthContext.signup');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await supabaseAuthService.logout();
      setUser(null);
    } catch (error) {
      const appError = ErrorHandler.mapError(error);
      ErrorHandler.logError(appError, 'AuthContext.logout');
      // Even if logout fails, clear local state
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await RetryHandler.withRetry(
        () => supabaseAuthService.getCurrentUser(),
        1, // Max 1 retry for refresh
        1000 // 1s delay
      );
      setUser(currentUser);
    } catch (error) {
      const appError = ErrorHandler.mapError(error);
      ErrorHandler.logError(appError, 'AuthContext.refreshUser');
      setUser(null);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };