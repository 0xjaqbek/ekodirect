// backend/models/User.ts
import { admin } from '../firebase';
import { usersCollection } from './collections';

/**
 * User model that provides Mongoose-like methods for Firestore
 */
export class User {
  _id?: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  role: 'farmer' | 'consumer' | 'admin';
  phoneNumber: string;
  location?: {
    type: string;
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
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<User>) {
    this.email = data.email || '';
    this.passwordHash = data.passwordHash;
    this.fullName = data.fullName || '';
    this.role = data.role || 'consumer';
    this.phoneNumber = data.phoneNumber || '';
    this.location = data.location;
    this.bio = data.bio;
    this.profileImage = data.profileImage;
    this.certificates = data.certificates || [];
    this.createdProducts = data.createdProducts || [];
    this.orders = data.orders || [];
    this.reviews = data.reviews || [];
    this.localGroups = data.localGroups || [];
    this.isVerified = data.isVerified || false;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    
    if (data._id) {
      this._id = data._id;
    }
  }

  /**
   * Find a user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const doc = await usersCollection.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const userData = doc.data();
    
    return new User({
      _id: doc.id,
      ...userData
    });
  }

  /**
   * Find a user by ID and update it
   */
  static async findByIdAndUpdate(id: string, update: any): Promise<User | null> {
    // Handle array operations for MongoDB compatibility
    const processedUpdate: Record<string, any> = {};
    
    // Process the update object to handle $push, $pull, etc.
    Object.entries(update).forEach(([key, value]) => {
      if (key === '$push') {
        // Handle $push operator - in Firestore, use arrayUnion
        Object.entries(value as Record<string, any>).forEach(([field, fieldValue]) => {
          processedUpdate[field] = admin.firestore.FieldValue.arrayUnion(fieldValue);
        });
      } else if (key === '$pull') {
        // Handle $pull operator - in Firestore, use arrayRemove
        Object.entries(value as Record<string, any>).forEach(([field, fieldValue]) => {
          processedUpdate[field] = admin.firestore.FieldValue.arrayRemove(fieldValue);
        });
      } else {
        // Regular field
        processedUpdate[key] = value;
      }
    });
    
    await usersCollection.doc(id).update(processedUpdate);
    
    const updated = await usersCollection.doc(id).get();
    if (!updated.exists) {
      return null;
    }
    
    return new User({
      _id: updated.id,
      ...updated.data()
    });
  }

  /**
   * Save this user to Firestore
   */
  async save(): Promise<User> {
    // Convert to plain object for Firestore
    const userData = this.toFirestore();
    
    // If _id exists, update the document
    if (this._id) {
      await usersCollection.doc(this._id).update(userData);
      
      // Return self for chaining
      return this;
    }
    
    // Otherwise, create a new document
    const docRef = await usersCollection.add(userData);
    this._id = docRef.id;
    
    // Return self for chaining
    return this;
  }

  /**
   * Convert to Firestore-friendly object (without methods)
   */
  private toFirestore(): Record<string, any> {
    // Filter out _id and functions
    const { _id, ...data } = this;
    return data;
  }
}

export default User;