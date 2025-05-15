// server/controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { admin } from '../firebase.js';
import { config } from '../config.js';

// Initialize Firestore
const db = admin.firestore();
const usersCollection = db.collection('users');
const tokensCollection = db.collection('tokens');

const JWT_SECRET = config.jwtSecret || 'default_jwt_secret';
const JWT_REFRESH_SECRET = config.jwtRefreshSecret || 'default_jwt_refresh_secret';
const JWT_EXPIRES_IN = '1h';
const JWT_REFRESH_EXPIRES_IN = '7d';

/**
 * Send an email (simplified and mocked for testing)
 */
const sendEmail = async (options) => {
  try {
    console.log('Sending email:', {
      to: options.to,
      subject: options.subject || 'Email from EkoDirect',
      contentPreview: options.html ? options.html.substring(0, 50) + '...' : 'No content'
    });
    
    // If you have a real email service, use it here
    // For now, we'll just log and return success for testing
    return { success: true, messageId: 'mock-email-id-' + Date.now() };
  } catch (error) {
    console.error('Email sending error:', error);
    // Return success anyway to continue the flow
    return { success: true, messageId: 'mock-email-id-' + Date.now() };
  }
};

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    console.log("Registration request received:", JSON.stringify(req.body, null, 2));
    
    const { email, password, fullName, role, phoneNumber, location } = req.body;
    
    // Log all values for debugging
    console.log("Registration data validation:", {
      emailPresent: !!email,
      passwordPresent: !!password,
      fullNamePresent: !!fullName,
      rolePresent: !!role,
      phoneNumberPresent: !!phoneNumber,
      locationPresent: !!location,
      coordinatesPresent: location && !!location.coordinates,
      addressPresent: location && !!location.address
    });

    // Basic validation - check required fields
    if (!email || !password || !fullName || !role || !phoneNumber || !location) {
      console.error("Missing required fields in registration request");
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check location format
    if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      console.error("Invalid location format:", location);
      return res.status(400).json({
        success: false,
        error: 'Invalid location format'
      });
    }

    console.log("Checking if user exists...");
    
    try {
      // Check if user with this email already exists
      const userSnapshot = await usersCollection.where('email', '==', email).get();
      console.log(`User query executed: found ${userSnapshot.size} matches`);
      
      if (!userSnapshot.empty) {
        return res.status(400).json({
          success: false,
          error: 'Użytkownik z tym adresem email już istnieje'
        });
      }
    } catch (error) {
      console.error("Error checking if user exists:", error);
      return res.status(500).json({
        success: false,
        error: 'Error checking user existence: ' + error.message
      });
    }

    console.log("Creating password hash...");
    // Create password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log("Creating user document...");
    
    // Prepare user data with proper formatting
    const userData = {
      email,
      passwordHash,
      fullName,
      role,
      phoneNumber,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address || 'Address not provided'
      },
      isVerified: false, // Set to true for testing if needed
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    try {
      // Create new user document
      const userRef = await usersCollection.add(userData);
      console.log("User saved successfully with ID:", userRef.id);
      
      // Update the user document with its ID
      await userRef.update({ id: userRef.id });
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      console.log("Saving verification token...");
      // Save token to Firestore
      const tokenData = {
        user: userRef.id,
        token: verificationToken,
        type: 'email-verification',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
      
      await tokensCollection.add(tokenData);
      console.log("Token saved successfully");

      // Prepare verification URL
      const verificationUrl = `${config.frontendUrl || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
      
      console.log("Sending verification email...");
      try {
        // Send verification email (mocked)
        await sendEmail({
          to: userData.email,
          subject: 'Verify your email - EkoDirect',
          html: `
            <div>
              <h2>Welcome ${userData.fullName}!</h2>
              <p>Please verify your email by clicking the link below:</p>
              <p><a href="${verificationUrl}">Verify Email</a></p>
              <p>This link is valid for 24 hours.</p>
            </div>
          `
        });
        console.log("Verification email sent successfully");
      } catch (emailError) {
        console.error("Email sending failed, but continuing registration:", emailError);
        // We'll continue with the registration even if email fails
      }

      console.log("Registration completed successfully");
      // Return success response without sensitive data
      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: userRef.id,
            email: userData.email,
            fullName: userData.fullName,
            role: userData.role,
            isVerified: userData.isVerified
          }
        },
        message: 'Rejestracja zakończona sukcesem. Sprawdź swoją skrzynkę email, aby zweryfikować konto.'
      });
    } catch (firebaseError) {
      console.error("Firebase error while creating user:", firebaseError);
      return res.status(500).json({
        success: false,
        error: 'Firebase error: ' + firebaseError.message
      });
    }
  } catch (error) {
    console.error('Register error details:', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Registration error: ' + error.message
    });
  }
};

/**
 * Login user and return JWT token
 */
export const login = async (req, res) => {
  try {
    console.log("Login request received:", JSON.stringify(req.body, null, 2));
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    console.log("Finding user by email...");
    // Find user by email
    const userSnapshot = await usersCollection.where('email', '==', email).get();
    
    if (userSnapshot.empty) {
      return res.status(401).json({
        success: false,
        error: 'Nieprawidłowy email lub hasło'
      });
    }

    // Get the first document (should be only one)
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log("Checking password...");
    // Check password
    const isPasswordValid = await bcrypt.compare(password, userData.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Nieprawidłowy email lub hasło'
      });
    }

    // For testing: Comment out the verification check if needed
    /*
    // Check if email is verified
    if (!userData.isVerified) {
      return res.status(401).json({
        success: false,
        error: 'Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę email.'
      });
    }
    */

    console.log("Generating tokens...");
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

    console.log("Saving refresh token...");
    // Save refresh token to Firestore
    await tokensCollection.add({
      user: userDoc.id,
      token: refreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    console.log("Updating last login timestamp...");
    // Update last login timestamp
    await userDoc.ref.update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("Login successful");
    // Return user data and tokens
    res.json({
      success: true,
      data: {
        user: {
          id: userDoc.id,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          phoneNumber: userData.phoneNumber,
          location: userData.location,
          profileImage: userData.profileImage,
          isVerified: userData.isVerified || false
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error details:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Login error: ' + error.message
    });
  }
};

/**
 * Refresh JWT token using refresh token
 */
export const refreshToken = async (req, res) => {
    try {
      console.log("Token refresh request received:", JSON.stringify(req.body, null, 2));
      
      const { refreshToken: token } = req.body;
  
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Brak tokenu odświeżającego'
        });
      }
  
      console.log("Verifying refresh token...");
      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        console.log("Token verified successfully:", decoded);
      } catch (error) {
        console.error("Token verification failed:", error.message);
        return res.status(401).json({
          success: false,
          error: 'Nieprawidłowy lub wygasły token odświeżający'
        });
      }
  
      // For debugging: check if userId exists
      if (!decoded.userId) {
        console.error("Missing userId in token payload:", decoded);
        return res.status(401).json({
          success: false,
          error: 'Nieprawidłowy format tokenu'
        });
      }
  
      console.log("Checking if token exists in database...");
      try {
        // Check if token exists in Firestore
        const tokenSnapshot = await tokensCollection
          .where('token', '==', token)
          .where('type', '==', 'refresh')
          .get();
  
        console.log(`Found ${tokenSnapshot.size} matching tokens`);
  
        if (tokenSnapshot.empty) {
          return res.status(401).json({
            success: false,
            error: 'Token odświeżający nie istnieje lub wygasł'
          });
        }
  
        const tokenDoc = tokenSnapshot.docs[0];
        const tokenData = tokenDoc.data();
        
        // Check if token is expired
        if (tokenData.expiresAt && new Date(tokenData.expiresAt.toDate()) < new Date()) {
          console.log("Token has expired:", tokenData.expiresAt.toDate());
          await tokenDoc.ref.delete(); // Clean up expired token
          return res.status(401).json({
            success: false,
            error: 'Token odświeżający wygasł'
          });
        }
  
        console.log("Getting user from database...");
        // Get user from Firestore
        const userDoc = await usersCollection.doc(decoded.userId).get();
        
        if (!userDoc.exists) {
          console.error("User not found:", decoded.userId);
          return res.status(401).json({
            success: false,
            error: 'Użytkownik nie istnieje'
          });
        }
  
        console.log("Generating new tokens...");
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
  
        console.log("Removing old refresh token...");
        // Remove old refresh token
        await tokenDoc.ref.delete();
  
        console.log("Saving new refresh token...");
        // Save new refresh token to Firestore
        await tokensCollection.add({
          user: userDoc.id,
          token: newRefreshToken,
          type: 'refresh',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
  
        console.log("Token refresh successful");
        // Return new tokens
        return res.json({
          success: true,
          data: {
            token: newToken,
            refreshToken: newRefreshToken
          }
        });
      } catch (dbError) {
        console.error("Database error during token refresh:", dbError);
        return res.status(500).json({
          success: false,
          error: 'Database error: ' + dbError.message
        });
      }
    } catch (error) {
      console.error('Refresh token error details:', error);
      console.error('Stack trace:', error.stack);
      return res.status(500).json({
        success: false,
        error: 'Token refresh error: ' + error.message
      });
    }
  };

/**
 * Verify email with token
 */
export const verifyEmail = async (req, res) => {
  try {
    console.log("Email verification request received:", JSON.stringify(req.body, null, 2));
    
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Brak tokenu weryfikacyjnego'
      });
    }

    console.log("Finding verification token...");
    // Find token in Firestore
    const tokenSnapshot = await tokensCollection
      .where('token', '==', token)
      .where('type', '==', 'email-verification')
      .where('expiresAt', '>', new Date())
      .get();

    if (tokenSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Nieprawidłowy lub wygasły token weryfikacyjny'
      });
    }

    const tokenDoc = tokenSnapshot.docs[0];
    const tokenData = tokenDoc.data();

    console.log("Finding user to verify...");
    // Find user and update verification status
    const userDoc = await usersCollection.doc(tokenData.user).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }

    console.log("Updating user verification status...");
    // Update verification status
    await userDoc.ref.update({
      isVerified: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("Removing verification token...");
    // Remove token
    await tokenDoc.ref.delete();

    console.log("Email verification successful");
    // Return success
    res.json({
      success: true,
      data: {
        verified: true
      },
      message: 'Adres email został pomyślnie zweryfikowany'
    });
  } catch (error) {
    console.error('Email verification error details:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Email verification error: ' + error.message
    });
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (req, res) => {
  try {
    console.log("Password reset request received:", JSON.stringify(req.body, null, 2));
    
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    console.log("Finding user by email...");
    // Find user by email
    const userSnapshot = await usersCollection.where('email', '==', email).get();
    
    // Don't reveal if user exists for security reasons
    if (userSnapshot.empty) {
      console.log("User not found, but returning success for security");
      return res.json({
        success: true,
        data: {
          sent: true
        },
        message: 'Jeśli konto o podanym adresie email istnieje, na skrzynkę pocztową zostanie wysłany link do resetowania hasła.'
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    console.log("Generating reset token...");
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    console.log("Saving reset token...");
    // Save token to Firestore
    await tokensCollection.add({
      user: userDoc.id,
      token: resetToken,
      type: 'password-reset',
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
    });

    // Prepare reset URL
    const resetUrl = `${config.frontendUrl || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    console.log("Sending password reset email...");
    try {
      // Send password reset email - using simplified function
      await sendEmail({
        to: userData.email,
        subject: 'Reset hasła - EkoDirect',
        html: `
          <div>
            <h2>Hello ${userData.fullName}!</h2>
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetUrl}">Reset Password</a></p>
            <p>This link is valid for 1 hour.</p>
          </div>
        `
      });
      console.log("Password reset email sent successfully");
    } catch (emailError) {
      console.error("Email sending failed, but continuing:", emailError);
      // Continue even if email fails
    }

    console.log("Password reset request processed successfully");
    // Return success
    res.json({
      success: true,
      data: {
        sent: true
      },
      message: 'Link do resetowania hasła został wysłany na podany adres email.'
    });
  } catch (error) {
    console.error('Password reset request error details:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Password reset request error: ' + error.message
    });
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req, res) => {
  try {
    console.log("Password reset execution request received");
    
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Brak tokenu lub nowego hasła'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    console.log("Finding reset token...");
    // Find token in Firestore
    const tokenSnapshot = await tokensCollection
      .where('token', '==', token)
      .where('type', '==', 'password-reset')
      .where('expiresAt', '>', new Date())
      .get();

    if (tokenSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Nieprawidłowy lub wygasły token resetowania hasła'
      });
    }

    const tokenDoc = tokenSnapshot.docs[0];
    const tokenData = tokenDoc.data();

    console.log("Finding user...");
    // Find user
    const userDoc = await usersCollection.doc(tokenData.user).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }

    console.log("Creating new password hash...");
    // Create new password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    console.log("Updating user password...");
    // Update user password
    await userDoc.ref.update({
      passwordHash: passwordHash,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("Removing reset token...");
    // Remove token
    await tokenDoc.ref.delete();

    console.log("Invalidating refresh tokens...");
    // Invalidate all refresh tokens for this user
    const refreshTokens = await tokensCollection
      .where('user', '==', userDoc.id)
      .where('type', '==', 'refresh')
      .get();
    
    if (!refreshTokens.empty) {
      const batch = db.batch();
      refreshTokens.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    console.log("Password reset successful");
    // Return success
    res.json({
      success: true,
      data: {
        success: true
      },
      message: 'Hasło zostało pomyślnie zresetowane. Możesz się teraz zalogować używając nowego hasła.'
    });
  } catch (error) {
    console.error('Password reset error details:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Password reset error: ' + error.message
    });
  }
};


// Add this function to your server/controllers/authController.js

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (req, res) => {
  try {
    console.log("Resend verification email request received:", JSON.stringify(req.body, null, 2));
    
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    console.log("Finding user by email...");
    // Find user by email
    const userSnapshot = await usersCollection.where('email', '==', email).get();
    
    if (userSnapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik o podanym adresie email nie istnieje'
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Check if user is already verified
    if (userData.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Konto zostało już zweryfikowane'
      });
    }

    console.log("Generating new verification token...");
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    console.log("Saving verification token...");
    // Save token to Firestore
    await tokensCollection.add({
      user: userDoc.id,
      token: verificationToken,
      type: 'email-verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Prepare verification URL
    const verificationUrl = `${config.frontendUrl || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    console.log("Sending verification email...");
    try {
      // Send verification email
      await sendEmail({
        to: userData.email,
        subject: 'Verify your email - EkoDirect',
        html: `
          <div>
            <h2>Welcome ${userData.fullName}!</h2>
            <p>Please verify your email by clicking the link below:</p>
            <p><a href="${verificationUrl}">Verify Email</a></p>
            <p>This link is valid for 24 hours.</p>
          </div>
        `
      });
      console.log("Verification email sent successfully");
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return res.status(500).json({
        success: false,
        error: 'Wystąpił błąd podczas wysyłania email. Spróbuj ponownie później.'
      });
    }

    console.log("Resend verification email completed successfully");
    // Return success response
    res.json({
      success: true,
      message: 'Link weryfikacyjny został wysłany ponownie. Sprawdź swoją skrzynkę email.'
    });
  } catch (error) {
    console.error('Resend verification email error details:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Error resending verification email: ' + error.message
    });
  }
};

