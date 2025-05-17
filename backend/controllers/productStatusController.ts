// backend/controllers/productStatusController.ts
import { Request, Response } from 'express';
import { admin } from '../firebase';
import { PRODUCT_STATUSES } from '../../src/shared/constants';

// Initialize Firestore
const db = admin.firestore();
const productsCollection = db.collection('products');

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

    const product = productDoc.data();

    // Check if user is the owner
    if (product.owner !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Nie masz uprawnień do zmiany statusu tego produktu.'
      });
    }

    // Create status history item
    const statusHistoryItem = {
      status,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId
    };

    if (note) {
      statusHistoryItem['note'] = note;
    }

    // Update product in Firestore
    await productDoc.ref.update({
      status,
      statusHistory: admin.firestore.FieldValue.arrayUnion(statusHistoryItem),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get updated product
    const updatedProductDoc = await productsCollection.doc(id).get();
    const updatedProduct = {
      _id: updatedProductDoc.id,
      ...updatedProductDoc.data()
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

    const product = productDoc.data();

    // Populate user data for each status history item
    const statusHistory = await Promise.all(
      product.statusHistory.map(async (item) => {
        // Get user who updated the status
        const userDoc = await db.collection('users').doc(item.updatedBy).get();
        
        if (userDoc.exists) {
          return {
            ...item,
            updatedBy: {
              _id: userDoc.id,
              fullName: userDoc.data().fullName
            }
          };
        }
        
        return item;
      })
    );

    // Return status history
    return res.json({
      success: true,
      data: statusHistory
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
    const product = productDoc.data();

    // Get owner data
    const ownerDoc = await db.collection('users').doc(product.owner).get();
    let owner = product.owner;
    
    if (ownerDoc.exists) {
      const ownerData = ownerDoc.data();
      owner = {
        _id: ownerDoc.id,
        fullName: ownerData.fullName,
        location: ownerData.location
      };
    }

    // Populate user data for each status history item
    const statusHistory = await Promise.all(
      product.statusHistory.map(async (item) => {
        // Get user who updated the status
        const userDoc = await db.collection('users').doc(item.updatedBy).get();
        
        if (userDoc.exists) {
          return {
            ...item,
            updatedBy: {
              _id: userDoc.id,
              fullName: userDoc.data().fullName
            }
          };
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
          name: product.name,
          status: product.status,
          trackingId: product.trackingId,
          statusHistory: statusHistory,
          harvestDate: product.harvestDate,
          owner: owner,
          location: product.location
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