/**
 * Authentication Service
 * Core authentication logic for user registration, login, and token management
 */

import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { PasswordService } from './password.service';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'passwordHash'>;
  requiresTwoFactor?: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

// In-memory storage for demo (replace with Strapi in production)
const users: Map<string, User> = new Map();
const refreshTokens: Map<string, RefreshToken> = new Map();
const resetTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();
const activationTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();
const backupCodes: Map<string, Set<string>> = new Map();

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ userId: string; activationToken: string }> {
    // Validate email format
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      (u) => u.email === data.email
    );
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Validate password strength
    const passwordValidation = PasswordService.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash password
    const passwordHash = await PasswordService.hashPassword(data.password);

    // Create user
    const userId = this.generateId();
    const user: User = {
      id: userId,
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      isActive: false, // Requires activation
      emailVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.set(userId, user);

    // Generate activation token
    const activationToken = PasswordService.generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    activationTokens.set(activationToken, { userId, expiresAt });

    return { userId, activationToken };
  }

  /**
   * Activate user account
   */
  static async activateAccount(token: string): Promise<void> {
    const activation = activationTokens.get(token);
    if (!activation) {
      throw new Error('Invalid activation token');
    }

    if (new Date() > activation.expiresAt) {
      activationTokens.delete(token);
      throw new Error('Activation token expired');
    }

    const user = users.get(activation.userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = true;
    user.emailVerified = true;
    user.updatedAt = new Date();
    users.set(user.id, user);

    activationTokens.delete(token);
  }

  /**
   * Login with email and password
   */
  static async login(
    email: string,
    password: string
  ): Promise<AuthResult> {
    // Find user
    const user = Array.from(users.values()).find(
      (u) => u.email === email.toLowerCase()
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account not activated');
    }

    // Verify password
    const isPasswordValid = await PasswordService.comparePassword(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // If 2FA is enabled, don't return tokens yet
    if (user.twoFactorEnabled) {
      return {
        accessToken: '',
        refreshToken: '',
        user: this.sanitizeUser(user),
        requiresTwoFactor: true,
      };
    }

    // Generate tokens
    return this.generateAuthResult(user);
  }

  /**
   * Verify 2FA code and complete login
   */
  static async verifyTwoFactor(
    email: string,
    code: string
  ): Promise<AuthResult> {
    const user = Array.from(users.values()).find(
      (u) => u.email === email.toLowerCase()
    );

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('2FA not enabled for this user');
    }

    // Check backup codes first
    const userBackupCodes = backupCodes.get(user.id);
    if (userBackupCodes && userBackupCodes.has(code)) {
      userBackupCodes.delete(code);
      backupCodes.set(user.id, userBackupCodes);
      return this.generateAuthResult(user);
    }

    // Verify TOTP
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps in either direction
    });

    if (!verified) {
      throw new Error('Invalid 2FA code');
    }

    return this.generateAuthResult(user);
  }

  /**
   * Setup 2FA for a user
   */
  static async setupTwoFactor(userId: string): Promise<TwoFactorSetup> {
    const user = users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `PrintShop OS (${user.email})`,
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const codes = this.generateBackupCodes(10);

    // Store secret temporarily (will be confirmed when user verifies)
    user.twoFactorSecret = secret.base32;
    users.set(userId, user);

    // Store backup codes
    backupCodes.set(userId, new Set(codes));

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes: codes,
    };
  }

  /**
   * Enable 2FA after verification
   */
  static async enableTwoFactor(userId: string, code: string): Promise<void> {
    const user = users.get(userId);
    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA setup not initiated');
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      throw new Error('Invalid 2FA code');
    }

    user.twoFactorEnabled = true;
    user.updatedAt = new Date();
    users.set(userId, user);
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<AuthResult> {
    // Verify refresh token
    let payload: JWTPayload;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if refresh token exists in storage
    const storedToken = Array.from(refreshTokens.values()).find(
      (t) => t.token === refreshToken && t.userId === payload.userId
    );

    if (!storedToken) {
      throw new Error('Refresh token not found');
    }

    if (new Date() > storedToken.expiresAt) {
      refreshTokens.delete(storedToken.id);
      throw new Error('Refresh token expired');
    }

    // Get user
    const user = users.get(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new auth result
    return this.generateAuthResult(user);
  }

  /**
   * Logout (invalidate refresh token)
   */
  static async logout(refreshToken: string): Promise<void> {
    const storedToken = Array.from(refreshTokens.values()).find(
      (t) => t.token === refreshToken
    );

    if (storedToken) {
      refreshTokens.delete(storedToken.id);
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<string> {
    const user = Array.from(users.values()).find(
      (u) => u.email === email.toLowerCase()
    );

    // Don't reveal if user exists or not
    if (!user) {
      return PasswordService.generateResetToken();
    }

    const resetToken = PasswordService.generateResetToken();
    const expiresAt = PasswordService.getResetTokenExpiration();

    resetTokens.set(resetToken, { userId: user.id, expiresAt });

    return resetToken;
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const reset = resetTokens.get(token);
    if (!reset) {
      throw new Error('Invalid reset token');
    }

    if (PasswordService.isResetTokenExpired(reset.expiresAt)) {
      resetTokens.delete(token);
      throw new Error('Reset token expired');
    }

    // Validate new password
    const passwordValidation = PasswordService.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    const user = users.get(reset.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update password
    user.passwordHash = await PasswordService.hashPassword(newPassword);
    user.updatedAt = new Date();
    users.set(user.id, user);

    // Invalidate reset token
    resetTokens.delete(token);

    // Invalidate all refresh tokens for security
    const userRefreshTokens = Array.from(refreshTokens.entries()).filter(
      ([_, t]) => t.userId === user.id
    );
    userRefreshTokens.forEach(([id]) => refreshTokens.delete(id));
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Helper methods

  private static generateAuthResult(user: User): AuthResult {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    const tokenId = this.generateId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    refreshTokens.set(tokenId, {
      id: tokenId,
      userId: user.id,
      token: refreshToken,
      expiresAt,
      createdAt: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  private static generateAccessToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      type: 'access',
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  private static generateRefreshToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      type: 'refresh',
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  }

  private static sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static generateId(): string {
    return crypto.randomUUID();
  }

  private static generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Testing helpers
  static clearAllData(): void {
    users.clear();
    refreshTokens.clear();
    resetTokens.clear();
    activationTokens.clear();
    backupCodes.clear();
  }

  static getUserByEmail(email: string): User | undefined {
    return Array.from(users.values()).find((u) => u.email === email.toLowerCase());
  }

  static getAllUsers(): User[] {
    return Array.from(users.values());
  }
}
