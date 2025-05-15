// src/modules/users/services/userService.ts
import apiClient from '../../../shared/api';
import { API_ROUTES } from '../../../shared/constants';
import type { User, ApiResponse } from '../../../shared/types';

/**
 * Serwis do zarządzania danymi użytkowników
 */
class UserService {
  /**
   * Pobierz profil zalogowanego użytkownika
   */
  async getCurrentUserProfile(): Promise<ApiResponse<User>> {
    return await apiClient.get<User>(API_ROUTES.USERS.ME);
  }

  /**
   * Pobierz profil użytkownika po ID
   */
  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    return await apiClient.get<User>(API_ROUTES.USERS.BY_ID(userId));
  }

  /**
   * Aktualizuj profil użytkownika
   */
  async updateUserProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return await apiClient.put<User>(API_ROUTES.USERS.ME, userData);
  }

  /**
   * Prześlij zdjęcie profilowe
   */
  async uploadAvatar(file: File): Promise<ApiResponse<User>> {
    return await apiClient.uploadFile<User>(API_ROUTES.USERS.AVATAR, file, 'avatar');
  }
}

export default new UserService();