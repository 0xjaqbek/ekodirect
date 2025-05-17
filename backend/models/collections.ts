// backend/models/collections.ts
import { admin } from '../firebase';

// Get Firestore instance
const db = admin.firestore();

// Define collections with proper types
export const usersCollection = db.collection('users');
export const tokensCollection = db.collection('tokens');
export const productsCollection = db.collection('products');
export const ordersCollection = db.collection('orders');
export const reviewsCollection = db.collection('reviews');
export const certificatesCollection = db.collection('certificates');

// Export default database instance
export default db;