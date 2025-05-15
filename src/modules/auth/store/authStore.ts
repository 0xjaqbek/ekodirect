// src/modules/auth/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../../../shared/api';
import type { User, LoginRequest, RegisterRequest } from '../../../shared/types';
import { API_ROUTES, STORAGE_KEYS } from '../../../shared/constants';

// Fix the duplicate API path issue
const fixApiPath = (path: string) => {
  // If the path starts with /api and we already have a base URL with /api, 
  // remove the duplicate
  if (path.startsWith('/api') && import.meta.env.VITE_API_URL?.includes('/api')) {
    return path.replace('/api', '');
  }
  return path;
};

// Interface for AuthState
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Authentication methods
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  checkSession: () => Promise<boolean>;
  clearError: () => void;
}

// Create the auth store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Login method
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post<{ user: User; token: string; refreshToken: string }>(
            fixApiPath(API_ROUTES.AUTH.LOGIN),
            credentials
          );
          
          if (response.success && response.data) {
            // Save tokens to localStorage
            localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
            
            // Update state
            set({ 
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false 
            });
            
            return true;
          } else {
            set({ 
              error: response.error || 'Nieprawidłowy email lub hasło',
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Błąd podczas logowania',
            isLoading: false 
          });
          return false;
        }
      },
      
      // Register method
      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post<{ user: User }>(
            fixApiPath(API_ROUTES.AUTH.REGISTER),
            userData
          );
          
          if (response.success && response.data) {
            set({ isLoading: false });
            return true;
          } else {
            set({ 
              error: response.error || 'Błąd podczas rejestracji',
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Błąd podczas rejestracji',
            isLoading: false 
          });
          return false;
        }
      },
      
      // Logout method
      logout: () => {
        // Clear tokens from localStorage
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        
        // Reset state
        set({ 
          user: null,
          isAuthenticated: false,
          error: null
        });
      },
      
      // Token refresh method
      refreshToken: async () => {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (!refreshToken) {
          get().logout();
          return false;
        }
        
        try {
          const response = await apiClient.post<{ token: string; refreshToken: string }>(
            fixApiPath(API_ROUTES.AUTH.REFRESH_TOKEN),
            { refreshToken }
          );
          
          if (response.success && response.data) {
            // Update tokens in localStorage
            localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
            
            return true;
          } else {
            get().logout();
            return false;
          }
        } catch {
          get().logout();
          return false;
        }
      },
      
      // Check user session
      checkSession: async () => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        
        if (!token) {
          return false;
        }
        
        set({ isLoading: true });
        
        try {
          // Fetch user data
          const response = await apiClient.get<User>(API_ROUTES.USERS.ME);
          
          if (response.success && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false
            });
            return true;
          } else {
            // Try to refresh token if user data fetch fails
            const refreshed = await get().refreshToken();
            
            if (refreshed) {
              return await get().checkSession();
            } else {
              get().logout();
              set({ isLoading: false });
              return false;
            }
          }
        } catch  {
          get().logout();
          set({ isLoading: false });
          return false;
        }
      },
      
      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      // Only store the user object in persisted storage
      partialize: (state) => ({ user: state.user }),
    }
  )
);

export default useAuthStore;