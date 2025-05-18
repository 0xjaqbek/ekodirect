// backend/types/index.ts - Fixed with proper exports
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

// Define StatusHistoryItem for Firestore
export interface FirestoreStatusHistoryItem {
  status: string;
  timestamp: admin.firestore.FieldValue | Date | admin.firestore.Timestamp;
  updatedBy: string;
  note?: string;
}

// Define FirestoreProduct - backend-specific version that handles Firestore types
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
  createdAt: Date | admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedAt: Date | admin.firestore.Timestamp | admin.firestore.FieldValue;
}

// Backend-specific User type that handles Firestore types
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
  createdAt: admin.firestore.Timestamp | Date | admin.firestore.FieldValue;
  updatedAt: admin.firestore.Timestamp | Date | admin.firestore.FieldValue;
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