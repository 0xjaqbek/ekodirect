// backend/firebase.ts - ESM-compatible initialization
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 🔁 Fix for __dirname and __filename in ES Modules
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
      throw error;
    }

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

// Run immediately on import
initializeFirebase();

// Export Firebase services
export { admin };
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export { initializeFirebase };
export default admin;
