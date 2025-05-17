// backend/controllers/productController.ts
import { Request, Response } from 'express';
import { admin } from '../firebase';
import { usersCollection, productsCollection } from '../models/collections';
import { uploadImageToStorage } from '../services/fileStorageService';
import { generateTrackingId } from '../utils/productUtils';
import { calculateDistance } from '../utils/geoUtils';
import { FirestoreProduct, FirestoreUser, UserWithoutPassword, ProductWithOwner } from '../types';

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

    // Build query
    let query = productsCollection.where('status', '==', 'available');

    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }

    if (subcategory) {
      query = query.where('subcategory', '==', subcategory);
    }

    if (minPrice) {
      query = query.where('price', '>=', Number(minPrice));
    }

    if (maxPrice) {
      query = query.where('price', '<=', Number(maxPrice));
    }

    if (farmer) {
      query = query.where('owner', '==', farmer);
    }

    if (certificate) {
      query = query.where('certificates', 'array-contains', certificate);
    }

    // Execute query
    const snapshot = await query.get();
    
    // Process results
    let products: ProductWithOwner[] = [];
    snapshot.forEach(doc => {
      products.push({
        _id: doc.id,
        ...(doc.data() as FirestoreProduct),
        owner: doc.data().owner || ''
      });
    });

    // Get owner information for each product
    const ownerIds = [...new Set(products.map(product => product.owner as string))];
    
    const ownerMap: Record<string, UserWithoutPassword> = {};
    
    if (ownerIds.length > 0) {
      const ownerDocs = await Promise.all(
        ownerIds.map(id => usersCollection.doc(id as string).get())
      );
      
      ownerDocs.forEach(doc => {
        if (doc.exists) {
          const userData = doc.data() as FirestoreUser;
          if (userData) {
            const { passwordHash, ...userWithoutPassword } = userData;
            ownerMap[doc.id] = {
              id: doc.id,
              ...userWithoutPassword
            };
          }
        }
      });
    }
    
    // Attach owner info to products
    products = products.map(product => ({
      ...product,
      owner: ownerMap[product.owner as string] || product.owner
    }));

    // Apply text search filter (case insensitive)
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    }

    // Calculate total documents for pagination
    const totalProducts = products.length;

    // Filter by location and calculate distance if coordinates provided
    if (lat && lng) {
      const userLocation: [number, number] = [Number(lng), Number(lat)];

      // Filter products by distance and add distance property
      products = products
        .filter(product => {
          // Skip products without location
          if (!product.location?.coordinates) return false;

          const distance = calculateDistance(
            Number(lat),
            Number(lng),
            product.location.coordinates[1],
            product.location.coordinates[0]
          );

          // Add distance to product
          product.distance = distance;

          // Keep only products within radius
          return distance <= Number(radius);
        })
        .sort((a, b) => {
          // If sortBy is distance, sort by distance
          if (sortBy === 'distance') {
            return sortOrder === 'asc'
              ? (a.distance || 0) - (b.distance || 0)
              : (b.distance || 0) - (a.distance || 0);
          }
          return 0; // Keep original sort for other cases
        });
    }

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedProducts = products.slice(startIndex, endIndex);

    // Return formatted response
    return res.json({
      success: true,
      data: {
        items: paginatedProducts,
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

    const doc = await productsCollection.doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
    }
    
    const product = {
      _id: doc.id,
      ...(doc.data() as FirestoreProduct)
    } as ProductWithOwner;

    // Populate owner info
    const ownerDoc = await usersCollection.doc(product.owner as string).get();
    
    if (ownerDoc.exists) {
      const userData = ownerDoc.data() as FirestoreUser;
      if (userData) {
        const { passwordHash, ...userWithoutPassword } = userData;
        product.owner = {
          id: ownerDoc.id,
          ...userWithoutPassword
        };
      }
    }

    return res.json({
      success: true,
      data: product
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
      certificates
    } = req.body;

    // Parse location if provided
    let location;
    if (req.body['location.coordinates'] && req.body['location.address']) {
      location = {
        type: 'Point',
        coordinates: [
          Number(req.body['location.coordinates[0]']),
          Number(req.body['location.coordinates[1]'])
        ],
        address: req.body['location.address']
      };
    }

    // Create a new product
    const productData: Partial<FirestoreProduct> = {
      name,
      description,
      price: Number(price),
      quantity: Number(quantity),
      unit,
      category,
      subcategory,
      owner: userId,
      location,
      harvestDate: harvestDate ? new Date(harvestDate) : undefined,
      certificates: certificates ? Array.isArray(certificates) ? certificates : [certificates] : [],
      status: 'available',
      statusHistory: [
        {
          status: 'available',
          timestamp: new Date(),
          updatedBy: userId
        }
      ],
      trackingId: generateTrackingId(),
      isCertified: certificates && (Array.isArray(certificates) ? certificates.length > 0 : true),
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [] // Initialize with empty array
    };

    // Process images
    const images = req.files as Express.Multer.File[];
    if (images && images.length > 0) {
      const imageUrls = await Promise.all(
        images.map(async (file) => {
          return await uploadImageToStorage(file, 'products');
        })
      );

      productData.images = imageUrls;
    }

    // Save product
    const productRef = await productsCollection.add(productData);

    // Add product to user's created products
    await usersCollection.doc(userId).update({
      createdProducts: admin.firestore.FieldValue.arrayUnion(productRef.id)
    });

    // Return created product
    return res.status(201).json({
      success: true,
      data: {
        _id: productRef.id,
        ...productData
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas tworzenia produktu.'
    });
  }
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
    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
    }

    const product = productDoc.data() as FirestoreProduct;

    // Check if user is the owner
    if (product && product.owner !== userId) {
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
      certificates
    } = req.body;

    // Parse location if provided
    let location;
    if (req.body['location.coordinates'] && req.body['location.address']) {
      location = {
        type: 'Point',
        coordinates: [
          Number(req.body['location.coordinates[0]']),
          Number(req.body['location.coordinates[1]'])
        ],
        address: req.body['location.address']
      };
    }

    // Update fields
    const updateData: Partial<FirestoreProduct> = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = Number(price);
    if (quantity) updateData.quantity = Number(quantity);
    if (unit) updateData.unit = unit;
    if (category) updateData.category = category;
    if (subcategory) updateData.subcategory = subcategory;
    if (harvestDate) updateData.harvestDate = new Date(harvestDate);
    if (location) updateData.location = location;
    
    // Update certificates
    if (certificates) {
      updateData.certificates = Array.isArray(certificates) ? certificates : [certificates];
      updateData.isCertified = updateData.certificates.length > 0;
    }

    // Update timestamp
    updateData.updatedAt = new Date();

    // Process new images
    const images = req.files as Express.Multer.File[];
    if (images && images.length > 0) {
      const imageUrls = await Promise.all(
        images.map(async (file) => {
          return await uploadImageToStorage(file, 'products');
        })
      );

      // Add new images to existing images array
      updateData.images = [...(product.images || []), ...imageUrls];
    }

    // Save updated product
    await productsCollection.doc(id).update(updateData);
    
    // Get updated product
    const updatedProductDoc = await productsCollection.doc(id).get();
    const updatedProduct = {
      _id: updatedProductDoc.id,
      ...(updatedProductDoc.data() as FirestoreProduct)
    };

    // Return updated product
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
    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
    }

    const product = productDoc.data() as FirestoreProduct;

    // Check if user is the owner or admin
    if (product && product.owner !== userId && req.user.role !== 'admin') {
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
        timestamp: new Date(),
        updatedBy: userId
      }),
      updatedAt: new Date()
    });

    // Alternative: Delete the product completely
    // await productsCollection.doc(id).delete();

    // Remove product from user's created products
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

// Add remaining methods...