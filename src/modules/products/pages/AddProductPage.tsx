// src/modules/products/pages/AddProductPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../modules/auth';
import ProductForm from '../components/ProductForm';

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Only farmers should be able to access this page
  if (user?.role !== 'farmer') {
    navigate('/');
    return null;
  }
  
  // Handle successful product creation
  const handleSuccess = (productId: string) => {
    navigate(`/products/${productId}`);
  };
  
  // Handle form cancel
  const handleCancel = () => {
    navigate(-1);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Dodaj nowy produkt
        </h1>
        <p className="mt-2 text-gray-600">
          Wypełnij formularz, aby dodać nowy produkt do swojej oferty.
        </p>
      </div>
      
      <ProductForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AddProductPage;