// src/modules/orders/store/checkoutStore.ts
import { create } from 'zustand';
import { API_ROUTES } from '../../../shared/constants';
import apiClient from '../../../shared/api';
import type { Address, ApiResponse, Order } from '../../../shared/types';

export interface CheckoutState {
  step: 'shipping' | 'payment' | 'summary';
  shippingAddress: Address | null;
  deliveryDate: Date | null;
  paymentMethod: string | null;
  paymentIntent: any | null;
  isProcessing: boolean;
  error: string | null;
  
  // Actions
  setStep: (step: 'shipping' | 'payment' | 'summary') => void;
  setShippingAddress: (address: Address) => void;
  setDeliveryDate: (date: Date) => void;
  setPaymentMethod: (method: string) => void;
  createPaymentIntent: (amount: number) => Promise<any | null>;
  processPayment: (paymentData: any) => Promise<boolean>;
  resetCheckout: () => void;
  clearError: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  // Initial state
  step: 'shipping',
  shippingAddress: null,
  deliveryDate: null,
  paymentMethod: null,
  paymentIntent: null,
  isProcessing: false,
  error: null,
  
  // Set current checkout step
  setStep: (step) => set({ step }),
  
  // Set shipping address
  setShippingAddress: (address) => set({ shippingAddress: address }),
  
  // Set delivery date
  setDeliveryDate: (date) => set({ deliveryDate: date }),
  
  // Set payment method
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  
  // Create payment intent with Stripe
  createPaymentIntent: async (amount: number) => {
    set({ isProcessing: true, error: null });
    
    try {
      const response = await apiClient.post<{ clientSecret: string }>(
        API_ROUTES.PAYMENTS.CREATE_INTENT,
        { amount }
      );
      
      if (response.success && response.data) {
        set({
          paymentIntent: response.data,
          isProcessing: false
        });
        return response.data;
      } else {
        set({
          error: response.error || 'Failed to create payment intent',
          isProcessing: false
        });
        return null;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred while creating payment intent',
        isProcessing: false
      });
      return null;
    }
  },
  
  // Process payment
  processPayment: async (paymentData) => {
    set({ isProcessing: true, error: null });
    
    try {
      const response = await apiClient.post<{ success: boolean }>(
        API_ROUTES.PAYMENTS.PROCESS,
        paymentData
      );
      
      set({ isProcessing: false });
      
      if (response.success && response.data?.success) {
        return true;
      } else {
        set({ error: response.error || 'Payment processing failed' });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred during payment processing',
        isProcessing: false
      });
      return false;
    }
  },
  
  // Reset checkout state
  resetCheckout: () => set({
    step: 'shipping',
    shippingAddress: null,
    deliveryDate: null,
    paymentMethod: null,
    paymentIntent: null,
    error: null
  }),
  
  // Clear error
  clearError: () => set({ error: null })
}));

export default useCheckoutStore;