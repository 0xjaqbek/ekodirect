// backend/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
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

/**
 * Middleware to authenticate user with JWT token
 */
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
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }
    
    // Attach user to request
    req.user = user;
    
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

/**
 * Middleware to check if user has required role
 */
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Brak autoryzacji. Wymagane zalogowanie.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Brak uprawnień do wykonania tej operacji'
      });
    }
    
    next();
  };
};