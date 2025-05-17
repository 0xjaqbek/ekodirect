// src/modules/products/components/SearchBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDebounce } from '../../../shared/hooks';
import productService from '../services/productService';
import { type Product } from '../../../shared/types';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  className = '',
  placeholder = 'Szukaj produktów...',
  onSearch,
  autoFocus = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Extract search query from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchTerm(query);
    }
  }, [location.search]);
  
  // Handle outside click to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle search when debounced search term changes
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      
      try {
        const response = await productService.searchProducts(debouncedSearchTerm, { limit: 5 });
        
        if (response.success && response.data) {
          setSearchResults(response.data.items);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    
    if (debouncedSearchTerm) {
      fetchSearchResults();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowResults(value.length >= 2);
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchTerm.trim()) {
      // Close results
      setShowResults(false);
      
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      
      // Call onSearch callback if provided
      if (onSearch) {
        onSearch(searchTerm.trim());
      }
    }
  };
  
  // Handle result item click
  const handleResultClick = (productId: string) => {
    setShowResults(false);
    navigate(`/products/${productId}`);
  };
  
  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="search"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setShowResults(searchTerm.length >= 2)}
            placeholder={placeholder}
            className="w-full px-4 py-2 pl-10 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            autoFocus={autoFocus}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary"
          >
            {isSearching ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            )}
          </button>
        </div>
      </form>
      
      {/* Search results dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {searchResults.map(product => (
              <li
                key={product._id}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleResultClick(product._id)}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded overflow-hidden mr-3">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate capitalize">
                      {product.category}
                      {product.subcategory && ` • ${product.subcategory}`}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {new Intl.NumberFormat('pl-PL', {
                      style: 'currency',
                      currency: 'PLN'
                    }).format(product.price)}
                  </div>
                </div>
              </li>
            ))}
            <li>
              <button
                onClick={handleSearchSubmit}
                className="w-full px-4 py-2 text-sm text-primary hover:bg-gray-50 text-center"
              >
                Pokaż wszystkie wyniki
              </button>
            </li>
          </ul>
        </div>
      )}
      
      {/* No results message */}
      {showResults && debouncedSearchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg py-2 px-4">
          <p className="text-sm text-gray-500">
            Brak wyników dla "{debouncedSearchTerm}".
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;