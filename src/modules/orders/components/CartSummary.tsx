// src/modules/orders/components/CartSummary.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../../../shared/utils';
import { useCart } from '../../../shared/hooks';
import { useAuth } from '../../../modules/auth';

interface CartSummaryProps {
  showCheckoutButton?: boolean;
  className?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ 
  showCheckoutButton = true,
  className = '' 
}) => {
  const { cart, cartTotal, itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Calculate shipping cost - free shipping over 100 PLN
  const shippingCost = cartTotal >= 100 ? 0 : 15;
  
  // Calculate total with shipping
  const totalWithShipping = cartTotal + shippingCost;
  
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };
  
  if (cart.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Podsumowanie koszyka</h2>
        <p className="text-gray-500">Twój koszyk jest pusty.</p>
        <Link 
          to="/products" 
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Przeglądaj produkty
        </Link>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Podsumowanie koszyka</h2>
      
      <div className="space-y-4 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Suma produktów ({itemCount})</span>
          <span className="font-medium">{formatPrice(cartTotal)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Koszt dostawy</span>
          {shippingCost === 0 ? (
            <span className="font-medium text-green-600">Darmowa</span>
          ) : (
            <span className="font-medium">{formatPrice(shippingCost)}</span>
          )}
        </div>
        
        <div className="border-t border-gray-200 pt-4 flex justify-between">
          <span className="text-lg font-medium text-gray-900">Razem</span>
          <span className="text-lg font-bold text-primary">{formatPrice(totalWithShipping)}</span>
        </div>
      </div>
      
      {showCheckoutButton && (
        <button
          onClick={handleCheckout}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Przejdź do kasy
        </button>
      )}
      
      {cartTotal < 100 && shippingCost > 0 && (
        <p className="mt-4 text-sm text-gray-600">
          Dodaj produkty za {formatPrice(100 - cartTotal)}, aby otrzymać darmową dostawę.
        </p>
      )}
    </div>
  );
};

export default CartSummary;