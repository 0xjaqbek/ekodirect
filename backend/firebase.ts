// backend/firebase.ts (Fixed with lazy initialization)
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs/promises';

// Track initialization state
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Simple approach that works with ts-node and CommonJS
const currentDir = path.resolve(__dirname || process.cwd());

// Initialize Firebase
async function initializeFirebase(): Promise<void> {
  if (isInitialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // Read service account file path from env or use default
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                                path.join(currentDir, 'serviceAccountKey.json');
      
      let serviceAccount;
      try {
        // Read and parse the service account JSON file
        const fileContent = await fs.readFile(serviceAccountPath, 'utf8');
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
  })();

  return initializationPromise;
}

// Lazy getters for Firebase services
export const getFirebaseAdmin = () => {
  if (!isInitialized) {
    throw new Error('Firebase not initialized. Make sure to await initializeFirebase() first.');
  }
  return admin;
};

export const getFirestore = () => {
  if (!isInitialized) {
    throw new Error('Firebase not initialized. Make sure to await initializeFirebase() first.');
  }
  return admin.firestore();
};

// Initialize Firebase immediately but don't export services until ready
initializeFirebase().catch(error => {
  console.error('Failed to initialize Firebase:', error);
  process.exit(1);
});

// Export the initialization function and admin instance for backward compatibility
export { admin, initializeFirebase };

// Backward compatibility exports (lazy)
export const db = new Proxy({} as FirebaseFirestore.Firestore, {
  get(target, prop) {
    const firestore = getFirestore();
    const value = firestore[prop as keyof FirebaseFirestore.Firestore];
    return typeof value === 'function' ? value.bind(firestore) : value;
  }
});