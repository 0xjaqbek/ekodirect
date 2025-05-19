// backend/middleware/products.ts - Fixed version with correct imports
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { VALIDATION } from '../shared/constants.js';
import { productsCollection } from '../models/collections.js';
import type { FirestoreProduct } from '../types/index.js';

// Extend Express Request type using module augmentation
declare module 'express' {
  interface Request {
    productData?: FirestoreProduct;
    productId?: string;
    productImageUpload?: multer.Multer;
  }
}

/**
 * Middleware to check if a product exists
 */
export const productExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const productDoc = await productsCollection.doc(id).get();
    
    if (!productDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony'
      });
      return;
    }
    
    // Add product data to request object with proper typing
    const productData = productDoc.data();
    req.productData = {
      _id: id,
      ...productData
    } as FirestoreProduct;
    req.productId = id;
    
    next();
  } catch (error) {
    console.error('Product exists middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas weryfikacji produktu'
    });
  }
};

/**
 * Middleware to check if user is the owner of the product
 */
export const isProductOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // This middleware should be used after productExists
    if (!req.productData) {
      res.status(500).json({
        success: false,
        error: 'Wewnętrzny błąd serwera - brak danych produktu'
      });
      return;
    }
    
    // Add null check for req.user
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    const userId = req.user.id;
    
    // Check if user is the owner
    if (req.productData.owner !== userId && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Nie masz uprawnień do wykonania tej operacji'
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Is product owner middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas weryfikacji uprawnień'
    });
  }
};

/**
 * Middleware to validate product data
 */
export const validateProductData = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { name, description, price, quantity, unit, category } = req.body;
    
    // Required fields
    if (!name || !description || !price || !quantity || !unit || !category) {
      res.status(400).json({
        success: false,
        error: 'Brakujące wymagane pola'
      });
      return;
    }
    
    // Name validation
    if (name.length < 3 || name.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Nazwa produktu musi mieć od 3 do 100 znaków'
      });
      return;
    }
    
    // Description validation
    if (description.length < 10 || description.length > 2000) {
      res.status(400).json({
        success: false,
        error: 'Opis produktu musi mieć od 10 do 2000 znaków'
      });
      return;
    }
    
    // Price validation
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      res.status(400).json({
        success: false,
        error: 'Cena musi być liczbą dodatnią'
      });
      return;
    }
    
    // Quantity validation
    const quantityNumber = parseInt(quantity, 10);
    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      res.status(400).json({
        success: false,
        error: 'Ilość musi być liczbą całkowitą dodatnią'
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Validate product data middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas walidacji danych produktu'
    });
  }
};

// Configure storage for multer
const storage = multer.memoryStorage();

/**
 * Middleware to configure image upload for products
 */
export const configureProductImageUpload = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Add product image upload configuration
    const upload = multer({
      storage,
      limits: {
        fileSize: VALIDATION.MAX_FILE_SIZE_MB * 1024 * 1024, // MB to bytes
        files: VALIDATION.MAX_IMAGES_PER_PRODUCT
      },
      fileFilter: (_req, file, cb) => {
        // Check if file type is allowed
        if (VALIDATION.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
          return cb(null, true);
        }
        cb(new Error(`Nieprawidłowy format pliku. Dozwolone są tylko: ${VALIDATION.ALLOWED_IMAGE_TYPES.join(', ')}`));
      }
    });

    // Attach the multer upload to the request for use in route handlers
    req.productImageUpload = upload;
    
    next();
  } catch (error) {
    console.error('Configure product image upload middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas konfiguracji przesyłania obrazów'
    });
  }
};