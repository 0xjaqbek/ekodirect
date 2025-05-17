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
  owner: string;
  images: string[];
  certificates?: string[];
  status: string;
  statusHistory?: Array<{
    status: string;
    timestamp: Date;
    updatedBy: string;
    note?: string;
  }>;
  location?: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  harvestDate?: Date;
  trackingId?: string;
  reviews?: string[];
  averageRating?: number;
  isCertified?: boolean;
  distance?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirestoreUser extends DocumentData {
  _id?: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'farmer' | 'consumer' | 'admin';
  phoneNumber: string;
  profileImage?: string;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithoutPassword extends Omit<FirestoreUser, 'passwordHash'> {
  id?: string;
}

export type ProductWithOwner =
  Omit<FirestoreProduct, 'owner'> & { owner: string | UserWithoutPassword };