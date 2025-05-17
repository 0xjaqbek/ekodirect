// backend/controllers/productController.ts
import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { User } from '../models/Users';
import { uploadImageToStorage } from '../services/fileStorageService';
import { generateTrackingId, calculateDistance } from '../utils/productUtils';
import { FirestoreProduct } from '../types';

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
    let query: Record<string, any> = { status: 'available' };

    // Apply filters
    if (category) {
      query.category = category as string;
    }

    if (subcategory) {
      query.subcategory = subcategory as string;
    }

    if (minPrice) {
      query.price = { ...query.price, $gte: Number(minPrice) };
    }

    if (maxPrice) {
      query.price = { ...query.price, $lte: Number(maxPrice) };
    }

    if (farmer) {
      query.owner = farmer as string;
    }

    if (certificate) {
      query.certificates = { $in: [certificate as string] };
    }

    // Apply text search
    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } }
      ];
    }

    // Apply sorting
    const sortOptions: Record<string, number> = {};
    switch (sortBy as string) {
      case 'price':
        sortOptions.price = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'rating':
        sortOptions.averageRating = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'date':
      default:
        sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
        break;
    }

    // Count total documents for pagination
    const totalProducts = await Product.countDocuments(query);

    // Apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Create query builder
    const queryBuilder = Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .populate('owner');
    
    // Execute query
    let products = await queryBuilder.exec();

    // Filter by location and calculate distance if coordinates provided
    if (lat && lng) {
      const userLat = Number(lat);
      const userLng = Number(lng);
      const maxRadius = Number(radius);

      // Filter products by distance and add distance property
      products = products
        .filter((product: FirestoreProduct) => {
          // Skip products without location
          if (!product.location?.coordinates) return false;

          const distance = calculateDistance(
            userLat,
            userLng,
            product.location.coordinates[1],
            product.location.coordinates[0]
          );

          // Add distance to product
          product.distance = distance;

          // Keep only products within radius
          return distance <= maxRadius;
        })
        .sort((a: FirestoreProduct, b: FirestoreProduct) => {
          // If sortBy is distance, sort by distance
          if (sortBy === 'distance') {
            return sortOrder === 'asc'
              ? (a.distance || 0) - (b.distance || 0)
              : (b.distance || 0) - (a.distance || 0);
          }
          return 0; // Keep original sort for other cases
        });
    }

    // Return formatted response
    return res.json({
      success: true,
      data: {
        items: products,
        total: products.length, // Use filtered length if location filtering applied
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalProducts / Number(limit))
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

    const product = await Product.findById(id).populate('owner');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
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
        ] as [number, number],
        address: req.body['location.address']
      };
    }

    // Create a new product
    const newProduct = new Product({
      name,
      description,
      price: Number(price),
      quantity: Number(quantity),
      unit,
      category,
      subcategory,
      owner: userId,
      location,
      harvestDate,
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
      updatedAt: new Date()
    });

    // Process images
    const images = req.files as Express.Multer.File[];
    if (images && images.length > 0) {
      const imageUrls = await Promise.all(
        images.map(async (file) => {
          return await uploadImageToStorage(file, 'products');
        })
      );

      newProduct.images = imageUrls;
    } else {
      newProduct.images = [];
    }

    // Save product
    const savedProduct = await newProduct.save();

    // Add product to user's created products
    const user = await User.findById(userId);
    if (user) {
      if (!user.createdProducts) {
        user.createdProducts = [];
      }
      user.createdProducts.push(savedProduct._id as string);
      await user.save();
    }

    // Return created product
    return res.status(201).json({
      success: true,
      data: savedProduct
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
    const product = await Product.findById(id).populate('owner');
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
    }

    // Check if user is the owner
    if ((product.owner as string) !== userId) {
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
        ] as [number, number],
        address: req.body['location.address']
      };
    }

    // Update fields
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (unit !== undefined) updateData.unit = unit;
    if (category !== undefined) updateData.category = category;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (harvestDate !== undefined) updateData.harvestDate = harvestDate;
    if (location !== undefined) updateData.location = location;
    
    // Update certificates
    if (certificates) {
      updateData.certificates = Array.isArray(certificates) ? certificates : [certificates];
      updateData.isCertified = updateData.certificates.length > 0;
    }

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

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData);

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
    const product = await Product.findById(id).populate('owner');
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
    }

    // Check if user is the owner or admin
    if ((product.owner as string) !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Nie masz uprawnień do usunięcia tego produktu.'
      });
    }

    // Set product as unavailable instead of deleting
    await Product.findByIdAndUpdate(id, {
      status: 'unavailable',
      statusHistory: [
        ...(product.statusHistory || []),
        {
          status: 'unavailable',
          timestamp: new Date(),
          updatedBy: userId
        }
      ],
      updatedAt: new Date()
    });

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
    const farmer = await User.findById(farmerId);
    if (!farmer || farmer.role !== 'farmer') {
      return res.status(404).json({
        success: false,
        error: 'Rolnik nie znaleziony.'
      });
    }

    // Build query
    let query: Record<string, any> = { owner: farmerId };

    // Filter by status if provided
    if (status !== 'all') {
      query.status = status;
    }

    // Count total documents for pagination
    const totalProducts = await Product.countDocuments(query);

    // Apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Create query builder and execute
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .exec();

    // Return formatted response
    return res.json({
      success: true,
      data: {
        items: products,
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