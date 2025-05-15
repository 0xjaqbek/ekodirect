// src/modules/users/components/FarmerCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistance } from '../../../shared/utils';
import type { User } from '../../../shared/types';
import UserAvatar from './UserAvatar';
import classNames from 'classnames';

interface FarmerCardProps {
  farmer: User;
  distance?: number;
  className?: string;
}

const FarmerCard: React.FC<FarmerCardProps> = ({ 
  farmer, 
  distance, 
  className = '' 
}) => {
  // Przygotuj inicjały z imienia i nazwiska
  const initials = farmer.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Ilość gwiazdek w ocenie (przykładowa logika)
  const rating = farmer.reviews && farmer.reviews.length > 0
    ? 4.5 // Tutaj byłaby faktyczna kalkulacja średniej oceny
    : null;

  // Liczba produktów (przykładowa logika)
  const productsCount = farmer.createdProducts?.length || 0;

  return (
    <Link to={`/farmers/${farmer._id}`}>
      <div className={classNames(
        "bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow",
        className
      )}>
        <div className="flex items-start space-x-4">
          <UserAvatar
            src={farmer.profileImage}
            initials={initials}
            size="lg"
            alt={farmer.fullName}
          />
          
          <div className="flex-1">
            <h3 className="text-lg font-medium text-primary">{farmer.fullName}</h3>
            
            <div className="text-sm text-gray-600 mt-1">
              {farmer.location.address}
              {distance && (
                <span className="ml-2 text-primary font-medium">
                  {formatDistance(distance)}
                </span>
              )}
            </div>
            
            {farmer.bio && (
              <p className="mt-2 text-gray-700 line-clamp-2">{farmer.bio}</p>
            )}
            
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center">
                {rating ? (
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.floor(rating)
                              ? 'text-accent'
                              : star <= rating
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
                    </div>
                    <span className="ml-1 text-sm text-gray-600">
                      {rating.toFixed(1)}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Brak ocen</span>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                {productsCount} {productsCount === 1 ? 'produkt' : 
                  productsCount % 10 >= 2 && productsCount % 10 <= 4 && (productsCount % 100 < 10 || productsCount % 100 >= 20) 
                    ? 'produkty' 
                    : 'produktów'}
              </div>
            </div>
            
            {farmer.certificates && farmer.certificates.length > 0 && (
              <div className="mt-3 flex flex-wrap">
                {farmer.certificates.slice(0, 3).map((cert, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2 mb-1"
                  >
                    {typeof cert === 'string' ? cert : cert}
                  </span>
                ))}
                {farmer.certificates.length > 3 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    +{farmer.certificates.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FarmerCard;
