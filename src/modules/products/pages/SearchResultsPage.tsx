// src/modules/products/pages/SearchResultsPage.tsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductsList from '../components/ProductsList';
import { queryStringToFilters, filtersToQueryString } from '../utils/filterUtils';

const SearchResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, updateFilters, resetFilters, totalProducts } = useProducts();
  
  // Get search query and other filters from URL
  const searchQuery = searchParams.get('q') || '';
  
  // Parse filters from URL query parameters
  useEffect(() => {
    const parsedFilters = queryStringToFilters(location.search);
    
    // Add search query to filters if not already present
    if (searchQuery && !parsedFilters.search) {
      parsedFilters.search = searchQuery;
    }
    
    updateFilters(parsedFilters);
  }, [location.search, searchQuery, updateFilters]);
  
  // Update URL when filters change
  const handleFiltersChange = (newFilters: any) => {
    // Preserve search query
    if (searchQuery && !newFilters.search) {
      newFilters.search = searchQuery;
    }
    
    // Convert filters to query string and navigate
    const queryString = filtersToQueryString(newFilters);
    setSearchParams(queryString);
  };
  
  // Handle reset filters
  const handleResetFilters = () => {
    resetFilters();
    
    // Keep only search query
    const queryString = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : '';
    setSearchParams(queryString);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {searchQuery ? (
            <>Wyniki wyszukiwania dla: <span className="text-primary">"{searchQuery}"</span></>
          ) : (
            'Wyszukiwanie produktów'
          )}
        </h1>
        <p className="mt-2 text-gray-600">
          {totalProducts > 0 ? (
            <>Znaleziono {totalProducts} {totalProducts === 1 ? 'produkt' : 
              totalProducts % 10 >= 2 && totalProducts % 10 <= 4 && (totalProducts % 100 < 10 || totalProducts % 100 >= 20) 
                ? 'produkty' 
                : 'produktów'}</>
          ) : (
            'Nie znaleziono żadnych produktów pasujących do kryteriów wyszukiwania.'
          )}
        </p>
      </div>
      
      <ProductsList
        showFarmer={true}
        showFilters={true}
        showDistance={true}
        emptyStateMessage={searchQuery 
          ? `Nie znaleziono produktów pasujących do zapytania "${searchQuery}". Spróbuj innych słów kluczowych lub zresetuj filtry.` 
          : 'Nie znaleziono produktów pasujących do wybranych filtrów.'}
      />
    </div>
  );
};

export default SearchResultsPage;