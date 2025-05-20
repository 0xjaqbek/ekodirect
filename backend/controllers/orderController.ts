// backend/controllers/orderController.ts
import { Request, Response } from 'express';
import { admin } from '../firebase';
import { calculateDistance, calculateCarbonFootprint } from '../utils/productUtils';
import { Order, OrderItem } from '../types';

// Initialize Firestore
const db = admin.firestore();
const ordersCollection = db.collection('orders');
const productsCollection = db.collection('products');
const usersCollection = db.collection('users');

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
    
    // Get order data from request body
    const { items, shippingAddress, deliveryDate } = req.body;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      res.status(400).json({
        success: false,
        error: 'Invalid order data. Items and shipping address are required.'
      });
      return;
    }
    
    // Process order items - get product details and calculate total price
    const orderItems: OrderItem[] = [];
    let totalPrice = 0;
    
    for (const item of items) {
      const { product: productId, quantity } = item;
      
      // Validate item data
      if (!productId || !quantity || quantity <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid item data. Product ID and quantity > 0 are required.'
        });
        return;
      }
      
      // Get product details
      const productDoc = await productsCollection.doc(productId).get();
      
      if (!productDoc.exists) {
        res.status(404).json({
          success: false,
          error: `Product with ID ${productId} not found.`
        });
        return;
      }
      
      const productData = productDoc.data();
      
      if (!productData) {
        res.status(404).json({
          success: false,
          error: `Product data for ID ${productId} is empty.`
        });
        return;
      }
      
      // Check if product is available and has enough quantity
      if (productData.status !== 'available') {
        res.status(400).json({
          success: false,
          error: `Product ${productData.name} is not available.`
        });
        return;
      }
      
      if (productData.quantity < quantity) {
        res.status(400).json({
          success: false,
          error: `Insufficient quantity for product ${productData.name}. Available: ${productData.quantity}, Requested: ${quantity}.`
        });
        return;
      }
      
      // Add item to order items
      orderItems.push({
        product: productId,
        quantity,
        priceAtPurchase: productData.price
      });
      
      // Add to total price
      totalPrice += productData.price * quantity;
    }
    
    // Get buyer location for carbon footprint calculation
    const buyerDoc = await usersCollection.doc(userId).get();
    const buyerData = buyerDoc.data();
    
    if (!buyerData || !buyerData.location) {
      res.status(400).json({
        success: false,
        error: 'Buyer location not found. Please update your profile with location data.'
      });
      return;
    }
    
    // Calculate carbon footprint - simple implementation
    let totalWeight = 0;
    let totalDistance = 0;
    let isLocalProduction = true;
    let hasEcoCertificates = true;
    
    for (const item of items) {
      const productDoc = await productsCollection.doc(item.product).get();
      const productData = productDoc.data();
      
      if (productData && productData.location && buyerData.location) {
        // Add weight based on quantity and unit (simplified)
        let itemWeight = item.quantity;
        if (productData.unit === 'g') {
          itemWeight = item.quantity / 1000; // Convert g to kg
        } else if (productData.unit === 'szt') {
          itemWeight = item.quantity * 0.5; // Assume 0.5 kg per item
        }
        
        totalWeight += itemWeight;
        
        // Calculate distance between seller and buyer
        const distance = calculateDistance(
          buyerData.location.coordinates[1],
          buyerData.location.coordinates[0],
          productData.location.coordinates[1],
          productData.location.coordinates[0]
        );
        
        totalDistance += distance;
        
        // Check if products are local (< 50km)
        if (distance > 50) {
          isLocalProduction = false;
        }
        
        // Check if products have eco certificates
        if (!productData.isCertified) {
          hasEcoCertificates = false;
        }
      }
    }
    
    // Calculate average distance
    const avgDistance = totalDistance / items.length;
    
    // Calculate carbon footprint
    const carbonFootprint = calculateCarbonFootprint(
      avgDistance,
      totalWeight,
      isLocalProduction,
      hasEcoCertificates
    );
    
    // Create order object
    const newOrder = {
      buyer: userId,
      items: orderItems,
      totalPrice,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: userId
        }
      ],
      shippingAddress,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      paymentStatus: 'pending',
      carbonFootprint,
      isReviewed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save order to Firestore
    const orderRef = await ordersCollection.add(newOrder);
    
    // Update product quantities
    for (const item of items) {
      const productRef = productsCollection.doc(item.product);
      await productRef.update({
        quantity: admin.firestore.FieldValue.increment(-item.quantity),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Add order to user's orders
    await usersCollection.doc(userId).update({
      orders: admin.firestore.FieldValue.arrayUnion(orderRef.id),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return created order
    const createdOrder = {
      _id: orderRef.id,
      ...newOrder
    };
    
    res.status(201).json({
      success: true,
      data: createdOrder
    });
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
    const offset = (page - 1) * limit;
    
    // Get orders for the current user
    const ordersSnapshot = await ordersCollection
      .where('buyer', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const totalOrders = ordersSnapshot.size;
    const orders: Order[] = [];
    
    // Convert to array of orders and apply pagination (in memory)
    ordersSnapshot.docs.forEach((doc, index) => {
      if (index >= offset && index < offset + limit) {
        const orderData = doc.data();
        orders.push({
          _id: doc.id,
          ...orderData
        } as unknown as Order);
      }
    });
    
    res.json({
      success: true,
      data: {
        items: orders,
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while getting