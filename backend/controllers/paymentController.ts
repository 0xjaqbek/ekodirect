// backend/controllers/paymentController.ts
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { admin } from '../firebase';
import { config } from '../config';
import { PAYMENT_STATUSES, ORDER_STATUSES } from '../shared/constants';

// Initialize Stripe
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16'
});

// Initialize Firestore
const db = admin.firestore();
const ordersCollection = db.collection('orders');
const paymentsCollection = db.collection('payments');

/**
 * Create a payment intent with Stripe
 */
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
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
    const { amount, orderId, currency = 'pln' } = req.body;
    
    // Validate required fields
    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid amount.'
      });
      return;
    }
    
    // If orderId is provided, verify that order exists and belongs to user
    if (orderId) {
      const orderDoc = await ordersCollection.doc(orderId).get();
      
      if (!orderDoc.exists) {
        res.status(404).json({
          success: false,
          error: 'Order not found.'
        });
        return;
      }
      
      const orderData = orderDoc.data();
      
      if (orderData?.buyer !== userId) {
        res.status(403).json({
          success: false,
          error: 'You do not have permission to create a payment for this order.'
        });
        return;
      }
    }
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in smallest currency unit (cents/groszy)
      currency: currency.toLowerCase(),
      metadata: {
        userId,
        orderId: orderId || ''
      }
    });
    
    // Save payment intent to Firestore
    await paymentsCollection.doc(paymentIntent.id).set({
      stripePaymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency.toLowerCase(),
      status: PAYMENT_STATUSES.PENDING,
      orderId: orderId || null,
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If orderId is provided, update order with payment intent ID
    if (orderId) {
      await ordersCollection.doc(orderId).update({
        paymentId: paymentIntent.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while creating the payment intent.'
    });
  }
};

/**
 * Process payment webhook from Stripe
 */
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    res.status(400).json({
      success: false,
      error: 'Missing stripe-signature header.'
    });
    return;
  }
  
  try {
    // Verify the event came from Stripe
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      config.stripe.webhookSecret
    );
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent);
        break;
      }
      
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCancellation(paymentIntent);
        break;
      }
      
      // You can add more event types if needed
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    res.status(400).json({
      success: false,
      error: 'Webhook error: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (req: Request, res: Response): Promise<void> => {
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
    const { paymentIntentId } = req.params;
    
    // Get payment from Firestore
    const paymentDoc = await paymentsCollection.doc(paymentIntentId).get();
    
    if (!paymentDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Payment not found.'
      });
      return;
    }
    
    const paymentData = paymentDoc.data();
    
    // Check if user is authorized to view this payment
    if (paymentData?.userId !== userId && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to view this payment.'
      });
      return;
    }
    
    // Return payment data
    res.json({
      success: true,
      data: {
        _id: paymentDoc.id,
        ...paymentData
      }
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while checking the payment status.'
    });
  }
};

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    // Update payment status in Firestore
    await paymentsCollection.doc(paymentIntent.id).update({
      status: PAYMENT_STATUSES.COMPLETED,
      stripePaymentIntentResponse: paymentIntent,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If payment is for an order, update order status
    if (paymentIntent.metadata.orderId) {
      const orderId = paymentIntent.metadata.orderId;
      
      // Get order
      const orderDoc = await ordersCollection.doc(orderId).get();
      
      if (orderDoc.exists) {
        // Update order status to PAID
        await orderDoc.ref.update({
          status: ORDER_STATUSES.PAID,
          paymentStatus: PAYMENT_STATUSES.COMPLETED,
          statusHistory: admin.firestore.FieldValue.arrayUnion({
            status: ORDER_STATUSES.PAID,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'system', // System update
            note: 'Payment completed'
          }),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    // Update payment status in Firestore
    await paymentsCollection.doc(paymentIntent.id).update({
      status: PAYMENT_STATUSES.FAILED,
      stripePaymentIntentResponse: paymentIntent,
      errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If payment is for an order, update order payment status
    if (paymentIntent.metadata.orderId) {
      const orderId = paymentIntent.metadata.orderId;
      
      // Get order
      const orderDoc = await ordersCollection.doc(orderId).get();
      
      if (orderDoc.exists) {
        // Update order payment status to FAILED
        await orderDoc.ref.update({
          paymentStatus: PAYMENT_STATUSES.FAILED,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

/**
 * Handle cancelled payment
 */
async function handlePaymentCancellation(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    // Update payment status in Firestore
    await paymentsCollection.doc(paymentIntent.id).update({
      status: PAYMENT_STATUSES.FAILED,
      stripePaymentIntentResponse: paymentIntent,
      errorMessage: 'Payment cancelled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If payment is for an order, update order payment status
    if (paymentIntent.metadata.orderId) {
      const orderId = paymentIntent.metadata.orderId;
      
      // Get order
      const orderDoc = await ordersCollection.doc(orderId).get();
      
      if (orderDoc.exists) {
        // Update order payment status to FAILED
        await orderDoc.ref.update({
          paymentStatus: PAYMENT_STATUSES.FAILED,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
    throw error;
  }
}

/**
 * Create a refund
 */
export const createRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    // Only admins can create refunds
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Only administrators can create refunds.'
      });
      return;
    }
    
    const { paymentIntentId, amount, reason } = req.body;
    
    // Validate required fields
    if (!paymentIntentId) {
      res.status(400).json({
        success: false,
        error: 'Payment intent ID is required.'
      });
      return;
    }
    
    // Get payment from Firestore
    const paymentDoc = await paymentsCollection.doc(paymentIntentId).get();
    
    if (!paymentDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Payment not found.'
      });
      return;
    }
    
    const paymentData = paymentDoc.data();
    
    // Check if payment is completed
    if (paymentData?.status !== PAYMENT_STATUSES.COMPLETED) {
      res.status(400).json({
        success: false,
        error: 'Only completed payments can be refunded.'
      });
      return;
    }
    
    // Create a refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount) : undefined, // Optional partial refund
      reason: reason || undefined
    });
    
    // Update payment in Firestore
    await paymentDoc.ref.update({
      status: amount && amount < paymentData.amount ? PAYMENT_STATUSES.PARTIALLY_REFUNDED : PAYMENT_STATUSES.REFUNDED,
      refundId: refund.id,
      refundAmount: amount || paymentData.amount,
      refundReason: reason || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If payment is for an order, update order status
    if (paymentData.orderId) {
      const orderDoc = await ordersCollection.doc(paymentData.orderId).get();
      
      if (orderDoc.exists) {
        // Update order payment status
        await orderDoc.ref.update({
          paymentStatus: amount && amount < paymentData.amount ? PAYMENT_STATUSES.PARTIALLY_REFUNDED : PAYMENT_STATUSES.REFUNDED,
          statusHistory: admin.firestore.FieldValue.arrayUnion({
            status: ORDER_STATUSES.CANCELLED,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: req.user.id,
            note: `Order cancelled and ${amount ? 'partially' : 'fully'} refunded. Reason: ${reason || 'Not specified'}`
          }),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        refundId: refund.id,
        amount: amount || paymentData.amount,
        status: refund.status
      }
    });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while creating the refund.'
    });
  }
};