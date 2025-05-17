// src/modules/products/components/ProductStatusBadge.tsx
import React, { type JSX } from 'react';
import classNames from 'classnames';
import { type ProductStatus } from '../../../shared/types';

interface ProductStatusBadgeProps {
  status: ProductStatus;
  large?: boolean;
  className?: string;
}

const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({
  status,
  large = false,
  className = ''
}) => {
  // Map status to display text
  const statusText: Record<ProductStatus, string> = {
    available: 'Dostępny',
    preparing: 'W przygotowaniu',
    shipped: 'Wysłany',
    delivered: 'Dostarczony',
    unavailable: 'Niedostępny'
  };

  // Map status to styles
  const statusStyles: Record<ProductStatus, string> = {
    available: 'bg-green-100 text-green-800',
    preparing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-indigo-100 text-indigo-800',
    unavailable: 'bg-gray-100 text-gray-800'
  };

  // Map status to icon path
  const statusIcons: Record<ProductStatus, JSX.Element> = {
    available: (
      <svg
        className={classNames(
          large ? "h-5 w-5" : "h-4 w-4",
          "text-green-500"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    preparing: (
      <svg
        className={classNames(
          large ? "h-5 w-5" : "h-4 w-4",
          "text-blue-500"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
        />
      </svg>
    ),
    shipped: (
      <svg
        className={classNames(
          large ? "h-5 w-5" : "h-4 w-4",
          "text-purple-500"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    delivered: (
      <svg
        className={classNames(
          large ? "h-5 w-5" : "h-4 w-4",
          "text-indigo-500"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    unavailable: (
      <svg
        className={classNames(
          large ? "h-5 w-5" : "h-4 w-4",
          "text-gray-500"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
        />
      </svg>
    )
  };

  return (
    <div
      className={classNames(
        "inline-flex items-center rounded-full",
        large ? "px-3 py-1" : "px-2 py-0.5",
        statusStyles[status],
        className
      )}
    >
      {statusIcons[status]}
      <span className={classNames(
        large ? "ml-2 text-sm" : "ml-1 text-xs",
        "font-medium"
      )}>
        {statusText[status]}
      </span>
    </div>
  );
};

export default ProductStatusBadge;