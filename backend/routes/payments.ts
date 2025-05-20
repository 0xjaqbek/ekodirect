// backend/routes/payments.ts
import express, { type RequestHandler } from 'express';
import { authenticateUser } from '../middleware/auth';
import {
  createPaymentIntent,
  handleStripeWebhook,
  checkPaymentStatus,
  createRefund
} from '../controllers/paymentController';
import {
  createEscrow,
  releaseEscrow,
  refundEscrow,
  getEscrowStatus
} from '../controllers/escrowController';

// Create a router
const router = express.Router();

/**
 * Create a payment intent
 * @route POST /api/payments/create-intent
 * @access Private
 */
router.post(
  '/create-intent',
  authenticateUser,
  createPaymentIntent as RequestHandler
);

/**
 * Stripe webhook handler
 * @route POST /api/payments/webhook
 * @access Public
 */
router.post(
  '/webhook',
  handleStripeWebhook as RequestHandler
);

/**
 * Check payment status
 * @route GET /api/payments/:paymentIntentId
 * @access Private
 */
router.get(
  '/:paymentIntentId',
  authenticateUser,
  checkPaymentStatus as RequestHandler
);

/**
 * Create a refund
 * @route POST /api/payments/:paymentIntentId/refund
 * @access Private (Admin only)
 */
router.post(
  '/:paymentIntentId/refund',
  authenticateUser,
  createRefund as RequestHandler
);

/**
 * Create escrow
 * @route POST /api/payments/escrow
 * @access Private
 */
router.post(
  '/escrow',
  authenticateUser,
  createEscrow as RequestHandler
);

/**
 * Release escrow to seller
 * @route PUT /api/payments/escrow/:escrowId/release
 * @access Private (Admin only)
 */
router.put(
  '/escrow/:escrowId/release',
  authenticateUser,
  releaseEscrow as RequestHandler
);

/**
 * Refund escrow to buyer
 * @route PUT /api/payments/escrow/:escrowId/refund
 * @access Private (Admin only)
 */
router.put(
  '/escrow/:escrowId/refund',
  authenticateUser,
  refundEscrow as RequestHandler
);

/**
 * Get escrow status
 * @route GET /api/payments/escrow/:escrowId
 * @access Private (Escrow participant)
 */
router.get(
  '/escrow/:escrowId',
  authenticateUser,
  getEscrowStatus as RequestHandler
);

export default router;