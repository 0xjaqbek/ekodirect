// backend/controllers/productStatusController.ts
import { Request, Response } from 'express';
import { admin } from '../firebase';
import { PRODUCT_STATUSES } from '../../src/shared/constants';

// Initialize Firestore
const db = admin.firestore();
const productsCollection = db.collection('products');

// Define proper types for our data structures
interface StatusHistoryItem {
  status: string;
  timestamp: admin.firestore.FieldValue | Date;
  updatedBy: string;
  note?: string;
}

interface UserData {
  fullName: string;
  location?: {
    coordinates: [number, number];
    address: string;
    type?: string;
  };
  [key: string]: unknown; // For other properties we don't explicitly define
}

interface ProductData {
  name: string;
  status: string;
  owner: string;
  trackingId: string;
  statusHistory?: StatusHistoryItem[];
  harvestDate?: Date | admin.firestore.Timestamp;
  location?: {
    coordinates: [number, number];
    address: string;
    type?: string;
  };
  [key: string]: unknown; // For other properties we don't explicitly define
}

interface OwnerData {
  _id: string;
  fullName: string;
  location?: {
    coordinates: [number, number];
    address: string;
    type?: string;
  };
}

/**
 * Update product status
 */
export const updateProductStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const userId = req.user.id;

    // Validate status
    if (!status || !Object.values(PRODUCT_STATUSES).includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Nieprawidłowy status produktu.'
      });
    }

    // Check if product exists
    const productDoc = await productsCollection.doc(id).get();
    
    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
    }

    const productData = productDoc.data() as ProductData | undefined;
    if (!productData) {
      return res.status(404).json({
        success: false,
        error: 'Brak danych produktu.'
      });
    }

    // Check if user is the owner
    if (productData.owner !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Nie masz uprawnień do zmiany statusu tego produktu.'
      });
    }

    // Create status history item
    const statusHistoryItem: StatusHistoryItem = {
      status,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId
    };

    // Add note if provided
    if (note) {
      statusHistoryItem.note = note;
    }

    // Update product in Firestore
    await productDoc.ref.update({
      status,
      statusHistory: admin.firestore.FieldValue.arrayUnion(statusHistoryItem),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get updated product
    const updatedProductDoc = await productsCollection.doc(id).get();
    const updatedProductData = updatedProductDoc.data() as ProductData | undefined;
    if (!updatedProductData) {
      return res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania zaktualizowanego produktu.'
      });
    }

    const updatedProduct = {
      _id: updatedProductDoc.id,
      ...updatedProductData
    };

    // Return updated product
    return res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas aktualizacji statusu produktu.'
    });
  }
};

/**
 * Get product status history
 */
export const getProductStatusHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const productDoc = await productsCollection.doc(id).get();
    
    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
    }

    const productData = productDoc.data() as ProductData | undefined;
    if (!productData) {
      return res.status(404).json({
        success: false,
        error: 'Brak danych produktu.'
      });
    }

    // Check if statusHistory exists and handle it safely
    const statusHistory: StatusHistoryItem[] = productData.statusHistory || [];

    // Populate user data for each status history item
    const populatedStatusHistory = await Promise.all(
      statusHistory.map(async (item: StatusHistoryItem) => {
        // Get user who updated the status
        const userDoc = await db.collection('users').doc(item.updatedBy).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data() as UserData | undefined;
          if (userData) {
            return {
              ...item,
              updatedBy: {
                _id: userDoc.id,
                fullName: userData.fullName
              }
            };
          }
        }
        
        return item;
      })
    );

    // Return status history
    return res.json({
      success: true,
      data: populatedStatusHistory
    });
  } catch (error) {
    console.error('Error getting product status history:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas pobierania historii statusu produktu.'
    });
  }
};

/**
 * Get tracking information for a product
 */
export const getProductTracking = async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;

    // Find product by tracking ID
    const productsSnapshot = await productsCollection
      .where('trackingId', '==', trackingId)
      .limit(1)
      .get();

    if (productsSnapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Produkt o podanym identyfikatorze śledzenia nie został znaleziony.'
      });
    }

    const productDoc = productsSnapshot.docs[0];
    const productData = productDoc.data() as ProductData | undefined;
    if (!productData) {
      return res.status(404).json({
        success: false,
        error: 'Brak danych produktu.'
      });
    }

    // Get owner data
    let ownerData: string | OwnerData = productData.owner;
    
    if (typeof productData.owner === 'string') {
      const ownerDoc = await db.collection('users').doc(productData.owner).get();
      if (ownerDoc.exists) {
        const userData = ownerDoc.data() as UserData | undefined;
        if (userData) {
          ownerData = {
            _id: ownerDoc.id,
            fullName: userData.fullName,
            location: userData.location
          };
        }
      }
    }

    // Safely access statusHistory
    const statusHistory: StatusHistoryItem[] = productData.statusHistory || [];
    
    // Populate user data for each status history item
    const populatedStatusHistory = await Promise.all(
      statusHistory.map(async (item: StatusHistoryItem) => {
        // Get user who updated the status
        const userDoc = await db.collection('users').doc(item.updatedBy).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data() as UserData | undefined;
          if (userData) {
            return {
              ...item,
              updatedBy: {
                _id: userDoc.id,
                fullName: userData.fullName
              }
            };
          }
        }
        
        return item;
      })
    );

    // Return tracking information
    return res.json({
      success: true,
      data: {
        product: {
          _id: productDoc.id,
          name: productData.name,
          status: productData.status,
          trackingId: productData.trackingId,
          statusHistory: populatedStatusHistory,
          harvestDate: productData.harvestDate,
          owner: ownerData,
          location: productData.location
        }
      }
    });
  } catch (error) {
    console.error('Error getting product tracking:', error);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas pobierania informacji o śledzeniu produktu.'
    });
  }
};