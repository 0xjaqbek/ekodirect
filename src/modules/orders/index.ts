// src/modules/orders/index.ts
// Export components
export { default as CartItem } from './components/CartItem';
export { default as CartSummary } from './components/CartSummary';
export { default as OrderSummary } from './components/orderSummary';
export { default as OrderStatusBadge } from './components/OrderStatusBadge';
export { default as OrderStatusTimeline } from './components/OrderStatusTimeline';
export { default as CarbonFootprintInfo } from './components/CarbonFootprintInfo';
export { default as ShippingForm } from './components/ShippingForm';
export { default as PaymentForm } from './components/PaymentForm';

// Export pages
export { default as CartPage } from './pages/CartPage';
export { default as CheckoutPage } from './pages/CheckoutPage';
export { default as OrdersListPage } from './pages/OrdersListPage';
export { default as OrderDetailsPage } from './pages/OrderDetailsPage';

// Export hooks
export { default as useOrders } from './hooks/useOrders';
export { default as useCheckout } from './hooks/useCheckout';

// Export store
export { useOrdersStore } from './store/ordersStore';
export type { OrdersState } from './store/ordersStore';
export { useCheckoutStore } from './store/checkoutStore';
export type { CheckoutState } from './store/checkoutStore';

// Export utils
export * from './utils/orderValidation';