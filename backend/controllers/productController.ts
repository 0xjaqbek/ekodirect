// backend/controllers/productController.ts
import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { uploadImageToStorage } from '../services/fileStorageService';
import { generateTrackingId } from '../utils/productUtils';
import { calculateDistance } from '../utils/geoUtils';

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
    let query = Product.find({ status: 'available' });

    // Apply filters
    if (category) {
      query = query.where('category', category as string);
    }

    if (subcategory) {
      query = query.where('subcategory', subcategory as string);
    }

    if (minPrice) {
      query = query.where('price').gte(Number(minPrice));
    }

    if (maxPrice) {
      query = query.where('price').lte(Number(maxPrice));
    }

    if (farmer) {
      query = query.where('owner', farmer as string);
    }

    if (certificate) {
      query = query.where('certificates').in([certificate as string]);
    }

    // Text search
    if (search) {
      query = query.where({
        $or: [
          { name: { $regex: search as string, $options: 'i' } },
          { description: { $regex: search as string, $options: 'i' } }
        ]
      });
    }

    // Apply sorting
    const sortOptions: any = {};
    switch (sortBy) {
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

    query = query.sort(sortOptions);

    // Count total documents for pagination
    const totalProducts = await Product.countDocuments(query);

    // Apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    query = query.skip(skip).limit(Number(limit));

    // Populate owner
    query = query.populate('owner', 'fullName profileImage');

    // Execute query
    let products = await query.exec();

    // Filter by location and calculate distance if coordinates provided
    if (lat && lng) {
      const userLocation = [Number(lng), Number(lat)];

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
          (product as any).distance = distance;

          // Keep only products within radius
          return distance <= Number(radius);
        })
        .sort((a, b) => {
          // If sortBy is distance, sort by distance
          if (sortBy === 'distance') {
            return sortOrder === 'asc'
              ? (a as any).distance - (b as any).distance
              : (b as any).distance - (a as any).distance;
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

    const product = await Product.findById(id)
      .populate('owner', 'fullName email phoneNumber profileImage location role')
      .exec();

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
        ],
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
    }

    // Save product
    await newProduct.save();

    // Add product to user's created products
    await User.findByIdAndUpdate(userId, {
      $push: { createdProducts: newProduct._id }
    });

    // Return created product
    return res.status(201).json({
      success: true,
      data: newProduct
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
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
    }

    // Check if user is the owner
    if (product.owner.toString() !== userId) {
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
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price ? Number(price) : product.price;
    product.quantity = quantity ? Number(quantity) : product.quantity;
    product.unit = unit || product.unit;
    product.category = category || product.category;
    product.subcategory = subcategory;
    product.harvestDate = harvestDate || product.harvestDate;
    
    // Update certificates
    if (certificates) {
      product.certificates = Array.isArray(certificates) ? certificates : [certificates];
      product.isCertified = product.certificates.length > 0;
    }

    // Update location
    if (location) {
      product.location = location;
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
      product.images = [...product.images, ...imageUrls];
    }

    // Update timestamp
    product.updatedAt = new Date();

    // Save updated product
    await product.save();

    // Return updated product
    return res.json({
      success: true,
      data: product
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
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
    }

    // Check if user is the owner or admin
    if (product.owner.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Nie masz uprawnień do usunięcia tego produktu.'
      });
    }

    // Set product as unavailable instead of deleting
    product.status = 'unavailable';
    product.statusHistory.push({
      status: 'unavailable',
      timestamp: new Date(),
      updatedBy: userId
    });
    product.updatedAt = new Date();

    await product.save();

    // Alternative: Delete the product completely
    // await Product.findByIdAndDelete(id);

    // Remove product from user's created products
    // await User.findByIdAndUpdate(userId, {
    //   $pull: { createdProducts: id }
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
    const farmer = await User.findById(farmerId);
    if (!farmer || farmer.role !== 'farmer') {
      return res.status(404).json({
        success: false,
        error: 'Rolnik nie znaleziony.'
      });
    }

    // Build query
    let query = Product.find({ owner: farmerId });

    // Filter by status if provided
    if (status !== 'all') {
      query = query.where('status', status);
    }

    // Sort by created date (newest first)
    query = query.sort({ createdAt: -1 });

    // Count total documents for pagination
    const totalProducts = await Product.countDocuments(query);

    // Apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    query = query.skip(skip).limit(Number(limit));

    // Execute query
    const products = await query.exec();

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