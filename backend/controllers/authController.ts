// backend/controllers/authController.ts - Bez weryfikacji email
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { admin } from '../firebase';
import { config } from '../config';
import { emailService } from '../services/emailService';

// Initialize Firestore
const db = admin.firestore();
const usersCollection = db.collection('users');
const tokensCollection = db.collection('tokens');

const JWT_SECRET = config.jwtSecret;
const JWT_REFRESH_SECRET = config.jwtRefreshSecret;
const JWT_EXPIRES_IN = '1h';
const JWT_REFRESH_EXPIRES_IN = '7d';

/**
 * Register a new user - BEZ WERYFIKACJI EMAIL
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== REJESTRACJA - START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { email, password, fullName, role, phoneNumber, location } = req.body;

    // Validate required fields
    if (!email || !password || !fullName || !role || !phoneNumber) {
      res.status(400).json({
        success: false,
        error: 'Wszystkie pola są wymagane'
      });
      return;
    }

    if (!location || !location.coordinates || !location.address) {
      res.status(400).json({
        success: false,
        error: 'Lokalizacja jest wymagana'
      });
      return;
    }

    // Check if user with this email already exists
    const userSnapshot = await usersCollection.where('email', '==', email).get();
    
    if (!userSnapshot.empty) {
      res.status(400).json({
        success: false,
        error: 'Użytkownik z tym adresem email już istnieje'
      });
      return;
    }

    // Create password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user - ALREADY VERIFIED
    const userData = {
      email,
      passwordHash,
      fullName,
      role,
      phoneNumber,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address
      },
      isVerified: true, // Automatycznie zweryfikowany
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save user to Firestore
    const userRef = await usersCollection.add(userData);
    console.log('Użytkownik zapisany z ID:', userRef.id);

    // Generate JWT tokens immediately (no email verification needed)
    const token = jwt.sign(
      { userId: userRef.id }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: userRef.id }, 
      JWT_REFRESH_SECRET, 
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    // Save refresh token to database
    await tokensCollection.add({
      user: userRef.id,
      token: refreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return success response with tokens
    const responseData = {
      success: true,
      data: {
        user: {
          _id: userRef.id,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          phoneNumber: userData.phoneNumber,
          location: userData.location,
          isVerified: userData.isVerified
        },
        token,
        refreshToken
      },
      message: 'Rejestracja zakończona sukcesem. Możesz się teraz zalogować.'
    };

    console.log('Wysyłam odpowiedź sukcesu:', responseData);
    res.status(201).json(responseData);
    console.log('=== REJESTRACJA - KONIEC SUKCES ===');

  } catch (error) {
    console.error('=== REJESTRACJA - BŁĄD ===');
    console.error('Register error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie później.'
    });
  }
};

/**
 * Login user and return JWT token
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userSnapshot = await usersCollection.where('email', '==', email).get();
    
    if (userSnapshot.empty) {
      res.status(401).json({
        success: false,
        error: 'Nieprawidłowy email lub hasło'
      });
      return;
    }

    // Get user data
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, userData.passwordHash);
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Nieprawidłowy email lub hasło'
      });
      return;
    }

    // Usunęliśmy sprawdzanie weryfikacji email
    // User is automatically verified upon registration

    // Generate JWT token
    const token = jwt.sign(
      { userId: userDoc.id }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: userDoc.id }, 
      JWT_REFRESH_SECRET, 
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    // Save refresh token to database
    await tokensCollection.add({
      user: userDoc.id,
      token: refreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update last login timestamp
    await userDoc.ref.update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return user data and tokens
    res.json({
      success: true,
      data: {
        user: {
          _id: userDoc.id,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          phoneNumber: userData.phoneNumber,
          location: userData.location,
          profileImage: userData.profileImage,
          isVerified: userData.isVerified
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas logowania. Spróbuj ponownie później.'
    });
  }
};

/**
 * Request password reset - FUNKCJA RESETOWANIA HASŁA
 */
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email jest wymagany'
      });
      return;
    }

    // Find user by email
    const userSnapshot = await usersCollection.where('email', '==', email).get();
    
    // Don't reveal if user exists for security reasons
    if (userSnapshot.empty) {
      res.json({
        success: true,
        data: { sent: true },
        message: 'Jeśli konto o podanym adresie email istnieje, zostanie wysłany link do resetowania hasła.'
      });
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Save token to database
    await tokensCollection.add({
      user: userDoc.id,
      token: resetToken,
      type: 'password-reset',
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send password reset email
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    
    try {
      await emailService.sendPasswordResetEmail({
        to: email,
        name: userData.fullName,
        resetUrl
      });
      console.log(`Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue anyway - don't reveal email sending errors
    }

    res.json({
      success: true,
      data: { sent: true },
      message: 'Link do resetowania hasła został wysłany na podany adres email.'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas przetwarzania żądania. Spróbuj ponownie później.'
    });
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Brak tokenu lub nowego hasła'
      });
      return;
    }

    // Find token in database
    const tokenSnapshot = await tokensCollection
      .where('token', '==', token)
      .where('type', '==', 'password-reset')
      .get();

    if (tokenSnapshot.empty) {
      res.status(400).json({
        success: false,
        error: 'Nieprawidłowy lub wygasły token resetowania hasła'
      });
      return;
    }

    const tokenDoc = tokenSnapshot.docs[0];
    const tokenData = tokenDoc.data();
    
    // Check if token is expired
    if (tokenData.expiresAt.toDate() < new Date()) {
      await tokenDoc.ref.delete();
      res.status(400).json({
        success: false,
        error: 'Token resetowania hasła wygasł'
      });
      return;
    }

    // Find user
    const userDoc = await usersCollection.doc(tokenData.user).get();
    
    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
      return;
    }

    // Create new password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password
    await userDoc.ref.update({
      passwordHash,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Remove token
    await tokenDoc.ref.delete();

    // Remove all refresh tokens for this user (logout from all devices)
    const refreshTokensSnapshot = await tokensCollection
      .where('user', '==', userDoc.id)
      .where('type', '==', 'refresh')
      .get();
    
    const batch = db.batch();
    refreshTokensSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({
      success: true,
      data: { success: true },
      message: 'Hasło zostało pomyślnie zresetowane. Możesz się teraz zalogować używając nowego hasła.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie później.'
    });
  }
};

/**
 * Refresh JWT token using refresh token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Brak tokenu odświeżającego'
      });
      return;
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      res.status(401).json({
        success: false,
        error: 'Nieprawidłowy lub wygasły token odświeżający'
      });
      return;
    }

    // Check if token exists in database
    const tokenSnapshot = await tokensCollection
      .where('token', '==', refreshToken)
      .where('type', '==', 'refresh')
      .get();

    if (tokenSnapshot.empty) {
      res.status(401).json({
        success: false,
        error: 'Token odświeżający nie istnieje lub wygasł'
      });
      return;
    }

    const tokenDoc = tokenSnapshot.docs[0];
    const tokenData = tokenDoc.data();
    
    // Check if token is expired
    if (tokenData.expiresAt.toDate() < new Date()) {
      await tokenDoc.ref.delete();
      res.status(401).json({
        success: false,
        error: 'Token odświeżający wygasł'
      });
      return;
    }

    // Get user from database
    const userDoc = await usersCollection.doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      res.status(401).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
      return;
    }

    // Generate new JWT token
    const newToken = jwt.sign(
      { userId: userDoc.id }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { userId: userDoc.id }, 
      JWT_REFRESH_SECRET, 
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    // Remove old refresh token
    await tokenDoc.ref.delete();

    // Save new refresh token to database
    await tokensCollection.add({
      user: userDoc.id,
      token: newRefreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return new tokens
    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas odświeżania tokenu. Spróbuj ponownie później.'
    });
  }
};