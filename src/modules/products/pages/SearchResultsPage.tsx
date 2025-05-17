// src/modules/products/pages/SearchResultsPage.tsx - Fixed version
import React, { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductsList from '../components/ProductsList';
import { queryStringToFilters } from '../utils/filterUtils';

const SearchResultsPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { updateFilters, totalProducts } = useProducts();
  
  // Get search query from URL
  const searchQuery = searchParams.get('q') || '';
  
  // Parse filters from URL query parameters and update store
  useEffect(() => {
    const parsedFilters = queryStringToFilters(location.search);
    
    // Add search query to filters if not already present
    if (searchQuery && !parsedFilters.search) {
      parsedFilters.search = searchQuery;
    }
    
    updateFilters(parsedFilters);
  }, [location.search, searchQuery, updateFilters]);
  
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