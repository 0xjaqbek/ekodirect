// backend/middleware/orders.ts
import { Request, Response, NextFunction } from 'express';
import { admin } from '../firebase';
import { VALIDATION } from '../shared/constants';
import { ordersCollection } from '../models/collections';

// Extend Express Request type using module augmentation
declare module 'express' {
  interface Request {
    orderData?: any;
    orderId?: string;
  }
}

/**
 * Middleware to validate order data
 */
export const validateOrderData = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { items, shippingAddress, deliveryDate } = req.body;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Items array is required and must contain at least one item.'
      });
      return;
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.product || typeof item.product !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Each item must have a valid product ID.'
        });
        return;
      }
      
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        res.status(400).json({
          success: false,
          error: 'Each item must have a valid quantity greater than zero.'
        });
        return;
      }
    }
    
    // Validate shipping address
    if (!shippingAddress) {
      res.status(400).json({
        success: false,
        error: 'Shipping address is required.'
      });
      return;
    }
    
    const { street, city, postalCode, country } = shippingAddress;
    
    if (!street || !city || !postalCode || !country) {
      res.status(400).json({
        success: false,
        error: 'Shipping address must include street, city, postal code, and country.'
      });
      return;
    }
    
    // Validate Polish postal code format if the country is Poland
    if (country.toLowerCase() === 'polska' || country.toLowerCase() === 'poland') {
      const postalCodeRegex = /^\d{2}-\d{3}$/;
      
      if (!postalCodeRegex.test(postalCode)) {
        res.status(400).json({
          success: false,
          error: 'Invalid postal code format. Polish postal code must be in the format XX-XXX.'
        });
        return;
      }
    }
    
    // Validate delivery date if provided
    if (deliveryDate) {
      const deliveryDateObj = new Date(deliveryDate);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const now = new Date();
      
      // Delivery date must be at least tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      // Max delivery date is 14 days from now
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 14);
      maxDate.setHours(23, 59, 59, 999);
      
      if (isNaN(deliveryDateObj.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid delivery date format.'
        });
        return;
      }
      
      if (deliveryDateObj < tomorrow) {
        res.status(400).json({
          success: false,
          error: 'Delivery date must be at least tomorrow.'
        });
        return;
      }
      
      if (deliveryDateObj > maxDate) {
        res.status(400).json({
          success: false,
          error: 'Delivery date must be within 14 days from now.'
        });
        return;
      }
    }
    
    next();
  } catch (error) {
    console.error('Order validation error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while validating the order data.'
    });
  }
};

/**
 * Middleware to check if order exists
 */
export const orderExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if order exists
    const orderDoc = await ordersCollection.doc(id).get();
    
    if (!orderDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Order not found.'
      });
      return;
    }
    
    // Add order data to request object
    const orderData = orderDoc.data();
    req.orderData = orderData;
    req.orderId = id;
    
    next();
  } catch (error) {
    console.error('Order exists middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while checking if the order exists.'
    });
  }
};

/**
 * Middleware to check if user is a participant in the order (buyer, seller, or admin)
 */
export const isOrderParticipant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // This middleware should be used after orderExists
    if (!req.orderData) {
      res.status(500).json({
        success: false,
        error: 'Internal server error - no order data.'
      });
      return;
    }
    
    // Add null check for req.user
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
      return;
    }
    
    const userId = req.user.id;
    const orderData = req.orderData;
    
    // Check if user is the buyer
    if (orderData.buyer === userId) {
      next();
      return;
    }
    
    // Check if user is an admin
    if (req.user.role === 'admin') {
      next();
      return;
    }
    
    // Check if user is a seller (farmer) of any product in the order
    if (req.user.role === 'farmer') {
      // For this check, we need to load the products to verify ownership
      const orderItems = orderData.items || [];
      
      for (const item of orderItems) {
        const productId = typeof item.product === 'string' ? item.product : item.product?._id;
        
        if (productId) {
          const productDoc = await admin.firestore().collection('products').doc(productId).get();
          
          if (productDoc.exists) {
            const productData = productDoc.data();
            
            if (productData?.owner === userId) {
              // User is a seller of at least one product in the order
              next();
              return;
            }
          }
        }
      }
    }
    
    // If we get here, user is not a participant
    res.status(403).json({
      success: false,
      error: 'You do not have permission to access this order.'
    });
  } catch (error) {
    console.error('Is order participant middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while checking order permissions.'
    });
  }
};

/**
 * Middleware to check if the order can be modified
 * Prevents modifications to cancelled or delivered orders
 */
export const isOrderModifiable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // This middleware should be used after orderExists
    if (!req.orderData) {
      res.status(500).json({
        success: false,
        error: 'Internal server error - no order data.'
      });
      return;
    }
    
    const orderData = req.orderData;
    
    // Check if order is in a final state
    if (orderData.status === 'cancelled' || orderData.status === 'delivered') {
      res.status(400).json({
        success: false,
        error: `Order cannot be modified because it is already ${orderData.status}.`
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Is order modifiable middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while checking if the order can be modified.'
    });
  }
};