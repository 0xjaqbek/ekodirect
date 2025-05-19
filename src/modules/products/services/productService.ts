// src/modules/products/services/productService.ts
import apiClient from '../../../shared/api';
import { API_ROUTES } from '../../../shared/constants';
import { 
  type Product, 
  type ApiResponse, 
  type ProductFilterParams,
  type CreateProductRequest 
} from '../../../shared/types';

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
    // Transform filters to handle location array
    const transformedFilters = filters ? this.transformFilters(filters) : undefined;
    return await apiClient.get(API_ROUTES.PRODUCTS.LIST, transformedFilters);
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
   * Create a new product with images (using FormData)
   */
  async createProductWithImages(productData: FormData): Promise<ApiResponse<Product>> {
    // For FormData, don't set Content-Type header - let the browser set it automatically
    return await apiClient.post(API_ROUTES.PRODUCTS.LIST, productData);
  }

  /**
   * Update a product
   */
  async updateProduct(id: string, productData: Partial<Product>): Promise<ApiResponse<Product>> {
    return await apiClient.put(API_ROUTES.PRODUCTS.BY_ID(id), productData);
  }

  /**
   * Update a product with images (using FormData)
   */
  async updateProductWithImages(id: string, productData: FormData): Promise<ApiResponse<Product>> {
    // For FormData, don't set Content-Type header - let the browser set it automatically
    return await apiClient.put(API_ROUTES.PRODUCTS.BY_ID(id), productData);
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
    // Transform filters to handle location array
    const transformedFilters = this.transformFilters({ ...filters, farmer: farmerId });
    return await apiClient.get(API_ROUTES.PRODUCTS.LIST, transformedFilters);
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
    // Transform filters to handle location array
    const transformedFilters = this.transformFilters({ ...filters, search: searchTerm });
    return await apiClient.get(API_ROUTES.PRODUCTS.LIST, transformedFilters);
  }

  /**
   * Transform ProductFilterParams to RequestParams
   * Converts location array to separate lat/lng parameters
   */
  private transformFilters(filters: Partial<ProductFilterParams>): Record<string, string | number | boolean | undefined | null> {
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
  }
}

export default new ProductService();