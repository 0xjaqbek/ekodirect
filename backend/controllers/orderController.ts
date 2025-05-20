// backend/controllers/orderController.ts (Updated version using services)
import { Request, Response } from 'express';
import { orderService } from '../services/orderService';
import { invoiceService } from '../services/invoiceService';

/**
 * Create a new order
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    const userId = req.user.id;
    
    try {
      const order = await orderService.createOrder(userId, req.body);
      
      if (order) {
        res.status(201).json({
          success: true,
          data: order
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create order'
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while creating the order. Please try again later.'
    });
  }
};

/**
 * Get all orders for the current user
 */
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    const userId = req.user.id;
    
    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    
    const result = await orderService.getUserOrders(userId, page, limit, status);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while getting orders.'
    });
  }
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const order = await orderService.getOrderById(id);
    
    if (order) {
      res.json({
        success: true,
        data: order
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Order not found.'
      });
    }
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while getting the order.'
    });
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    const userId = req.user.id;
    const { id } = req.params;
    const { status, note } = req.body;
    
    const updatedOrder = await orderService.updateOrderStatus(id, status, userId, note);
    
    if (updatedOrder) {
      res.json({
        success: true,
        data: updatedOrder
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update order status.'
      });
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while updating the order status.'
    });
  }
};

/**
 * Get orders for a specific seller (farmer)
 */
export const getSellerOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    const userId = req.user.id;
    
    // Validate that user is a farmer
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Only farmers can access seller orders.'
      });
      return;
    }
    
    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await orderService.getSellerOrders(userId, page, limit);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting seller orders:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while getting seller orders.'
    });
  }
};

/**
 * Generate invoice for order
 */
export const generateOrderInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    const { id } = req.params;
    
    // Get order details
    const order = await orderService.getOrderById(id);
    
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found.'
      });
      return;
    }
    
    // Generate invoice
    const invoice = await invoiceService.generateInvoice({
      order,
      user: req.user
    });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    
    // Send the PDF as response
    res.send(invoice);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while generating the invoice.'
    });
  }
};