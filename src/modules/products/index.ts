// src/modules/products/index.ts
// Export components
export { default as ProductCard } from './components/ProductCard';
export { default as ProductDetails } from './components/ProductDetails';
export { default as ProductForm } from './components/ProductForm';
export { default as ProductsList } from './components/ProductsList';
export { default as ProductFilters } from './components/ProductFilters';
export { default as ProductImageUploader } from './components/ProductImageUploader';
export { default as ProductStatusBadge } from './components/ProductStatusBadge';
export { default as CertificateBadge } from './components/CertificateBadge';
export { default as SearchBar } from './components/SearchBar';

// Export pages
export { default as ProductsListPage } from './pages/ProductsListPage';
export { default as ProductDetailsPage } from './pages/ProductDetailsPage';
export { default as AddProductPage } from './pages/AddProductPage';
export { default as EditProductPage } from './pages/EditProductPage';
export { default as FarmerProductsPage } from './pages/FarmerProductsPage';
export { default as SearchResultsPage } from './pages/SearchResultsPage';

// Export hooks
export { default as useProducts } from './hooks/useProducts';

// Export store
export { useProductsStore } from './store/productsStore';
export type { ProductsState } from './store/productsStore';

// Export services
export { default as productService } from './services/productService';

// Export utils
export * from './utils/productValidation';
export * from './utils/filterUtils';

// Export types
export * from './types';