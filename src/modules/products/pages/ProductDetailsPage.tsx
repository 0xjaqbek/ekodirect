// src/modules/products/pages/ProductDetailsPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../../../modules/auth';
import ProductDetails from '../components/ProductDetails';

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    selectedProduct, 
    fetchProduct, 
    deleteProduct,
    isLoading, 
    error, 
    clearError 
  } = useProducts();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Fetch product details when ID changes
  useEffect(() => {
    if (id) {
      clearError();
      fetchProduct(id);
    }
  }, [id, fetchProduct, clearError]);
  
  // Handle product deletion
  const handleDelete = async () => {
    if (!id) return;
    
    setDeleteError(null);
    const success = await deleteProduct(id);
    
    if (success) {
      // Navigate back to products list after successful deletion
      navigate('/farmer/products');
    } else {
      setDeleteError('Nie udało się usunąć produktu. Spróbuj ponownie później.');
    }
  };
  
  // Check if current user is product owner
  const isOwner = user && selectedProduct && user._id === selectedProduct.owner;
  
  return (
    <div className="container mx-auto px-4 py-8">
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
      
      {/* Delete error */}
      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {deleteError}
        </div>
      )}
      
      {/* Product details */}
      {!isLoading && !error && selectedProduct && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-primary hover:text-primary-dark"
              >
                <svg 
                  className="h-5 w-5 mr-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                  />
                </svg>
                Powrót
              </button>
            </div>
            
            {isOwner && (
              <div className="text-sm text-gray-500">
                Jesteś właścicielem tego produktu
              </div>
            )}
          </div>
          
          <ProductDetails 
            product={selectedProduct} 
            onDelete={handleDelete} 
          />
          
          {/* Similar products section could be added here */}
        </>
      )}
    </div>
  );
};

export default ProductDetailsPage;