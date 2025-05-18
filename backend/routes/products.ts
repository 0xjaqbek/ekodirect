// backend/routes/products.ts - Fixed version
import express from 'express';
import multer from 'multer';
import { authenticateUser } from '../middleware/auth.js';
import { 
  productExists, 
  isProductOwner, 
  validateProductData, 
  configureProductImageUpload 
} from '../middleware/products.js';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getProductsByFarmer
} from '../controllers/productController.js';
import {
  uploadProductImages,
  removeProductImage,
  setMainProductImage
} from '../controllers/productImageController.js';
import {
  updateProductStatus,
  getProductStatusHistory,
  getProductTracking
} from '../controllers/productStatusController.js';
import { VALIDATION } from '../../src/shared/constants/index.js';

// Create a router instance
const router = express.Router();

// Configure multer storage for product images
const storage = multer.memoryStorage();

// Configure multer upload with limits
const upload = multer({
  storage,
  limits: {
    fileSize: VALIDATION.MAX_FILE_SIZE_MB * 1024 * 1024, // MB to bytes
    files: VALIDATION.MAX_IMAGES_PER_PRODUCT
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (VALIDATION.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Nieprawidłowy format pliku. Dozwolone formaty to: ${VALIDATION.ALLOWED_IMAGE_TYPES.join(', ')}`));
    }
  }
});

/**
 * Get all products with filtering
 * @route GET /api/products
 * @access Public
 */
router.get('/', getProducts);

/**
 * Get products by farmer
 * @route GET /api/products/farmer/:farmerId
 * @access Public
 */
router.get('/farmer/:farmerId', getProductsByFarmer);

/**
 * Get product tracking information
 * @route GET /api/products/tracking/:trackingId
 * @access Public
 */
router.get('/tracking/:trackingId', getProductTracking);

/**
 * Create a new product
 * @route POST /api/products
 * @access Private (Farmers only)
 */
router.post(
  '/', 
  authenticateUser, 
  configureProductImageUpload,
  upload.array('images', VALIDATION.MAX_IMAGES_PER_PRODUCT),
  validateProductData,
  createProduct
);

/**
 * Get a single product
 * @route GET /api/products/:id
 * @access Public
 */
router.get('/:id', productExists, getProductById);

/**
 * Update a product
 * @route PUT /api/products/:id
 * @access Private (Product owner only)
 */
router.put(
  '/:id', 
  authenticateUser, 
  productExists,
  isProductOwner,
  configureProductImageUpload,
  upload.array('images', VALIDATION.MAX_IMAGES_PER_PRODUCT),
  validateProductData,
  updateProduct
);

/**
 * Delete a product
 * @route DELETE /api/products/:id
 * @access Private (Product owner only)
 */
router.delete(
  '/:id', 
  authenticateUser, 
  productExists,
  isProductOwner,
  deleteProduct
);

/**
 * Upload product images
 * @route POST /api/products/:id/images
 * @access Private (Product owner only)
 */
router.post(
  '/:id/images',
  authenticateUser,
  productExists,
  isProductOwner,
  configureProductImageUpload,
  upload.array('images', VALIDATION.MAX_IMAGES_PER_PRODUCT),
  uploadProductImages
);

/**
 * Remove product image
 * @route DELETE /api/products/:id/images/:imageIndex
 * @access Private (Product owner only)
 */
router.delete(
  '/:id/images/:imageIndex',
  authenticateUser,
  productExists,
  isProductOwner,
  removeProductImage
);

/**
 * Set main product image
 * @route PUT /api/products/:id/images/:imageIndex/main
 * @access Private (Product owner only)
 */
router.put(
  '/:id/images/:imageIndex/main',
  authenticateUser,
  productExists,
  isProductOwner,
  setMainProductImage
);

/**
 * Update product status
 * @route PUT /api/products/:id/status
 * @access Private (Product owner only)
 */
router.put(
  '/:id/status',
  authenticateUser,
  productExists,
  isProductOwner,
  updateProductStatus
);

/**
 * Get product status history
 * @route GET /api/products/:id/status/history
 * @access Private (Product owner or buyer)
 */
router.get(
  '/:id/status/history',
  authenticateUser,
  productExists,
  getProductStatusHistory
);

export default router;