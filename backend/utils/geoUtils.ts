// backend/utils/geoUtils.ts

/**
 * Location interface with geographic coordinates
 */
export interface GeoLocation {
    coordinates: [number, number]; // [longitude, latitude]
    type?: string;
    address?: string;
  }
  
  /**
   * Base interface for items with location
   */
  export interface LocationItem {
    location: GeoLocation;
    distance?: number;
    [key: string]: unknown; // Use unknown instead of any
  }
  
  /**
   * Calculate distance between two points in kilometers using the Haversine formula
   * @param lat1 Latitude of first point
   * @param lon1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lon2 Longitude of second point
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
   * Find locations within a radius
   * @param userLat User latitude
   * @param userLon User longitude 
   * @param radius Radius in kilometers
   * @param locations Array of locations to filter
   * @returns Filtered locations with distance added
   */
  export const findLocationsWithinRadius = <T extends LocationItem>(
    userLat: number,
    userLon: number,
    radius: number,
    locations: T[]
  ): T[] => {
    return locations.filter(item => {
      if (!item.location?.coordinates) return false;
      
      const [lon, lat] = item.location.coordinates;
      const distance = calculateDistance(userLat, userLon, lat, lon);
      
      // Add distance to the item
      item.distance = distance;
      
      // Return true if within radius
      return distance <= radius;
    });
  };