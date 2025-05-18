// backend/constants/index.ts
// Validation constants for the backend
export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    MAX_IMAGES_PER_PRODUCT: 5,
    MAX_FILE_SIZE_MB: 5,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_REVIEW_LENGTH: 1000
  };
  
  // Product statuses
  export const PRODUCT_STATUSES = {
    AVAILABLE: 'available' as const,
    PREPARING: 'preparing' as const,
    SHIPPED: 'shipped' as const,
    DELIVERED: 'delivered' as const,
    UNAVAILABLE: 'unavailable' as const
  };
  
  // Order statuses
  export const ORDER_STATUSES = {
    PENDING: 'pending' as const,
    PAID: 'paid' as const,
    PROCESSING: 'processing' as const,
    SHIPPED: 'shipped' as const,
    DELIVERED: 'delivered' as const,
    CANCELLED: 'cancelled' as const
  };
  
  // Payment statuses
  export const PAYMENT_STATUSES = {
    PENDING: 'pending' as const,
    COMPLETED: 'completed' as const,
    FAILED: 'failed' as const,
    REFUNDED: 'refunded' as const
  };
  
  // Certificate types
  export const CERTIFICATE_TYPES = {
    ORGANIC: 'organic' as const,
    ECO: 'eco' as const,
    FAIR_TRADE: 'fair-trade' as const,
    OTHER: 'other' as const
  };