// backend/firebase.ts - Fixed with better error handling
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix for __dirname and __filename in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track initialization state
let isInitialized = false;

// Initialize Firebase synchronously
function initializeFirebase(): void {
  if (isInitialized) return;

  try {
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      path.join(__dirname, 'serviceAccountKey.json');

    let serviceAccount;
    try {
      const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading Firebase service account file:', error);
      console.error('Expected path:', serviceAccountPath);
      console.error('Please make sure the serviceAccountKey.json file exists');
      throw error;
    }

    // Initialize Firebase Admin with storage bucket handling
    const initConfig: admin.AppOptions = {
      credential: admin.credential.cert(serviceAccount),
    };

    // Add database URL if provided
    if (process.env.FIREBASE_DATABASE_URL) {
      initConfig.databaseURL = process.env.FIREBASE_DATABASE_URL;
    }

    // Add storage bucket if provided
    if (process.env.FIREBASE_STORAGE_BUCKET) {
      initConfig.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    } else {
      // Try to extract from service account project ID
      if (serviceAccount.project_id) {
        initConfig.storageBucket = `${serviceAccount.project_id}.appspot.com`;
        console.log(`Using default storage bucket: ${initConfig.storageBucket}`);
      }
    }

    admin.initializeApp(initConfig);

    isInitialized = true;
    console.log('Firebase initialized successfully');
    
    // Log configuration (without sensitive data)
    console.log('Firebase config:');
    console.log('- Project ID:', serviceAccount.project_id);
    console.log('- Storage bucket:', initConfig.storageBucket || 'Not configured');
    console.log('- Database URL:', initConfig.databaseURL || 'Not configured');
    
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Run immediately on import
initializeFirebase();

// Export Firebase services
export { admin };
export const db = admin.firestore();
export const auth = admin.auth();

// Export storage with error handling
export const storage = admin.storage();

// Export a function to get bucket with fallback
export const getBucket = (bucketName?: string) => {
  try {
    if (bucketName) {
      return storage.bucket(bucketName);
    }
    
    // Try to get default bucket
    const defaultBucket = storage.bucket();
    return defaultBucket;
  } catch (error) {
    console.error('Error getting storage bucket:', error);
    console.error('Make sure FIREBASE_STORAGE_BUCKET is set in your environment variables');
    throw new Error('Storage bucket not configured. Please set FIREBASE_STORAGE_BUCKET environment variable.');
  }
};

export { initializeFirebase };
export default admin;