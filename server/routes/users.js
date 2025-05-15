import express from 'express';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get current user profile
 * @route GET /api/users/me
 * @access Private
 */
router.get('/me', authenticateUser, async (req, res) => {
  try {
    // Since the authenticateUser middleware attaches the user to req.user,
    // we can simply return that
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Wystąpił błąd podczas pobierania profilu użytkownika'
    });
  }
});

export default router;