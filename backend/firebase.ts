// backend/firebase.ts (Fixed version)
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Get the backend directory path
const backendDir = path.join(process.cwd(), 'backend');

try {
  // Check if Firebase app is already initialized
  if (admin.apps.length === 0) {
    // Read service account file path from env or use default
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                              path.join(backendDir, './serviceAccountKey.json');
    
    let serviceAccount;
    try {
      // Read and parse the service account JSON file synchronously for startup
      const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading Firebase service account file:', error);
      console.error('Make sure the serviceAccountKey.json file exists in the project root');
      process.exit(1);
    }

    // Initialize Firebase app with the service account
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    console.log('Firebase initialized successfully');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  process.exit(1);
}

// Export admin and Firestore - now safe to access since initialization is complete
export const db = admin.firestore();
export { admin };