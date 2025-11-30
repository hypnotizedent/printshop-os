/**
 * Auth Service Tests
 * Tests for JWT token generation/verification and password hashing utilities
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies at module scope
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Import the service after mocking
import * as authService from '../services/auth';

describe('Auth Service', () => {
  const JWT_SECRET = 'printshop-os-secret-key-change-in-production';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashed_password';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      
      const result = await authService.hashPassword(password);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for valid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      const result = await authService.verifyPassword('password', 'hash');
      
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hash');
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      const result = await authService.verifyPassword('wrong', 'hash');
      
      expect(result).toBe(false);
    });
  });

  describe('generateCustomerToken', () => {
    it('should generate JWT token for customer', () => {
      const customer = {
        id: 1,
        documentId: 'doc-123',
        email: 'test@example.com',
      };
      
      (jwt.sign as jest.Mock).mockReturnValue('mock_token');
      
      const result = authService.generateCustomerToken(customer);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: 1,
          documentId: 'doc-123',
          email: 'test@example.com',
          type: 'customer',
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(result).toBe('mock_token');
    });
  });

  describe('generateEmployeeToken', () => {
    it('should generate JWT token for employee', () => {
      const employee = {
        id: 1,
        documentId: 'emp-1',
        email: 'john@example.com',
        role: 'operator',
        department: 'screen-printing',
      };
      
      (jwt.sign as jest.Mock).mockReturnValue('mock_employee_token');
      
      const result = authService.generateEmployeeToken(employee);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: 1,
          documentId: 'emp-1',
          email: 'john@example.com',
          role: 'operator',
          department: 'screen-printing',
          type: 'employee',
        },
        JWT_SECRET,
        { expiresIn: '12h' }
      );
      expect(result).toBe('mock_employee_token');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const mockPayload = {
        id: 1,
        documentId: 'doc-123',
        email: 'test@example.com',
        type: 'customer',
      };
      
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      
      const result = authService.verifyToken('valid_token');
      
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', JWT_SECRET);
      expect(result).toEqual(mockPayload);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const result = authService.extractTokenFromHeader('Bearer mytoken123');
      
      expect(result).toBe('mytoken123');
    });

    it('should return null for missing header', () => {
      const result = authService.extractTokenFromHeader(undefined);
      
      expect(result).toBeNull();
    });

    it('should return null for invalid header format', () => {
      const result = authService.extractTokenFromHeader('InvalidFormat token');
      
      expect(result).toBeNull();
    });

    it('should return null for empty header', () => {
      const result = authService.extractTokenFromHeader('');
      
      expect(result).toBeNull();
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(authService.isValidEmail('test@example.com')).toBe(true);
      expect(authService.isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(authService.isValidEmail('invalid')).toBe(false);
      expect(authService.isValidEmail('test@')).toBe(false);
      expect(authService.isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return valid for password >= 8 characters', () => {
      const result = authService.isValidPassword('securepassword123');
      
      expect(result).toEqual({ valid: true });
    });

    it('should return invalid for short password', () => {
      const result = authService.isValidPassword('short');
      
      expect(result).toEqual({ 
        valid: false, 
        message: 'Password must be at least 8 characters' 
      });
    });
  });

  describe('isValidPIN', () => {
    it('should return valid for 4-6 digit PIN', () => {
      expect(authService.isValidPIN('1234')).toEqual({ valid: true });
      expect(authService.isValidPIN('12345')).toEqual({ valid: true });
      expect(authService.isValidPIN('123456')).toEqual({ valid: true });
    });

    it('should return invalid for missing PIN', () => {
      expect(authService.isValidPIN('')).toEqual({ 
        valid: false, 
        message: 'PIN is required' 
      });
    });

    it('should return invalid for short PIN', () => {
      expect(authService.isValidPIN('12')).toEqual({ 
        valid: false, 
        message: 'PIN must be 4-6 digits' 
      });
    });

    it('should return invalid for long PIN', () => {
      expect(authService.isValidPIN('1234567')).toEqual({ 
        valid: false, 
        message: 'PIN must be 4-6 digits' 
      });
    });

    it('should return invalid for non-digit PIN', () => {
      expect(authService.isValidPIN('abcd')).toEqual({ 
        valid: false, 
        message: 'PIN must contain only digits' 
      });
    });
  });

  describe('sanitizeCustomer', () => {
    it('should remove passwordHash from customer data', () => {
      const customer = {
        id: 1,
        documentId: 'doc-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'secret_hash',
        phone: '555-1234',
        company: 'Test Co',
      };
      
      const result = authService.sanitizeCustomer(customer);
      
      expect(result).toEqual({
        id: 1,
        documentId: 'doc-123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '555-1234',
        company: 'Test Co',
      });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('sanitizeEmployee', () => {
    it('should remove pin from employee data', () => {
      const employee = {
        id: 1,
        documentId: 'emp-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        pin: 'hashed_pin',
        role: 'operator',
        department: 'screen-printing',
      };
      
      const result = authService.sanitizeEmployee(employee);
      
      expect(result).toEqual({
        id: 1,
        documentId: 'emp-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'operator',
        department: 'screen-printing',
      });
      expect(result).not.toHaveProperty('pin');
    });
  });
});

