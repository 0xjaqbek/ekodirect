// src/modules/products/components/ProductFilters.tsx
import React, { useState } from 'react';
import { 
  PRODUCT_CATEGORIES, 
  PRODUCT_SUBCATEGORIES, 
  APP_SETTINGS, 
  CERTIFICATE_TYPES 
} from '../../../shared/constants';
import { type ProductFilterParams } from '../../../shared/types';
import { generatePriceRanges } from '../utils/filterUtils';

interface ProductFiltersProps {
  filters: Partial<ProductFilterParams>;
  updateFilters: (newFilters: Partial<ProductFilterParams>) => void;
  resetFilters: () => void;
  userLocation?: [number, number];
  className?: string;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  updateFilters,
  resetFilters,
  userLocation,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState({
    categories: true,
    price: true,
    certificates: true,
    location: userLocation !== undefined, // Only expand location if user location is available
    sorting: true
  });

  // Generate price ranges
  const priceRanges = generatePriceRanges(500, 5); // Max price 500 zł, 5 steps
  
  // Get subcategories for selected category
  const subcategories = filters.category
    ? PRODUCT_SUBCATEGORIES[filters.category] || []
    : [];
  
  // Sort options
  const sortOptions = [
    { value: 'date', label: 'Najnowsze' },
    { value: 'price', label: 'Cena' },
    { value: 'rating', label: 'Ocena' }
  ];
  
  // Add distance to sort options if user location is available
  if (userLocation) {
    sortOptions.push({ value: 'distance', label: 'Odległość' });
  }
  
  // Add sort direction (asc/desc) labels
  const sortDirectionLabels = {
    date: { asc: 'Najstarsze', desc: 'Najnowsze' },
    price: { asc: 'Od najtańszych', desc: 'Od najdroższych' },
    rating: { asc: 'Od najniższej', desc: 'Od najwyższej' },
    distance: { asc: 'Od najbliższych', desc: 'Od najdalszych' }
  };
  
  // Toggle section expansion
  const toggleSection = (section: keyof typeof isExpanded) => {
    setIsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Handle category change
  const handleCategoryChange = (category: string) => {
    // When changing category, reset subcategory
    updateFilters({
      category,
      subcategory: undefined
    });
  };
  
  // Handle radius change
  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    updateFilters({ radius: value });
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 sticky top-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900">Filtry</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-primary hover:text-primary-dark"
        >
          Resetuj wszystkie
        </button>
      </div>
      
      {/* Categories filter */}
      <div className="mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-2"
          onClick={() => toggleSection('categories')}
        >
          <h4 className="font-medium text-gray-900">Kategorie</h4>
          <svg
            className={`h-5 w-5 text-gray-500 transform ${
              isExpanded.categories ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        
        {isExpanded.categories && (
          <div className="space-y-2">
            {PRODUCT_CATEGORIES.map(category => (
              <div key={category} className="ml-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value={category}
                    checked={filters.category === category}
                    onChange={() => handleCategoryChange(category)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {category}
                  </span>
                </label>
                
                {/* Show subcategories if category is selected */}
                {filters.category === category && subcategories.length > 0 && (
                  <div className="ml-6 mt-2 space-y-2">
                    {subcategories.map(subcategory => (
                      <label key={subcategory} className="flex items-center">
                        <input
                          type="radio"
                          name="subcategory"
                          value={subcategory}
                          checked={filters.subcategory === subcategory}
                          onChange={() => updateFilters({ subcategory })}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600 capitalize">
                          {subcategory}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Price filter */}
      <div className="mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-2"
          onClick={() => toggleSection('price')}
        >
          <h4 className="font-medium text-gray-900">Cena</h4>
          <svg
            className={`h-5 w-5 text-gray-500 transform ${
              isExpanded.price ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        
        {isExpanded.price && (
          <div className="space-y-2">
            <div className="flex space-x-4 mb-4">
              <div className="w-1/2">
                <label htmlFor="minPrice" className="block text-xs text-gray-500 mb-1">
                  Od
                </label>
                <input
                  id="minPrice"
                  type="number"
                  value={filters.minPrice || ''}
                  onChange={(e) => updateFilters({ minPrice: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="maxPrice" className="block text-xs text-gray-500 mb-1">
                  Do
                </label>
                <input
                  id="maxPrice"
                  type="number"
                  value={filters.maxPrice || ''}
                  onChange={(e) => updateFilters({ maxPrice: parseFloat(e.target.value) || undefined })}
                  placeholder="Maks."
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            
            {/* Price range options */}
            <div className="space-y-2">
              {priceRanges.map((range, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name="price-range"
                    checked={filters.minPrice === range.min && filters.maxPrice === range.max}
                    onChange={() => updateFilters({ minPrice: range.min, maxPrice: range.max })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {range.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Certificates filter */}
      <div className="mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-2"
          onClick={() => toggleSection('certificates')}
        >
          <h4 className="font-medium text-gray-900">Certyfikaty</h4>
          <svg
            className={`h-5 w-5 text-gray-500 transform ${
              isExpanded.certificates ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        
        {isExpanded.certificates && (
          <div className="space-y-2">
            {Object.entries(CERTIFICATE_TYPES).map(([key, value]) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.certificate === value}
                  onChange={() => updateFilters({ 
                    certificate: filters.certificate === value ? undefined : value 
                  })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {key === 'ORGANIC' ? 'Organiczny' : 
                   key === 'ECO' ? 'Ekologiczny' : 
                   key === 'FAIR_TRADE' ? 'Fair Trade' : 'Inny'}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
      
      {/* Location filter */}
      {userLocation && (
        <div className="mb-6">
          <div
            className="flex justify-between items-center cursor-pointer mb-2"
            onClick={() => toggleSection('location')}
          >
            <h4 className="font-medium text-gray-900">Lokalizacja</h4>
            <svg
              className={`h-5 w-5 text-gray-500 transform ${
                isExpanded.location ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          
          {isExpanded.location && (
            <div>
              <div className="mb-2">
                <label htmlFor="radius" className="block text-sm text-gray-700 mb-1">
                  Promień wyszukiwania: {filters.radius || APP_SETTINGS.DEFAULT_SEARCH_RADIUS_KM} km
                </label>
                <input
                  id="radius"
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={filters.radius || APP_SETTINGS.DEFAULT_SEARCH_RADIUS_KM}
                  onChange={handleRadiusChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5 km</span>
                  <span>100 km</span>
                </div>
              </div>
              
              <div className="flex items-center mt-4">
                <input
                  id="useLocation"
                  type="checkbox"
                  checked={!!filters.location}
                  onChange={() => updateFilters({ 
                    location: filters.location ? undefined : userLocation,
                    radius: filters.radius || APP_SETTINGS.DEFAULT_SEARCH_RADIUS_KM
                  })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="useLocation" className="ml-2 text-sm text-gray-700">
                  Używaj mojej lokalizacji
                </label>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Sorting */}
      <div className="mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-2"
          onClick={() => toggleSection('sorting')}
        >
          <h4 className="font-medium text-gray-900">Sortowanie</h4>
          <svg
            className={`h-5 w-5 text-gray-500 transform ${
              isExpanded.sorting ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        
        {isExpanded.sorting && (
          <div className="space-y-2">
            {sortOptions.map(option => {
              const sortBy = option.value as 'price' | 'rating' | 'distance' | 'date';
              const isSelected = filters.sortBy === sortBy;
              
              return (
                <div key={sortBy} className="ml-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sortBy"
                      value={sortBy}
                      checked={isSelected}
                      onChange={() => updateFilters({ 
                        sortBy,
                        // Default sort orders
                        sortOrder: sortBy === 'price' ? 'asc' : 'desc'
                      })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label}
                    </span>
                  </label>
                  
                  {/* Sort direction options */}
                  {isSelected && (
                    <div className="ml-6 mt-2 space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sortOrder"
                          value="asc"
                          checked={filters.sortOrder === 'asc'}
                          onChange={() => updateFilters({ sortOrder: 'asc' })}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          {sortDirectionLabels[sortBy].asc}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sortOrder"
                          value="desc"
                          checked={filters.sortOrder === 'desc'}
                          onChange={() => updateFilters({ sortOrder: 'desc' })}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          {sortDirectionLabels[sortBy].desc}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;