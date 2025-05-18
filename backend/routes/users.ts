// backend/routes/users.ts - Fixed version with correct imports
import express, { type RequestHandler } from 'express';
import multer from 'multer';
import { authenticateUser } from '../middleware/auth';
import { userExists } from '../middleware/user';
import {
  getCurrentUser,
  getUserById,
  updateUserProfile,
  uploadProfileImage
} from '../controllers/userController';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * Get current user profile
 * @route GET /api/users/me
 * @access Private
 */
router.get('/me', authenticateUser, getCurrentUser as RequestHandler);

/**
 * Update current user profile
 * @route PUT /api/users/me
 * @access Private
 */
router.put('/me', authenticateUser, updateUserProfile as RequestHandler);

/**
 * Upload profile image
 * @route POST /api/users/me/avatar
 * @access Private
 */
router.post('/me/avatar', authenticateUser, upload.single('avatar'), uploadProfileImage as RequestHandler);

/**
 * Get user profile by ID
 * @route GET /api/users/:id
 * @access Public
 */
router.get('/:id', userExists, getUserById as RequestHandler);

export default router;