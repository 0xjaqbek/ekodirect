"use strict";
// shared/constants/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_SETTINGS = exports.VALIDATION = exports.STORAGE_KEYS = exports.API_ROUTES = exports.MODERATION_STATUSES = exports.CERTIFICATE_TYPES = exports.PRODUCT_STATUSES = exports.PAYMENT_STATUSES = exports.ORDER_STATUSES = exports.PRODUCT_UNITS = exports.PRODUCT_SUBCATEGORIES = exports.PRODUCT_CATEGORIES = void 0;
// Kategorie produktów
exports.PRODUCT_CATEGORIES = [
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
];
exports.PRODUCT_SUBCATEGORIES = {
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
exports.PRODUCT_UNITS = ['kg', 'g', 'szt', 'l', 'ml', 'opak'];
// Statusy zamówień
exports.ORDER_STATUSES = {
    PENDING: 'pending',
    PAID: 'paid',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};
// Statusy płatności
exports.PAYMENT_STATUSES = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};
// Statusy produktów
exports.PRODUCT_STATUSES = {
    AVAILABLE: 'available',
    PREPARING: 'preparing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    UNAVAILABLE: 'unavailable'
};
// Typy certyfikatów
exports.CERTIFICATE_TYPES = {
    ORGANIC: 'organic',
    ECO: 'eco',
    FAIR_TRADE: 'fair-trade',
    OTHER: 'other'
};
// Statusy moderacji
exports.MODERATION_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};
// src/shared/constants/apiRoutes.ts
// API Routes separated for better organization
exports.API_ROUTES = {
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
        BY_ID: (id) => `/api/users/${id}`
    },
    PRODUCTS: {
        LIST: '/api/products',
        BY_ID: (id) => `/api/products/${id}`,
        TRACKING: (id) => `/api/products/${id}/tracking`,
        STATUS: (id) => `/api/products/${id}/status`,
        IMAGES: (id) => `/api/products/${id}/images`
    },
    ORDERS: {
        LIST: '/api/orders',
        BY_ID: (id) => `/api/orders/${id}`,
        STATUS: (id) => `/api/orders/${id}/status`,
        INVOICE: (id) => `/api/orders/${id}/invoice`
    },
    REVIEWS: {
        PRODUCT: (id) => `/api/reviews/product/${id}`,
        FARMER: (id) => `/api/reviews/farmer/${id}`,
        BY_ID: (id) => `/api/reviews/${id}`
    },
    CERTIFICATES: {
        LIST: '/api/certificates',
        BY_ID: (id) => `/api/certificates/${id}`
    },
    GROUPS: {
        LIST: '/api/groups',
        NEARBY: '/api/groups/nearby',
        BY_ID: (id) => `/api/groups/${id}`,
        JOIN: (id) => `/api/groups/${id}/join`
    },
    PAYMENTS: {
        CREATE_INTENT: '/api/payments/create-intent',
        BY_ID: (id) => `/api/payments/${id}`,
        WEBHOOK: '/api/payments/webhook'
    }
};
// Klucze LocalStorage
exports.STORAGE_KEYS = {
    TOKEN: 'ekodirekt_token',
    REFRESH_TOKEN: 'ekodirekt_refresh_token',
    USER: 'ekodirekt_user',
    CART: 'ekodirekt_cart',
    FILTER_PREFERENCES: 'ekodirekt_filters'
};
// Stałe walidacji
exports.VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    MAX_IMAGES_PER_PRODUCT: 5,
    MAX_FILE_SIZE_MB: 5,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_REVIEW_LENGTH: 1000
};
// Ustawienia aplikacji
exports.APP_SETTINGS = {
    DEFAULT_PAGINATION_LIMIT: 10,
    MAP_DEFAULT_ZOOM: 12,
    MAP_DEFAULT_CENTER: [21.0118, 52.2298], // Warszawa
    DEFAULT_SEARCH_RADIUS_KM: 50,
    PLATFORM_FEE_PERCENTAGE: 5,
    CARBON_FOOTPRINT_FACTORS: {
        KM_PER_KG_CO2: 0.12, // kg CO2 per km per kg produktu
        LOCAL_PRODUCTION_MULTIPLIER: 0.7,
        ECO_CERTIFICATE_MULTIPLIER: 0.8
    }
};
