// backend/controllers/userController.ts
import { Request, Response } from 'express';
import { admin } from '../firebase';
import { uploadImageToStorage } from '../services/fileStorageService';

// Initialize Firestore
const db = admin.firestore();
const usersCollection = db.collection('users');

// Define proper types
interface UserData {
  passwordHash: string;
  email: string;
  fullName: string;
  role: 'farmer' | 'consumer' | 'admin';
  phoneNumber: string;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  bio?: string;
  profileImage?: string;
  certificates?: string[];
  createdProducts?: string[];
  orders?: string[];
  reviews?: string[];
  localGroups?: string[];
  isVerified: boolean;
  lastLoginAt?: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const userId = req.user.id;

    // Get user from database
    const userDoc = await usersCollection.doc(userId).get();

    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const userData = userDoc.data() as UserData;

    // Remove sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUserData } = userData;

    res.json({
      success: true,
      data: {
        _id: userDoc.id,
        ...safeUserData
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching user profile'
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get user from database
    const userDoc = await usersCollection.doc(id).get();

    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const userData = userDoc.data() as UserData;

    // Remove sensitive data for public profile
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUserData } = userData;

    res.json({
      success: true,
      data: {
        _id: userDoc.id,
        ...safeUserData
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching user profile'
    });
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const userId = req.user.id;
    const { fullName, phoneNumber, bio, location } = req.body;

    // Validate required fields
    if (!fullName || !phoneNumber) {
      res.status(400).json({
        success: false,
        error: 'Full name and phone number are required'
      });
      return;
    }

    // Prepare update data
    const updateData: Partial<UserData> = {
      fullName,
      phoneNumber,
      bio,
      location,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp
    };

    // Update user in database
    await usersCollection.doc(userId).update(updateData);

    // Get updated user data
    const updatedUserDoc = await usersCollection.doc(userId).get();
    const updatedUserData = updatedUserDoc.data() as UserData;

    // Remove sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUserData } = updatedUserData;

    res.json({
      success: true,
      data: {
        _id: updatedUserDoc.id,
        ...safeUserData
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while updating profile'
    });
  }
};

/**
 * Upload user avatar
 */
export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
      return;
    }

    // Upload image to storage
    const imageUrl = await uploadImageToStorage(req.file, 'avatars');

    // Update user profile with new image URL
    await usersCollection.doc(userId).update({
      profileImage: imageUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get updated user data
    const updatedUserDoc = await usersCollection.doc(userId).get();
    const updatedUserData = updatedUserDoc.data() as UserData;

    // Remove sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUserData } = updatedUserData;

    res.json({
      success: true,
      data: {
        _id: updatedUserDoc.id,
        ...safeUserData
      }
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while uploading profile image'
    });
  }
};