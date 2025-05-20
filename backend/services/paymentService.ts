// backend/services/paymentService.ts
import Stripe from 'stripe';
import { admin } from '../firebase';
import { config } from '../config';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../shared/constants';
import { paymentsCollection, ordersCollection } from '../models/collections';

// Initialize Stripe
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16'
});

class PaymentService {
  /**
   * Create a payment intent with Stripe
   */
  async createPaymentIntent(userId: string, amount: number, orderId?: string, currency: string = 'pln'): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  } | null> {
    try {
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
      
      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return null;
    }
  }
  
  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(paymentIntentId: string): Promise<boolean> {
    try {
      // Get payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Update payment status in Firestore
      await paymentsCollection.doc(paymentIntentId).update({
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
      
      return true;
    } catch (error) {
      console.error('Error handling payment success:', error);
      return false;
    }
  }
  
  /**
   * Handle failed payment
   */
  async handlePaymentFailure(paymentIntentId: string, errorMessage?: string): Promise<boolean> {
    try {
      // Get payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Update payment status in Firestore
      await paymentsCollection.doc(paymentIntentId).update({
        status: PAYMENT_STATUSES.FAILED,
        stripePaymentIntentResponse: paymentIntent,
        errorMessage: errorMessage || 'Payment failed',
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
      
      return true;
    } catch (error) {
      console.error('Error handling payment failure:', error);
      return false;
    }
  }
  
  /**
   * Create a refund
   */
  async createRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<{
    refundId: string;
    amount: number;
    status: string;
  } | null> {
    try {
      // Get payment from Firestore
      const paymentDoc = await paymentsCollection.doc(paymentIntentId).get();
      
      if (!paymentDoc.exists) {
        return null;
      }
      
      const paymentData = paymentDoc.data();
      
      // Check if payment is completed
      if (paymentData?.status !== PAYMENT_STATUSES.COMPLETED) {
        return null;
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
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      
      return {
        refundId: refund.id,
        amount: amount || paymentData.amount,
        status: refund.status
      };
    } catch (error) {
      console.error('Error creating refund:', error);
      return null;
    }
  }
  
  /**
   * Check payment status
   */
  async getPaymentStatus(paymentIntentId: string): Promise<{
    status: string;
    amount: number;
    currency: string;
    orderId?: string;
  } | null> {
    try {
      // Get payment from Firestore
      const paymentDoc = await paymentsCollection.doc(paymentIntentId).get();
      
      if (!paymentDoc.exists) {
        return null;
      }
      
      const paymentData = paymentDoc.data();
      
      return {
        status: paymentData?.status,
        amount: paymentData?.amount,
        currency: paymentData?.currency,
        orderId: paymentData?.orderId
      };
    } catch (error) {
      console.error('Error getting payment status:', error);
      return null;
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;