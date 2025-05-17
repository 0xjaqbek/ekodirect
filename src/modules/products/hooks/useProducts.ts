// src/modules/products/hooks/useProducts.ts
import { useEffect } from 'react';
import { useProductsStore } from '../store/productsStore';
import { type ProductFilterParams } from '../../../shared/types';

/**
 * Custom hook for managing products
 * Provides access to product state and methods
 */
export const useProducts = (initialFilters?: Partial<ProductFilterParams>) => {
  const {
    products,
    selectedProduct,
    totalProducts,
    filters,
    isLoading,
    error,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImages,
    updateFilters,
    resetFilters,
    clearSelectedProduct,
    clearError
  } = useProductsStore();

  // Load products on mount with initial filters if provided
  useEffect(() => {
    if (initialFilters) {
      updateFilters(initialFilters);
    } else {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // State
    products,
    selectedProduct,
    totalProducts,
    filters,
    isLoading,
    error,
    
    // Methods
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImages,
    updateFilters,
    resetFilters,
    clearSelectedProduct,
    clearError
  };
};

export default useProducts;