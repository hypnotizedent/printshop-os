/**
 * Password Service
 * Handles password hashing, validation, and reset token generation
 */

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const SALT_ROUNDS = 12;

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export class PasswordService {
  /**
   * Validate password strength
   * Requirements: 8+ chars, uppercase, lowercase, number, special char
   */
  static validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate password reset token
   * Returns a cryptographically secure random token
   */
  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate expiration timestamp for reset token (1 hour from now)
   */
  static getResetTokenExpiration(): Date {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);
    return expiration;
  }

  /**
   * Check if reset token is expired
   */
  static isResetTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
}
