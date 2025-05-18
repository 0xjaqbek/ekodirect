// backend/firebase.ts (Fixed version)
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs/promises';

// Define __dirname directly for CommonJS compatibility
const __dirname = process.cwd() + '/backend';

// Initialize Firebase
async function initializeFirebase() {
  try {
    // Read service account file path from env or use default
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                              path.join(__dirname, '../serviceAccountKey.json');
    
    let serviceAccount;
    try {
      // Read and parse the service account JSON file
      const fileContent = await fs.readFile(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading Firebase service account file:', error);
      process.exit(1);
    }

    // Initialize Firebase app with the service account
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    process.exit(1);
  }
}

// Initialize Firebase immediately
initializeFirebase().catch(error => {
  console.error('Failed to initialize Firebase:', error);
  process.exit(1);
});

// Export admin and Firestore
export const db = admin.firestore();
export { admin };