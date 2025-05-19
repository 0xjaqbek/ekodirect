// src/modules/auth/store/authStore.ts - Enhanced with detailed logging
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
      
      // Login method with enhanced logging
      login: async (credentials: LoginRequest) => {
        console.log('=== FRONTEND LOGIN START ===');
        console.log('Login credentials:', { 
          email: credentials.email, 
          password: credentials.password ? '[HIDDEN]' : 'MISSING' 
        });
        console.log('API Base URL:', import.meta.env.VITE_API_URL);
        console.log('Full login URL:', `${import.meta.env.VITE_API_URL}${fixApiPath(API_ROUTES.AUTH.LOGIN)}`);
        
        set({ isLoading: true, error: null });
        
        try {
          console.log('Making API request...');
          const response = await apiClient.post<{ user: User; token: string; refreshToken: string }>(
            fixApiPath(API_ROUTES.AUTH.LOGIN),
            credentials
          );
          
          console.log('API Response received:', {
            success: response.success,
            hasData: !!response.data,
            hasUser: !!response.data?.user,
            hasToken: !!response.data?.token,
            hasRefreshToken: !!response.data?.refreshToken,
            error: response.error
          });
          
          if (response.success && response.data) {
            console.log('Login successful, saving tokens...');
            
            // Save tokens to localStorage
            localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
            
            console.log('Tokens saved, updating state...');
            
            // Update state
            set({ 
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false 
            });
            
            console.log('=== FRONTEND LOGIN SUCCESS ===');
            return true;
          } else {
            console.error('Login failed - invalid response:', response);
            set({ 
              error: response.error || 'Nieprawidłowy email lub hasło',
              isLoading: false 
            });
            console.log('=== FRONTEND LOGIN FAILED ===');
            return false;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Błąd podczas logowania',
            isLoading: false 
          });
          console.log('=== FRONTEND LOGIN ERROR END ===');
          return false;
        }
      },
      
      // Register method with enhanced logging
      register: async (userData: RegisterRequest) => {
        console.log('=== FRONTEND REGISTER START ===');
        console.log('Register data:', { 
          ...userData, 
          password: userData.password ? '[HIDDEN]' : 'MISSING' 
        });
        
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post<{ user: User }>(
            fixApiPath(API_ROUTES.AUTH.REGISTER),
            userData
          );
          
          console.log('Register API response:', {
            success: response.success,
            hasData: !!response.data,
            error: response.error
          });
          
          if (response.success && response.data) {
            set({ isLoading: false });
            console.log('=== FRONTEND REGISTER SUCCESS ===');
            return true;
          } else {
            console.error('Register failed:', response);
            set({ 
              error: response.error || 'Błąd podczas rejestracji',
              isLoading: false 
            });
            console.log('=== FRONTEND REGISTER FAILED ===');
            return false;
          }
        } catch (error) {
          console.error('=== FRONTEND REGISTER ERROR ===');
          console.error('Register error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Błąd podczas rejestracji',
            isLoading: false 
          });
          console.log('=== FRONTEND REGISTER ERROR END ===');
          return false;
        }
      },
      
      // Logout method
      logout: () => {
        console.log('=== FRONTEND LOGOUT ===');
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
        console.log('Logout completed');
      },
      
      // Token refresh method
      refreshToken: async () => {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (!refreshToken) {
          console.log('No refresh token found, logging out');
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
            
            console.log('Token refreshed successfully');
            return true;
          } else {
            console.log('Token refresh failed');
            get().logout();
            return false;
          }
        } catch {
          console.log('Token refresh error');
          get().logout();
          return false;
        }
      },
      
      // Check user session - modified with better error handling and fallback
      checkSession: async () => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        
        if (!token) {
          console.log('No token found, logging out');
          get().logout();
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
            try {
              const refreshed = await get().refreshToken();
              
              if (refreshed) {
                return await get().checkSession();
              } else {
                get().logout();
                set({ isLoading: false });
                return false;
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              get().logout();
              set({ isLoading: false });
              return false;
            }
          }
        } catch (error) {
          console.error('Session check error:', error);
          // IMPORTANT: If both the session check and refresh fail, but we have a stored user,
          // we can use that as a fallback for a smoother user experience
          const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              set({
                user,
                isAuthenticated: true,
                isLoading: false
              });
              console.log('Using stored user as fallback');
              return true;
            } catch (parseError) {
              console.error('Failed to parse stored user:', parseError);
            }
          }
          
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