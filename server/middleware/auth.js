// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import { admin } from '../firebase.ts';
import { config } from '../config.js';

const db = admin.firestore();
const usersCollection = db.collection('users');
const JWT_SECRET = config.jwtSecret;

/**
 * Middleware to authenticate user with JWT token
 */
export const authenticateUser = async (req, res, next) => {
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
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by ID
    const userDoc = await usersCollection.doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }
    
    // Attach user to request (exclude passwordHash)
    const userData = userDoc.data();
    const { passwordHash, ...userWithoutPassword } = userData;
    req.user = { id: userDoc.id, ...userWithoutPassword };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
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