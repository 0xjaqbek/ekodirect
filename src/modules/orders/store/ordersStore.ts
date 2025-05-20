// src/modules/orders/store/ordersStore.ts
import { create } from 'zustand';
import { API_ROUTES } from '../../../shared/constants';
import apiClient from '../../../shared/api';
import type { Order, ApiResponse, PaginatedResponse } from '../../../shared/types';

export interface OrdersState {
  orders: Order[];
  selectedOrder: Order | null;
  totalOrders: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchOrders: (page?: number, limit?: number) => Promise<void>;
  fetchOrder: (id: string) => Promise<Order | null>;
  createOrder: (orderData: Omit<Order, '_id' | 'createdAt' | 'updatedAt'>) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: string, note?: string) => Promise<boolean>;
  clearSelectedOrder: () => void;
  clearError: () => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  // Initial state
  orders: [],
  selectedOrder: null,
  totalOrders: 0,
  isLoading: false,
  error: null,
  
  // Fetch all orders for the current user
  fetchOrders: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.get<PaginatedResponse<Order>>(
        API_ROUTES.ORDERS.LIST,
        { page, limit }
      );
      
      if (response.success && response.data) {
        set({
          orders: response.data.items,
          totalOrders: response.data.total,
          isLoading: false
        });
      } else {
        set({
          error: response.error || 'Failed to fetch orders',
          isLoading: false
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred while fetching orders',
        isLoading: false
      });
    }
  },
  
  // Fetch a single order by ID
  fetchOrder: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.get<Order>(API_ROUTES.ORDERS.BY_ID(id));
      
      if (response.success && response.data) {
        set({
          selectedOrder: response.data,
          isLoading: false
        });
        return response.data;
      } else {
        set({
          error: response.error || 'Failed to fetch order',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred while fetching the order',
        isLoading: false
      });
      return null;
    }
  },
  
  // Create a new order
  createOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.post<Order>(API_ROUTES.ORDERS.LIST, orderData);
      
      if (response.success && response.data) {
        set({
          selectedOrder: response.data,
          isLoading: false
        });
        
        // Refresh order list
        await get().fetchOrders();
        
        return response.data;
      } else {
        set({
          error: response.error || 'Failed to create order',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred while creating the order',
        isLoading: false
      });
      return null;
    }
  },
  
  // Update order status
  updateOrderStatus: async (orderId: string, status: string, note?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.put<Order>(API_ROUTES.ORDERS.STATUS(orderId), {
        status,
        note
      });
      
      if (response.success && response.data) {
        // Update selected order if it's the one being modified
        if (get().selectedOrder?._id === orderId) {
          set({ selectedOrder: response.data });
        }
        
        // Refresh order list
        await get().fetchOrders();
        
        set({ isLoading: false });
        return true;
      } else {
        set({
          error: response.error || 'Failed to update order status',
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred while updating order status',
        isLoading: false
      });
      return false;
    }
  },
  
  // Clear selected order
  clearSelectedOrder: () => set({ selectedOrder: null }),
  
  // Clear error
  clearError: () => set({ error: null })
}));

export default useOrdersStore;