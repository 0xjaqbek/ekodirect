// backend/controllers/productImageController.ts - Fixed version with correct imports
import { Request, Response } from 'express';
import { admin } from '../firebase';
import { VALIDATION } from '../constants';

// Initialize Firestore
const db = admin.firestore();
const productsCollection = db.collection('products');

// Initialize Firebase Storage
const bucket = admin.storage().bucket();

// Define proper types
interface ProductData {
  owner: string;
  images: string[];
  [key: string]: unknown;
}

/**
 * Upload product images
 */
export const uploadProductImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Add null check before accessing req.user
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    const userId = req.user.id;

    // Check if product exists
    const productDoc = await productsCollection.doc(id).get();
    
    if (!productDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
      return;
    }

    const product = productDoc.data() as ProductData | undefined;
    
    // Add null check for product
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Brak danych produktu.'
      });
      return;
    }

    // Check if user is the owner
    if (product.owner !== userId) {
      res.status(403).json({
        success: false,
        error: 'Nie masz uprawnień do edycji tego produktu.'
      });
      return;
    }

    // Get uploaded files
    const images = req.files as Express.Multer.File[];
    
    if (!images || images.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Nie przesłano żadnych zdjęć.'
      });
      return;
    }

    // Check if max images limit reached
    if (product.images.length + images.length > VALIDATION.MAX_IMAGES_PER_PRODUCT) {
      res.status(400).json({
        success: false,
        error: `Przekroczono maksymalną liczbę zdjęć (${VALIDATION.MAX_IMAGES_PER_PRODUCT}).`
      });
      return;
    }

    // Upload images to Firebase Storage
    const imageUrls: string[] = [];

    for (const file of images) {
      const fileName = `products/${userId}_${Date.now()}_${file.originalname}`;
      const fileUpload = bucket.file(fileName);
      
      // Create write stream
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype
        }
      });
      
      // Handle stream errors
      const uploadPromise = new Promise<string>((resolve, reject) => {
        blobStream.on('error', (error) => {
          console.error('Error uploading to Firebase Storage:', error);
          reject(error);
        });
        
        blobStream.on('finish', async () => {
          // Make the file publicly accessible
          await fileUpload.makePublic();
          
          // Get public URL
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          resolve(publicUrl);
        });
        
        // End the stream with the file buffer
        blobStream.end(file.buffer);
      });
      
      const imageUrl = await uploadPromise;
      imageUrls.push(imageUrl);
    }

    // Add new images to existing images array
    const updatedImages = [...product.images, ...imageUrls];
    
    // Update product in Firestore
    await productDoc.ref.update({
      images: updatedImages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return updated image URLs
    res.json({
      success: true,
      data: {
        imageUrls: updatedImages
      }
    });
  } catch (error) {
    console.error('Error uploading product images:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas przesyłania zdjęć.'
    });
  }
};

/**
 * Remove product image
 */
export const removeProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, imageIndex } = req.params;
    
    // Add null check before accessing req.user
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    const userId = req.user.id;

    // Check if product exists
    const productDoc = await productsCollection.doc(id).get();
    
    if (!productDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
      return;
    }

    const product = productDoc.data() as ProductData | undefined;
    
    // Add null check for product
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Brak danych produktu.'
      });
      return;
    }

    // Check if user is the owner
    if (product.owner !== userId) {
      res.status(403).json({
        success: false,
        error: 'Nie masz uprawnień do edycji tego produktu.'
      });
      return;
    }

    // Check if image index is valid
    const index = parseInt(imageIndex, 10);
    
    if (isNaN(index) || index < 0 || index >= product.images.length) {
      res.status(400).json({
        success: false,
        error: 'Nieprawidłowy indeks zdjęcia.'
      });
      return;
    }

    // Get image URL
    const imageUrl = product.images[index];

    // Try to delete image from Firebase Storage
    try {
      // Extract file path from URL
      const decodedUrl = decodeURIComponent(imageUrl);
      const startIndex = decodedUrl.indexOf('/o/') + 3;
      const endIndex = decodedUrl.indexOf('?');
      const filePath = decodedUrl.substring(startIndex, endIndex !== -1 ? endIndex : undefined);
      
      // Delete file from Storage
      await bucket.file(filePath).delete();
    } catch (deleteError) {
      // Just log the error but continue with removal from array
      console.warn('Error deleting image from Storage:', deleteError);
    }

    // Remove image from array
    const updatedImages = [...product.images];
    updatedImages.splice(index, 1);

    // Update product in Firestore
    await productDoc.ref.update({
      images: updatedImages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return updated image URLs
    res.json({
      success: true,
      data: {
        imageUrls: updatedImages
      }
    });
  } catch (error) {
    console.error('Error removing product image:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas usuwania zdjęcia.'
    });
  }
};

/**
 * Set main product image (reorder images)
 */
export const setMainProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, imageIndex } = req.params;
    
    // Add null check before accessing req.user
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    const userId = req.user.id;

    // Check if product exists
    const productDoc = await productsCollection.doc(id).get();
    
    if (!productDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
      return;
    }

    const product = productDoc.data() as ProductData | undefined;
    
    // Add null check for product
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Brak danych produktu.'
      });
      return;
    }

    // Check if user is the owner
    if (product.owner !== userId) {
      res.status(403).json({
        success: false,
        error: 'Nie masz uprawnień do edycji tego produktu.'
      });
      return;
    }

    // Check if image index is valid
    const index = parseInt(imageIndex, 10);
    
    if (isNaN(index) || index < 0 || index >= product.images.length) {
      res.status(400).json({
        success: false,
        error: 'Nieprawidłowy indeks zdjęcia.'
      });
      return;
    }

    // Move selected image to the beginning of the array
    const imageUrl = product.images[index];
    const updatedImages = [...product.images];
    updatedImages.splice(index, 1);
    updatedImages.unshift(imageUrl);

    // Update product in Firestore
    await productDoc.ref.update({
      images: updatedImages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return updated image URLs
    res.json({
      success: true,
      data: {
        imageUrls: updatedImages
      }
    });
  } catch (error) {
    console.error('Error setting main product image:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas ustawiania głównego zdjęcia.'
    });
  }
};