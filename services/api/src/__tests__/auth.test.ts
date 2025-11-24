/**
 * Comprehensive Authentication Test Suite
 * Tests user registration, login, JWT tokens, 2FA, password reset, and session management
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import { AuthService } from '../auth/auth.service';
import { PasswordService } from '../auth/password.service';

// Disable rate limiting for tests
jest.setTimeout(10000);

describe('Authentication System', () => {
  beforeEach(() => {
    // Clear all data before each test
    AuthService.clearAllData();
  });

  afterEach(() => {
    // Clean up after each test
    AuthService.clearAllData();
  });

  describe('Password Service', () => {
    it('should validate strong password', () => {
      const result = PasswordService.validatePassword('StrongP@ss123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password without uppercase', () => {
      const result = PasswordService.validatePassword('weakpass123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = PasswordService.validatePassword('WEAKPASS123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = PasswordService.validatePassword('WeakPass!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = PasswordService.validatePassword('WeakPass123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject short password', () => {
      const result = PasswordService.validatePassword('Weak1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should hash and compare passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordService.hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
      
      const isMatch = await PasswordService.comparePassword(password, hash);
      expect(isMatch).toBe(true);
      
      const isNotMatch = await PasswordService.comparePassword('WrongPassword', hash);
      expect(isNotMatch).toBe(false);
    });

    it('should generate unique reset tokens', () => {
      const token1 = PasswordService.generateResetToken();
      const token2 = PasswordService.generateResetToken();
      
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes in hex
    });

    it('should calculate correct expiration time', () => {
      const expiration = PasswordService.getResetTokenExpiration();
      const now = new Date();
      const diff = expiration.getTime() - now.getTime();
      
      // Should be approximately 1 hour (3600000 ms)
      expect(diff).toBeGreaterThan(3500000);
      expect(diff).toBeLessThan(3700000);
    });
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
          phone: '1234567890',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('activationToken');
      expect(response.body.message).toContain('registered successfully');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid email');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'AnotherP@ss456',
          firstName: 'Jane',
          lastName: 'Smith',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          // Missing password, firstName, lastName
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('Account Activation', () => {
    it('should activate account with valid token', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      const { activationToken } = registerResponse.body;

      // Activate account
      const activateResponse = await request(app)
        .post('/api/auth/activate')
        .send({ token: activationToken });

      expect(activateResponse.status).toBe(200);
      expect(activateResponse.body.message).toContain('activated successfully');
    });

    it('should reject activation with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/activate')
        .send({ token: 'invalid-token' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid activation token');
    });
  });

  describe('User Login', () => {
    it('should login successfully with valid credentials', async () => {
      // Register and activate user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body).toHaveProperty('refreshToken');
      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body.user.email).toBe('test@example.com');
      expect(loginResponse.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject login with invalid credentials', async () => {
      // Register and activate user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      // Login with wrong password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        });

      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body.error).toContain('Invalid credentials');
    });

    it('should reject login for non-activated account', async () => {
      // Register user but don't activate
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      // Try to login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body.error).toContain('not activated');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('JWT Token Management', () => {
    it('should generate valid access and refresh tokens', async () => {
      // Register, activate, and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      const { accessToken, refreshToken } = loginResponse.body;

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
    });

    it('should refresh access token with valid refresh token', async () => {
      // Register, activate, and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      const { refreshToken } = loginResponse.body;

      // Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Logout', () => {
    it('should logout successfully and invalidate refresh token', async () => {
      // Register, activate, and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      const { refreshToken } = loginResponse.body;

      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.message).toContain('successful');

      // Try to use the refresh token after logout
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
    });
  });

  describe('Password Reset', () => {
    it('should request password reset', async () => {
      // Register and activate user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      // Request password reset
      const resetResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(resetResponse.status).toBe(200);
      expect(resetResponse.body).toHaveProperty('resetToken');
    });

    it('should reset password with valid token', async () => {
      // Register and activate user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      // Request password reset
      const resetRequestResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      const { resetToken } = resetRequestResponse.body;

      // Reset password
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewStrongP@ss456',
        });

      expect(resetResponse.status).toBe(200);
      expect(resetResponse.body.message).toContain('successful');

      // Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewStrongP@ss456',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should reject password reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewStrongP@ss456',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid reset token');
    });

    it('should reject password reset with weak new password', async () => {
      // Register and activate user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      // Request password reset
      const resetRequestResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      const { resetToken } = resetRequestResponse.body;

      // Try to reset with weak password
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'weak',
        });

      expect(resetResponse.status).toBe(400);
      expect(resetResponse.body.error).toBeDefined();
    });
  });

  describe('Two-Factor Authentication (2FA)', () => {
    it('should setup 2FA for authenticated user', async () => {
      // Register, activate, and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      const { accessToken } = loginResponse.body;

      // Setup 2FA
      const setupResponse = await request(app)
        .post('/api/auth/setup-2fa')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(setupResponse.status).toBe(200);
      expect(setupResponse.body).toHaveProperty('secret');
      expect(setupResponse.body).toHaveProperty('qrCodeUrl');
      expect(setupResponse.body).toHaveProperty('backupCodes');
      expect(setupResponse.body.backupCodes).toHaveLength(10);
    });

    it('should reject 2FA setup without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/setup-2fa')
        .send();

      expect(response.status).toBe(401);
    });

    it('should enable 2FA after verification', async () => {
      // Register, activate, and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      const { accessToken } = loginResponse.body;

      // Setup 2FA
      const setupResponse = await request(app)
        .post('/api/auth/setup-2fa')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      const { secret } = setupResponse.body;

      // Generate valid TOTP code
      const speakeasy = require('speakeasy');
      const code = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      // Enable 2FA with code
      const enableResponse = await request(app)
        .post('/api/auth/enable-2fa')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code });

      expect(enableResponse.status).toBe(200);
      expect(enableResponse.body.message).toContain('enabled successfully');
    });

    it('should require 2FA code during login when enabled', async () => {
      // Register, activate, and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      const { accessToken } = loginResponse.body;

      // Setup and enable 2FA
      const setupResponse = await request(app)
        .post('/api/auth/setup-2fa')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      const { secret } = setupResponse.body;

      const speakeasy = require('speakeasy');
      const code = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      await request(app)
        .post('/api/auth/enable-2fa')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code });

      // Try to login again (should require 2FA)
      const secondLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      expect(secondLoginResponse.status).toBe(200);
      expect(secondLoginResponse.body.requiresTwoFactor).toBe(true);
      expect(secondLoginResponse.body.accessToken).toBeUndefined();
    });

    it('should complete login with valid 2FA code', async () => {
      // Register, activate, login, setup and enable 2FA
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      const { accessToken } = loginResponse.body;

      const setupResponse = await request(app)
        .post('/api/auth/setup-2fa')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      const { secret } = setupResponse.body;

      const speakeasy = require('speakeasy');
      let code = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      await request(app)
        .post('/api/auth/enable-2fa')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code });

      // Try to login (will require 2FA)
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      // Generate new code for verification
      code = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      // Verify 2FA
      const verifyResponse = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          email: 'test@example.com',
          code,
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toHaveProperty('accessToken');
      expect(verifyResponse.body).toHaveProperty('refreshToken');
    });

    it('should allow login with backup code', async () => {
      // Register, activate, login, setup and enable 2FA
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      const { accessToken } = loginResponse.body;

      const setupResponse = await request(app)
        .post('/api/auth/setup-2fa')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      const { secret, backupCodes } = setupResponse.body;

      const speakeasy = require('speakeasy');
      const code = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      await request(app)
        .post('/api/auth/enable-2fa')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code });

      // Try to login
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      // Use backup code
      const verifyResponse = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          email: 'test@example.com',
          code: backupCodes[0],
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toHaveProperty('accessToken');
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      // Register, activate, and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      const { accessToken } = loginResponse.body;

      // Access protected route
      const protectedResponse = await request(app)
        .post('/api/auth/setup-2fa')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(protectedResponse.status).toBe(200);
    });

    it('should reject protected route without token', async () => {
      const response = await request(app)
        .post('/api/auth/setup-2fa')
        .send();

      expect(response.status).toBe(401);
    });

    it('should reject protected route with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/setup-2fa')
        .set('Authorization', 'Bearer invalid-token')
        .send();

      expect(response.status).toBe(403);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle email case insensitivity', async () => {
      // Register with lowercase
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'Test@Example.COM',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      // Login with different case
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should not reveal user existence on password reset', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      // Should still return 200 and a token (even though user doesn't exist)
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('resetToken');
    });

    it('should invalidate all refresh tokens on password reset', async () => {
      // Register, activate, and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        });

      await request(app)
        .post('/api/auth/activate')
        .send({ token: registerResponse.body.activationToken });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });

      const { refreshToken } = loginResponse.body;

      // Request and complete password reset
      const resetRequestResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetRequestResponse.body.resetToken,
          newPassword: 'NewStrongP@ss456',
        });

      // Try to use old refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
    });
  });
});
