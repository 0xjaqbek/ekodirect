// backend/routes/auth.ts - Authentication routes
import express, { type RequestHandler } from 'express';
import {
  register,
  login,
  refreshToken,
  verifyEmail,
  requestPasswordReset,
  resetPassword
} from '../controllers/authController';

const router = express.Router();

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
router.post('/register', register as RequestHandler);

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
router.post('/login', login as RequestHandler);

/**
 * Refresh JWT token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
router.post('/refresh-token', refreshToken as RequestHandler);

/**
 * Verify email with token
 * @route POST /api/auth/verify-email
 * @access Public
 */
router.post('/verify-email', verifyEmail as RequestHandler);

/**
 * Request password reset
 * @route POST /api/auth/request-password-reset
 * @access Public
 */
router.post('/request-password-reset', requestPasswordReset as RequestHandler);

/**
 * Reset password with token
 * @route POST /api/auth/reset-password
 * @access Public
 */
router.post('/reset-password', resetPassword as RequestHandler);

export default router;