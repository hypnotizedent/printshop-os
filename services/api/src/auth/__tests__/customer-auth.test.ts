/**
 * Customer Authentication Tests
 * Phase 1: Customer signup, login, JWT generation
 */

import { signupCustomer, loginCustomer, verifyToken } from '../customer-auth';
import axios from 'axios';
import bcrypt from 'bcrypt';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Customer Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signupCustomer', () => {
    it('should create a new customer account successfully', async () => {
      // Mock check for existing customer (none found)
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      });

      // Mock customer creation
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            id: '1',
            documentId: 'abc123',
            email: 'test@example.com',
            name: 'Test User',
            company: 'Test Company',
          },
        },
      });

      const result = await signupCustomer({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        company: 'Test Company',
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.customer?.email).toBe('test@example.com');
      expect(result.customer?.name).toBe('Test User');
    });

    it('should reject invalid email format', async () => {
      const result = await signupCustomer({
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject duplicate email', async () => {
      // Mock existing customer found
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: '1',
              email: 'existing@example.com',
            },
          ],
        },
      });

      const result = await signupCustomer({
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer with this email already exists');
    });
  });

  describe('loginCustomer', () => {
    it('should login customer with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('SecurePass123!', 10);

      // Mock finding customer
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: '1',
              documentId: 'abc123',
              email: 'test@example.com',
              name: 'Test User',
              company: 'Test Company',
              passwordHash: hashedPassword,
            },
          ],
        },
      });

      const result = await loginCustomer({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.customer?.email).toBe('test@example.com');
    });

    it('should reject login with invalid email', async () => {
      // Mock customer not found
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      });

      const result = await loginCustomer({
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);

      // Mock finding customer
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: '1',
              documentId: 'abc123',
              email: 'test@example.com',
              passwordHash: hashedPassword,
            },
          ],
        },
      });

      const result = await loginCustomer({
        email: 'test@example.com',
        password: 'WrongPassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should reject login for account without password', async () => {
      // Mock finding customer without passwordHash
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: '1',
              documentId: 'abc123',
              email: 'test@example.com',
              name: 'Test User',
              passwordHash: null,
            },
          ],
        },
      });

      const result = await loginCustomer({
        email: 'test@example.com',
        password: 'AnyPassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured for portal access');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', async () => {
      // First create a customer to get a valid token
      mockedAxios.get.mockResolvedValueOnce({ data: { data: [] } });
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            id: '1',
            documentId: 'abc123',
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      });

      const signupResult = await signupCustomer({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      });

      const decoded = verifyToken(signupResult.token!);

      expect(decoded).toBeDefined();
      expect(decoded?.type).toBe('customer');
      expect(decoded?.documentId).toBe('abc123');
    });

    it('should reject invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });
});
