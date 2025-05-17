// backend/types/index.ts
import { DocumentData } from 'firebase-admin/firestore';

export interface FirestoreProduct extends DocumentData {
  _id?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  subcategory?: string;
  owner: string | ProductOwner;
  images: string[];
  certificates?: string[];
  status: 'available' | 'preparing' | 'shipped' | 'delivered' | 'unavailable';
  statusHistory?: Array<{
    status: string;
    timestamp: Date | FirestoreTimestamp;
    updatedBy: string;
    note?: string;
  }>;
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
  };
  harvestDate?: Date | FirestoreTimestamp;
  trackingId?: string;
  reviews?: string[];
  averageRating: number;
  isCertified: boolean;
  distance?: number;
  createdAt: Date | FirestoreTimestamp;
  updatedAt: Date | FirestoreTimestamp;
  [key: string]: any; // Allow additional properties
}

export interface FirestoreTimestamp {
  toDate: () => Date;
  seconds: number;
  nanoseconds: number;
}

export interface ProductOwner {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  location?: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  role?: string;
  [key: string]: any; // To allow other properties
}

// Type guard to check if owner is populated
export function isPopulatedOwner(owner: string | ProductOwner): owner is ProductOwner {
  return typeof owner !== 'string' && owner !== null && typeof owner === 'object' && '_id' in owner;
}