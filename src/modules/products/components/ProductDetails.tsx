// src/modules/products/components/ProductDetails.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice, formatDate } from '../../../shared/utils';
import { useAuth } from '../../../modules/auth';
import ProductStatusBadge from './ProductStatusBadge';
import CertificateBadge from './CertificateBadge';
import { isPopulatedOwner } from '../types';
import type { Product } from '../types';

interface ProductDetailsProps {
  product: Product;
  onDelete?: () => void;
  className?: string;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  onDelete,
  className = ''
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Check if current user is the product owner
  const isOwner = user && typeof product.owner === 'string' 
    ? user._id === product.owner 
    : isPopulatedOwner(product.owner) && user?._id === product.owner._id;
  
  // Format dates
  const harvestDateFormatted = product.harvestDate 
    ? formatDate(product.harvestDate) 
    : 'Brak danych';
  
  const createdAtFormatted = product.createdAt 
    ? formatDate(product.createdAt) 
    : '';
    
  // Handle image navigation
  const goToNextImage = () => {
    if (product.images && product.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };
  
  const goToPrevImage = () => {
    if (product.images && product.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
      );
    }
  };
  
  // Handle edit button
  const handleEdit = () => {
    navigate(`/farmer/products/${product._id}/edit`);
  };
  
  // Handle delete button
  const handleDelete = () => {
    if (onDelete) {
      setShowDeleteConfirm(false);
      onDelete();
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Product images */}
      <div className="relative bg-gray-100 rounded-t-lg">
        {product.images && product.images.length > 0 ? (
          <>
            <div className="aspect-w-16 aspect-h-9 md:aspect-h-10">
              <img
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="object-contain w-full h-full"
              />
            </div>
            
            {/* Image navigation */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={goToPrevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 p-2 rounded-full"
                >
                  <svg 
                    className="h-6 w-6 text-gray-800" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 19l-7-7 7-7" 
                    />
                  </svg>
                </button>
                <button
                  onClick={goToNextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 p-2 rounded-full"
                >
                  <svg 
                    className="h-6 w-6 text-gray-800" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </button>
                
                {/* Image counter */}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                  {currentImageIndex + 1} / {product.images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="aspect-w-16 aspect-h-9 md:aspect-h-10 flex items-center justify-center">
            <svg 
              className="h-20 w-20 text-gray-400" 
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
        
        {/* Image thumbnails */}
        {product.images && product.images.length > 1 && (
          <div className="flex p-2 overflow-x-auto">
            {product.images.map((image, index) => (
              <div
                key={index}
                className={`relative w-16 h-16 mr-2 cursor-pointer ${
                  index === currentImageIndex ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img
                  src={image}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  className="object-cover w-full h-full rounded"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start mb-4">
          <div className="flex-1 min-w-0 mr-4">
            <h1 className="text-2xl font-bold text-gray-900 break-words">
              {product.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ProductStatusBadge status={product.status} large />
              
              {product.isCertified && (
                <CertificateBadge 
                  type={product.certificates && product.certificates.length > 0 
                    ? product.certificates[0] 
                    : 'organic'} 
                />
              )}
              
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {product.category}
                {product.subcategory && ` • ${product.subcategory}`}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-3xl font-bold text-primary">
              {formatPrice(product.price)}
              <span className="text-base text-gray-500 ml-1">/ {product.unit}</span>
            </div>
            
            {product.averageRating > 0 && (
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.floor(product.averageRating)
                        ? 'text-accent'
                        : star <= product.averageRating
                        ? 'text-accent'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 15.585l-6.327 3.323a1 1 0 01-1.451-1.054l1.208-7.04-5.118-4.988a1 1 0 01.555-1.705l7.073-1.027 3.157-6.404a1 1 0 011.79 0l3.157 6.404 7.073 1.027a1 1 0 01.555 1.705l-5.118 4.988 1.208 7.04a1 1 0 01-1.451 1.054L10 15.585z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
                <span className="ml-2 text-gray-700">
                  {product.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Opis
          </h2>
          <div className="prose max-w-none text-gray-700">
            {product.description}
          </div>
        </div>
        
        {/* Product details */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Szczegóły produktu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Ilość dostępna</h3>
              <p className="mt-1">{product.quantity} {product.unit}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Data zbioru</h3>
              <p className="mt-1">{harvestDateFormatted}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Kategoria</h3>
              <p className="mt-1 capitalize">{product.category}</p>
            </div>
            {product.subcategory && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Podkategoria</h3>
                <p className="mt-1 capitalize">{product.subcategory}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Dodano</h3>
              <p className="mt-1">{createdAtFormatted}</p>
            </div>
            {product.trackingId && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">ID Śledzenia</h3>
                <p className="mt-1">{product.trackingId}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Farmer details */}
        {isPopulatedOwner(product.owner) && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Rolnik
            </h2>
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-primary-light text-white flex items-center justify-center mr-4">
                {product.owner.profileImage ? (
                  <img 
                    src={product.owner.profileImage} 
                    alt={product.owner.fullName} 
                    className="h-12 w-12 rounded-full object-cover" 
                  />
                ) : (
                  <span className="text-lg font-medium">
                    {product.owner.fullName[0]}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">
                  {product.owner.fullName}
                </h3>
                <Link 
                  to={`/farmers/${product.owner._id}`} 
                  className="text-sm text-primary hover:text-primary-dark"
                >
                  Zobacz profil
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Location */}
        {product.location && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Lokalizacja
            </h2>
            <p className="text-gray-700">
              {product.location.address}
            </p>
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          {!isOwner && (
            <button
              type="button"
              className="flex-1 min-w-[140px] bg-primary text-white py-3 px-6 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Dodaj do koszyka
            </button>
          )}
          
          {isOwner && (
            <>
              <button
                type="button"
                onClick={handleEdit}
                className="flex-1 min-w-[140px] bg-transparent border border-primary text-primary py-3 px-6 rounded-md hover:bg-primary-light/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Edytuj produkt
              </button>
              
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 min-w-[140px] bg-transparent border border-red-500 text-red-500 py-3 px-6 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Usuń produkt
                </button>
              ) : (
                <div className="flex-1 min-w-[140px] flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 bg-red-500 text-white py-3 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Tak, usuń
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Anuluj
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;