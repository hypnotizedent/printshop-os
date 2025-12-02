/**
 * Validation Utilities
 * Shared validation functions for phone numbers, emails, and other data formats
 */

/**
 * E.164 phone number format regex
 * Matches international phone numbers like +15551234567
 */
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Validate phone number in E.164 format
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return true; // Empty is valid (optional field)
  const cleaned = phone.replace(/[\s-()]/g, '');
  return PHONE_REGEX.test(cleaned);
}

/**
 * Normalize phone number to E.164 format
 * @param phone - Phone number to normalize
 * @returns Normalized phone number
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  if (phone.startsWith('+')) {
    return phone.replace(/[^\d+]/g, '');
  }
  return phone;
}

/**
 * Email format regex
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 * @param email - Email to validate
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Empty is valid (optional field)
  return EMAIL_REGEX.test(email);
}

export default {
  PHONE_REGEX,
  validatePhoneNumber,
  normalizePhoneNumber,
  EMAIL_REGEX,
  validateEmail,
};
