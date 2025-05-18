// src/modules/products/services/productService.ts - Fixed version
import apiClient from '../../../shared/api';
import { API_ROUTES } from '../../../shared/constants';
import { 
  type Product, 
  type ApiResponse, 
  type ProductFilterParams,
  type CreateProductRequest 
} from '../../../shared/types';

// Helper function to convert ProductFilterParams to RequestParams
function convertFiltersToRequestParams(filters: ProductFilterParams): Record<string, string | number | boolean | undefined> {
  const params: Record<string, string | number | boolean | undefined> = {};
  
  // Convert all properties to compatible types
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Handle location array specially - convert to separate lat/lng params
      if (key === 'location' && Array.isArray(value) && value.length === 2) {
        params.lat = value[1]; // latitude
        params.lng = value[0]; // longitude
      } else if (Array.isArray(value)) {
        // Handle other arrays by joining them
        params[key] = value.join(',');
      } else {
        // Handle primitive types
        params[key] = value;
      }
    }
  });
  
  return params;
}

/**
 * Service for product-related API operations
 */
class ProductService {
  /**
   * Fetch products with optional filters
   */
  async getProducts(filters?: ProductFilterParams): Promise<ApiResponse<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    // Convert filters to compatible format
    const requestParams = filters ? convertFiltersToRequestParams(filters) : undefined;
    return await apiClient.get(API_ROUTES.PRODUCTS.LIST, requestParams);
  }

  /**
   * Fetch a single product by ID
   */
  async getProductById(id: string): Promise<ApiResponse<Product>> {
    return await apiClient.get(API_ROUTES.PRODUCTS.BY_ID(id));
  }

  /**
   * Create a new product
   */
  async createProduct(productData: CreateProductRequest): Promise<ApiResponse<Product>> {
    return await apiClient.post(API_ROUTES.PRODUCTS.LIST, productData);
  }

  /**
   * Create a new product with images
   */
  async createProductWithImages(productData: FormData): Promise<ApiResponse<Product>> {
    return await apiClient.post(API_ROUTES.PRODUCTS.LIST, productData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Update a product
   */
  async updateProduct(id: string, productData: Partial<Product>): Promise<ApiResponse<Product>> {
    return await apiClient.put(API_ROUTES.PRODUCTS.BY_ID(id), productData);
  }

  /**
   * Update a product with images
   */
  async updateProductWithImages(id: string, productData: FormData): Promise<ApiResponse<Product>> {
    return await apiClient.put(API_ROUTES.PRODUCTS.BY_ID(id), productData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return await apiClient.delete(API_ROUTES.PRODUCTS.BY_ID(id));
  }

  /**
   * Upload product images
   */
  async uploadProductImages(productId: string, images: File[]): Promise<ApiResponse<{ imageUrls: string[] }>> {
    return await apiClient.uploadFiles(API_ROUTES.PRODUCTS.IMAGES(productId), images, 'images');
  }

  /**
   * Update product status
   */
  async updateProductStatus(productId: string, status: string): Promise<ApiResponse<Product>> {
    return await apiClient.put(API_ROUTES.PRODUCTS.STATUS(productId), { status });
  }

  /**
   * Get products by farmer ID
   */
  async getProductsByFarmer(farmerId: string, filters?: Partial<ProductFilterParams>): Promise<ApiResponse<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    // Combine farmer ID with other filters
    const combinedFilters = { 
      ...filters,
      farmer: farmerId 
    };
    
    // Convert to request params
    const requestParams = convertFiltersToRequestParams(combinedFilters);
    return await apiClient.get(API_ROUTES.PRODUCTS.LIST, requestParams);
  }

  /**
   * Search for products
   */
  async searchProducts(searchTerm: string, filters?: Partial<ProductFilterParams>): Promise<ApiResponse<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    // Combine search term with other filters
    const combinedFilters = {
      ...filters,
      search: searchTerm
    };
    
    // Convert to request params
    const requestParams = convertFiltersToRequestParams(combinedFilters);
    return await apiClient.get(API_ROUTES.PRODUCTS.LIST, requestParams);
  }
}

export default new ProductService();