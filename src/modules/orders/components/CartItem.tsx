// src/modules/orders/components/CartItem.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../../shared/utils';
import { useCart } from '../../../shared/hooks';

interface CartItemProps {
  item: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  };
  editable?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({ item, editable = true }) => {
  const { updateQuantity, removeFromCart } = useCart();
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (newQuantity === 0) {
      removeFromCart(item.productId);
    } else {
      updateQuantity(item.productId, newQuantity);
    }
  };
  
  return (
    <div className="flex items-center py-4 border-b border-gray-200">
      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="ml-4 flex-1">
        <Link to={`/products/${item.productId}`} className="text-lg font-medium text-gray-900 hover:text-primary">
          {item.name}
        </Link>
        
        <div className="mt-1 flex items-center">
          <span className="text-sm text-gray-600">
            {formatPrice(item.price)} × {item.quantity} = <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
          </span>
        </div>
      </div>
      
      <div className="ml-4 flex items-center">
        {editable ? (
          <div className="flex items-center">
            <select
              value={item.quantity}
              onChange={handleQuantityChange}
              className="border border-gray-300 rounded-md px-2 py-1 mr-2 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="0">Usuń</option>
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => removeFromCart(item.productId)}
              className="text-red-500 hover:text-red-700"
              aria-label="Remove item"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : (
          <span className="text-sm font-medium">
            {item.quantity} szt.
          </span>
        )}
      </div>
    </div>
  );
};

export default CartItem;