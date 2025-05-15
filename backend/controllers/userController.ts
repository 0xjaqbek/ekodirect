// backend/controllers/userController.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { admin } from '../firebase.js';

// Inicjalizacja Firestore
const db = admin.firestore();
const usersCollection = db.collection('users');

// Konfiguracja przechowywania plików
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/avatars';
    // Upewnij się, że katalog istnieje
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtrowanie typów plików
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Dozwolone są tylko pliki graficzne!'));
  }
};

// Konfiguracja uploadera
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

/**
 * Pobierz profil zalogowanego użytkownika
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // Użytkownik jest już załączony przez middleware auth
    const userId = req.user.id;
    
    // Pobierz użytkownika z bazy
    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }
    
    // Przygotuj dane użytkownika (bez hasła)
    const userData = userDoc.data();
    const { passwordHash, ...userWithoutPassword } = userData;
    
    res.json({
      success: true,
      data: {
        id: userDoc.id,
        ...userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas pobierania profilu użytkownika'
    });
  }
};

/**
 * Pobierz profil użytkownika po ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Pobierz użytkownika z bazy
    const userDoc = await usersCollection.doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }
    
    // Przygotuj dane użytkownika (bez hasła)
    const userData = userDoc.data();
    const { passwordHash, ...userWithoutPassword } = userData;
    
    res.json({
      success: true,
      data: {
        id: userDoc.id,
        ...userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas pobierania profilu użytkownika'
    });
  }
};

/**
 * Aktualizuj profil użytkownika
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { fullName, phoneNumber, bio, location } = req.body;
    
    // Walidacja danych
    if (!fullName || !phoneNumber || !location) {
      return res.status(400).json({
        success: false,
        error: 'Brakujące dane profilu'
      });
    }
    
    // Zaktualizuj użytkownika w bazie
    await usersCollection.doc(userId).update({
      fullName,
      phoneNumber,
      bio: bio || null,
      location,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Pobierz zaktualizowane dane
    const updatedUserDoc = await usersCollection.doc(userId).get();
    const userData = updatedUserDoc.data();
    const { passwordHash, ...userWithoutPassword } = userData;
    
    res.json({
      success: true,
      data: {
        id: updatedUserDoc.id,
        ...userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas aktualizacji profilu użytkownika'
    });
  }
};

/**
 * Upload zdjęcia profilowego
 */
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nie przesłano pliku'
      });
    }
    
    const userId = req.user.id;
    const filePath = req.file.path;
    
    // W rzeczywistym projekcie tutaj byłby upload pliku do Cloudinary lub innego serwisu
    // Dla uproszczenia, używamy lokalnego URL
    const profileImageUrl = `${req.protocol}://${req.get('host')}/${filePath}`;
    
    // Zaktualizuj URL zdjęcia w profilu użytkownika
    await usersCollection.doc(userId).update({
      profileImage: profileImageUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Pobierz zaktualizowane dane
    const updatedUserDoc = await usersCollection.doc(userId).get();
    const userData = updatedUserDoc.data();
    const { passwordHash, ...userWithoutPassword } = userData;
    
    res.json({
      success: true,
      data: {
        id: updatedUserDoc.id,
        ...userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas przesyłania zdjęcia profilowego'
    });
  }
};