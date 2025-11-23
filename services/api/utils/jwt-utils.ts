/**
 * JWT Utilities for Quote Approval Tokens
 * Generates and validates JWT tokens for email approval links
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'printshop-secret-change-in-production';

export interface QuoteTokenPayload {
  quoteId: string;
  type: 'quote_approval';
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token for quote approval with specified expiration
 * @param quoteId - The ID of the quote
 * @param expirationDays - Number of days until token expires (default: 7)
 * @returns JWT token string
 */
export function generateQuoteApprovalToken(quoteId: string, expirationDays: number = 7): string {
  const payload: QuoteTokenPayload = {
    quoteId,
    type: 'quote_approval',
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${expirationDays}d`,
  });

  return token;
}

/**
 * Verify and decode quote approval token
 * @param token - JWT token to verify
 * @returns Decoded payload with quoteId and expiration, or null if invalid
 */
export function verifyQuoteApprovalToken(token: string): { quoteId: string; exp: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as QuoteTokenPayload;

    if (decoded.type !== 'quote_approval') {
      console.error('Invalid token type:', decoded.type);
      return null;
    }

    return {
      quoteId: decoded.quoteId,
      exp: decoded.exp || 0,
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.error('Invalid token:', error.message);
    } else {
      console.error('Token verification error:', error);
    }
    return null;
  }
}

/**
 * Check if a token is expired without throwing an error
 * @param token - JWT token to check
 * @returns true if expired, false if still valid
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as QuoteTokenPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    return true;
  }
}

/**
 * Decode token without verifying signature (useful for debugging)
 * @param token - JWT token to decode
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): QuoteTokenPayload | null {
  try {
    return jwt.decode(token) as QuoteTokenPayload;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}
