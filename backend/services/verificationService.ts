// backend/services/verificationService.ts - Fixed TypeScript version
import { admin } from '../firebase';

const db = admin.firestore();
const certificatesCollection = db.collection('certificates');

// Define types for certificates
interface Certificate {
  id: string;
  name: string;
  type: 'organic' | 'eco' | 'fair-trade' | 'other';
  issuingAuthority: string;
  documentUrl?: string;
  issuedTo: string;
  products?: string[];
  isVerified: boolean;
  validUntil: admin.firestore.Timestamp | Date;
  createdAt: admin.firestore.Timestamp | Date;
  updatedAt: admin.firestore.Timestamp | Date;
}

/**
 * Serwis do weryfikacji rolników i certyfikatów
 */
class VerificationService {
  /**
   * Zweryfikuj certyfikat rolnika
   */
  async verifyCertificate(certificateId: string, isVerified: boolean): Promise<Certificate | null> {
    await certificatesCollection.doc(certificateId).update({
      isVerified,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const doc = await certificatesCollection.doc(certificateId).get();
    if (!doc.exists) {
      return null;
    }
    
    return { 
      id: doc.id, 
      ...doc.data() 
    } as Certificate;
  }
  
  /**
   * Pobierz certyfikaty rolnika
   */
  async getFarmerCertificates(userId: string): Promise<Certificate[]> {
    const certificatesSnapshot = await certificatesCollection
      .where('issuedTo', '==', userId)
      .get();
    
    if (certificatesSnapshot.empty) {
      return [];
    }
    
    const certificates: Certificate[] = [];
    certificatesSnapshot.forEach(doc => {
      certificates.push({ 
        id: doc.id, 
        ...doc.data() 
      } as Certificate);
    });
    
    return certificates;
  }
  
  /**
   * Sprawdź czy rolnik posiada zweryfikowane certyfikaty
   */
  async hasFarmerVerifiedCertificates(userId: string): Promise<boolean> {
    const certificatesSnapshot = await certificatesCollection
      .where('issuedTo', '==', userId)
      .where('isVerified', '==', true)
      .limit(1)
      .get();
    
    return !certificatesSnapshot.empty;
  }
}

export const verificationService = new VerificationService();