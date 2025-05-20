// src/modules/orders/pages/CartPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../../shared/hooks';
import CartItem from '../components/CartItem';
import CartSummary from '../components/CartSummary';

const CartPage: React.FC = () => {
  const { cart, clearCart } = useCart();
  
  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h2 className="mt-2 text-lg font-medium text-gray-900">Twój koszyk jest pusty</h2>
          <p className="mt-1 text-sm text-gray-500">
            Nie masz jeszcze żadnych produktów w koszyku.
          </p>
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Przeglądaj produkty
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Koszyk</h1>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        <div className="lg:col-span-7">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flow-root">
              <ul className="-my-6 divide-y divide-gray-200">
                {cart.map((item) => (
                  <li key={item.productId} className="py-6">
                    <CartItem item={item} />
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => clearCart()}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Wyczyść koszyk
              </button>
              
              <Link
                to="/products"
                className="text-sm text-primary hover:text-primary-dark"
              >
                Kontynuuj zakupy
              </Link>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-5">
          <CartSummary />
        </div>
      </div>
    </div>
  );
};

export default CartPage;