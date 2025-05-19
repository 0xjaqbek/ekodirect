// Updated src/shared/api/index.ts with environment detection

import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { STORAGE_KEYS } from '../constants';

// Define ApiResponse type locally to avoid import issues
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Define type for error response data
interface ErrorResponseData {
  message?: string;
  error?: string;
}

// Define Request Parameters type
export type RequestParams = Record<string, string | number | boolean | undefined | null>;

// Define interface for Vite's import.meta.env
interface ViteImportMeta {
  env: {
    VITE_API_URL?: string;
    [key: string]: string | undefined;
  };
}

// Define interface for window with Vite's import.meta
interface WindowWithVite extends Window {
  import?: {
    meta?: ViteImportMeta;
  };
}

// Environment detection and API configuration
const isNode = typeof process !== 'undefined' && process.env;
const isBrowser = typeof window !== 'undefined';

// Get API URL from environment variables
const getApiUrl = (): string => {
  if (isNode) {
    // Node.js environment (backend)
    return process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:3001/api';
  } else if (isBrowser && (window as WindowWithVite).import?.meta?.env) {
    // Vite browser environment
    return (window as WindowWithVite).import!.meta!.env.VITE_API_URL || 'http://localhost:3001/api';
  } else {
    // Fallback
    return 'http://localhost:3001/api';
  }
};

const API_BASE_URL = getApiUrl();
const API_TIMEOUT = 15000; // 15 sekund

// Domyślna konfiguracja dla instancji axios
const axiosConfig: AxiosRequestConfig = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Utworzenie instancji axios
const axiosInstance: AxiosInstance = axios.create(axiosConfig);

/**
 * Get storage function that works in both Node.js and browser
 */
const getStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return null;
};

const setStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  }
};

const removeStorageItem = (key: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(key);
  }
};

/**
 * Interceptor dla żądań API
 * - Dodaje nagłówek Authorization z tokenem JWT, jeśli dostępny
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStorageItem(STORAGE_KEYS.TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor dla odpowiedzi API
 * - Obsługuje globalne zarządzanie błędami i odświeżanie tokenów
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponseData>) => {
    const originalRequest = error.config;
    
    // Obsługa wygaśnięcia tokenu - próba odświeżenia (tylko w browser)
    if (
      typeof window !== 'undefined' &&
      error.response?.status === 401 &&
      originalRequest && 
      !(originalRequest as { _retry?: boolean })._retry &&
      error.response.data?.message === 'Token expired'
    ) {
      (originalRequest as { _retry?: boolean })._retry = true;
      
      try {
        // Wywołanie endpointu refresh token
        const refreshToken = getStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
        const response = await axios.post<{ token: string }>(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
        
        if (response.data.token) {
          setStorageItem(STORAGE_KEYS.TOKEN, response.data.token);
          
          // Ponowna próba oryginalnego żądania z nowym tokenem
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          }
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Jeśli odświeżenie tokenu nie powiodło się, wyloguj użytkownika
        removeStorageItem(STORAGE_KEYS.TOKEN);
        removeStorageItem(STORAGE_KEYS.USER);
        removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        // Przekierowanie do logowania (tylko w browser)
        if (typeof window !== 'undefined') {
          window.location.href = '/login?session=expired';
        }
        return Promise.reject(refreshError);
      }
    }
    
    // Formatowanie odpowiedzi błędu
    let errorMessage = 'Wystąpił nieoczekiwany błąd';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Tworzenie standardowej odpowiedzi błędu
    const formattedError: ApiResponse<null> = {
      success: false,
      error: errorMessage
    };
    
    return Promise.reject(formattedError);
  }
);

// Klient API z typowanymi metodami
export const apiClient = {
  /**
   * Wykonaj żądanie GET
   */
  get: async <T>(url: string, params?: RequestParams): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axiosInstance.get(url, { params });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return error as ApiResponse<T>;
    }
  },
  
  /**
   * Wykonaj żądanie POST
   */
  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axiosInstance.post(url, data, config);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return error as ApiResponse<T>;
    }
  },
  
  /**
   * Wykonaj żądanie PUT
   */
  put: async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axiosInstance.put(url, data);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return error as ApiResponse<T>;
    }
  },
  
  /**
   * Wykonaj żądanie DELETE
   */
  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return error as ApiResponse<T>;
    }
  },
  
  /**
   * Wyślij plik z multipart/form-data
   */
  uploadFile: async <T>(url: string, file: File, fieldName = 'file', data?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    try {
      const formData = new FormData();
      formData.append(fieldName, file);
      
      // Dodaj dodatkowe dane jeśli podane
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }
      
      const response: AxiosResponse<ApiResponse<T>> = await axiosInstance.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return error as ApiResponse<T>;
    }
  },
  
  /**
   * Wyślij wiele plików z multipart/form-data
   */
  uploadFiles: async <T>(url: string, files: File[], fieldName = 'files', data?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    try {
      const formData = new FormData();
      
      // Dodaj wszystkie pliki do formData
      files.forEach((file) => {
        formData.append(fieldName, file);
      });
      
      // Dodaj dodatkowe dane jeśli podane
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }
      
      const response: AxiosResponse<ApiResponse<T>> = await axiosInstance.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return error as ApiResponse<T>;
    }
  }
};

export default apiClient;