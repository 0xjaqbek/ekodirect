// backend/routes/users.js
import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { userExists, isProfileOwner } from '../middleware/user.js';
import { 
  getCurrentUser, 
  getUserById, 
  updateUserProfile, 
  uploadProfileImage,
  upload
} from '../controllers/userController.js';

const router = express.Router();

/**
 * Pobierz profil zalogowanego użytkownika
 * @route GET /api/users/me
 * @access Private
 */
router.get('/me', authenticateUser, getCurrentUser);

/**
 * Aktualizuj profil zalogowanego użytkownika
 * @route PUT /api/users/me
 * @access Private
 */
router.put('/me', authenticateUser, updateUserProfile);

/**
 * Upload zdjęcia profilowego
 * @route POST /api/users/me/avatar
 * @access Private
 */
router.post('/me/avatar', authenticateUser, upload.single('avatar'), uploadProfileImage);

/**
 * Pobierz profil użytkownika po ID
 * @route GET /api/users/:id
 * @access Public
 */
router.get('/:id', userExists, getUserById);

export default router;