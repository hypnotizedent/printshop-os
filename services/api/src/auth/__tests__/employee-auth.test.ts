/**
 * Employee Authentication Tests
 * Phase 1: Employee PIN validation
 */

import { validateEmployeePIN, verifyToken } from '../employee-auth';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Employee Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateEmployeePIN', () => {
    it('should validate correct employee PIN', async () => {
      // Mock finding employee
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: '1',
              documentId: 'emp123',
              name: 'John Doe',
              pin: '1234',
            },
          ],
        },
      });

      const result = await validateEmployeePIN({
        pin: '1234',
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.employee?.name).toBe('John Doe');
      expect(result.employee?.pin).toBe('1234');
    });

    it('should validate PIN with employee ID filter', async () => {
      // Mock finding specific employee
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: '1',
              documentId: 'emp123',
              name: 'John Doe',
              pin: '1234',
            },
          ],
        },
      });

      const result = await validateEmployeePIN({
        pin: '1234',
        employeeId: 'emp123',
      });

      expect(result.success).toBe(true);
      expect(result.employee?.documentId).toBe('emp123');
    });

    it('should reject invalid PIN format', async () => {
      const result = await validateEmployeePIN({
        pin: '123', // Too short
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid PIN format');
    });

    it('should reject PIN with non-numeric characters', async () => {
      const result = await validateEmployeePIN({
        pin: 'abcd',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid PIN format');
    });

    it('should reject incorrect PIN', async () => {
      // Mock employee not found
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      });

      const result = await validateEmployeePIN({
        pin: '9999',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid PIN');
    });

    it('should accept 4-digit PIN', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: '1',
              documentId: 'emp123',
              name: 'John Doe',
              pin: '1234',
            },
          ],
        },
      });

      const result = await validateEmployeePIN({
        pin: '1234',
      });

      expect(result.success).toBe(true);
    });

    it('should accept 6-digit PIN', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: '1',
              documentId: 'emp123',
              name: 'Jane Smith',
              pin: '123456',
            },
          ],
        },
      });

      const result = await validateEmployeePIN({
        pin: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.employee?.name).toBe('Jane Smith');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid employee JWT token', async () => {
      // Mock finding employee
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: '1',
              documentId: 'emp123',
              name: 'John Doe',
              pin: '1234',
            },
          ],
        },
      });

      const validateResult = await validateEmployeePIN({
        pin: '1234',
      });

      const decoded = verifyToken(validateResult.token!);

      expect(decoded).toBeDefined();
      expect(decoded?.type).toBe('employee');
      expect(decoded?.documentId).toBe('emp123');
    });

    it('should reject invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });
});
