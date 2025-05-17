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
    return await apiClient.get(API_ROUTES.PRODUCTS.LIST, filters);
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
    return await apiClient.get(API_ROUTES.PRODUCTS.LIST, { 
      ...filters,
      farmer: farmerId 
    });
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
    return await apiClient.get(API_ROUTES.PRODUCTS.LIST, {
      ...filters,
      search: searchTerm
    });
  }
}

export default new ProductService();