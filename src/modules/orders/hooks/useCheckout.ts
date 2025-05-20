// src/modules/orders/hooks/useCheckout.ts

import { useCheckoutStore } from '../store/checkoutStore';
import { useCart } from '../../../shared/hooks';
import { useOrdersStore } from '../store/ordersStore';
import type { CreateOrderRequest } from '../../../shared/types';

export const useCheckout = () => {
  const {
    step,
    shippingAddress,
    deliveryDate,
    paymentMethod,
    paymentIntent,
    isProcessing,
    error,
    setStep,
    setShippingAddress,
    setDeliveryDate,
    setPaymentMethod,
    createPaymentIntent,
    processPayment,
    resetCheckout,
    clearError
  } = useCheckoutStore();

  const { createOrder } = useOrdersStore();
  const { cart, cartTotal, clearCart } = useCart();

  // Helper function to complete order after payment
  const completeOrder = async () => {
    if (!shippingAddress || cart.length === 0) {
      return null;
    }

    const orderItems = cart.map(item => ({
      product: item.productId,
      quantity: item.quantity
    }));

    const orderData: CreateOrderRequest = {
      items: orderItems,
      shippingAddress,
      deliveryDate: deliveryDate || undefined
    };

    const order = await createOrder(orderData as any);
    
    if (order) {
      clearCart();
      resetCheckout();
    }
    
    return order;
  };

  return {
    // State
    step,
    shippingAddress,
    deliveryDate,
    paymentMethod,
    paymentIntent,
    isProcessing,
    error,
    
    // Cart info
    cart,
    cartTotal,
    
    // Methods
    setStep,
    setShippingAddress,
    setDeliveryDate,
    setPaymentMethod,
    createPaymentIntent,
    processPayment,
    completeOrder,
    resetCheckout,
    clearError
  };
};

export default useCheckout;