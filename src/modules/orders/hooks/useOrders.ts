// src/modules/orders/hooks/useOrders.ts
import { useEffect } from 'react';
import { useOrdersStore } from '../store/ordersStore';

export const useOrders = (initialPage?: number, initialLimit?: number) => {
  const {
    orders,
    selectedOrder,
    totalOrders,
    isLoading,
    error,
    fetchOrders,
    fetchOrder,
    createOrder,
    updateOrderStatus,
    clearSelectedOrder,
    clearError
  } = useOrdersStore();

  // Load orders on mount if initialPage provided
  useEffect(() => {
    if (initialPage) {
      fetchOrders(initialPage, initialLimit);
    }
  }, [initialPage, initialLimit, fetchOrders]);

  return {
    // State
    orders,
    selectedOrder,
    totalOrders,
    isLoading,
    error,
    
    // Methods
    fetchOrders,
    fetchOrder,
    createOrder,
    updateOrderStatus,
    clearSelectedOrder,
    clearError
  };
};

export default useOrders;