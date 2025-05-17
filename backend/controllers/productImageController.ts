// backend/controllers/productImageController.ts
import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { uploadImageToStorage, deleteImageFromStorage } from '../services/fileStorageService';
import { VALIDATION } from '../constants';

/**
 * Upload product images
 */
export const uploadProductImages = async (req: Request, res: Response) => {
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

    // Get uploaded files
    const images = req.files as Express.Multer.File[];
    if (!images || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nie przesłano żadnych zdjęć.'
      });
    }

    // Check if max images limit reached
    if (product.images.length + images.length > VALIDATION.MAX_IMAGES_PER_PRODUCT) {
      return res.status(400).json({
        success: false,
        error: `Przekroczono maksymalną liczbę zdjęć (${VALIDATION.MAX_IMAGES_PER_PRODUCT}).`
      });
    }

    // Upload images to storage
    const imageUrls = await Promise.all(
      images.map(async (file) => {
        return await uploadImageToStorage(file, 'products');
      })
    );

    // Add new images to existing images array
    product.images = [...product.images, ...imageUrls];
    product.updatedAt = new Date();

    // Save updated product
    await product.save();

    // Return updated image URLs
    return res.json({
      success: true,
      data: {
        imageUrls: product.images
      }
    });
  } catch (error) {
    console.error('Error uploading product images:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas przesyłania zdjęć.'
    });
  }
};

/**
 * Remove product image
 */
export const removeProductImage = async (req: Request, res: Response) => {
  try {
    const { id, imageIndex } = req.params;
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

    // Check if image index is valid
    const index = parseInt(imageIndex, 10);
    if (isNaN(index) || index < 0 || index >= product.images.length) {
      return res.status(400).json({
        success: false,
        error: 'Nieprawidłowy indeks zdjęcia.'
      });
    }

    // Get image URL
    const imageUrl = product.images[index];

    // Delete image from storage
    await deleteImageFromStorage(imageUrl);

    // Remove image from array
    product.images.splice(index, 1);
    product.updatedAt = new Date();

    // Save updated product
    await product.save();

    // Return updated image URLs
    return res.json({
      success: true,
      data: {
        imageUrls: product.images
      }
    });
  } catch (error) {
    console.error('Error removing product image:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas usuwania zdjęcia.'
    });
  }
};

/**
 * Set main product image (reorder images)
 */
export const setMainProductImage = async (req: Request, res: Response) => {
  try {
    const { id, imageIndex } = req.params;
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

    // Check if image index is valid
    const index = parseInt(imageIndex, 10);
    if (isNaN(index) || index < 0 || index >= product.images.length) {
      return res.status(400).json({
        success: false,
        error: 'Nieprawidłowy indeks zdjęcia.'
      });
    }

    // Move selected image to the beginning of the array
    const imageUrl = product.images[index];
    product.images.splice(index, 1);
    product.images.unshift(imageUrl);
    product.updatedAt = new Date();

    // Save updated product
    await product.save();

    // Return updated image URLs
    return res.json({
      success: true,
      data: {
        imageUrls: product.images
      }
    });
  } catch (error) {
    console.error('Error setting main product image:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas ustawiania głównego zdjęcia.'
    });
  }
};