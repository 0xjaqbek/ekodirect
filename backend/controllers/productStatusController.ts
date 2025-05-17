// backend/controllers/productStatusController.ts
import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { PRODUCT_STATUSES } from '../constants';

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
        error: 'Nie masz uprawnień do zmiany statusu tego produktu.'
      });
    }

    // Update status
    product.status = status;

    // Add to status history
    product.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: userId,
      note: note || undefined
    });

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
    const product = await Product.findById(id)
      .populate('statusHistory.updatedBy', 'fullName');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nie znaleziony.'
      });
    }

    // Return status history
    return res.json({
      success: true,
      data: product.statusHistory
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
    const product = await Product.findOne({ trackingId })
      .populate('owner', 'fullName location')
      .populate('statusHistory.updatedBy', 'fullName')
      .exec();

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produkt o podanym identyfikatorze śledzenia nie został znaleziony.'
      });
    }

    // Return tracking information
    return res.json({
      success: true,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          status: product.status,
          trackingId: product.trackingId,
          statusHistory: product.statusHistory,
          harvestDate: product.harvestDate,
          owner: product.owner,
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