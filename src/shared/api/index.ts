// shared/api/index.ts
<<<<<<< HEAD
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
=======
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { STORAGE_KEYS } from '../constants';
import { ApiResponse } from '../types';
>>>>>>> 3dbe02a (initial)

// Konfiguracja API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
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
 * Interceptor dla żądań API
 * - Dodaje nagłówek Authorization z tokenem JWT, jeśli dostępny
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
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
<<<<<<< HEAD
  async (error: AxiosError<ErrorResponseData>) => {
=======
  async (error: AxiosError) => {
>>>>>>> 3dbe02a (initial)
    const originalRequest = error.config;
    
    // Obsługa wygaśnięcia tokenu - próba odświeżenia
    if (
      error.response?.status === 401 &&
      originalRequest && 
<<<<<<< HEAD
      !(originalRequest as { _retry?: boolean })._retry &&
      error.response.data?.message === 'Token expired'
    ) {
      (originalRequest as { _retry?: boolean })._retry = true;
=======
      !(originalRequest as any)._retry &&
      error.response.data?.message === 'Token expired'
    ) {
      (originalRequest as any)._retry = true;
>>>>>>> 3dbe02a (initial)
      
      try {
        // Wywołanie endpointu refresh token
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
<<<<<<< HEAD
        const response = await axios.post<{ token: string }>(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
=======
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
>>>>>>> 3dbe02a (initial)
        
        if (response.data.token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
          
          // Ponowna próba oryginalnego żądania z nowym tokenem
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          }
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Jeśli odświeżenie tokenu nie powiodło się, wyloguj użytkownika
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        // Przekierowanie do logowania
        window.location.href = '/login?session=expired';
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
  get: async <T>(url: string, params?: any): Promise<ApiResponse<T>> => {
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
<<<<<<< HEAD
  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
=======
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
>>>>>>> 3dbe02a (initial)
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
<<<<<<< HEAD
  put: async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
=======
  put: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
>>>>>>> 3dbe02a (initial)
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
<<<<<<< HEAD
  uploadFile: async <T>(url: string, file: File, fieldName = 'file', data?: Record<string, unknown>): Promise<ApiResponse<T>> => {
=======
  uploadFile: async <T>(url: string, file: File, fieldName: string = 'file', data?: Record<string, any>): Promise<ApiResponse<T>> => {
>>>>>>> 3dbe02a (initial)
    try {
      const formData = new FormData();
      formData.append(fieldName, file);
      
      // Dodaj dodatkowe dane jeśli podane
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
<<<<<<< HEAD
          formData.append(key, String(value));
=======
          formData.append(key, value);
>>>>>>> 3dbe02a (initial)
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
<<<<<<< HEAD
  uploadFiles: async <T>(url: string, files: File[], fieldName = 'files', data?: Record<string, unknown>): Promise<ApiResponse<T>> => {
=======
  uploadFiles: async <T>(url: string, files: File[], fieldName: string = 'files', data?: Record<string, any>): Promise<ApiResponse<T>> => {
>>>>>>> 3dbe02a (initial)
    try {
      const formData = new FormData();
      
      // Dodaj wszystkie pliki do formData
      files.forEach((file) => {
        formData.append(fieldName, file);
      });
      
      // Dodaj dodatkowe dane jeśli podane
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
<<<<<<< HEAD
          formData.append(key, String(value));
=======
          formData.append(key, value);
>>>>>>> 3dbe02a (initial)
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