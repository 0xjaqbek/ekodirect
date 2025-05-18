// backend/middleware/auth.ts - Fixed version
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { usersCollection } from '../models/collections';
import { config } from '../config';

const JWT_SECRET = config.jwtSecret;

// Define a clear type for user data from Firestore
interface UserData {
  passwordHash: string;
  email: string;
  fullName: string;
  role: 'farmer' | 'consumer' | 'admin';
  phoneNumber: string;
  location?: {
    coordinates: [number, number];
    address: string;
  };
  // Add other needed properties
  [key: string]: unknown; // For other properties
}

// Define what we store in req.user (without sensitive data)
export interface UserWithoutPassword {
  email: string;
  fullName: string;
  role: 'farmer' | 'consumer' | 'admin';
  phoneNumber: string;
  location?: {
    coordinates: [number, number];
    address: string;
  };
  // Add other needed properties
  [key: string]: unknown; // For other properties
}

// Use module augmentation instead of namespace (ES2015 module syntax)
declare module 'express' {
  interface Request {
    user?: UserWithoutPassword & { id: string };
  }
}

// Authenticate user with JWT token
export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Brak autoryzacji. Wymagane zalogowanie.'
      });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Find user by ID
    const userDoc = await usersCollection.doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      res.status(401).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
      return;
    }
    
    // Get user data with proper typing
    const userData = userDoc.data() as UserData | undefined;
    
    if (!userData) {
      res.status(401).json({
        success: false,
        error: 'Brak danych użytkownika'
      });
      return;
    }
    
    // Destructure to remove passwordHash with ESLint disable comment
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = userData;
    
    // Attach user to request
    req.user = {
      id: userDoc.id,
      ...userWithoutPassword
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if ((error as Error).name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token wygasł',
        message: 'Token expired'
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      error: 'Nieprawidłowy token'
    });
  }
};