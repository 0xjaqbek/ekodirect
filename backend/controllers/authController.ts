// backend/controllers/authController.ts - Wersja z lepszym logowaniem
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
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== REJESTRACJA - START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);

    const { email, password, fullName, role, phoneNumber, location } = req.body;

    // Detailed validation logging
    console.log('Extracted fields:');
    console.log('- email:', email);
    console.log('- password:', password ? '[HIDDEN]' : 'MISSING');
    console.log('- fullName:', fullName);
    console.log('- role:', role);
    console.log('- phoneNumber:', phoneNumber);
    console.log('- location:', location);

    // Validate required fields
    if (!email) {
      console.error('Missing email');
      res.status(400).json({
        success: false,
        error: 'Email jest wymagany'
      });
      return;
    }

    if (!password) {
      console.error('Missing password');
      res.status(400).json({
        success: false,
        error: 'Hasło jest wymagane'
      });
      return;
    }

    if (!fullName) {
      console.error('Missing fullName');
      res.status(400).json({
        success: false,
        error: 'Imię i nazwisko jest wymagane'
      });
      return;
    }

    if (!role) {
      console.error('Missing role');
      res.status(400).json({
        success: false,
        error: 'Rola jest wymagana'
      });
      return;
    }

    if (!phoneNumber) {
      console.error('Missing phoneNumber');
      res.status(400).json({
        success: false,
        error: 'Numer telefonu jest wymagany'
      });
      return;
    }

    if (!location || !location.coordinates || !location.address) {
      console.error('Missing or invalid location:', location);
      res.status(400).json({
        success: false,
        error: 'Lokalizacja jest wymagana'
      });
      return;
    }

    console.log('Wszystkie pola przeszły walidację');

    // Check if user with this email already exists
    console.log('Sprawdzam czy użytkownik z emailem już istnieje...');
    const userSnapshot = await usersCollection.where('email', '==', email).get();
    
    if (!userSnapshot.empty) {
      console.error('Użytkownik już istnieje:', email);
      res.status(400).json({
        success: false,
        error: 'Użytkownik z tym adresem email już istnieje'
      });
      return;
    }

    // Create password hash
    console.log('Tworzę hash hasła...');
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

    console.log('Zapisuję użytkownika do Firestore...');
    console.log('User data (without password):', { ...userData, passwordHash: '[HIDDEN]' });

    // Save user to Firestore
    const userRef = await usersCollection.add(userData);
    console.log('Użytkownik zapisany z ID:', userRef.id);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log('Wygenerowany token weryfikacyjny');
    
    // Save token to database
    await tokensCollection.add({
      user: userRef.id,
      token: verificationToken,
      type: 'email-verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Token weryfikacyjny zapisany');

    // Send verification email (implementation will vary)
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
    
    // Mock email service call for now
    console.log(`Sending verification email to ${email} with URL: ${verificationUrl}`);

    // Return success response without sensitive data
    const responseData = {
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
    };

    console.log('Wysyłam odpowiedź sukcesu:', responseData);
    res.status(201).json(responseData);
    console.log('=== REJESTRACJA - KONIEC SUKCES ===');

  } catch (error) {
    console.error('=== REJESTRACJA - BŁĄD ===');
    console.error('Register error:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie później.'
    });
    console.log('=== REJESTRACJA - KONIEC BŁĄD ===');
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

    // Check if email is verified
    if (!userData.isVerified) {
      res.status(401).json({
        success: false,
        error: 'Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę email.'
      });
      return;
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

/**
 * Verify email with token
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Brak tokenu weryfikacyjnego'
      });
      return;
    }

    // Find token in database
    const tokenSnapshot = await tokensCollection
      .where('token', '==', token)
      .where('type', '==', 'email-verification')
      .get();

    if (tokenSnapshot.empty) {
      res.status(400).json({
        success: false,
        error: 'Nieprawidłowy lub wygasły token weryfikacyjny'
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
        error: 'Token weryfikacyjny wygasł'
      });
      return;
    }

    // Find user and update verification status
    const userDoc = await usersCollection.doc(tokenData.user).get();
    
    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
      return;
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
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user by email
    const userSnapshot = await usersCollection.where('email', '==', email).get();
    
    // Don't reveal if user exists for security reasons
    if (userSnapshot.empty) {
      res.json({
        success: true,
        data: {
          sent: true
        },
        message: 'Jeśli konto o podanym adresie email istnieje, na skrzynkę pocztową zostanie wysłany link do resetowania hasła.'
      });
      return;
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