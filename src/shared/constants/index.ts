// shared/constants/index.ts

// Kategorie produktów
export const PRODUCT_CATEGORIES = [
    'warzywa',
    'owoce',
    'nabiał',
    'mięso',
    'zboża',
    'przetwory',
    'miód',
    'jaja',
    'napoje',
    'inne'
  ]as const;
  export type ProductCategories = typeof PRODUCT_CATEGORIES[];
  
  export const PRODUCT_SUBCATEGORIES: Record<string, string[]> = {
    'warzywa': ['korzeniowe', 'liściaste', 'psiankowate', 'dyniowate', 'cebulowe', 'strączkowe', 'inne'],
    'owoce': ['jabłka i gruszki', 'pestkowce', 'jagodowe', 'cytrusy', 'egzotyczne', 'inne'],
    'nabiał': ['mleko', 'sery', 'jogurty', 'masło', 'śmietana', 'inne'],
    'mięso': ['wołowe', 'wieprzowe', 'drób', 'dziczyzna', 'inne'],
    'zboża': ['pszenica', 'żyto', 'owies', 'jęczmień', 'gryka', 'inne'],
    'przetwory': ['dżemy', 'sosy', 'przetwory warzywne', 'przetwory owocowe', 'inne'],
    'miód': ['wielokwiatowy', 'lipowy', 'rzepakowy', 'spadziowy', 'inne'],
    'jaja': ['kurze', 'przepiórcze', 'gęsie', 'kacze', 'inne'],
    'napoje': ['soki', 'syropy', 'wina', 'napoje fermentowane', 'inne'],
    'inne': ['zioła', 'grzyby', 'orzechy', 'nasiona', 'inne']
  };
  
  // Jednostki produktów
  export const PRODUCT_UNITS = ['kg', 'g', 'szt', 'l', 'ml', 'opak']as const;
  export type ProductUnit = typeof PRODUCT_UNITS[number];
  
  // Statusy zamówień
  export const ORDER_STATUSES = {
    PENDING: 'pending' as const,
    PAID: 'paid' as const,
    PROCESSING: 'processing' as const,
    SHIPPED: 'shipped' as const,
    DELIVERED: 'delivered' as const,
    CANCELLED: 'cancelled' as const
  };
  
  // Statusy płatności
  export const PAYMENT_STATUSES = {
    PENDING: 'pending' as const,
    COMPLETED: 'completed' as const,
    FAILED: 'failed' as const,
    REFUNDED: 'refunded' as const
  };
  
  // Statusy produktów
  export const PRODUCT_STATUSES = {
    AVAILABLE: 'available' as const,
    PREPARING: 'preparing' as const,
    SHIPPED: 'shipped' as const,
    DELIVERED: 'delivered' as const,
    UNAVAILABLE: 'unavailable' as const
  };
  
  // Typy certyfikatów
  export const CERTIFICATE_TYPES = {
    ORGANIC: 'organic' as const,
    ECO: 'eco' as const,
    FAIR_TRADE: 'fair-trade' as const,
    OTHER: 'other' as const
  };
  
  // Statusy moderacji
  export const MODERATION_STATUSES = {
    PENDING: 'pending' as const,
    APPROVED: 'approved' as const,
    REJECTED: 'rejected' as const
  };
  
// src/shared/constants/apiRoutes.ts
// API Routes separated for better organization

export const API_ROUTES = {
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login',
      REFRESH_TOKEN: '/api/auth/refresh-token',
      VERIFY_EMAIL: '/api/auth/verify-email',
      RESEND_VERIFICATION: '/api/auth/resend-verification',
      REQUEST_PASSWORD_RESET: '/api/auth/request-password-reset',
      RESET_PASSWORD: '/api/auth/reset-password'
    },
    USERS: {
      ME: '/api/users/me',
      BY_ID: (id: string) => `/api/users/${id}`
    },
    PRODUCTS: {
      LIST: '/api/products',
      BY_ID: (id: string) => `/api/products/${id}`,
      TRACKING: (id: string) => `/api/products/${id}/tracking`,
      STATUS: (id: string) => `/api/products/${id}/status`,
      IMAGES: (id: string) => `/api/products/${id}/images`
    },
    ORDERS: {
      LIST: '/api/orders',
      BY_ID: (id: string) => `/api/orders/${id}`,
      STATUS: (id: string) => `/api/orders/${id}/status`,
      INVOICE: (id: string) => `/api/orders/${id}/invoice`
    },
    REVIEWS: {
      PRODUCT: (id: string) => `/api/reviews/product/${id}`,
      FARMER: (id: string) => `/api/reviews/farmer/${id}`,
      BY_ID: (id: string) => `/api/reviews/${id}`
    },
    CERTIFICATES: {
      LIST: '/api/certificates',
      BY_ID: (id: string) => `/api/certificates/${id}`
    },
    GROUPS: {
      LIST: '/api/groups',
      NEARBY: '/api/groups/nearby',
      BY_ID: (id: string) => `/api/groups/${id}`,
      JOIN: (id: string) => `/api/groups/${id}/join`
    },
    PAYMENTS: {
      CREATE_INTENT: '/api/payments/create-intent',
      BY_ID: (id: string) => `/api/payments/${id}`,
      WEBHOOK: '/api/payments/webhook'
    }
  };
  
  // Klucze LocalStorage
  export const STORAGE_KEYS = {
    TOKEN: 'ekodirekt_token',
    REFRESH_TOKEN: 'ekodirekt_refresh_token',
    USER: 'ekodirekt_user',
    CART: 'ekodirekt_cart',
    FILTER_PREFERENCES: 'ekodirekt_filters'
  };
  
  // Stałe walidacji
  export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    MAX_IMAGES_PER_PRODUCT: 5,
    MAX_FILE_SIZE_MB: 5,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_REVIEW_LENGTH: 1000
  };
  
  // Ustawienia aplikacji
  export const APP_SETTINGS = {
    DEFAULT_PAGINATION_LIMIT: 10,
    MAP_DEFAULT_ZOOM: 12,
    MAP_DEFAULT_CENTER: [21.0118, 52.2298] as [number, number], // Warszawa
    DEFAULT_SEARCH_RADIUS_KM: 50,
    PLATFORM_FEE_PERCENTAGE: 5,
    CARBON_FOOTPRINT_FACTORS: {
      KM_PER_KG_CO2: 0.12, // kg CO2 per km per kg produktu
      LOCAL_PRODUCTION_MULTIPLIER: 0.7,
      ECO_CERTIFICATE_MULTIPLIER: 0.8
    }
  };