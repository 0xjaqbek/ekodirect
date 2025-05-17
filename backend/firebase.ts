// backend/firebase.ts
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
try {
  // Read service account file
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                           path.join(__dirname, '../serviceAccountKey.json');
  
  let serviceAccount;
  try {
    const fs = await import('fs');
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } catch (error) {
    console.error('Error reading Firebase service account file:', error);
    process.exit(1);
  }

  // Initialize Firebase app
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  process.exit(1);
}

// Export admin and Firestore
export const db = admin.firestore();
export { admin };