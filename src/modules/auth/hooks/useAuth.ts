// src/modules/auth/hooks/useAuth.ts
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest, RegisterRequest } from '../../../shared/types';

/**
 * Custom hook for authentication functionality
 * Provides access to authentication state and methods
 */
export const useAuth = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error,
    login,
    register,
    logout,
    refreshToken,
    checkSession,
    clearError
  } = useAuthStore();

  // Check the user's session on initial load
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkSession();
    }
  }, [isAuthenticated, isLoading, checkSession]);

  // Login handler with appropriate typing
  const handleLogin = async (credentials: LoginRequest): Promise<boolean> => {
    return await login(credentials);
  };

  // Register handler with appropriate typing
  const handleRegister = async (userData: RegisterRequest): Promise<boolean> => {
    return await register(userData);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout,
    refreshToken,
    clearError
  };
};

export default useAuth;