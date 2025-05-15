// server/routes/auth.js
import express from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  verifyEmail, 
  requestPasswordReset, 
  resetPassword,
  resendVerificationEmail 
} from '../controllers/authController.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/resend-verification', resendVerificationEmail);

export default router;