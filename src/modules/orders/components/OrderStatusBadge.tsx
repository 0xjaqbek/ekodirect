// src/modules/orders/components/OrderStatusBadge.tsx
import React from 'react';
import classNames from 'classnames';
import { ORDER_STATUSES } from '../../../shared/constants';

interface OrderStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  size = 'md',
  className = ''
}) => {
  // Map status to display text
  const statusText: Record<string, string> = {
    [ORDER_STATUSES.PENDING]: 'Oczekujące',
    [ORDER_STATUSES.PAID]: 'Opłacone',
    [ORDER_STATUSES.PROCESSING]: 'W realizacji',
    [ORDER_STATUSES.SHIPPED]: 'Wysłane',
    [ORDER_STATUSES.DELIVERED]: 'Dostarczone',
    [ORDER_STATUSES.CANCELLED]: 'Anulowane'
  };

  // Map status to styles
  const statusStyles: Record<string, string> = {
    [ORDER_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
    [ORDER_STATUSES.PAID]: 'bg-blue-100 text-blue-800',
    [ORDER_STATUSES.PROCESSING]: 'bg-purple-100 text-purple-800',
    [ORDER_STATUSES.SHIPPED]: 'bg-indigo-100 text-indigo-800',
    [ORDER_STATUSES.DELIVERED]: 'bg-green-100 text-green-800',
    [ORDER_STATUSES.CANCELLED]: 'bg-red-100 text-red-800'
  };

  // Map size to padding and text size
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  };

  // Get the status style or default to gray if status is unknown
  const style = status in statusStyles ? statusStyles[status] : 'bg-gray-100 text-gray-800';
  
  // Get the status text or show the status as is if unknown
  const text = status in statusText ? statusText[status] : status;

  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full font-medium",
        style,
        sizeClasses[size],
        className
      )}
    >
      {text}
    </span>
  );
};

export default OrderStatusBadge;