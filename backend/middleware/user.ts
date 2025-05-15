// backend/middleware/user.ts
import { Request, Response, NextFunction } from 'express';
import { admin } from '../../server/firebase.js';

const db = admin.firestore();
const usersCollection = db.collection('users');

/**
 * Middleware sprawdzające czy użytkownik istnieje
 */
export const userExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Sprawdź czy użytkownik istnieje
    const userDoc = await usersCollection.doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }
    
    next();
  } catch (error) {
    console.error('User exists middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas weryfikacji użytkownika'
    });
  }
};

/**
 * Middleware sprawdzające czy użytkownik jest właścicielem profilu
 */
export const isProfileOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    if (userId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Brak uprawnień do wykonania tej operacji'
      });
    }
    
    next();
  } catch (error) {
    console.error('Is profile owner middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas weryfikacji uprawnień'
    });
  }
};