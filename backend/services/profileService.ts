// backend/services/profileService.ts - Fixed TypeScript version
import { admin } from '../firebase';

const db = admin.firestore();
const usersCollection = db.collection('users');

// Define types for better type safety
interface UserProfileData {
  id: string;
  email: string;
  fullName: string;
  role: 'farmer' | 'consumer' | 'admin';
  phoneNumber: string;
  bio?: string;
  profileImage?: string;
  location?: {
    type?: string;
    coordinates?: [number, number];
    address?: string;
  };
  certificates?: string[];
  createdProducts?: string[];
  orders?: string[];
  reviews?: string[];
  localGroups?: string[];
  isVerified?: boolean;
  lastLoginAt?: admin.firestore.Timestamp;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  [key: string]: unknown;
}

interface FarmerWithDistance extends Omit<UserProfileData, 'id'> {
  id: string;
  distance: number;
}

/**
 * Serwis do zarządzania profilami użytkowników
 */
class ProfileService {
  /**
   * Pobierz profil użytkownika
   */
  async getUserProfile(userId: string): Promise<UserProfileData | null> {
    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    if (!userData) {
      return null;
    }
    
    // Remove sensitive data - use explicit destructuring with renamed unused variable
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...userWithoutPassword } = userData;
    
    return {
      id: userDoc.id,
      ...userWithoutPassword
    } as UserProfileData;
  }
  
  /**
   * Zaktualizuj profil użytkownika
   */
  async updateUserProfile(userId: string, userData: Partial<UserProfileData>): Promise<UserProfileData | null> {
    // Remove fields we don't want to update - use explicit destructuring with renamed unused variables
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, email: _email, role: _role, isVerified: _isVerified, ...updateData } = userData;
    
    await usersCollection.doc(userId).update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get updated data
    return await this.getUserProfile(userId);
  }
  
  /**
   * Pobierz rolników w pobliżu lokalizacji
   * Uwaga: Firebase Firestore nie obsługuje natywnie zapytań geoprzestrzennych
   * W rzeczywistym projekcie użylibyśmy Firebase GeoFirestore lub innej bazy obsługującej geoprzestrzenne zapytania
   */
  async getFarmersNearLocation(coordinates: [number, number], maxDistance: number = 50): Promise<FarmerWithDistance[]> {
    // Get all farmers
    const farmersSnapshot = await usersCollection
      .where('role', '==', 'farmer')
      .get();
    
    if (farmersSnapshot.empty) {
      return [];
    }
    
    // Function to calculate distance (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth radius in km
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return R * c; // Distance in km
    };
    
    // Filter farmers by distance
    const farmersNearby: FarmerWithDistance[] = [];
    
    farmersSnapshot.forEach(doc => {
      const farmer = doc.data();
      
      if (farmer.location && farmer.location.coordinates) {
        const farmerLat = farmer.location.coordinates[1];
        const farmerLon = farmer.location.coordinates[0];
        const distance = calculateDistance(
          coordinates[1], coordinates[0], 
          farmerLat, farmerLon
        );
        
        if (distance <= maxDistance) {
          // Remove sensitive data - use explicit destructuring with renamed unused variable
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { passwordHash: _passwordHash, ...farmerWithoutPassword } = farmer;
          farmersNearby.push({
            id: doc.id,
            ...farmerWithoutPassword,
            distance // Add distance to result
          } as FarmerWithDistance);
        }
      }
    });
    
    // Sort by distance
    return farmersNearby.sort((a, b) => a.distance - b.distance);
  }
  
  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export const profileService = new ProfileService();