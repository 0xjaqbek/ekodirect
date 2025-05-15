// server/firebase.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
try {
  // Read service account file
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                           path.join(__dirname, 'serviceAccountKey.json');
  
  // Parse service account JSON
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  } catch (error) {
    console.error('Error reading Firebase service account file:', error);
    console.error('Make sure you have a valid serviceAccountKey.json file in your server directory');
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

// Export admin
export { admin };