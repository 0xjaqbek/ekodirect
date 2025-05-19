// src/modules/products/utils/filterUtils.ts
import { type ProductFilterParams, type Product } from '../../../shared/types';
import { APP_SETTINGS, PRODUCT_CATEGORIES, type ProductCategory } from '../../../shared/constants';

/**
 * Type guard to check if a string is a valid product category
 */
const isValidProductCategory = (category: string): category is ProductCategory => {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(category);
};

/**
 * Convert filter parameters to URL query string
 */
export const filtersToQueryString = (filters: Partial<ProductFilterParams>): string => {
  if (!filters || Object.keys(filters).length === 0) return '';
  
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Handle location array specifically
      if (key === 'location' && Array.isArray(value)) {
        params.append('lat', value[1].toString());
        params.append('lng', value[0].toString());
      } else {
        params.append(key, value.toString());
      }
    }
  });
  
  return params.toString();
};

/**
 * Parse query string to filter parameters
 */
export const queryStringToFilters = (queryString: string): Partial<ProductFilterParams> => {
  if (!queryString) return {};
  
  const params = new URLSearchParams(queryString);
  const filters: Partial<ProductFilterParams> = {};
  
  // Handle pagination
  const page = params.get('page');
  if (page) filters.page = parseInt(page, 10);
  
  const limit = params.get('limit');
  if (limit) filters.limit = parseInt(limit, 10);
  
  // Handle price range
  const minPrice = params.get('minPrice');
  if (minPrice) filters.minPrice = parseFloat(minPrice);
  
  const maxPrice = params.get('maxPrice');
  if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
  
  // Handle category and subcategory - fix the type error
  const category = params.get('category');
  if (category && isValidProductCategory(category)) {
    filters.category = category;
  }
  
  const subcategory = params.get('subcategory');
  if (subcategory) filters.subcategory = subcategory;
  
  // Handle location
  const lat = params.get('lat');
  const lng = params.get('lng');
  if (lat && lng) {
    filters.location = [parseFloat(lng), parseFloat(lat)];
  }
  
  const radius = params.get('radius');
  if (radius) filters.radius = parseFloat(radius);
  
  // Handle other filters
  const certificate = params.get('certificate');
  if (certificate) filters.certificate = certificate;
  
  const farmer = params.get('farmer');
  if (farmer) filters.farmer = farmer;
  
  const search = params.get('search');
  if (search) filters.search = search;
  
  // Handle sorting
  const sortBy = params.get('sortBy');
  if (sortBy && ['price', 'rating', 'distance', 'date'].includes(sortBy)) {
    filters.sortBy = sortBy as 'price' | 'rating' | 'distance' | 'date';
  }
  
  const sortOrder = params.get('sortOrder');
  if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
    filters.sortOrder = sortOrder as 'asc' | 'desc';
  }
  
  return filters;
};

/**
 * Generate price range steps for filters
 */
export const generatePriceRanges = (maxPrice: number = 1000, steps: number = 5): Array<{
  min: number;
  max: number;
  label: string;
}> => {
  const ranges = [];
  const step = maxPrice / steps;
  
  for (let i = 0; i < steps; i++) {
    const min = i * step;
    const max = (i + 1) * step;
    
    ranges.push({
      min,
      max,
      label: `${min.toFixed(0)} - ${max.toFixed(0)} zł`
    });
  }
  
  return ranges;
};

/**
 * Calculate distance between user location and product
 */
export const calculateDistanceFromUserToProduct = (
  userLocation: [number, number],
  productLocation: [number, number]
): number => {
  // Convert coordinates from [longitude, latitude] to [latitude, longitude]
  const userCoords: [number, number] = [userLocation[1], userLocation[0]];
  const productCoords: [number, number] = [productLocation[1], productLocation[0]];
  
  const deg2rad = (deg: number) => deg * (Math.PI / 180);
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(productCoords[0] - userCoords[0]);
  const dLon = deg2rad(productCoords[1] - userCoords[1]);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(userCoords[0])) * Math.cos(deg2rad(productCoords[0])) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Filter products by location radius
 */
export const filterProductsByRadius = (
  products: Product[],
  userLocation: [number, number],
  radius: number = APP_SETTINGS.DEFAULT_SEARCH_RADIUS_KM
): Product[] => {
  if (!userLocation || !products || products.length === 0) {
    return products;
  }
  
  return products.filter(product => {
    if (!product.location || !product.location.coordinates) {
      return false;
    }
    
    const distance = calculateDistanceFromUserToProduct(
      userLocation,
      product.location.coordinates
    );
    
    // Add distance to product for sorting
    (product as Product & { distance: number }).distance = distance;
    
    return distance <= radius;
  });
};