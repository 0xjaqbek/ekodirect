// backend/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { usersCollection } from '../models/collections';
import { config } from '../config';

const JWT_SECRET = config.jwtSecret;

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Authenticate user with JWT token
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Brak autoryzacji. Wymagane zalogowanie.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Find user by ID
    const userDoc = await usersCollection.doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }
    
    // Attach user to request
    const userData = userDoc.data();
    const { passwordHash, ...userWithoutPassword } = userData;
    
    req.user = {
      id: userDoc.id,
      ...userWithoutPassword
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if ((error as Error).name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token wygasł',
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Nieprawidłowy token'
    });
  }
};