// src/modules/products/pages/EditProductPage.tsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../modules/auth';
import { useProducts } from '../hooks/useProducts';
import ProductForm from '../components/ProductForm';
import { isPopulatedOwner } from '../types'; // Import isPopulatedOwner

const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedProduct, fetchProduct, isLoading, error, clearError } = useProducts();
  
  // Fetch product when id changes
  useEffect(() => {
    if (id) {
      clearError();
      fetchProduct(id);
    }
  }, [id, fetchProduct, clearError]);
  
  // Check if user is product owner
  const isOwner = user && selectedProduct && (
    (typeof selectedProduct.owner === 'string' && user._id === selectedProduct.owner) || 
    (isPopulatedOwner(selectedProduct.owner) && user._id === selectedProduct.owner._id)
  );
  
  // Only product owner should be able to edit
  if (selectedProduct && !isOwner) {
    navigate(`/products/${id}`);
    return null;
  }
  
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
      
      {/* Product form */}
      {!isLoading && !error && selectedProduct && (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Edytuj produkt
            </h1>
            <p className="mt-2 text-gray-600">
              Zaktualizuj informacje o swoim produkcie.
            </p>
          </div>
          
          <ProductForm
            productId={id}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </>
      )}
    </div>
  );
  
  // Handle successful product update
  function handleSuccess(productId: string) {
    navigate(`/products/${productId}`);
  }
  
  // Handle form cancel
  function handleCancel() {
    navigate(`/products/${id}`);
  }
};

export default EditProductPage;