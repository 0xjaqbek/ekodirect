// src/modules/products/components/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, truncateText } from '../../../shared/utils';
import ProductStatusBadge from './ProductStatusBadge';
import CertificateBadge from './CertificateBadge';
import { isPopulatedOwner } from '../types';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  showFarmer?: boolean;
  showDistance?: boolean;
  className?: string;
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showFarmer = false,
  showDistance = false,
  className = '',
  onClick
}) => {
  // Default image if product has no images
  const defaultImage = '/placeholder-product.jpg';
  
  // Get first image or use default
  const productImage = product.images && product.images.length > 0
    ? product.images[0]
    : defaultImage;
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg ${className}`}
      onClick={onClick}
    >
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative pb-[70%] bg-gray-100">
          <img
            src={productImage}
            alt={product.name}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
          
          {/* Status badge */}
          <div className="absolute top-2 right-2">
            <ProductStatusBadge status={product.status} />
          </div>
          
          {/* Distance if provided */}
          {showDistance && product.distance && (
            <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700">
              {product.distance} km
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 flex-1">
              {product.name}
            </h3>
            <span className="text-lg font-bold text-primary whitespace-nowrap ml-2">
              {formatPrice(product.price)}
              <span className="text-xs text-gray-500 ml-1">/ {product.unit}</span>
            </span>
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {truncateText(product.description, 100)}
          </p>
          
          {/* Show farmer info if requested */}
          {showFarmer && product.owner && (
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <svg 
                className="h-4 w-4 mr-1 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
              <span>
                {isPopulatedOwner(product.owner) 
                  ? product.owner.fullName 
                  : 'Rolnik ekologiczny'}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex space-x-1">
              {/* Show first certificate or organic badge if certified */}
              {product.isCertified && (
                <CertificateBadge 
                  type={product.certificates && product.certificates.length > 0 
                    ? product.certificates[0] 
                    : 'organic'} 
                  small 
                />
              )}
              
              {/* Category badge */}
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {product.category}
              </span>
            </div>
            
            {/* Show average rating if exists */}
            {product.averageRating > 0 && (
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-accent"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 15.585l-6.327 3.323a1 1 0 01-1.451-1.054l1.208-7.04-5.118-4.988a1 1 0 01.555-1.705l7.073-1.027 3.157-6.404a1 1 0 011.79 0l3.157 6.404 7.073 1.027a1 1 0 01.555 1.705l-5.118 4.988 1.208 7.04a1 1 0 01-1.451 1.054L10 15.585z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-700">
                  {product.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;