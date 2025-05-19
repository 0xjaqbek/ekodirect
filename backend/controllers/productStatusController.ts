// backend/controllers/productStatusController.ts - Fixed version
import { Request, Response } from 'express';
import { admin } from '../firebase.js';
import { PRODUCT_STATUSES } from '../shared/constants.js';

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
  [key: string]: unknown;
}

interface ProductData {
  name: string;
  status: string;
  owner: string;
  trackingId: string;
  statusHistory?: StatusHistoryItem[];
  harvestDate?: admin.firestore.Timestamp | Date;
  location?: {
    coordinates: [number, number];
    address: string;
    type?: string;
  };
  [key: string]: unknown;
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
export const updateProductStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    
    // Add null check before accessing req.user
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    const userId = req.user.id;

    // Validate status
    if (!status || !Object.values(PRODUCT_STATUSES).includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Nieprawidłowy status produktu.'
      });
      return;
    }

    // Check if product exists
    const productDoc = await productsCollection.doc(id).get();
    
    if (!productDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
      return;
    }

    const productData = productDoc.data() as ProductData | undefined;
    if (!productData) {
      res.status(404).json({
        success: false,
        error: 'Brak danych produktu.'
      });
      return;
    }

    // Check if user is the owner
    if (productData.owner !== userId) {
      res.status(403).json({
        success: false,
        error: 'Nie masz uprawnień do zmiany statusu tego produktu.'
      });
      return;
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
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania zaktualizowanego produktu.'
      });
      return;
    }

    const updatedProduct = {
      _id: updatedProductDoc.id,
      ...updatedProductData
    };

    // Return updated product
    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas aktualizacji statusu produktu.'
    });
  }
};

/**
 * Get product tracking information
 */
export const getProductTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;

    // Find product by tracking ID
    const productsSnapshot = await productsCollection
      .where('trackingId', '==', trackingId)
      .limit(1)
      .get();

    if (productsSnapshot.empty) {
      res.status(404).json({
        success: false,
        error: 'Produkt o podanym identyfikatorze śledzenia nie został znaleziony.'
      });
      return;
    }

    const productDoc = productsSnapshot.docs[0];
    const productData = productDoc.data() as ProductData | undefined;
    if (!productData) {
      res.status(404).json({
        success: false,
        error: 'Brak danych produktu.'
      });
      return;
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

    // Convert Firebase Timestamp to Date for harvestDate
    let harvestDate = null;
    if (productData.harvestDate) {
      if ('toDate' in productData.harvestDate && typeof productData.harvestDate.toDate === 'function') {
        harvestDate = productData.harvestDate.toDate();
      } else if (productData.harvestDate instanceof Date) {
        harvestDate = productData.harvestDate;
      }
    }

    // Return tracking information
    res.json({
      success: true,
      data: {
        product: {
          _id: productDoc.id,
          name: productData.name,
          status: productData.status,
          trackingId: productData.trackingId,
          statusHistory: populatedStatusHistory,
          harvestDate: harvestDate,
          owner: ownerData,
          location: productData.location
        }
      }
    });
  } catch (error) {
    console.error('Error getting product tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas pobierania informacji o śledzeniu produktu.'
    });
  }
};

/**
 * Get product status history
 */
export const getProductStatusHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if product exists
    const productDoc = await productsCollection.doc(id).get();
    
    if (!productDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
      return;
    }

    const productData = productDoc.data() as ProductData | undefined;
    if (!productData) {
      res.status(404).json({
        success: false,
        error: 'Brak danych produktu.'
      });
      return;
    }

    // Return status history
    res.json({
      success: true,
      data: {
        statusHistory: productData.statusHistory || []
      }
    });
  } catch (error) {
    console.error('Error getting product status history:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas pobierania historii statusu produktu.'
    });
  }
};