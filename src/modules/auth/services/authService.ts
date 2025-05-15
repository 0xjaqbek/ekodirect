// src/modules/auth/services/authService.ts
import apiClient from '../../../shared/api';
import { API_ROUTES } from '../../../shared/constants';
import type {
    LoginRequest,
    RegisterRequest,
    ApiResponse,
    User,
  } from '../../../shared/types';
// Verify the API_ROUTES values
console.log("Auth routes:", API_ROUTES.AUTH);

/**
 * Service for handling authentication-related API calls
 */
class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<{ user: User; token: string; refreshToken: string }>> {
    return await apiClient.post<{ user: User; token: string; refreshToken: string }>(
      API_ROUTES.AUTH.LOGIN,
      credentials
    );
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterRequest): Promise<ApiResponse<{ user: User }>> {
    console.log("Registering user:", userData);
    console.log("API URL:", API_ROUTES.AUTH.REGISTER);
    return await apiClient.post<{ user: User }>(
      API_ROUTES.AUTH.REGISTER,
      userData
    );
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    return await apiClient.post<{ token: string; refreshToken: string }>(
      API_ROUTES.AUTH.REFRESH_TOKEN,
      { refreshToken }
    );
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse<{ verified: boolean }>> {
    return await apiClient.post<{ verified: boolean }>(
      API_ROUTES.AUTH.VERIFY_EMAIL,
      { token }
    );
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<{ sent: boolean }>> {
    return await apiClient.post<{ sent: boolean }>(
      '/api/auth/request-password-reset',
      { email }
    );
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> {
    return await apiClient.post<{ success: boolean }>(
      '/api/auth/reset-password',
      { token, newPassword }
    );
  }
}

export default new AuthService();