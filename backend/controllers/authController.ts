// backend/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User } from '../models/User';
import { Token } from '../models/Token';
import { emailService } from '../services/emailService';
import { config } from '../config';

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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Użytkownik z tym adresem email już istnieje'
      });
    }

    // Create password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
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
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save user to database
    await user.save();

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Save token to database
    const token = new Token({
      user: user._id,
      token: verificationToken,
      type: 'email-verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    
    await token.save();

    // Send verification email
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
    
    await emailService.sendVerificationEmail({
      to: user.email,
      name: user.fullName,
      verificationUrl
    });

    // Return success response without sensitive data
    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isVerified: user.isVerified
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
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Nieprawidłowy email lub hasło'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Nieprawidłowy email lub hasło'
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        error: 'Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę email.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user._id }, 
      JWT_REFRESH_SECRET, 
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    // Save refresh token to database
    const tokenDoc = new Token({
      user: user._id,
      token: refreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    await tokenDoc.save();

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // Return user data and tokens
    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phoneNumber: user.phoneNumber,
          location: user.location,
          profileImage: user.profileImage,
          isVerified: user.isVerified
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
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Nieprawidłowy lub wygasły token odświeżający'
      });
    }

    // Check if token exists in database
    const tokenDoc = await Token.findOne({
      token: refreshToken,
      type: 'refresh',
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.status(401).json({
        success: false,
        error: 'Token odświeżający nie istnieje lub wygasł'
      });
    }

    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }

    // Generate new JWT token
    const newToken = jwt.sign(
      { userId: user._id }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { userId: user._id }, 
      JWT_REFRESH_SECRET, 
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    // Remove old refresh token
    await Token.deleteOne({ _id: tokenDoc._id });

    // Save new refresh token to database
    const newTokenDoc = new Token({
      user: user._id,
      token: newRefreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    await newTokenDoc.save();

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
    const tokenDoc = await Token.findOne({
      token,
      type: 'email-verification',
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        error: 'Nieprawidłowy lub wygasły token weryfikacyjny'
      });
    }

    // Find user and update verification status
    const user = await User.findById(tokenDoc.user);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }

    // Update verification status
    user.isVerified = true;
    user.updatedAt = new Date();
    await user.save();

    // Remove token
    await Token.deleteOne({ _id: tokenDoc._id });

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
    const user = await User.findOne({ email });
    
    // Don't reveal if user exists for security reasons
    if (!user) {
      return res.json({
        success: true,
        data: {
          sent: true
        },
        message: 'Jeśli konto o podanym adresie email istnieje, na skrzynkę pocztową zostanie wysłany link do resetowania hasła.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Save token to database
    const token = new Token({
      user: user._id,
      token: resetToken,
      type: 'password-reset',
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
    });
    
    await token.save();

    // Send password reset email
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    
    await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.fullName,
      resetUrl
    });

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
    const tokenDoc = await Token.findOne({
      token,
      type: 'password-reset',
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        error: 'Nieprawidłowy lub wygasły token resetowania hasła'
      });
    }

    // Find user
    const user = await User.findById(tokenDoc.user);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }

    // Create new password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password
    user.passwordHash = passwordHash;
    user.updatedAt = new Date();
    await user.save();

    // Remove token
    await Token.deleteOne({ _id: tokenDoc._id });

    // Invalidate all refresh tokens for this user
    await Token.deleteMany({ user: user._id, type: 'refresh' });

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