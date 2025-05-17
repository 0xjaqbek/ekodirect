// backend/controllers/userController.ts
import { Request, Response } from 'express';
import { admin } from '../firebase';
import path from 'path';
import fs from 'fs';

// Initialize Firestore
const db = admin.firestore();
const usersCollection = db.collection('users');

// Initialize Firebase Storage
const bucket = admin.storage().bucket();

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // User is already attached by auth middleware
    const userId = req.user.id;
    
    // Get user from database
    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }
    
    // Prepare user data (without password)
    const userData = userDoc.data();
    const { passwordHash, ...userWithoutPassword } = userData;
    
    res.json({
      success: true,
      data: {
        id: userDoc.id,
        ...userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas pobierania profilu użytkownika'
    });
  }
};

/**
 * Get user profile by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get user from database
    const userDoc = await usersCollection.doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie istnieje'
      });
    }
    
    // Prepare user data (without password)
    const userData = userDoc.data();
    const { passwordHash, ...userWithoutPassword } = userData;
    
    res.json({
      success: true,
      data: {
        id: userDoc.id,
        ...userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas pobierania profilu użytkownika'
    });
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { fullName, phoneNumber, bio, location } = req.body;
    
    // Validate data
    if (!fullName || !phoneNumber || !location) {
      return res.status(400).json({
        success: false,
        error: 'Brakujące dane profilu'
      });
    }
    
    // Update user in database
    await usersCollection.doc(userId).update({
      fullName,
      phoneNumber,
      bio: bio || null,
      location,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get updated user data
    const updatedUserDoc = await usersCollection.doc(userId).get();
    const userData = updatedUserDoc.data();
    const { passwordHash, ...userWithoutPassword } = userData;
    
    res.json({
      success: true,
      data: {
        id: updatedUserDoc.id,
        ...userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas aktualizacji profilu użytkownika'
    });
  }
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nie przesłano pliku'
      });
    }
    
    const userId = req.user.id;
    const file = req.file;
    
    // Upload file to Firebase Storage
    const fileName = `profile_images/${userId}_${Date.now()}_${path.basename(file.originalname)}`;
    const fileUpload = bucket.file(fileName);
    
    // Create write stream
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });
    
    blobStream.on('error', (error) => {
      console.error('Error uploading to Firebase Storage:', error);
      return res.status(500).json({
        success: false,
        error: 'Wystąpił błąd podczas przesyłania pliku'
      });
    });
    
    blobStream.on('finish', async () => {
      // Make the file publicly accessible
      await fileUpload.makePublic();
      
      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      
      // Update user profile with new image URL
      await usersCollection.doc(userId).update({
        profileImage: publicUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Get updated user data
      const updatedUserDoc = await usersCollection.doc(userId).get();
      const userData = updatedUserDoc.data();
      const { passwordHash, ...userWithoutPassword } = userData;
      
      res.json({
        success: true,
        data: {
          id: updatedUserDoc.id,
          ...userWithoutPassword
        }
      });
    });
    
    // End the stream with the file buffer
    blobStream.end(file.buffer);
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas przesyłania zdjęcia profilowego'
    });
  }
};