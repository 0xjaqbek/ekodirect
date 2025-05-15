// backend/services/profileService.js
import { admin } from '../firebase.js';

const db = admin.firestore();
const usersCollection = db.collection('users');

/**
 * Serwis do zarządzania profilami użytkowników
 */
class ProfileService {
  /**
   * Pobierz profil użytkownika
   */
  async getUserProfile(userId) {
    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    const { passwordHash, ...userWithoutPassword } = userData;
    
    return {
      id: userDoc.id,
      ...userWithoutPassword
    };
  }
  
  /**
   * Zaktualizuj profil użytkownika
   */
  async updateUserProfile(userId, userData) {
    // Usuń pola, których nie chcemy aktualizować
    const { passwordHash, email, role, isVerified, ...updateData } = userData;
    
    await usersCollection.doc(userId).update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Pobierz zaktualizowane dane
    return await this.getUserProfile(userId);
  }
  
  /**
   * Pobierz rolników w pobliżu lokalizacji
   * Uwaga: Firebase Firestore nie obsługuje natywnie zapytań geoprzestrzennych
   * W rzeczywistym projekcie użylibyśmy Firebase GeoFirestore lub innej bazy obsługującej geoprzestrzenne zapytania
   */
  async getFarmersNearLocation(coordinates, maxDistance = 50) {
    // Pobierz wszystkich rolników
    const farmersSnapshot = await usersCollection
      .where('role', '==', 'farmer')
      .get();
    
    if (farmersSnapshot.empty) {
      return [];
    }
    
    // Funkcja do obliczania odległości (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Promień Ziemi w km
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return R * c; // Odległość w km
    };
    
    // Filtruj rolników według odległości
    const farmersNearby = [];
    
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
          const { passwordHash, ...farmerWithoutPassword } = farmer;
          farmersNearby.push({
            id: doc.id,
            ...farmerWithoutPassword,
            distance // Dodaj odległość do wyniku
          });
        }
      }
    });
    
    // Sortuj według odległości
    return farmersNearby.sort((a, b) => a.distance - b.distance);
  }
  
  /**
   * Konwersja stopni na radiany
   */
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

export const profileService = new ProfileService();
