/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from './jwt.middleware';

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          error: 'Missing required fields: email, password, firstName, lastName',
        });
        return;
      }

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        phone,
      });

      res.status(201).json({
        message: 'User registered successfully. Please check your email to activate your account.',
        userId: result.userId,
        activationToken: result.activationToken, // In production, this would be sent via email
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({ error: errorMessage });
    }
  }

  /**
   * POST /api/auth/activate
   * Activate user account
   */
  static async activate(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: 'Activation token required' });
        return;
      }

      await AuthService.activateAccount(token);

      res.status(200).json({
        message: 'Account activated successfully. You can now log in.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Activation failed';
      res.status(400).json({ error: errorMessage });
    }
  }

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password required' });
        return;
      }

      const result = await AuthService.login(email, password);

      if (result.requiresTwoFactor) {
        res.status(200).json({
          requiresTwoFactor: true,
          message: 'Please enter your 2FA code',
        });
        return;
      }

      res.status(200).json({
        message: 'Login successful',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ error: errorMessage });
    }
  }

  /**
   * POST /api/auth/verify-2fa
   * Verify 2FA code and complete login
   */
  static async verifyTwoFactor(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({ error: 'Email and 2FA code required' });
        return;
      }

      const result = await AuthService.verifyTwoFactor(email, code);

      res.status(200).json({
        message: 'Login successful',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2FA verification failed';
      res.status(401).json({ error: errorMessage });
    }
  }

  /**
   * POST /api/auth/setup-2fa
   * Setup 2FA for authenticated user
   */
  static async setupTwoFactor(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const result = await AuthService.setupTwoFactor(req.user.userId);

      res.status(200).json({
        message: '2FA setup initiated. Please scan the QR code with your authenticator app.',
        secret: result.secret,
        qrCodeUrl: result.qrCodeUrl,
        backupCodes: result.backupCodes,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2FA setup failed';
      res.status(400).json({ error: errorMessage });
    }
  }

  /**
   * POST /api/auth/enable-2fa
   * Enable 2FA after verification
   */
  static async enableTwoFactor(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { code } = req.body;

      if (!code) {
        res.status(400).json({ error: '2FA code required' });
        return;
      }

      await AuthService.enableTwoFactor(req.user.userId, code);

      res.status(200).json({
        message: '2FA enabled successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2FA enable failed';
      res.status(400).json({ error: errorMessage });
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token required' });
        return;
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({ error: errorMessage });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout and invalidate refresh token
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token required' });
        return;
      }

      await AuthService.logout(refreshToken);

      res.status(200).json({
        message: 'Logout successful',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      res.status(400).json({ error: errorMessage });
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email required' });
        return;
      }

      const resetToken = await AuthService.requestPasswordReset(email);

      res.status(200).json({
        message: 'If an account exists with this email, a password reset link has been sent.',
        resetToken, // In production, this would be sent via email only
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset request failed';
      res.status(400).json({ error: errorMessage });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password with token
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token and new password required' });
        return;
      }

      await AuthService.resetPassword(token, newPassword);

      res.status(200).json({
        message: 'Password reset successful. You can now log in with your new password.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      res.status(400).json({ error: errorMessage });
    }
  }
}
