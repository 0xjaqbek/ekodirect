// src/modules/products/pages/EditProductPage.tsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../modules/auth';
import { useProducts } from '../hooks/useProducts';
import ProductForm from '../components/ProductForm';

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
  const isOwner = user && selectedProduct && 
    (user._id === selectedProduct.owner || 
     (typeof selectedProduct.owner === 'object' && user._id === selectedProduct.owner._id));
  
  // Only product owner should be able to edit
  if (selectedProduct && !isOwner) {
    navigate(`/products/${id}`);
    return null;
  }
  
  // Handle successful product update
  const handleSuccess = (productId: string) => {
    navigate(`/products/${productId}`);
  };
  
  // Handle form cancel
  const handleCancel = () => {
    navigate(`/products/${id}`);
  };
  
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
};

export default EditProductPage;