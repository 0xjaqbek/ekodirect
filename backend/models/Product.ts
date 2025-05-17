// backend/models/Product.ts
import { admin } from '../firebase';
import { FirestoreProduct, ProductOwner } from '../types';
import { usersCollection } from './collections';

const db = admin.firestore();
const productsCollection = db.collection('products');

// Create a query builder class to support chaining
class ProductQueryBuilder {
  private query: any;
  private sortOpts: Record<string, number> | null = null;
  private skipValue: number = 0;
  private limitValue: number | null = null;
  private populateField: string | null = null;

  constructor(query: any) {
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
    let firestoreQuery = productsCollection;

    // Apply query filters
    Object.entries(this.query).forEach(([key, value]) => {
      if (value === undefined) return;

      // Handle special query operators
      if (key === 'price' && typeof value === 'object') {
        if (value.$gte !== undefined) {
          firestoreQuery = firestoreQuery.where('price', '>=', value.$gte);
        }
        if (value.$lte !== undefined) {
          firestoreQuery = firestoreQuery.where('price', '<=', value.$lte);
        }
      } else if (key === 'certificates' && typeof value === 'object' && value.$in) {
        // This is a simplification - Firestore doesn't support $in directly
        // For array-contains-any, all array items must be in one query
        firestoreQuery = firestoreQuery.where('certificates', 'array-contains-any', value.$in);
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
    snapshot.forEach((doc: any) => {
      const product = {
        _id: doc.id,
        ...doc.data()
      } as FirestoreProduct;

      // Handle text search ($or) in memory
      if (this.query.$or) {
        const matchesSearch = this.query.$or.some((condition: any) => {
          const field = Object.keys(condition)[0];
          const value = condition[field];
          
          if (value.$regex && product[field]) {
            const regex = new RegExp(value.$regex, value.$options || '');
            return regex.test(product[field]);
          }
          return false;
        });

        if (!matchesSearch) return; // Skip if doesn't match text search
      }

      results.push(product);
    });

    // Apply sorting
    if (this.sortOpts) {
      results.sort((a, b) => {
        for (const [field, direction] of Object.entries(this.sortOpts)) {
          if (field === 'createdAt') {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            
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

  // Helper method to populate owner references
  private async populateOwners(products: FirestoreProduct[]): Promise<FirestoreProduct[]> {
    const populatedProducts = await Promise.all(products.map(async (product) => {
      if (typeof product.owner === 'string') {
        try {
          const ownerDoc = await usersCollection.doc(product.owner).get();
          
          if (ownerDoc.exists) {
            const ownerData = ownerDoc.data();
            // Remove sensitive data
            const { passwordHash, ...safeOwnerData } = ownerData;
            
            return {
              ...product,
              owner: {
                _id: ownerDoc.id,
                ...safeOwnerData
              } as ProductOwner
            };
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
  averageRating: number = 0;
  isCertified: boolean = false;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Find products that match a query
   */
  static find(query: Record<string, any>): ProductQueryBuilder {
    return new ProductQueryBuilder(query);
  }

  /**
   * Count documents matching a query
   */
  static async countDocuments(query: any): Promise<number> {
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
  static async findByIdAndUpdate(id: string, update: any): Promise<FirestoreProduct | null> {
    // Process the update to handle Firestore specific operations
    const processedUpdate: Record<string, any> = {};
    
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
    this.statusHistory = data.statusHistory || [];
    this.location = data.location;
    this.harvestDate = data.harvestDate instanceof Date ? data.harvestDate : 
                     data.harvestDate ? new Date(data.harvestDate) : undefined;
    this.trackingId = data.trackingId;
    this.reviews = data.reviews || [];
    this.averageRating = data.averageRating || 0;
    this.isCertified = data.isCertified || false;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    
    if (data._id) {
      this._id = data._id;
    }
  }

  /**
   * Save the product to Firestore
   */
  async save(): Promise<FirestoreProduct> {
    // Convert to plain object for Firestore
    const productData = this.toFirestore();
    
    // If _id exists, update the document
    if (this._id) {
      await productsCollection.doc(this._id).update(productData);
      
      // Return as FirestoreProduct
      return {
        _id: this._id,
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
  private toFirestore(): Record<string, any> {
    // Filter out _id and functions
    const { _id, ...data } = this;
    return data;
  }
}

export default Product;