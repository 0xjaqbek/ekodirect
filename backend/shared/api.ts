// backend/shared/api.ts - nowy plik dla backend

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

// Define ApiResponse type locally to avoid import issues
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}



// Define Request Parameters type
export type RequestParams = Record<string, string | number | boolean | undefined | null>;

// Konfiguracja API - używaj process.env dla Node.js
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
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
  
  // ... reszta metod
};

export default apiClient;