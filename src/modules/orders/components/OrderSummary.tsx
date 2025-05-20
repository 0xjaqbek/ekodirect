// src/modules/orders/components/OrderSummary.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, formatDate } from '../../../shared/utils';
import type { Order } from '../../../shared/types';
import OrderStatusBadge from './OrderStatusBadge';
import CarbonFootprintInfo from './CarbonFootprintInfo';

interface OrderSummaryProps {
  order: Order;
  showDetails?: boolean;
  className?: string;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  order,
  showDetails = true,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Zamówienie #{order._id.substring(0, 8)}
          </h2>
          <p className="text-sm text-gray-500">
            {formatDate(order.createdAt)}
          </p>
        </div>
        
        <OrderStatusBadge status={order.status} />
      </div>
      
      <div className="border-t border-gray-200 py-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Produkty</h3>
        <ul className="space-y-2">
          {order.items.map((item, index) => (
            <li key={index} className="flex justify-between">
              <div>
                <span className="text-sm font-medium">
                  {typeof item.product === 'string' 
                    ? `Produkt ${item.product.substring(0, 6)}` 
                    : item.product.name}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  {item.quantity} szt.
                </span>
              </div>
              <span className="text-sm font-medium">
                {formatPrice(item.priceAtPurchase * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="border-t border-gray-200 py-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Suma produktów</span>
          <span className="text-sm font-medium">{formatPrice(order.totalPrice)}</span>
        </div>
        
        {/* Delivery cost would typically be separated in the order model */}
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Koszt dostawy</span>
          <span className="text-sm font-medium">
            {order.totalPrice >= 100 ? 'Darmowa' : formatPrice(15)}
          </span>
        </div>
        
        <div className="flex justify-between font-medium">
          <span className="text-gray-900">Razem</span>
          <span className="text-primary">
            {formatPrice(order.totalPrice + (order.totalPrice >= 100 ? 0 : 15))}
          </span>
        </div>
      </div>
      
      {order.carbonFootprint && (
        <div className="border-t border-gray-200 py-4">
          <CarbonFootprintInfo footprint={order.carbonFootprint} />
        </div>
      )}
      
      {showDetails && (
        <div className="border-t border-gray-200 pt-4 mt-2">
          <Link 
            to={`/orders/${order._id}`}
            className="text-primary hover:text-primary-dark font-medium text-sm"
          >
            Zobacz szczegóły
          </Link>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;