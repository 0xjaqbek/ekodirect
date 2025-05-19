// src/modules/products/types/index.ts
import {  type GeoLocation, type StatusHistoryItem } from '../../../shared/types';

// Define a type for a populated owner object
export interface ProductOwner {
  _id: string;
  fullName: string;
  email?: string;
  profileImage?: string;

}

// Define the Product interface with proper owner handling
export interface Product {
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
  statusHistory?: StatusHistoryItem[];
  location?: GeoLocation;
  harvestDate?: Date | string;
  trackingId?: string;
  reviews?: string[];
  averageRating: number;
  isCertified: boolean;
  distance?: number; // Added when filtering by location
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Helper type guard to check if owner is populated
export function isPopulatedOwner(owner: string | ProductOwner): owner is ProductOwner {
  return typeof owner !== 'string' && owner !== null && typeof owner === 'object' && '_id' in owner;
}

// Helper type for filter parameters
export interface ProductFilterParams {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: [number, number]; // [longitude, latitude]
  radius?: number;
  farmer?: string;
  certificate?: string;
  search?: string;
  sortBy?: 'price' | 'rating' | 'distance' | 'date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Type for product create/update forms
export interface ProductFormData {
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
  images?: File[];
}