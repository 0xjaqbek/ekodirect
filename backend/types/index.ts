// backend/types/index.ts - Fixed with proper type separation

import { admin } from '../firebase';

// Re-export shared types from frontend
export * from '../../src/shared/types';
export * from '../../src/shared/types/firebase';

// Backend-specific types that extend or modify the shared types

// Define a type for a populated owner object (backend-specific)
export interface ProductOwner {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  role?: string;
  location?: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  [key: string]: unknown; // Allow other properties
}

// Define StatusHistoryItem for Firestore writes (with FieldValue)
export interface FirestoreStatusHistoryItemWrite {
  status: string;
  timestamp: admin.firestore.FieldValue;
  updatedBy: string;
  note?: string;
}

// Define StatusHistoryItem for Firestore reads (with actual Timestamp/Date)
export interface FirestoreStatusHistoryItem {
  status: string;
  timestamp: Date | admin.firestore.Timestamp;
  updatedBy: string;
  note?: string;
}

// Define FirestoreProduct for write operations (when creating/updating)
export interface FirestoreProductWrite {
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  subcategory?: string;
  owner: string;
  images: string[];
  certificates?: string[];
  status: 'available' | 'preparing' | 'shipped' | 'delivered' | 'unavailable';
  statusHistory?: FirestoreStatusHistoryItemWrite[];
  location?: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  harvestDate?: Date;
  trackingId?: string;
  reviews?: string[];
  averageRating: number;
  isCertified: boolean;
  // For write operations, these can be FieldValue (like serverTimestamp())
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
}

// Define FirestoreProduct for read operations (when fetching from Firestore)
export interface FirestoreProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  subcategory?: string;
  owner: string | ProductOwner; // Can be either an ID string or a populated owner object
  images: string[];
  certificates?: string[];
  status: 'available' | 'preparing' | 'shipped' | 'delivered' | 'unavailable';
  statusHistory?: FirestoreStatusHistoryItem[];
  location?: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  harvestDate?: Date | admin.firestore.Timestamp;
  trackingId?: string;
  reviews?: string[];
  averageRating: number;
  isCertified: boolean;
  distance?: number; // Added when filtering by location
  // For read operations, these are actual Timestamp/Date objects
  createdAt: Date | admin.firestore.Timestamp;
  updatedAt: Date | admin.firestore.Timestamp;
}

// Backend-specific User type for write operations
export interface FirestoreUserWrite {
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'farmer' | 'consumer' | 'admin';
  phoneNumber: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  bio?: string;
  profileImage?: string;
  certificates?: string[];
  createdProducts?: string[];
  orders?: string[];
  reviews?: string[];
  localGroups?: string[];
  isVerified: boolean;
  lastLoginAt?: admin.firestore.FieldValue;
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
}

// Backend-specific User type for read operations
export interface FirestoreUser {
  _id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'farmer' | 'consumer' | 'admin';
  phoneNumber: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  bio?: string;
  profileImage?: string;
  certificates?: string[];
  createdProducts?: string[];
  orders?: string[];
  reviews?: string[];
  localGroups?: string[];
  isVerified: boolean;
  lastLoginAt?: admin.firestore.Timestamp | Date;
  createdAt: admin.firestore.Timestamp | Date;
  updatedAt: admin.firestore.Timestamp | Date;
}

// Helper type guard to check if owner is populated
export function isPopulatedOwner(owner: string | ProductOwner): owner is ProductOwner {
  return typeof owner !== 'string' && owner !== null && typeof owner === 'object' && '_id' in owner;
}

// Re-export commonly used types for convenience
export type ProductStatus = 'available' | 'preparing' | 'shipped' | 'delivered' | 'unavailable';
export type ProductCategory = 'warzywa' | 'owoce' | 'nabiał' | 'mięso' | 'zboża' | 'przetwory' | 'miód' | 'jaja' | 'napoje' | 'inne';
export type CertificateType = 'organic' | 'eco' | 'fair-trade' | 'other';

// API response types for backend
export interface BackendApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedBackendResponse<T> {
  success: boolean;
  data?: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}