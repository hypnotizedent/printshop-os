/**
 * Tests for JWT Utilities
 */

import {
  generateQuoteApprovalToken,
  verifyQuoteApprovalToken,
  isTokenExpired,
  decodeToken,
} from '../utils/jwt-utils';
import jwt from 'jsonwebtoken';

describe('JWT Utilities', () => {
  const testQuoteId = 'quote-789';
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateQuoteApprovalToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateQuoteApprovalToken(testQuoteId);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include quote ID in payload', () => {
      const token = generateQuoteApprovalToken(testQuoteId);
      const decoded = jwt.decode(token) as any;

      expect(decoded.quoteId).toBe(testQuoteId);
      expect(decoded.type).toBe('quote_approval');
    });

    it('should set default 7-day expiration', () => {
      const token = generateQuoteApprovalToken(testQuoteId);
      const decoded = jwt.decode(token) as any;

      const now = Math.floor(Date.now() / 1000);
      const sevenDays = 7 * 24 * 60 * 60;
      
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(now + sevenDays + 60); // +60s buffer
    });

    it('should accept custom expiration days', () => {
      const customDays = 14;
      const token = generateQuoteApprovalToken(testQuoteId, customDays);
      const decoded = jwt.decode(token) as any;

      const now = Math.floor(Date.now() / 1000);
      const fourteenDays = 14 * 24 * 60 * 60;
      
      expect(decoded.exp).toBeGreaterThan(now + (13 * 24 * 60 * 60)); // At least 13 days
      expect(decoded.exp).toBeLessThanOrEqual(now + fourteenDays + 60);
    });

    it('should generate different tokens for different quote IDs', () => {
      const token1 = generateQuoteApprovalToken('quote-1');
      const token2 = generateQuoteApprovalToken('quote-2');

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyQuoteApprovalToken', () => {
    it('should verify valid token and return payload', () => {
      const token = generateQuoteApprovalToken(testQuoteId);
      const result = verifyQuoteApprovalToken(token);

      expect(result).not.toBeNull();
      expect(result?.quoteId).toBe(testQuoteId);
      expect(result?.exp).toBeGreaterThan(0);
    });

    it('should reject token with wrong secret', () => {
      const token = jwt.sign(
        { quoteId: testQuoteId, type: 'quote_approval' },
        'wrong-secret',
        { expiresIn: '7d' }
      );

      const result = verifyQuoteApprovalToken(token);
      expect(result).toBeNull();
    });

    it('should reject expired token', () => {
      const expiredToken = jwt.sign(
        { quoteId: testQuoteId, type: 'quote_approval' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1s' } // Already expired
      );

      const result = verifyQuoteApprovalToken(expiredToken);
      expect(result).toBeNull();
    });

    it('should reject token with wrong type', () => {
      const token = jwt.sign(
        { quoteId: testQuoteId, type: 'wrong_type' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      const result = verifyQuoteApprovalToken(token);
      expect(result).toBeNull();
    });

    it('should reject malformed token', () => {
      const result = verifyQuoteApprovalToken('not.a.valid.token');
      expect(result).toBeNull();
    });

    it('should reject empty token', () => {
      const result = verifyQuoteApprovalToken('');
      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = generateQuoteApprovalToken(testQuoteId);
      const expired = isTokenExpired(token);

      expect(expired).toBe(false);
    });

    it('should return true for expired token', () => {
      const expiredToken = jwt.sign(
        { quoteId: testQuoteId, type: 'quote_approval' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1s' }
      );

      const expired = isTokenExpired(expiredToken);
      expect(expired).toBe(true);
    });

    it('should return true for token without expiration', () => {
      const tokenWithoutExp = jwt.sign(
        { quoteId: testQuoteId, type: 'quote_approval' },
        process.env.JWT_SECRET!
      );

      // Remove exp from token by decoding and re-encoding without it
      const decoded = jwt.decode(tokenWithoutExp) as any;
      delete decoded.exp;
      delete decoded.iat;
      
      const modifiedToken = jwt.sign(decoded, process.env.JWT_SECRET!);
      const expired = isTokenExpired(modifiedToken);
      
      expect(expired).toBe(true);
    });

    it('should return true for malformed token', () => {
      const expired = isTokenExpired('invalid.token');
      expect(expired).toBe(true);
    });
  });

  describe('decodeToken', () => {
    it('should decode valid token without verification', () => {
      const token = generateQuoteApprovalToken(testQuoteId);
      const decoded = decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.quoteId).toBe(testQuoteId);
      expect(decoded?.type).toBe('quote_approval');
    });

    it('should decode expired token without verification', () => {
      const expiredToken = jwt.sign(
        { quoteId: testQuoteId, type: 'quote_approval' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1s' }
      );

      const decoded = decodeToken(expiredToken);
      expect(decoded).not.toBeNull();
      expect(decoded?.quoteId).toBe(testQuoteId);
    });

    it('should return null for malformed token', () => {
      const decoded = decodeToken('not.valid');
      expect(decoded).toBeNull();
    });
  });

  describe('token security', () => {
    it('should not be tamperable', () => {
      const token = generateQuoteApprovalToken('quote-original');
      
      // Try to tamper with the payload
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      payload.quoteId = 'quote-tampered';
      parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64');
      const tamperedToken = parts.join('.');

      // Verification should fail
      const result = verifyQuoteApprovalToken(tamperedToken);
      expect(result).toBeNull();
    });

    it('should use different signatures for different secrets', () => {
      const token1 = jwt.sign(
        { quoteId: testQuoteId, type: 'quote_approval' },
        'secret-1',
        { expiresIn: '7d' }
      );

      const token2 = jwt.sign(
        { quoteId: testQuoteId, type: 'quote_approval' },
        'secret-2',
        { expiresIn: '7d' }
      );

      // Same payload, different secrets = different tokens
      expect(token1).not.toBe(token2);
    });
  });

  describe('edge cases', () => {
    it('should handle quote IDs with special characters', () => {
      const specialQuoteId = 'quote-123-ABC_xyz.456';
      const token = generateQuoteApprovalToken(specialQuoteId);
      const result = verifyQuoteApprovalToken(token);

      expect(result?.quoteId).toBe(specialQuoteId);
    });

    it('should handle very long quote IDs', () => {
      const longQuoteId = 'quote-' + 'x'.repeat(1000);
      const token = generateQuoteApprovalToken(longQuoteId);
      const result = verifyQuoteApprovalToken(token);

      expect(result?.quoteId).toBe(longQuoteId);
    });

    it('should handle zero expiration days', () => {
      const token = generateQuoteApprovalToken(testQuoteId, 0);
      const decoded = jwt.decode(token) as any;

      // Should expire almost immediately
      const now = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeLessThanOrEqual(now + 60); // Within a minute
    });
  });
});
