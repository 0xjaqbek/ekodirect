// shared/types/index.ts
import { ProductUnit, ProductCategory } from '../../src/shared/constants';

// Podstawowe interfejsy
export interface User {
    _id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: 'farmer' | 'consumer' | 'admin';
    phoneNumber: string;
    location: GeoLocation;
    bio?: string;
    profileImage?: string;
    certificates?: string[]; // referencje do Certificate
    createdProducts?: string[]; // referencje do Product (dla rolników)
    orders?: string[]; // referencje do Order
    reviews?: string[]; // referencje do Review
    localGroups?: string[]; // referencje do LocalGroup
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
    unit: ProductUnit;  // kg, szt, etc.
    category: ProductCategory;
    subcategory?: string;
    owner: string; // referencja do User (rolnik)
    images: string[]; // URL-e do zdjęć
    certificates: string[]; // referencje do Certificate
    status: ProductStatus;
    statusHistory: StatusHistoryItem[];
    location: GeoLocation;
    harvestDate?: Date;
    trackingId: string; // unikalny identyfikator do śledzenia
    reviews: string[]; // referencje do Review
    averageRating: number;
    isCertified: boolean;
    distance?: number; // Changed from boolean to optional number
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Order {
    _id: string;
    buyer: string; // referencja do User
    items: OrderItem[];
    totalPrice: number;
    status: OrderStatus;
    statusHistory: StatusHistoryItem[];
    shippingAddress: Address;
    deliveryDate?: Date;
    paymentId?: string; // ID transakcji Stripe
    paymentStatus: PaymentStatus;
    carbonFootprint?: number; // obliczony ślad węglowy
    isReviewed: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Certificate {
    _id: string;
    name: string;
    type: CertificateType;
    issuingAuthority: string;
    documentUrl?: string;
    issuedTo: string; // referencja do User (rolnik)
    products?: string[]; // referencje do Product
    isVerified: boolean;
    validUntil: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Review {
    _id: string;
    author: string; // referencja do User
    product?: string; // referencja do Product
    farmer?: string; // referencja do User (rolnik)
    rating: number; // 1-5
    comment: string;
    images?: string[];
    isVerified: boolean;
    moderationStatus: ModerationStatus;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface LocalGroup {
    _id: string;
    name: string;
    description: string;
    location: GeoLocation;
    radius: number; // km
    members: LocalGroupMember[];
    products?: string[]; // referencje do Product dostępnych w grupie
    image?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Pomocnicze typy
  export interface GeoLocation {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
  }
  
  export interface StatusHistoryItem {
    status: string;
    timestamp: Date;
    updatedBy: string; // referencja do User
    note?: string;
  }
  
  export interface OrderItem {
    product: string; // referencja do Product
    quantity: number;
    priceAtPurchase: number;
  }
  
  export interface Address {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  }
  
  export interface LocalGroupMember {
    user: string; // referencja do User
    role: 'admin' | 'member';
    joinedAt: Date;
  }
  
  // Typy enum
  export type ProductStatus = 'available' | 'preparing' | 'shipped' | 'delivered' | 'unavailable';
  export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
  export type CertificateType = 'organic' | 'eco' | 'fair-trade' | 'other';
  export type ModerationStatus = 'pending' | 'approved' | 'rejected';
  
  // Typy odpowiedzi API
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }
  
  export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  // Typy żądań
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
    role: 'farmer' | 'consumer';
    phoneNumber: string;
    location: {
      coordinates: [number, number];
      address: string;
    };
  }
  
  export interface CreateProductRequest {
    name: string;
    description: string;
    price: number;
    quantity: number;
    unit: string;
    category: string;
    subcategory?: string;
    certificates?: string[];
    location?: {
      coordinates: [number, number];
      address: string;
    };
    harvestDate?: Date;
  }
  
  export interface CreateOrderRequest {
    items: {
      product: string;
      quantity: number;
    }[];
    shippingAddress: Address;
    deliveryDate?: Date;
  }
  
  export interface ProductFilterParams {
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: [number, number];
    radius?: number; // km
    certificate?: string;
    farmer?: string;
    search?: string;
    sortBy?: 'price' | 'rating' | 'distance' | 'date';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }