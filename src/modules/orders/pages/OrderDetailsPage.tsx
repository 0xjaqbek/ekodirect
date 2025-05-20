// src/modules/orders/pages/OrderDetailsPage.tsx
import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { formatPrice, formatDate } from '../../../shared/utils';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import CarbonFootprintInfo from '../components/CarbonFootprintInfo';

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedOrder, isLoading, error, fetchOrder } = useOrders();
  
  useEffect(() => {
    if (id) {
      fetchOrder(id);
    }
  }, [id, fetchOrder]);
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (error || !selectedOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error || 'Nie znaleziono zamówienia'}
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Wróć do listy zamówień
          </button>
        </div>
      </div>
    );
  }
  
  // Calculate shipping cost
  const shippingCost = selectedOrder.totalPrice >= 100 ? 0 : 15;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center text-sm text-primary hover:text-primary-dark font-medium"
        >
          <svg
            className="mr-2 h-5 w-5"
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
          Wróć do zamówień
        </button>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Zamówienie #{selectedOrder._id.substring(0, 8)}
          </h1>
          <p className="text-sm text-gray-500">
            Złożone {formatDate(selectedOrder.createdAt)}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <OrderStatusBadge status={selectedOrder.status} size="lg" />
        </div>
      </div>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        <div className="lg:col-span-7">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Szczegóły zamówienia
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Produkty
                </h3>
                <ul className="divide-y divide-gray-200">
                  {selectedOrder.items.map((item, index) => (
                    <li key={index} className="py-4 flex justify-between">
                      <div>
                        <Link
                          to={`/products/${typeof item.product === 'string' ? item.product : item.product._id}`}
                          className="text-sm font-medium text-primary hover:text-primary-dark"
                        >
                          {typeof item.product === 'string'
                            ? `Produkt ${item.product.substring(0, 6)}`
                            : item.product.name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatPrice(item.priceAtPurchase)} × {item.quantity} = {formatPrice(item.priceAtPurchase * item.quantity)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <OrderStatusTimeline statusHistory={selectedOrder.statusHistory} />
              )}
              
              {selectedOrder.carbonFootprint && (
                <CarbonFootprintInfo footprint={selectedOrder.carbonFootprint} />
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-5">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Podsumowanie
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Suma produktów</span>
                <span className="text-sm font-medium">{formatPrice(selectedOrder.totalPrice)}</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Koszt dostawy</span>
                <span className="text-sm font-medium">
                  {shippingCost === 0 ? (
                    <span className="text-green-600">Darmowa</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>
              
              <div className="border-t border-gray-200 pt-2 flex justify-between font-medium">
                <span className="text-gray-900">Razem</span>
                <span className="text-primary">
                  {formatPrice(selectedOrder.totalPrice + shippingCost)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Informacje o dostawie
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  Adres dostawy
                </h3>
                <address className="text-sm text-gray-600 mt-1 not-italic">
                  {selectedOrder.shippingAddress.street}<br />
                  {selectedOrder.shippingAddress.postalCode} {selectedOrder.shippingAddress.city}<br />
                  {selectedOrder.shippingAddress.country}
                </address>
              </div>
              
              {selectedOrder.deliveryDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Planowana data dostawy
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(selectedOrder.deliveryDate)}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Płatność
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                  Status płatności
                </h3>
                <span className={`text-sm font-medium ${
                  selectedOrder.paymentStatus === 'completed'
                    ? 'text-green-600'
                    : selectedOrder.paymentStatus === 'pending'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {selectedOrder.paymentStatus === 'completed'
                    ? 'Opłacone'
                    : selectedOrder.paymentStatus === 'pending'
                    ? 'Oczekuje na płatność'
                    : 'Błąd płatności'}
                </span>
              </div>
              
              {selectedOrder.paymentId && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Identyfikator płatności
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedOrder.paymentId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;