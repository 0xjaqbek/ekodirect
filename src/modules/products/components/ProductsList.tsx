// src/modules/products/components/ProductsList.tsx
import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { type ProductFilterParams } from '../../../shared/types';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import { useGeolocation, useMediaQuery } from '../../../shared/hooks';

interface ProductsListProps {
  initialFilters?: Partial<ProductFilterParams>;
  showFarmer?: boolean;
  showFilters?: boolean;
  showDistance?: boolean;
  className?: string;
  title?: string;
  emptyStateMessage?: string;
}

const ProductsList: React.FC<ProductsListProps> = ({
  initialFilters,
  showFarmer = true,
  showFilters = true,
  showDistance = false,
  className = '',
  title = 'Produkty',
  emptyStateMessage = 'Brak produktów spełniających kryteria wyszukiwania.'
}) => {
  const {
    products,
    totalProducts,
    filters,
    isLoading,
    error,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fetchProducts,
    updateFilters,
    resetFilters
  } = useProducts(initialFilters);
  
  const { location } = useGeolocation();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(!isMobile);
  
  // Handle responsive sidebar
  useEffect(() => {
    setIsFilterSidebarOpen(!isMobile);
  }, [isMobile]);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalProducts / (filters.limit || 12));
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    updateFilters({ page: newPage });
  };
  
  // Toggle filter sidebar on mobile
  const toggleFilterSidebar = () => {
    setIsFilterSidebarOpen(!isFilterSidebarOpen);
  };
  
  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        
        {showFilters && isMobile && (
          <button
            onClick={toggleFilterSidebar}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            {isFilterSidebarOpen ? 'Ukryj filtry' : 'Pokaż filtry'}
          </button>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters sidebar */}
        {showFilters && (
          <div className={`
            ${isFilterSidebarOpen ? 'block' : 'hidden'}
            md:block md:w-64 flex-shrink-0
          `}>
            <ProductFilters
              filters={filters}
              updateFilters={updateFilters}
              resetFilters={resetFilters}
              userLocation={location ? [location.longitude, location.latitude] : undefined}
            />
          </div>
        )}
        
        <div className="flex-1">
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
          
          {/* Error state */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {/* Products grid */}
          {!isLoading && !error && products.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {products.map(product => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    showFarmer={showFarmer}
                    showDistance={showDistance}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(Number(filters.page) - 1)}
                      disabled={Number(filters.page) <= 1}
                      className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Poprzednia
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      // Show only 5 page buttons at a time
                      .filter(page => {
                        const currentPage = Number(filters.page);
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1 ||
                          (page === 2 && currentPage === 1) ||
                          (page === totalPages - 1 && currentPage === totalPages)
                        );
                      })
                      .map(page => {
                        const isCurrent = page === Number(filters.page);
                        // Add dots for pagination gaps
                        const showLeftDots = page === 2 && Number(filters.page) > 3;
                        const showRightDots = page === totalPages - 1 && Number(filters.page) < totalPages - 2;
                        
                        return (
                          <React.Fragment key={page}>
                            {showLeftDots && (
                              <span className="px-3 py-2 text-gray-500">...</span>
                            )}
                            
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 rounded-md ${
                                isCurrent
                                  ? 'bg-primary text-white'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                            
                            {showRightDots && (
                              <span className="px-3 py-2 text-gray-500">...</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    
                    <button
                      onClick={() => handlePageChange(Number(filters.page) + 1)}
                      disabled={Number(filters.page) >= totalPages}
                      className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Następna
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
          
          {/* Empty state */}
          {!isLoading && !error && products.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Brak produktów
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {emptyStateMessage}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => resetFilters()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Resetuj filtry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsList;