// backend/services/orderService.ts
import { admin } from '../firebase';
import { ordersCollection, productsCollection, usersCollection } from '../models/collections';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../shared/constants';
import { calculateCarbonFootprint } from '../utils/productUtils';
import type { CreateOrderRequest, Order, OrderItem } from '../types';

class OrderService {
  /**
   * Create a new order
   */
  async createOrder(userId: string, orderData: CreateOrderRequest): Promise<Order | null> {
    const { items, shippingAddress, deliveryDate } = orderData;
    
    // Validate items
    if (!items || items.length === 0) {
      throw new Error('Order must have at least one item');
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
      
      // Get product details
      const productDoc = await productsCollection.doc(productId).get();
      
      if (!productDoc.exists) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      const productData = productDoc.data();
      
      if (!productData) {
        throw new Error(`Product data for ID ${productId} is empty`);
      }
      
      // Check if product is available and has enough quantity
      if (productData.status !== 'available') {
        throw new Error(`Product ${productData.name} is not available`);
      }
      
      if (productData.quantity < quantity) {
        throw new Error(`Insufficient quantity for product ${productData.name}. Available: ${productData.quantity}, Requested: ${quantity}`);
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
      
      if (buyerData?.location && productData.location) {
        // Add weight based on quantity and unit (simplified)
        let itemWeight = quantity;
        if (productData.unit === 'g') {
          itemWeight = quantity / 1000; // Convert g to kg
        } else if (productData.unit === 'szt') {
          itemWeight = quantity * 0.5; // Assume 0.5 kg per item
        }
        
        totalWeight += itemWeight;
        
        // Calculate distance between seller and buyer
        const calculateDistance = (
          lat1: number, lon1: number, 
          lat2: number, lon2: number
        ): number => {
          const deg2rad = (deg: number) => deg * (Math.PI / 180);
          const R = 6371; // Radius of the Earth in km
          const dLat = deg2rad(lat2 - lat1);
          const dLon = deg2rad(lon2 - lon1);
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
          return R * c; // Distance in km
        };
        
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
    const orderDoc = await orderRef.get();
    const orderData = orderDoc.data();
    
    return {
      _id: orderRef.id,
      ...orderData
    } as Order;
  }
  
  /**
   * Get orders for a user
   */
  async getUserOrders(userId: string, page: number = 1, limit: number = 10, status?: string): Promise<{
    items: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let query = ordersCollection.where('buyer', '==', userId);
    
    // Filter by status if provided
    if (status && Object.values(ORDER_STATUSES).includes(status as any)) {
      query = query.where('status', '==', status);
    }
    
    // Execute query
    const ordersSnapshot = await query.orderBy('createdAt', 'desc').get();
    
    const totalOrders = ordersSnapshot.size;
    const orders: Order[] = [];
    
    // Apply pagination
    const offset = (page - 1) * limit;
    
    // Convert to array of orders
    ordersSnapshot.docs.forEach((doc, index) => {
      if (index >= offset && index < offset + limit) {
        const orderData = doc.data();
        orders.push({
          _id: doc.id,
          ...orderData
        } as unknown as Order);
      }
    });
    
    return {
      items: orders,
      total: totalOrders,
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit)
    };
  }
  
  /**
   * Get a single order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    const orderDoc = await ordersCollection.doc(orderId).get();
    
    if (!orderDoc.exists) {
      return null;
    }
    
    const orderData = orderDoc.data();
    
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
    
    return {
      _id: orderDoc.id,
      ...orderData,
      items: populatedItems
    } as Order;
  }
  
  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, userId: string, note?: string): Promise<Order | null> {
    const orderDoc = await ordersCollection.doc(orderId).get();
    
    if (!orderDoc.exists) {
      return null;
    }
    
    const orderData = orderDoc.data();
    
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
    
    // Return updated order
    return this.getOrderById(orderId);
  }
  
  /**
   * Get orders for a specific seller (farmer)
   */
  async getSellerOrders(sellerId: string, page: number = 1, limit: number = 10): Promise<{
    items: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Get all products owned by the seller
    const productsSnapshot = await productsCollection.where('owner', '==', sellerId).get();
    
    if (productsSnapshot.empty) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }
    
    // Get product IDs
    const productIds = productsSnapshot.docs.map(doc => doc.id);
    
    // Get all orders
    const ordersSnapshot = await ordersCollection.orderBy('createdAt', 'desc').get();
    
    const sellerOrders: Order[] = [];
    
    // Filter orders that contain seller's products
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
        } as Order);
      }
    });
    
    // Apply pagination
    const totalOrders = sellerOrders.length;
    const paginatedOrders = sellerOrders.slice((page - 1) * limit, page * limit);
    
    return {
      items: paginatedOrders,
      total: totalOrders,
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit)
    };
  }
}

export const orderService = new OrderService();
export default orderService;