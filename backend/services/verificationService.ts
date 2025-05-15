// backend/services/verificationService.js
import { admin } from '../firebase.js';

const db = admin.firestore();
const usersCollection = db.collection('users');
const certificatesCollection = db.collection('certificates');

/**
 * Serwis do weryfikacji rolników i certyfikatów
 */
class VerificationService {
  /**
   * Zweryfikuj certyfikat rolnika
   */
  async verifyCertificate(certificateId, isVerified) {
    await certificatesCollection.doc(certificateId).update({
      isVerified,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return await certificatesCollection.doc(certificateId).get().then(doc => {
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    });
  }
  
  /**
   * Pobierz certyfikaty rolnika
   */
  async getFarmerCertificates(userId) {
    const certificatesSnapshot = await certificatesCollection
      .where('issuedTo', '==', userId)
      .get();
    
    if (certificatesSnapshot.empty) {
      return [];
    }
    
    const certificates = [];
    certificatesSnapshot.forEach(doc => {
      certificates.push({ id: doc.id, ...doc.data() });
    });
    
    return certificates;
  }
  
  /**
   * Sprawdź czy rolnik posiada zweryfikowane certyfikaty
   */
  async hasFarmerVerifiedCertificates(userId) {
    const certificatesSnapshot = await certificatesCollection
      .where('issuedTo', '==', userId)
      .where('isVerified', '==', true)
      .limit(1)
      .get();
    
    return !certificatesSnapshot.empty;
  }
}

export const verificationService = new VerificationService();