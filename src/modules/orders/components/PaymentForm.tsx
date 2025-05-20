// src/modules/orders/components/PaymentForm.tsx
import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { formatPrice } from '../../../shared/utils';
import classNames from 'classnames';

interface PaymentFormProps {
  amount: number;
  onSubmit: (paymentMethod: any) => Promise<void>;
  onBack: () => void;
  clientSecret?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onSubmit,
  onBack,
  clientSecret
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }
    
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      
      if (error) {
        setError(error.message || 'Payment processing error');
        setProcessing(false);
        return;
      }
      
      // Confirm payment with the payment intent
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id
      });
      
      if (confirmError) {
        setError(confirmError.message || 'Payment confirmation error');
        setProcessing(false);
        return;
      }
      
      // Payment successful, call the onSubmit callback
      await onSubmit(paymentMethod);
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred during payment processing');
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Płatność kartą</h2>
        <p className="text-gray-600 mb-4">
          Kwota do zapłaty: <span className="font-bold text-primary">{formatPrice(amount)}</span>
        </p>
        
        <div className="p-4 border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-primary">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
        
        <div className="text-sm text-gray-500 mt-2">
          Twoje dane płatności są bezpieczne dzięki szyfrowaniu SSL.
        </div>
      </div>
      
      <div className="pt-4 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={processing}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Wróć
        </button>
        
        <button
          type="submit"
          disabled={!stripe || !elements || processing}
          className={classNames(
            "flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            (!stripe || !elements || processing) && "opacity-70 cursor-not-allowed"
          )}
        >
          {processing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Przetwarzanie...
            </>
          ) : (
            "Zapłać"
          )}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;