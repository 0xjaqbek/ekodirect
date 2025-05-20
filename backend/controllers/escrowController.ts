// backend/controllers/escrowController.ts
import { Request, Response } from 'express';
import { admin } from '../firebase';
import { PAYMENT_STATUSES, ORDER_STATUSES } from '../shared/constants';

// Initialize Firestore
const db = admin.firestore();
const escrowsCollection = db.collection('escrows');
const ordersCollection = db.collection('orders');
const usersCollection = db.collection('users');

/**
 * Create escrow for payment
 */
export const createEscrow = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    const { orderId, paymentId } = req.body;
    
    if (!orderId || !paymentId) {
      res.status(400).json({
        success: false,
        error: 'Order ID and payment ID are required'
      });
      return;
    }
    
    // Check if order exists
    const orderDoc = await ordersCollection.doc(orderId).get();
    
    if (!orderDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }
    
    const orderData = orderDoc.data();
    
    // Create escrow
    const escrow = {
      orderId,
      paymentId,
      amount: orderData?.totalPrice,
      status: 'held',
      buyer: orderData?.buyer,
      sellers: [], // Will be populated with seller IDs
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      releasedAt: null
    };
    
    // Get sellers from order items
    const sellerIds = new Set<string>();
    const items = orderData?.items || [];
    
    for (const item of items) {
      const productId = typeof item.product === 'string' ? item.product : item.product?._id;
      
      if (productId) {
        const productDoc = await db.collection('products').doc(productId).get();
        
        if (productDoc.exists) {
          const productData = productDoc.data();
          
          if (productData?.owner) {
            sellerIds.add(productData.owner);
          }
        }
      }
    }
    
    // Add sellers to escrow
    escrow.sellers = Array.from(sellerIds);
    
    // Save escrow to Firestore
    const escrowRef = await escrowsCollection.add(escrow);
    
    // Update order with escrow ID
    await orderDoc.ref.update({
      escrowId: escrowRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      data: {
        escrowId: escrowRef.id
      }
    });
  } catch (error) {
    console.error('Error creating escrow:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while creating the escrow.'
    });
  }
};

/**
 * Release escrow to seller
 */
export const releaseEscrow = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    // Only admins can release escrows
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Only administrators can release escrows.'
      });
      return;
    }
    
    const { escrowId } = req.params;
    
    // Check if escrow exists
    const escrowDoc = await escrowsCollection.doc(escrowId).get();
    
    if (!escrowDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Escrow not found.'
      });
      return;
    }
    
    const escrowData = escrowDoc.data();
    
    // Check if escrow is already released
    if (escrowData?.status === 'released') {
      res.status(400).json({
        success: false,
        error: 'Escrow is already released.'
      });
      return;
    }
    
    // Update escrow status
    await escrowDoc.ref.update({
      status: 'released',
      releasedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update order status to delivered
    if (escrowData?.orderId) {
      await ordersCollection.doc(escrowData.orderId).update({
        status: ORDER_STATUSES.DELIVERED,
        statusHistory: admin.firestore.FieldValue.arrayUnion({
          status: ORDER_STATUSES.DELIVERED,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: req.user.id,
          note: 'Payment released to seller'
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({
      success: true,
      data: {
        status: 'released'
      }
    });
  } catch (error) {
    console.error('Error releasing escrow:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while releasing the escrow.'
    });
  }
};

/**
 * Refund escrow to buyer
 */
export const refundEscrow = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    // Only admins can refund escrows
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Only administrators can refund escrows.'
      });
      return;
    }
    
    const { escrowId } = req.params;
    const { reason } = req.body;
    
    // Check if escrow exists
    const escrowDoc = await escrowsCollection.doc(escrowId).get();
    
    if (!escrowDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Escrow not found.'
      });
      return;
    }
    
    const escrowData = escrowDoc.data();
    
    // Check if escrow is already released
    if (escrowData?.status === 'released') {
      res.status(400).json({
        success: false,
        error: 'Escrow is already released and cannot be refunded.'
      });
      return;
    }
    
    // Update escrow status
    await escrowDoc.ref.update({
      status: 'refunded',
      refundReason: reason || null,
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update order status to cancelled and issue refund
    if (escrowData?.orderId) {
      await ordersCollection.doc(escrowData.orderId).update({
        status: ORDER_STATUSES.CANCELLED,
        paymentStatus: PAYMENT_STATUSES.REFUNDED,
        statusHistory: admin.firestore.FieldValue.arrayUnion({
          status: ORDER_STATUSES.CANCELLED,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: req.user.id,
          note: `Order cancelled and refunded. Reason: ${reason || 'Not specified'}`
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({
      success: true,
      data: {
        status: 'refunded'
      }
    });
  } catch (error) {
    console.error('Error refunding escrow:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while refunding the escrow.'
    });
  }
};

/**
 * Get escrow status
 */
export const getEscrowStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    const { escrowId } = req.params;
    
    // Check if escrow exists
    const escrowDoc = await escrowsCollection.doc(escrowId).get();
    
    if (!escrowDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Escrow not found.'
      });
      return;
    }
    
    const escrowData = escrowDoc.data();
    
    // Check if user is authorized to view this escrow
    if (
      escrowData?.buyer !== req.user.id &&
      !escrowData?.sellers.includes(req.user.id) &&
      req.user.role !== 'admin'
    ) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to view this escrow.'
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        escrowId: escrowDoc.id,
        status: escrowData?.status,
        amount: escrowData?.amount,
        createdAt: escrowData?.createdAt,
        releasedAt: escrowData?.releasedAt,
        refundedAt: escrowData?.refundedAt
      }
    });
  } catch (error) {
    console.error('Error getting escrow status:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while getting the escrow status.'
    });
  }
};