// backend/controllers/orderController.ts
import { Request, Response } from 'express';
import { admin } from '../firebase';
import { calculateDistance, calculateCarbonFootprint } from '../utils/productUtils';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../shared/constants';
import { Order, OrderItem } from '../types';
import { generateInvoice } from '../services/invoiceService';
import { notifyOrderStatusChange } from '../services/notificationService';

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
    let totalWeight = 0;
    let totalDistance = 0;
    let isLocalProduction = true;
    let hasEcoCertificates = true;
    
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
      
      // Get buyer location for carbon footprint calculation
      const buyerDoc = await usersCollection.doc(userId).get();
      const buyerData = buyerDoc.data();
      
      if (buyerData && buyerData.location && productData.location) {
        // Add weight based on quantity and unit (simplified)
        let itemWeight = quantity;
        if (productData.unit === 'g') {
          itemWeight = quantity / 1000; // Convert g to kg
        } else if (productData.unit === 'szt') {
          itemWeight = quantity * 0.5; // Assume 0.5 kg per item
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
      status: ORDER_STATUSES.PENDING,
      statusHistory: [
        {
          status: ORDER_STATUSES.PENDING,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: userId
        }
      ],
      shippingAddress,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      paymentStatus: PAYMENT_STATUSES.PENDING,
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
    const ordersQuery = ordersCollection.where('buyer', '==', userId);
    
    // Filter by status if provided
    const status = req.query.status as string;
    if (status && Object.values(ORDER_STATUSES).includes(status as any)) {
      ordersQuery.where('status', '==', status);
    }
    
    // Execute query
    const ordersSnapshot = await ordersQuery.orderBy('createdAt', 'desc').get();
    
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
      error: 'An error occurred while getting orders.'
    });
  }
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
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
    
    // Get order
    const orderDoc = await ordersCollection.doc(id).get();
    
    if (!orderDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Order not found.'
      });
      return;
    }
    
    const orderData = orderDoc.data();
    
    // Check if user is the buyer
    if (orderData?.buyer !== userId && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to view this order.'
      });
      return;
    }
    
    // Populate product details in order items
    const populatedItems = await Promise.all(
      orderData?.items.map(async (item: OrderItem) => {
        if (typeof item.product === 'string') {
          try {
            const productDoc = await productsCollection.doc(item.product).get();
            
            if (productDoc.exists) {
              const productData = productDoc.data();
              return {
                ...item,
                product: {
                  _id: productDoc.id,
                  name: productData?.name,
                  images: productData?.images,
                  category: productData?.category
                }
              };
            }
          } catch (error) {
            console.error('Error populating product:', error);
          }
        }
        
        return item;
      }) || []
    );
    
    // Return order with populated items
    const order = {
      _id: orderDoc.id,
      ...orderData,
      items: populatedItems
    };
    
    res.json({
      success: true,
      data: order
    });
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
    
    // Validate status
    if (!status || !Object.values(ORDER_STATUSES).includes(status as any)) {
      res.status(400).json({
        success: false,
        error: 'Invalid order status.'
      });
      return;
    }
    
    // Get order
    const orderDoc = await ordersCollection.doc(id).get();
    
    if (!orderDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Order not found.'
      });
      return;
    }
    
    const orderData = orderDoc.data();
    
    // Check if user is the buyer or an admin
    if (orderData?.buyer !== userId && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to update this order.'
      });
      return;
    }
    
    // Create status history item
    const statusHistoryItem = {
      status,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId,
      note: note || null
    };
    
    // Update order status
    await orderDoc.ref.update({
      status,
      statusHistory: admin.firestore.FieldValue.arrayUnion(statusHistoryItem),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If status is "cancelled", return product quantities
    if (status === ORDER_STATUSES.CANCELLED) {
      for (const item of orderData?.items || []) {
        // Only return quantity if the product ID is a string (not a populated object)
        if (typeof item.product === 'string') {
          const productRef = productsCollection.doc(item.product);
          await productRef.update({
            quantity: admin.firestore.FieldValue.increment(item.quantity),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }
    
    // Notify user about status change
    await notifyOrderStatusChange(id, status, orderData?.buyer);
    
    // Get updated order
    const updatedOrderDoc = await ordersCollection.doc(id).get();
    const updatedOrderData = updatedOrderDoc.data();
    
    const order = {
      _id: updatedOrderDoc.id,
      ...updatedOrderData
    };
    
    res.json({
      success: true,
      data: order
    });
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
    
    // This query is more complex as we need to find orders that contain 
    // products owned by the seller. Firebase doesn't support such queries natively,
    // so we'll need to do it in multiple steps:
    
    // 1. Get all products owned by the seller
    const productsSnapshot = await productsCollection.where('owner', '==', userId).get();
    
    if (productsSnapshot.empty) {
      // If seller has no products, return empty result
      res.json({
        success: true,
        data: {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      });
      return;
    }
    
    // Get product IDs
    const productIds = productsSnapshot.docs.map(doc => doc.id);
    
    // 2. Get all orders (not efficient, but Firestore doesn't support array contains any with multiple values)
    const ordersSnapshot = await ordersCollection.orderBy('createdAt', 'desc').get();
    
    // 3. Filter orders that contain seller's products
    const sellerOrders: any[] = [];
    
    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      const orderItems = orderData.items || [];
      
      // Check if any order item contains seller's product
      const hasSellerProduct = orderItems.some((item: any) => {
        const productId = typeof item.product === 'string' ? item.product : item.product?._id;
        return productIds.includes(productId);
      });
      
      if (hasSellerProduct) {
        sellerOrders.push({
          _id: doc.id,
          ...orderData
        });
      }
    });
    
    // Apply pagination
    const totalOrders = sellerOrders.length;
    const paginatedOrders = sellerOrders.slice((page - 1) * limit, page * limit);
    
    res.json({
      success: true,
      data: {
        items: paginatedOrders,
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit)
      }
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
    
    const userId = req.user.id;
    const { id } = req.params;
    
    // Get order
    const orderDoc = await ordersCollection.doc(id).get();
    
    if (!orderDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Order not found.'
      });
      return;
    }
    
    const orderData = orderDoc.data();
    
    // Check if user is the buyer
    if (orderData?.buyer !== userId && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to generate an invoice for this order.'
      });
      return;
    }
    
    // Generate invoice
    const invoice = await generateInvoice({
      order: {
        _id: orderDoc.id,
        ...orderData
      },
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