// src/modules/products/store/productsStore.ts
import { create } from 'zustand';
import { type Product, type ProductFilterParams } from '../../../shared/types';
import apiClient from '../../../shared/api';
import { API_ROUTES } from '../../../shared/constants';

// Interface for the products state
export interface ProductsState {
  products: Product[];
  selectedProduct: Product | null;
  totalProducts: number;
  filters: ProductFilterParams;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProducts: (params?: Partial<ProductFilterParams>) => Promise<void>;
  fetchProduct: (id: string) => Promise<Product | null>;
  createProduct: (productData: FormData) => Promise<Product | null>;
  updateProduct: (id: string, productData: FormData) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  uploadImages: (productId: string, images: File[]) => Promise<string[] | null>;
  updateFilters: (newFilters: Partial<ProductFilterParams>) => void;
  resetFilters: () => void;
  clearSelectedProduct: () => void;
  clearError: () => void;
}

// Default filter values
const defaultFilters: ProductFilterParams = {
  page: 1,
  limit: 12,
  sortBy: 'date',
  sortOrder: 'desc'
};

// Create the products store with Zustand
export const useProductsStore = create<ProductsState>((set, get) => ({
    // Initial state
    products: [],
    selectedProduct: null,
    totalProducts: 0,
    filters: { ...defaultFilters },
    isLoading: false,
    error: null,
    
    // Helper function to transform ProductFilterParams to RequestParams
    transformFilters: (filters: ProductFilterParams): Record<string, string | number | boolean | undefined | null> => {
      const { location, ...otherFilters } = filters;
      
      const transformed: Record<string, string | number | boolean | undefined | null> = {};
      
      // Copy all non-location filters
      Object.entries(otherFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          transformed[key] = value;
        }
      });
      
      // Handle location separately - convert [lng, lat] to separate parameters
      if (location && Array.isArray(location) && location.length === 2) {
        transformed.lng = location[0]; // longitude
        transformed.lat = location[1]; // latitude
      }
      
      return transformed;
    },
    
    // Fetch products with optional filter parameters
    fetchProducts: async (params?: Partial<ProductFilterParams>) => {
      set({ isLoading: true, error: null });
      
      try {
        // Combine current filters with new params
        const currentFilters = get().filters;
        const updatedFilters = { ...currentFilters, ...params };
        
        // Update filters in state
        set({ filters: updatedFilters });
        
        // Transform filters to handle location array
        const transformedFilters = get().transformFilters(updatedFilters);
        
        // Make API request
        const response = await apiClient.get<{
          items: Product[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }>(API_ROUTES.PRODUCTS.LIST, transformedFilters);
        
        if (response.success && response.data) {
          set({
            products: response.data.items,
            totalProducts: response.data.total,
            isLoading: false
          });
        } else {
          set({
            error: response.error || 'Nie udało się pobrać produktów',
            isLoading: false
          });
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Wystąpił błąd podczas pobierania produktów',
          isLoading: false
        });
      }
    },
  
  // Fetch a single product by ID
  fetchProduct: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.get<Product>(API_ROUTES.PRODUCTS.BY_ID(id));
      
      if (response.success && response.data) {
        set({
          selectedProduct: response.data,
          isLoading: false
        });
        return response.data;
      } else {
        set({
          error: response.error || 'Nie udało się pobrać produktu',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Wystąpił błąd podczas pobierania produktu',
        isLoading: false
      });
      return null;
    }
  },
  
  // Create a new product
  createProduct: async (productData: FormData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use custom method for FormData
      const response = await apiClient.post<Product>(API_ROUTES.PRODUCTS.LIST, productData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.success && response.data) {
        // Refresh products list
        await get().fetchProducts();
        
        set({
          selectedProduct: response.data,
          isLoading: false
        });
        return response.data;
      } else {
        set({
          error: response.error || 'Nie udało się utworzyć produktu',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Wystąpił błąd podczas tworzenia produktu',
        isLoading: false
      });
      return null;
    }
  },
  
  // Update an existing product
  updateProduct: async (id: string, productData: FormData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.put<Product>(API_ROUTES.PRODUCTS.BY_ID(id), productData);
      
      if (response.success && response.data) {
        // Update the selected product and refresh list if needed
        set({
          selectedProduct: response.data,
          isLoading: false
        });
        
        // Update product in the list if it exists there
        const products = get().products;
        const productIndex = products.findIndex(p => p._id === id);
        
        if (productIndex !== -1) {
          const updatedProducts = [...products];
          updatedProducts[productIndex] = response.data;
          set({ products: updatedProducts });
        }
        
        return response.data;
      } else {
        set({
          error: response.error || 'Nie udało się zaktualizować produktu',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Wystąpił błąd podczas aktualizacji produktu',
        isLoading: false
      });
      return null;
    }
  },
  
  // Delete a product
  deleteProduct: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.delete<{ success: boolean }>(API_ROUTES.PRODUCTS.BY_ID(id));
      
      if (response.success) {
        // Remove from products list if it exists there
        const products = get().products;
        const updatedProducts = products.filter(p => p._id !== id);
        
        set({
          products: updatedProducts,
          isLoading: false
        });
        
        // Clear selected product if it's the one that was deleted
        if (get().selectedProduct?._id === id) {
          set({ selectedProduct: null });
        }
        
        return true;
      } else {
        set({
          error: response.error || 'Nie udało się usunąć produktu',
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Wystąpił błąd podczas usuwania produktu',
        isLoading: false
      });
      return false;
    }
  },
  
  // Upload images for a product
  uploadImages: async (productId: string, images: File[]) => {
    set({ isLoading: true, error: null });
    
    try {
      const formData = new FormData();
      
      // Append each image to the form data
      images.forEach(image => {
        formData.append('images', image);
      });
      
      const response = await apiClient.uploadFiles<{ imageUrls: string[] }>(
        API_ROUTES.PRODUCTS.IMAGES(productId),
        images,
        'images'
      );
      
      if (response.success && response.data) {
        // Refresh the product to get updated image URLs
        await get().fetchProduct(productId);
        
        set({ isLoading: false });
        return response.data.imageUrls;
      } else {
        set({
          error: response.error || 'Nie udało się przesłać zdjęć',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Wystąpił błąd podczas przesyłania zdjęć',
        isLoading: false
      });
      return null;
    }
  },
  
  // Update filters
  updateFilters: (newFilters: Partial<ProductFilterParams>) => {
    const currentFilters = get().filters;
    // Reset to page 1 when changing filters
    const updatedFilters = { 
      ...currentFilters, 
      ...newFilters,
      page: newFilters.page || 1
    };
    
    set({ filters: updatedFilters });
    // Fetch products with new filters
    get().fetchProducts(updatedFilters);
  },
  
  // Reset filters to default
  resetFilters: () => {
    set({ filters: { ...defaultFilters }});
    // Fetch products with default filters
    get().fetchProducts(defaultFilters);
  },
  
  // Clear selected product
  clearSelectedProduct: () => {
    set({ selectedProduct: null });
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

export default useProductsStore;