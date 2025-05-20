// src/modules/orders/pages/CheckoutPage.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../../modules/auth';
import { useCart } from '../../../shared/hooks';
import { useCheckout } from '../hooks/useCheckout';
import ShippingForm from '../components/ShippingForm';
import PaymentForm from '../components/PaymentForm';
import CartItem from '../components/CartItem';
import { formatPrice } from '../../../shared/utils';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_your_stripe_key');

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, cartTotal } = useCart();
  const {
    step,
    shippingAddress,
    paymentIntent,
    isProcessing,
    error,
    setStep,
    setShippingAddress,
    createPaymentIntent,
    completeOrder
  } = useCheckout();
  
  const [orderCompleted, setOrderCompleted] = useState(false);
  
  // Shipping cost calculation
  const shippingCost = cartTotal >= 100 ? 0 : 15;
  const totalWithShipping = cartTotal + shippingCost;
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/checkout" replace />;
  }
  
  // Redirect if cart is empty
  if (cart.length === 0 && !orderCompleted) {
    return <Navigate to="/cart" replace />;
  }
  
  // Handle shipping form submission
  const handleShippingSubmit = async (data: any) => {
    setShippingAddress(data);
    
    // Create payment intent with Stripe
    const intent = await createPaymentIntent(totalWithShipping * 100); // Amount in cents
    
    if (intent) {
      setStep('payment');
    }
  };
  
  // Handle payment form submission
  const handlePaymentSubmit = async (paymentMethod: any) => {
    const order = await completeOrder();
    
    if (order) {
      setOrderCompleted(true);
      navigate(`/orders/${order._id}?status=success`);
    }
  };
  
  // Steps indicator
  const steps = [
    { id: 'shipping', name: 'Adres dostawy' },
    { id: 'payment', name: 'Płatność' }
  ];
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <nav className="flex justify-center" aria-label="Progress">
          <ol className="space-y-6 md:flex md:space-y-0">
            {steps.map((stepItem, stepIdx) => (
              <li key={stepItem.id} className="md:flex-1">
                <div
                  className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0 ${
                    stepItem.id === step
                      ? 'border-primary'
                      : stepIdx < steps.findIndex(s => s.id === step)
                      ? 'border-primary-light'
                      : 'border-gray-200'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      stepItem.id === step
                        ? 'text-primary'
                        : stepIdx < steps.findIndex(s => s.id === step)
                        ? 'text-primary-light'
                        : 'text-gray-500'
                    }`}
                  >
                    Krok {stepIdx + 1}
                  </span>
                  <span className="text-sm font-medium">{stepItem.name}</span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        <div className="lg:col-span-7">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {step === 'shipping' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Adres dostawy
                </h2>
                <ShippingForm
                  onSubmit={handleShippingSubmit}
                  defaultValues={shippingAddress || undefined}
                  isLoading={isProcessing}
                />
              </div>
            )}
            
            {step === 'payment' && (
              <div>
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    amount={totalWithShipping}
                    onSubmit={handlePaymentSubmit}
                    onBack={() => setStep('shipping')}
                    clientSecret={paymentIntent?.clientSecret}
                  />
                </Elements>
              </div>
            )}
            
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-5">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Podsumowanie zamówienia
            </h2>
            
            <div className="max-h-60 overflow-y-auto mb-4">
              <ul className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <li key={item.productId} className="py-3">
                    <CartItem item={item} editable={false} />
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Suma produktów</span>
                <span className="text-sm font-medium">{formatPrice(cartTotal)}</span>
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
              
              <div className="flex justify-between font-medium">
                <span className="text-gray-900">Razem</span>
                <span className="text-primary">{formatPrice(totalWithShipping)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;