// backend/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { admin } from '../firebase';
import { config } from '../config';

// Initialize Firestore
const db = admin.firestore();
const usersCollection = db.collection('users');
const tokensCollection = db.collection('tokens');

const JWT_SECRET = config.jwtSecret;
const JWT_REFRESH_SECRET = config.jwtRefreshSecret;
const JWT_EXPIRES_IN = '1h';
const JWT_REFRESH_EXPIRES_IN = '7d';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role, phoneNumber, location } = req.body;

    // Check if user with this email already exists
    const userSnapshot = await usersCollection.where('email', '==', email).get();
    
    if (!userSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Użytkownik z tym adresem email już istnieje'
      });
    }

    // Create password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
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
      isVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save user to Firestore
    const userRef = await usersCollection.add(userData);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Save token to database
    await tokensCollection.add({
      user: userRef.id,
      token: verificationToken,
      type: 'email-verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send verification email (implementation will vary)
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
    
    // Mock email service call for now
    console.log(`Sending verification email to ${email} with URL: ${verificationUrl}`);

    // Return success response without sensitive data
    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: userRef.id,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          isVerified: userData.isVerified
        }
      },
      message: 'Rejestracja zakończona sukcesem. Sprawdź swoją skrzynkę email, aby zweryfikować konto.'
    });
  } catch (error) {
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
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userSnapshot = await usersCollection.where('email', '==', email).get();
    
    if (userSnapshot.empty) {
      return res.status(401).json({
        success: false,
        error: 'Nieprawidłowy email lub hasło'
      });
    }

    // Get user data
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, userData.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Nieprawidłowy email lub hasło'
      });
    }

    // Check if email is verified
    if (!userData.isVerified) {
      return res.status(401).json({
        success: false,
        error: 'Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę email.'
      });
    }

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
 * Refresh JWT token using refresh token
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Brak tokenu odświeżającego'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Nieprawidłowy lub wygasły token odświeżający'
      });
    }

    // Check if token exists in database
    const tokenSnapshot = await tokensCollection
      .where('token', '==', refreshToken)
      .where('type', '==', 'refresh')
      .get();

    if (tokenSnapshot.empty) {
      return res.status(401).json({
        success: false,
        error: 'Token odświeżający nie istnieje lub wygasł'
      });
    }

    const tokenDoc = tokenSnapshot.docs[0];
    const tokenData = tokenDoc.data();
    
    // Check if token is expired
    if (tokenData.expiresAt.toDate() < new Date()) {
      await tokenDoc.ref.delete();
      return res.status(401).json({
        success: false,
        error: 'Token odświeżający wygasł'
      });
    }

    // Get user from database
    const userDoc = await usersCollection.doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
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

/**
 * Verify email with token
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Brak tokenu weryfikacyjnego'
      });
    }

    // Find token in database
    const tokenSnapshot = await tokensCollection
      .where('token', '==', token)
      .where('type', '==', 'email-verification')
      .get();

    if (tokenSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Nieprawidłowy lub wygasły token weryfikacyjny'
      });
    }

    const tokenDoc = tokenSnapshot.docs[0];
    const tokenData = tokenDoc.data();
    
    // Check if token is expired
    if (tokenData.expiresAt.toDate() < new Date()) {
      await tokenDoc.ref.delete();
      return res.status(400).json({
        success: false,
        error: 'Token weryfikacyjny wygasł'
      });
    }

    // Find user and update verification status
    const userDoc = await usersCollection.doc(tokenData.user).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }

    // Update verification status
    await userDoc.ref.update({
      isVerified: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Remove token
    await tokenDoc.ref.delete();

    // Return success
    res.json({
      success: true,
      data: {
        verified: true
      },
      message: 'Adres email został pomyślnie zweryfikowany'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas weryfikacji adresu email. Spróbuj ponownie później.'
    });
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Find user by email
    const userSnapshot = await usersCollection.where('email', '==', email).get();
    
    // Don't reveal if user exists for security reasons
    if (userSnapshot.empty) {
      return res.json({
        success: true,
        data: {
          sent: true
        },
        message: 'Jeśli konto o podanym adresie email istnieje, na skrzynkę pocztową zostanie wysłany link do resetowania hasła.'
      });
    }

    const userDoc = userSnapshot.docs[0];
    
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

    // Send password reset email (implementation will vary)
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    
    // Mock email service call for now
    console.log(`Sending password reset email to ${email} with URL: ${resetUrl}`);

    // Return success
    res.json({
      success: true,
      data: {
        sent: true
      },
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
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Brak tokenu lub nowego hasła'
      });
    }

    // Find token in database
    const tokenSnapshot = await tokensCollection
      .where('token', '==', token)
      .where('type', '==', 'password-reset')
      .get();

    if (tokenSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Nieprawidłowy lub wygasły token resetowania hasła'
      });
    }

    const tokenDoc = tokenSnapshot.docs[0];
    const tokenData = tokenDoc.data();
    
    // Check if token is expired
    if (tokenData.expiresAt.toDate() < new Date()) {
      await tokenDoc.ref.delete();
      return res.status(400).json({
        success: false,
        error: 'Token resetowania hasła wygasł'
      });
    }

    // Find user
    const userDoc = await usersCollection.doc(tokenData.user).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
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

    // Return success
    res.json({
      success: true,
      data: {
        success: true
      },
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