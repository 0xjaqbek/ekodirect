// backend/utils/productUtils.ts
import crypto from 'crypto';

/**
 * Generate a unique tracking ID for a product
 */
export const generateTrackingId = (): string => {
  // Generate a random string
  const randomStr = crypto.randomBytes(6).toString('hex').toUpperCase();
  
  // Get current timestamp
  const timestamp = Date.now().toString(36).toUpperCase();
  
  // Combine them with a prefix
  return `EKO-${timestamp.slice(-6)}-${randomStr}`;
};

/**
 * Calculate distance between two points
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  // Convert degrees to radians
  const deg2rad = (deg: number) => deg * (Math.PI / 180);
  
  // Radius of the Earth in kilometers
  const R = 6371;
  
  // Calculate differences
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  // Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const distance = R * c;
  
  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
};

/**
 * Calculate price with quantities
 * @param price Base price per unit
 * @param quantity Number of units
 * @returns Total price
 */
export const calculateTotalPrice = (price: number, quantity: number): number => {
  return price * quantity;
};

/**
 * Format price in PLN
 * @param price Price to format
 * @returns Formatted price string
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pl-PL', { 
    style: 'currency', 
    currency: 'PLN'
  }).format(price);
};

/**
 * Check if a product has valid certificates
 * @param certificates Array of certificate IDs or types
 * @returns Whether the product has valid certificates
 */
export const hasValidCertificates = (certificates: string[]): boolean => {
  return Array.isArray(certificates) && certificates.length > 0;
};

/**
 * Get product image URL or placeholder
 * @param images Array of image URLs
 * @param index Index of the image to get (defaults to 0 for main image)
 * @returns Image URL or placeholder
 */
export const getProductImageUrl = (images: string[], index: number = 0): string => {
  if (!images || images.length === 0 || !images[index]) {
    return '/placeholder-product.jpg';
  }
  
  return images[index];
};