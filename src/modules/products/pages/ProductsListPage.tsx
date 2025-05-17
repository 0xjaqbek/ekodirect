// src/modules/products/pages/ProductsListPage.tsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../modules/auth';
import { useProducts } from '../hooks/useProducts';
import ProductsList from '../components/ProductsList';
import { queryStringToFilters } from '../utils/filterUtils';

const ProductsListPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { filters, updateFilters, resetFilters } = useProducts();
  
  // Parse filters from URL query parameters
  useEffect(() => {
    if (location.search) {
      const parsedFilters = queryStringToFilters(location.search);
      updateFilters(parsedFilters);
    } else {
      resetFilters();
    }
  }, [location.search, updateFilters, resetFilters]);
  
  // Handle add product button click
  const handleAddProduct = () => {
    navigate('/farmer/products/new');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between mb-6 items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Ekologiczne produkty
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Świeże produkty ekologiczne bezpośrednio od lokalnych rolników. Wybierz spośród szerokiej gamy certyfikowanych produktów ekologicznych.
          </p>
        </div>
        
        {isAuthenticated && user?.role === 'farmer' && (
          <button
            onClick={handleAddProduct}
            className="mt-4 md:mt-0 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Dodaj nowy produkt
          </button>
        )}
      </div>
      
      <ProductsList 
        showFarmer={true}
        showFilters={true}
        showDistance={true}
      />
    </div>
  );
};

export default ProductsListPage;