// backend/controllers/productController.ts
import { Request, Response } from 'express';
import { admin } from '../firebase';
import { calculateDistance } from '../utils/geoUtils';
import { generateTrackingId } from '../utils/productUtils';
import { productsCollection, usersCollection } from '../models/collections';
import { FirestoreProduct, ProductOwner } from '../types';
import { convertToDate } from '../../src/shared/utils/firebase';
import { uploadImageToStorage } from '../services/fileStorageService';


// Interface for the product data coming from the request body (likely FormData)
interface ProductRequestBody {
  name: string;
  description: string;
  price: string; // FormData sends numbers as strings
  quantity: string; // FormData sends numbers as strings
  unit: string;
  category: string;
  subcategory?: string;
  harvestDate?: string; // ISO date string
  certificates?: string | string[]; // Can be single or multiple
  'location.coordinates[0]'?: string;
  'location.coordinates[1]'?: string;
  'location.address'?: string;
}
// Define an interface for the user document structure from Firestore
// This helps TypeScript understand the shape of ownerData
interface UserDocData extends admin.firestore.DocumentData {
  passwordHash: string;
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
}

/**
 * Get all products with filtering, sorting, and pagination
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      subcategory,
      minPrice,
      maxPrice,
      lat,
      lng,
      radius = 50, // default radius 50km
      farmer,
      certificate,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    // Start building query
    let query = productsCollection.where('status', '==', 'available');

    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }

    if (subcategory) {
      query = query.where('subcategory', '==', subcategory);
    }

    if (farmer) {
      query = query.where('owner', '==', farmer);
    }

    if (certificate) {
      query = query.where('certificates', 'array-contains', certificate);
    }

    // Note: Firestore doesn't support OR queries between fields
    // For search, we'll need to do it after fetching
    // Same for price ranges - we'll filter the results

    // Execute query
    const snapshot = await query.get();

    // Convert to array of products
    let products: FirestoreProduct[] = [];
    
    snapshot.forEach(doc => {
      const product = {
        _id: doc.id,
        ...doc.data()
      } as FirestoreProduct;
      
      // Apply additional filters that couldn't be done in Firestore query
      if (minPrice && product.price < Number(minPrice)) return;
      if (maxPrice && product.price > Number(maxPrice)) return;
      
      // Apply text search if provided
      if (search) {
        const searchLower = (search as string).toLowerCase();
        const nameMatch = product.name.toLowerCase().includes(searchLower);
        const descMatch = product.description.toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch) return;
      }
      
      products.push(product);
    });
    
    // Filter by location if coordinates provided
    if (lat && lng) {
      const userLocation: [number, number] = [Number(lng), Number(lat)];
      const maxDistance = Number(radius);
      
      products = products.filter(product => {
        if (!product.location?.coordinates) return false;
        
        const distance = calculateDistance(
          userLocation[1], // user latitude
          userLocation[0], // user longitude
          product.location.coordinates[1],
          product.location.coordinates[0]
        );
        
        // Add distance to product
        product.distance = distance;
        
        // Keep only products within radius
        return distance <= maxDistance;
      });
    }
    
    // Sort products
    products = sortProducts(products, sortBy as string, sortOrder as string);
    
    // Apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedProducts = products.slice(skip, skip + Number(limit));
    
    // Populate owner data for each product
    const populatedProducts = await populateProductOwners(paginatedProducts);
    
    return res.json({
      success: true,
      data: {
        items: populatedProducts,
        total: products.length,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(products.length / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas pobierania produktów.'
    });
  }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const productDoc = await productsCollection.doc(id).get();
    
    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
    }
    
    const product = {
      _id: productDoc.id,
      ...productDoc.data()
    } as FirestoreProduct;
    
    // Populate owner data
    let populatedProduct = product;
    
    if (product.owner) {
      try {
        const ownerDoc = await usersCollection.doc(product.owner as string).get();
        if (ownerDoc.exists) {
          const ownerData = ownerDoc.data() as UserDocData | undefined;
          
          if (ownerData) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { passwordHash, ...safeOwnerData } = ownerData;
            
            populatedProduct = {
              ...product,
              owner: {
                _id: ownerDoc.id,
                ...safeOwnerData
              } as ProductOwner
            };
          }
        }
      } catch (error) {
        console.error('Error populating owner data:', error);
      }
    }

    return res.json({
      success: true,
      data: populatedProduct
    });
  } catch (error) {
    console.error('Error getting product:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas pobierania produktu.'
    });
  }
};

/**
 * Create a new product
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    // Get user ID from authenticated user
    const userId = req.user.id;

    // Get form data
    const {
      name,
      description,
      price,
      quantity,
      unit,
      category,
      subcategory,
      harvestDate,
      certificates,
    } = req.body as ProductRequestBody;

    // Parse location if provided
    let location;
    if (req.body['location.coordinates'] && req.body['location.address']) {
      location = {
        type: 'Point',
        coordinates: [
          Number(req.body['location.coordinates[0]']),
          Number(req.body['location.coordinates[1]'])
        ] as [number, number],
        address: req.body['location.address'] as string // Ensured by the if condition
      };
    }

    // Create a new product object
    const newProduct = {
      name,
      description,
      price: Number(price),
      quantity: Number(quantity),
      unit,
      category,
      subcategory,
      owner: userId,
      location,
      harvestDate: harvestDate ? new Date(harvestDate) : undefined, // FirestoreProduct allows Date | FirestoreTimestamp
      certificates: certificates ? Array.isArray(certificates) ? certificates : [certificates] : [],
      status: 'available',
      statusHistory: [
        {
          status: 'available',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: userId
        }
      ],
      trackingId: generateTrackingId(),
      isCertified: certificates && (Array.isArray(certificates) ? certificates.length > 0 : true),
      images: [] as string[],
      averageRating: 0,
      reviews: [] as string[],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Process images
    const images = req.files as Express.Multer.File[];
    if (images && images.length > 0) {
      // Assuming you have a function to upload images and get URLs
      // This would typically involve uploading to Firebase Storage

      const imageUrls = await Promise.all(
        images.map(async (file) => {
          return await uploadImageToStorage(file, 'products');
        })
      );

      newProduct.images = imageUrls;
    }

    // Save product to Firestore
    const productRef = await productsCollection.add(newProduct);

    // Add product to user's created products
    await usersCollection.doc(userId).update({
      createdProducts: admin.firestore.FieldValue.arrayUnion(productRef.id)
    });

    // Return created product
    const createdProduct = {
      _id: productRef.id,
      ...newProduct
    };

    return res.status(201).json({
      success: true,
      data: createdProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas tworzenia produktu.'
    });
  }
};

// Specific type for Firestore update payload to avoid using 'any'
// Allows FieldValue for atomic operations.
type ProductFirestoreUpdateData = Partial<Omit<FirestoreProduct, 'createdAt' | 'updatedAt' | 'images' | 'statusHistory' | 'certificates' | 'location' | 'harvestDate'>> & {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  category?: string;
  subcategory?: string | admin.firestore.FieldValue; // For deletion
  location?: FirestoreProduct['location'] | admin.firestore.FieldValue; // For deletion
  harvestDate?: Date | null | admin.firestore.FieldValue; // For deletion or setting to null
  certificates?: string[];
  isCertified?: boolean;
  images?: admin.firestore.FieldValue; // For arrayUnion
  updatedAt: admin.firestore.FieldValue;
};
/**
 * Update a product
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if product exists
    const productDoc = await productsCollection.doc(id).get();
    
    const product = productDoc.data();
    
    // Add an explicit check for product data
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony (brak danych).'
      });
    }
    
    // Check if user is the owner
    if (product.owner !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Nie masz uprawnień do edycji tego produktu.'
      });
    }

    // Extract form data
    const {
      name,
      description,
      price,
      quantity,
      unit,
      category,
      subcategory,
      harvestDate,
      certificates,
    } = req.body as ProductRequestBody;

    // Parse location if provided
    let location;
    if (req.body['location.coordinates'] && req.body['location.address']) {
      location = {
        type: 'Point',
        coordinates: [
          Number(req.body['location.coordinates[0]']),
          Number(req.body['location.coordinates[1]'])
        ] as [number, number],
        address: req.body['location.address'] as string // Ensured by the if condition
      };
    }

    // Prepare update data
    const updateData: ProductFirestoreUpdateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Add fields to update only if they exist in the request
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = Number(price);
    if (quantity) updateData.quantity = Number(quantity);
    if (unit) updateData.unit = unit;
    if (category) updateData.category = category;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (harvestDate) updateData.harvestDate = new Date(harvestDate); // Or FieldValue.delete() if null/undefined means delete
    if (location) updateData.location = location;
    
    // Update certificates if provided
    if (certificates) {
      updateData.certificates = Array.isArray(certificates) ? certificates : [certificates];
      updateData.isCertified = updateData.certificates.length > 0;
    }

    // Process new images
    const images = req.files as Express.Multer.File[];
    if (images && images.length > 0) {
      // Assuming you have a function to upload images and get URLs

      const imageUrls = await Promise.all(
        images.map(async (file) => {
          return await uploadImageToStorage(file, 'products');
        })
      );

      // Add new images to existing images array
      updateData.images = admin.firestore.FieldValue.arrayUnion(...imageUrls);
    }

    // Update product in Firestore
    await productsCollection.doc(id).update(updateData);
    
    // Get updated product
    const updatedProductDoc = await productsCollection.doc(id).get();
    const updatedProduct = {
      _id: updatedProductDoc.id,
      ...updatedProductDoc.data()
    };

    return res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas aktualizacji produktu.'
    });
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if product exists
    const productDoc = await productsCollection.doc(id).get();
    
    const product = productDoc.data();
    
    // Add an explicit check for product data to satisfy TypeScript
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony (brak danych po odczycie).'
      });
    }
    
    // Check if user is the owner or admin
    if (product.owner !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Nie masz uprawnień do usunięcia tego produktu.'
      });
    }

    // Set product as unavailable instead of deleting
    await productsCollection.doc(id).update({
      status: 'unavailable',
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        status: 'unavailable',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: userId
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Alternative: Delete the product completely
    // await productsCollection.doc(id).delete();
    
    // Remove from user's created products array
    // await usersCollection.doc(userId).update({
    //   createdProducts: admin.firestore.FieldValue.arrayRemove(id)
    // });

    return res.json({
      success: true,
      message: 'Produkt został usunięty.'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas usuwania produktu.'
    });
  }
};

/**
 * Get products by farmer
 */
export const getProductsByFarmer = async (req: Request, res: Response) => {
  try {
    const { farmerId } = req.params;
    const {
      status = 'available',
      page = 1,
      limit = 12
    } = req.query;

    // Check if farmer exists
    const farmerDoc = await usersCollection.doc(farmerId as string).get();
    const farmerData = farmerDoc.data();
    
    if (!farmerDoc.exists || !farmerData || farmerData.role !== 'farmer') {
      return res.status(404).json({
        success: false,
        error: 'Rolnik nie znaleziony.'
      });
    }

    // Build query
    let query = productsCollection.where('owner', '==', farmerId);
    
    // Filter by status if not 'all'
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    // Execute query
    const snapshot = await query.get();
    const totalProducts = snapshot.size;
    
    // Get all products (we'll handle pagination in memory since Firestore doesn't have skip/limit like MongoDB)
    const products: FirestoreProduct[] = [];
    
    snapshot.forEach(doc => {
      products.push({
        _id: doc.id,
        ...doc.data()
      } as FirestoreProduct);
    });
    
    // Sort by created date (newest first)
    const sortedProducts = products.sort((a, b) => {
      const dateA = convertToDate(a.createdAt) || new Date();
      const dateB = convertToDate(b.createdAt) || new Date();
      return dateB.getTime() - dateA.getTime();
    });

    // Apply pagination
    const paginationOffset = (Number(page) - 1) * Number(limit);
    const paginatedProducts = sortedProducts.slice(
      paginationOffset, 
      paginationOffset + Number(limit)
    );

    // Return formatted response
    return res.json({
      success: true,
      data: {
        items: paginatedProducts,
        total: totalProducts,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalProducts / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error getting farmer products:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas pobierania produktów rolnika.'
    });
  }
};

/**
 * Helper function to sort products
 */
function sortProducts(products: FirestoreProduct[], sortBy: string, sortOrder: string): FirestoreProduct[] {
  return [...products].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'price': {
        return (a.price - b.price) * multiplier;
      }
      
      case 'rating': {
        return (a.averageRating - b.averageRating) * multiplier;
      }
      
      case 'distance': {
        // Default to 0 if distance not calculated
        const distanceA = a.distance || 0;
        const distanceB = b.distance || 0;
        return (distanceA - distanceB) * multiplier;
      }
      
      case 'date':
      default: {
        // Import the convertToDate function if available
        // const dateA = convertToDate(a.createdAt) || new Date();
        // const dateB = convertToDate(b.createdAt) || new Date();
        
        // Or handle conversion manually
        const dateA = a.createdAt instanceof Date ? a.createdAt :
                     (a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt) 
                     ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        
        const dateB = b.createdAt instanceof Date ? b.createdAt :
                     (b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt) 
                     ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        
        return (dateB.getTime() - dateA.getTime()) * (sortOrder === 'asc' ? -1 : 1);
      }
    }
  });
}
/**
 * Helper function to populate product owners
 */
async function populateProductOwners(products: FirestoreProduct[]): Promise<FirestoreProduct[]> {
  const populatedProducts = await Promise.all(products.map(async (product) => {
    if (typeof product.owner === 'string') {
      try {
        const ownerDoc = await usersCollection.doc(product.owner).get();
        
        if (ownerDoc.exists) {
          const ownerData = ownerDoc.data() as UserDocData | undefined; // Cast to our specific type

          if (ownerData) { // Ensure ownerData is defined
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { passwordHash, ...safeOwnerData } = ownerData; // passwordHash is intentionally unused after destructuring
            
            return {
              ...product,
              owner: {
                _id: ownerDoc.id,
                ...safeOwnerData
              } as ProductOwner // Cast to the expected ProductOwner type
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