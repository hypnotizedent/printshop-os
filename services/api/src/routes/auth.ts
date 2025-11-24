/**
 * Authentication Routes
 * Defines all authentication endpoints with rate limiting
 */

import { Router } from 'express';
import * as rateLimit from 'express-rate-limit';
import { AuthController } from '../auth/auth.controller';
import { authenticateToken } from '../auth/jwt.middleware';

const router = Router();

// Rate limiting for login attempts: 5 attempts per 15 minutes (or 100 in test mode)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // Higher limit for tests
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip in test mode
});

// Rate limiting for registration: 3 attempts per hour (or 100 in test mode)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'test' ? 1000 : 3,
  message: 'Too many registration attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip in test mode
});

// Rate limiting for password reset: 3 attempts per hour (or 100 in test mode)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'test' ? 1000 : 3,
  message: 'Too many password reset attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip in test mode
});

// Public routes
router.post('/register', registerLimiter, AuthController.register);
router.post('/activate', AuthController.activate);
router.post('/login', loginLimiter, AuthController.login);
router.post('/verify-2fa', loginLimiter, AuthController.verifyTwoFactor);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes (require authentication)
router.post('/setup-2fa', authenticateToken, AuthController.setupTwoFactor);
router.post('/enable-2fa', authenticateToken, AuthController.enableTwoFactor);

export default router;
