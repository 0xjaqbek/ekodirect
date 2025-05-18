// backend/middleware/user.ts - Fixed version
import { Request, Response, NextFunction } from 'express';
import { admin } from '../firebase';

const db = admin.firestore();
const usersCollection = db.collection('users');

/**
 * Middleware sprawdzające czy użytkownik istnieje
 */
export const userExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Sprawdź czy użytkownik istnieje
    const userDoc = await usersCollection.doc(id).get();
    
    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
      return;
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
export const isProfileOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Add null check for req.user
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    const userId = req.user.id;
    const { id } = req.params;
    
    if (userId !== id) {
      res.status(403).json({
        success: false,
        error: 'Brak uprawnień do wykonania tej operacji'
      });
      return;
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