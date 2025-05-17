// Fixed version of backend/models/Product.ts

import { admin } from '../firebase';
import { FirestoreProduct, ProductOwner, FirestoreTimestamp } from '../types';
import { usersCollection } from './collections';

const db = admin.firestore();
const productsCollection = db.collection('products');

// Define proper types for MongoDB-like query operators
interface MongoQueryOperators {
  $gte?: number;
  $lte?: number;
  $in?: string[];
}

// Type for queries with MongoDB-like operators
interface QueryWithOperators {
  status?: string;
  category?: string;
  subcategory?: string;
  price?: MongoQueryOperators;
  owner?: string;
  certificates?: MongoQueryOperators;
  $or?: Array<{
    [key: string]: {
      $regex: string;
      $options: string;
    };
  }>;
  [key: string]: unknown;
}

// Define more specific types for search conditions
type SearchCondition = {
  [key: string]: {
    $regex: string;
    $options: string;
  };
};

// Create a query builder class to support chaining
class ProductQueryBuilder {
  private query: QueryWithOperators;
  private sortOpts: Record<string, number> | null = null;
  private skipValue: number = 0;
  private limitValue: number | null = null;
  private populateField: string | null = null;

  constructor(query: QueryWithOperators) {
    this.query = query;
  }

  // Support sorting
  sort(options: Record<string, number>) {
    this.sortOpts = options;
    return this;
  }

  // Support pagination - skip
  skip(count: number) {
    this.skipValue = count;
    return this;
  }

  // Support pagination - limit
  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  // Support populating references
  populate(field: string) {
    this.populateField = field;
    return this;
  }

  // Execute the query
  async exec(): Promise<FirestoreProduct[]> {
    let firestoreQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = productsCollection;

    // Apply query filters
    Object.entries(this.query).forEach(([key, value]) => {
        if (value === undefined) return;
      
        // Handle special query operators
        if (key === 'price' && typeof value === 'object' && value !== null) {
          // Type assertion to tell TypeScript this object might have these properties
          const priceFilter = value as { $gte?: number; $lte?: number };
          
          if (priceFilter.$gte !== undefined) {
            firestoreQuery = firestoreQuery.where('price', '>=', priceFilter.$gte);
          }
          if (priceFilter.$lte !== undefined) {
            firestoreQuery = firestoreQuery.where('price', '<=', priceFilter.$lte);
          }
        } else if (key === 'certificates' && typeof value === 'object' && value !== null) {
          // Type assertion for the certificates filter
          const certFilter = value as { $in?: string[] };
          
          if (certFilter.$in && certFilter.$in.length > 0) {
            // Firestore uses array-contains-any for this operation
            firestoreQuery = firestoreQuery.where('certificates', 'array-contains-any', certFilter.$in);
          }
        } else if (key === 'status') {
          firestoreQuery = firestoreQuery.where('status', '==', value);
        } else if (key === 'owner') {
          firestoreQuery = firestoreQuery.where('owner', '==', value);
        } else if (key === 'category') {
          firestoreQuery = firestoreQuery.where('category', '==', value);
        } else if (key === 'subcategory') {
          firestoreQuery = firestoreQuery.where('subcategory', '==', value);
        } else if (key !== '$or') { // Skip $or for now - Firestore doesn't support it directly
          firestoreQuery = firestoreQuery.where(key, '==', value);
        }
      });

    // Execute the query
    const snapshot = await firestoreQuery.get();
    let results: FirestoreProduct[] = [];

    // Convert to array of products
    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => {
      const product = {
        _id: doc.id,
        ...doc.data()
      } as FirestoreProduct;

      // Handle text search ($or) in memory
      if (this.query.$or) {
        const matchesSearch = this.query.$or.some((condition: SearchCondition) => {
          const field = Object.keys(condition)[0];
          const value = condition[field];
          
          if (value.$regex && product[field]) {
            const regex = new RegExp(value.$regex, value.$options || '');
            return regex.test(String(product[field]));
          }
          return false;
        });

        if (!matchesSearch) return; // Skip if doesn't match text search
      }

      results.push(product);
    });

    // Apply sorting
    if (this.sortOpts !== null) {
        results.sort((a, b) => {
          for (const [field, direction] of Object.entries(this.sortOpts || {})) {
            if (field === 'createdAt') {
              const dateA = this.toJsDate(a.createdAt);
              const dateB = this.toJsDate(b.createdAt);
              
              // Handle sort direction
              if (direction === 1) {
                return dateA.getTime() - dateB.getTime();
              } else {
                return dateB.getTime() - dateA.getTime();
              }
            }
            
            // Handle normal field sorting
            if (a[field] < b[field]) return -1 * direction;
            if (a[field] > b[field]) return 1 * direction;
          }
          
          return 0;
        });
      }

    // Apply pagination
    if (this.skipValue > 0) {
      results = results.slice(this.skipValue);
    }

    if (this.limitValue !== null) {
      results = results.slice(0, this.limitValue);
    }

    // Populate references if needed
    if (this.populateField && this.populateField === 'owner') {
      results = await this.populateOwners(results);
    }

    return results;
  }

  /**
   * Helper method to convert FirestoreTimestamp or any date-like value to JavaScript Date
   */
  private toJsDate(value: Date | FirestoreTimestamp | string | number | undefined): Date {
    if (!value) return new Date();
    
    // Handle Firebase Timestamp objects with type checking
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
      return (value as FirestoreTimestamp).toDate();
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return value;
    }
    
    // Handle string or number by creating a new Date
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    
    // Default case - return current date
    return new Date();
  }

  // Helper method to populate owner references
  private async populateOwners(products: FirestoreProduct[]): Promise<FirestoreProduct[]> {
    const populatedProducts = await Promise.all(products.map(async (product) => {
      if (typeof product.owner === 'string') {
        try {
          const ownerDoc = await usersCollection.doc(product.owner).get();
          
          if (ownerDoc.exists) {
            const ownerData = ownerDoc.data();
            if (ownerData) {
              // Remove sensitive data but avoid using the variable directly
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { passwordHash, ...safeOwnerData } = ownerData;
              
              return {
                ...product,
                owner: {
                  _id: ownerDoc.id,
                  ...safeOwnerData
                } as ProductOwner
              };
            }
          }
        } catch (error) {
          console.error(`Error populating owner for product ${product._id}:`, error);
        }
      }
      
      return product;
    }));
    
    return populatedProducts;
  }
}

/**
 * Product model that provides Mongoose-like methods for Firestore
 */
export class Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  subcategory?: string;
  owner: string;
  images: string[] = [];
  certificates?: string[];
  status: string;
  statusHistory?: Array<{
    status: string;
    timestamp: Date;  // Ensure this is Date only, not FirestoreTimestamp
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
  averageRating: number = 0;
  isCertified: boolean = false;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Find products that match a query
   */
  static find(query: QueryWithOperators): ProductQueryBuilder {
    return new ProductQueryBuilder(query);
  }

  /**
   * Count documents matching a query
   */
  static async countDocuments(query: QueryWithOperators): Promise<number> {
    // Use the query builder to execute the query
    const results = await new ProductQueryBuilder(query).exec();
    return results.length;
  }

  /**
   * Find a product by ID
   */
  static async findById(id: string): Promise<FirestoreProduct | null> {
    const doc = await productsCollection.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      _id: doc.id,
      ...doc.data()
    } as FirestoreProduct;
  }

  /**
   * Find a product by ID and update it
   */
  static async findByIdAndUpdate(id: string, update: Record<string, unknown>): Promise<FirestoreProduct | null> {
    // Process the update to handle Firestore specific operations
    const processedUpdate: Record<string, unknown> = {};
    
    // Process normal fields
    for (const [key, value] of Object.entries(update)) {
      if (key.startsWith('$')) {
        // Skip operators for now
        continue;
      }
      processedUpdate[key] = value;
    }
    
    // Process status history arrays
    if (update.statusHistory && Array.isArray(update.statusHistory)) {
      processedUpdate.statusHistory = admin.firestore.FieldValue.arrayUnion(...update.statusHistory);
    }
    
    // Update document
    await productsCollection.doc(id).update(processedUpdate);
    
    // Get updated document
    const updated = await productsCollection.doc(id).get();
    if (!updated.exists) {
      return null;
    }
    
    return {
      _id: updated.id,
      ...updated.data()
    } as FirestoreProduct;
  }

  /**
   * Create a new product
   */
  constructor(data: Partial<FirestoreProduct>) {
    this.name = data.name || '';
    this.description = data.description || '';
    this.price = data.price || 0;
    this.quantity = data.quantity || 0;
    this.unit = data.unit || '';
    this.category = data.category || '';
    this.subcategory = data.subcategory;
    this.owner = data.owner as string || '';
    this.images = data.images || [];
    this.certificates = data.certificates || [];
    this.status = data.status || 'available';
    
    // Properly convert status history timestamps to Date objects
    if (data.statusHistory) {
      this.statusHistory = data.statusHistory.map(item => ({
        ...item,
        timestamp: this.convertToDate(item.timestamp)
      }));
    } else {
      this.statusHistory = [];
    }
    
    this.location = data.location;
    this.harvestDate = this.convertToDate(data.harvestDate);
    this.trackingId = data.trackingId;
    this.reviews = data.reviews || [];
    this.averageRating = data.averageRating || 0;
    this.isCertified = data.isCertified || false;
    this.createdAt = this.convertToDate(data.createdAt) || new Date();
    this.updatedAt = this.convertToDate(data.updatedAt) || new Date();
    
    // Avoid using unassigned property (but capture it for completeness)
    if (data._id) {
      this._id = data._id;
    }
  }

  /**
   * Helper to convert FirestoreTimestamp or string to Date
   */
  private convertToDate(value: unknown): Date {
    if (!value) return new Date();
    
    // Handle Firebase Timestamp objects
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
      return value.toDate();
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return value;
    }
    
    // Handle string or number dates
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return new Date();
  }

  /**
   * Save the product to Firestore
   */
  async save(): Promise<FirestoreProduct> {
    // Convert to plain object for Firestore
    const productData = this.toFirestore();
    const docId = this._id;  // Store the ID in a local variable to avoid the unused warning
    
    // If _id exists, update the document
    if (docId) {
      await productsCollection.doc(docId).update(productData);
      
      // Return as FirestoreProduct
      return {
        _id: docId,
        ...productData
      } as FirestoreProduct;
    }
    
    // Otherwise, create a new document
    const docRef = await productsCollection.add(productData);
    this._id = docRef.id;
    
    // Return as FirestoreProduct
    return {
      _id: this._id,
      ...productData
    } as FirestoreProduct;
  }

  /**
   * Convert to Firestore-friendly object (without methods)
   */
  private toFirestore(): Record<string, unknown> {
    // Create a fresh object to avoid the unused _id property warning
    const result: Record<string, unknown> = {
      name: this.name,
      description: this.description,
      price: this.price,
      quantity: this.quantity,
      unit: this.unit,
      category: this.category,
      owner: this.owner,
      images: this.images,
      status: this.status,
      averageRating: this.averageRating,
      isCertified: this.isCertified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    
    // Add optional properties only if they exist
    if (this.subcategory) result.subcategory = this.subcategory;
    if (this.certificates) result.certificates = this.certificates;
    if (this.statusHistory) result.statusHistory = this.statusHistory;
    if (this.location) result.location = this.location;
    if (this.harvestDate) result.harvestDate = this.harvestDate;
    if (this.trackingId) result.trackingId = this.trackingId;
    if (this.reviews) result.reviews = this.reviews;
    
    return result;
  }
}

export default Product;