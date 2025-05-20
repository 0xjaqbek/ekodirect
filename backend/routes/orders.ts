// backend/routes/orders.ts
import express, { type RequestHandler } from 'express';
import { authenticateUser } from '../middleware/auth';
import {
  validateOrderData,
  orderExists,
  isOrderParticipant,
  isOrderModifiable
} from '../middleware/orders';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getSellerOrders,
  generateOrderInvoice
} from '../controllers/orderController';

// Create a router
const router = express.Router();

/**
 * Create a new order
 * @route POST /api/orders
 * @access Private
 */
router.post(
  '/',
  authenticateUser,
  validateOrderData,
  createOrder as RequestHandler
);

/**
 * Get all orders for the current user
 * @route GET /api/orders
 * @access Private
 */
router.get(
  '/',
  authenticateUser,
  getOrders as RequestHandler
);

/**
 * Get a single order by ID
 * @route GET /api/orders/:id
 * @access Private (Order participant)
 */
router.get(
  '/:id',
  authenticateUser,
  orderExists,
  isOrderParticipant,
  getOrderById as RequestHandler
);

/**
 * Update order status
 * @route PUT /api/orders/:id/status
 * @access Private (Order participant)
 */
router.put(
  '/:id/status',
  authenticateUser,
  orderExists,
  isOrderParticipant,
  isOrderModifiable,
  updateOrderStatus as RequestHandler
);

/**
 * Get orders for a specific seller (farmer)
 * @route GET /api/orders/seller
 * @access Private (Farmers only)
 */
router.get(
  '/seller',
  authenticateUser,
  getSellerOrders as RequestHandler
);

/**
 * Generate invoice for order
 * @route GET /api/orders/:id/invoice
 * @access Private (Order participant)
 */
router.get(
  '/:id/invoice',
  authenticateUser,
  orderExists,
  isOrderParticipant,
  generateOrderInvoice as RequestHandler
);

export default router;