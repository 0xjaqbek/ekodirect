// backend/firebase.ts - Synchronous initialization to fix the loading issue
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Track initialization state
let isInitialized = false;

// Simple approach that works with ts-node and CommonJS
const currentDir = path.resolve(__dirname);

// Initialize Firebase synchronously
function initializeFirebase(): void {
  if (isInitialized) {
    return;
  }

  try {
    // Read service account file path from env or use default
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                              path.join(currentDir, 'serviceAccountKey.json');
    
    let serviceAccount;
    try {
      // Read and parse the service account JSON file synchronously
      const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading Firebase service account file:', error);
      console.error('Expected path:', serviceAccountPath);
      throw error;
    }

    // Initialize Firebase app with the service account
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    isInitialized = true;
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Initialize Firebase immediately when this module is imported
initializeFirebase();

// Export the admin instance and services
export { admin };
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// Export initialization function for manual initialization if needed
export { initializeFirebase };

// Export default admin instance for backward compatibility
export default admin;