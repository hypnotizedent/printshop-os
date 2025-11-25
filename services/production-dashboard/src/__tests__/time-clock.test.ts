/**
 * Time Clock Service Tests
 * Comprehensive test suite for time clock operations
 */

import { TimeClockService, ClockInRequest, ClockOutRequest } from '../time-clock/time-clock.service';
import axios from 'axios';
import bcrypt from 'bcrypt';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('TimeClockService', () => {
  let service: TimeClockService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup axios instance mock
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    service = new TimeClockService();
  });

  describe('verifyEmployeePin', () => {
    it('should verify valid PIN', async () => {
      // Arrange
      const employeeId = 1;
      const pin = '1234';
      const hashedPin = 'hashed_pin';

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: employeeId,
            attributes: {
              name: 'John Doe',
              pin: hashedPin,
            },
          },
        },
      });

      mockedBcrypt.compare.mockResolvedValueOnce(true as never);

      // Act
      const result = await service.verifyEmployeePin(employeeId, pin);

      // Assert
      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/employees/1');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(pin, hashedPin);
    });

    it('should reject invalid PIN', async () => {
      // Arrange
      const employeeId = 1;
      const pin = '1234';
      const hashedPin = 'hashed_pin';

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: employeeId,
            attributes: {
              name: 'John Doe',
              pin: hashedPin,
            },
          },
        },
      });

      mockedBcrypt.compare.mockResolvedValueOnce(false as never);

      // Act
      const result = await service.verifyEmployeePin(employeeId, pin);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject when no PIN is set', async () => {
      // Arrange
      const employeeId = 1;
      const pin = '1234';

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: employeeId,
            attributes: {
              name: 'John Doe',
              pin: null,
            },
          },
        },
      });

      // Act
      const result = await service.verifyEmployeePin(employeeId, pin);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('clockIn', () => {
    it('should successfully clock in employee', async () => {
      // Arrange
      const request: ClockInRequest = {
        employeeId: 1,
        employeePin: '1234',
        jobId: 100,
        taskType: 'Printing',
        machineId: 'press-1',
      };

      // Mock PIN verification
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              name: 'John Doe',
              pin: 'hashed_pin',
              hourlyRate: 25.0,
            },
          },
        },
      });
      mockedBcrypt.compare.mockResolvedValueOnce(true as never);

      // Mock check for active entries (none found)
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: [],
        },
      });

      // Mock employee hourly rate fetch
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            attributes: {
              hourlyRate: 25.0,
            },
          },
        },
      });

      // Mock create entry
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              employee: { data: { id: 1 } },
              job: { data: { id: 100 } },
              taskType: 'Printing',
              machineId: 'press-1',
              clockIn: new Date().toISOString(),
              totalTime: 0,
              breakTime: 0,
              productiveTime: 0,
              laborCost: 0,
              status: 'Active',
            },
          },
        },
      });

      // Act
      const result = await service.clockIn(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('Active');
      expect(result.taskType).toBe('Printing');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/time-clock-entries',
        expect.objectContaining({
          data: expect.objectContaining({
            employee: 1,
            job: 100,
            taskType: 'Printing',
            machineId: 'press-1',
            status: 'Active',
          }),
        })
      );
    });

    it('should reject clock in with invalid PIN', async () => {
      // Arrange
      const request: ClockInRequest = {
        employeeId: 1,
        employeePin: 'wrong',
        jobId: 100,
        taskType: 'Printing',
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            attributes: {
              pin: 'hashed_pin',
            },
          },
        },
      });
      mockedBcrypt.compare.mockResolvedValueOnce(false as never);

      // Act & Assert
      await expect(service.clockIn(request)).rejects.toThrow('Invalid employee PIN');
    });

    it('should reject clock in when employee already has active entry', async () => {
      // Arrange
      const request: ClockInRequest = {
        employeeId: 1,
        employeePin: '1234',
        jobId: 100,
        taskType: 'Printing',
      };

      // Mock PIN verification
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            attributes: {
              pin: 'hashed_pin',
            },
          },
        },
      });
      mockedBcrypt.compare.mockResolvedValueOnce(true as never);

      // Mock active entry exists
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              attributes: {
                status: 'Active',
              },
            },
          ],
        },
      });

      // Act & Assert
      await expect(service.clockIn(request)).rejects.toThrow(
        'Employee already has an active time entry'
      );
    });
  });

  describe('clockOut', () => {
    it('should successfully clock out employee', async () => {
      // Arrange
      const request: ClockOutRequest = {
        entryId: 1,
        notes: 'Completed successfully',
        issues: 'Minor registration issue',
      };

      const clockInTime = new Date();
      clockInTime.setHours(clockInTime.getHours() - 4); // 4 hours ago

      // Mock get entry
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              employee: { data: { id: 1 } },
              job: { data: { id: 100 } },
              clockIn: clockInTime.toISOString(),
              breakTime: 30,
              status: 'Active',
            },
          },
        },
      });

      // Mock get employee hourly rate
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            attributes: {
              hourlyRate: 20.0,
            },
          },
        },
      });

      // Mock update entry
      mockAxiosInstance.put.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              employee: { data: { id: 1 } },
              job: { data: { id: 100 } },
              clockIn: clockInTime.toISOString(),
              clockOut: new Date().toISOString(),
              totalTime: 240,
              breakTime: 30,
              productiveTime: 210,
              laborCost: 70.0,
              notes: 'Completed successfully',
              issues: 'Minor registration issue',
              status: 'Completed',
            },
          },
        },
      });

      // Act
      const result = await service.clockOut(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('Completed');
      expect(result.notes).toBe('Completed successfully');
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/api/time-clock-entries/1',
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Completed',
            notes: 'Completed successfully',
            issues: 'Minor registration issue',
          }),
        })
      );
    });

    it('should reject clock out for non-existent entry', async () => {
      // Arrange
      const request: ClockOutRequest = {
        entryId: 999,
      };

      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Not found'));

      // Act & Assert
      await expect(service.clockOut(request)).rejects.toThrow();
    });
  });

  describe('pauseEntry', () => {
    it('should successfully pause active entry', async () => {
      // Arrange
      const entryId = 1;

      // Mock get entry
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              status: 'Active',
              clockIn: new Date().toISOString(),
            },
          },
        },
      });

      // Mock update entry
      mockAxiosInstance.put.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              status: 'Paused',
              pausedAt: new Date().toISOString(),
            },
          },
        },
      });

      // Act
      const result = await service.pauseEntry({ entryId });

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('Paused');
      expect(result.pausedAt).toBeDefined();
    });

    it('should reject pause for non-active entry', async () => {
      // Arrange
      const entryId = 1;

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              status: 'Completed',
            },
          },
        },
      });

      // Act & Assert
      await expect(service.pauseEntry({ entryId })).rejects.toThrow('Time entry is not active');
    });
  });

  describe('resumeEntry', () => {
    it('should successfully resume paused entry', async () => {
      // Arrange
      const entryId = 1;
      const pausedAt = new Date();
      pausedAt.setMinutes(pausedAt.getMinutes() - 15); // 15 minutes ago

      // Mock get entry
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              status: 'Paused',
              pausedAt: pausedAt.toISOString(),
              breakTime: 0,
            },
          },
        },
      });

      // Mock update entry
      mockAxiosInstance.put.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              status: 'Active',
              pausedAt: null,
              breakTime: 15,
            },
          },
        },
      });

      // Act
      const result = await service.resumeEntry({ entryId });

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('Active');
      expect(result.breakTime).toBeGreaterThanOrEqual(14); // Allow for slight time difference
    });

    it('should reject resume for non-paused entry', async () => {
      // Arrange
      const entryId = 1;

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              status: 'Active',
            },
          },
        },
      });

      // Act & Assert
      await expect(service.resumeEntry({ entryId })).rejects.toThrow('Time entry is not paused');
    });
  });

  describe('editEntry', () => {
    it('should successfully edit time entry', async () => {
      // Arrange
      const entryId = 1;
      const editedById = 2;
      const editReason = 'Forgot to clock out';
      const originalClockIn = new Date();
      originalClockIn.setHours(originalClockIn.getHours() - 4);
      const newClockOut = new Date();
      newClockOut.setHours(newClockOut.getHours() - 1);

      // Mock get entry
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              employee: { data: { id: 1 } },
              clockIn: originalClockIn.toISOString(),
              clockOut: new Date().toISOString(),
              breakTime: 30,
              status: 'Completed',
            },
          },
        },
      });

      // Mock get employee hourly rate
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            attributes: {
              hourlyRate: 20.0,
            },
          },
        },
      });

      // Mock update entry
      mockAxiosInstance.put.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              clockOut: newClockOut.toISOString(),
              editedBy: { data: { id: 2 } },
              editReason: 'Forgot to clock out',
              status: 'PendingApproval',
            },
          },
        },
      });

      // Act
      const result = await service.editEntry({
        entryId,
        clockOut: newClockOut.toISOString(),
        editedById,
        editReason,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('PendingApproval');
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/api/time-clock-entries/1',
        expect.objectContaining({
          data: expect.objectContaining({
            editedBy: editedById,
            editReason: editReason,
            status: 'PendingApproval',
          }),
        })
      );
    });
  });

  describe('approveEdit', () => {
    it('should successfully approve edit', async () => {
      // Arrange
      const entryId = 1;
      const approvedById = 3;

      // Mock get entry
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              status: 'PendingApproval',
              clockOut: new Date().toISOString(),
            },
          },
        },
      });

      // Mock update entry
      mockAxiosInstance.put.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              editApprovedBy: { data: { id: 3 } },
              status: 'Edited',
            },
          },
        },
      });

      // Act
      const result = await service.approveEdit({
        entryId,
        approvedById,
        approved: true,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('Edited');
    });

    it('should successfully reject edit', async () => {
      // Arrange
      const entryId = 1;
      const approvedById = 3;

      // Mock get entry
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              status: 'PendingApproval',
              clockOut: new Date().toISOString(),
            },
          },
        },
      });

      // Mock update entry
      mockAxiosInstance.put.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              editApprovedBy: { data: { id: 3 } },
              status: 'Completed',
            },
          },
        },
      });

      // Act
      const result = await service.approveEdit({
        entryId,
        approvedById,
        approved: false,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('Completed');
    });
  });

  describe('getActiveEntries', () => {
    it('should return all active entries', async () => {
      // Arrange
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              attributes: {
                employee: { data: { id: 1 } },
                job: { data: { id: 100 } },
                status: 'Active',
                clockIn: new Date().toISOString(),
              },
            },
            {
              id: 2,
              attributes: {
                employee: { data: { id: 2 } },
                job: { data: { id: 101 } },
                status: 'Paused',
                clockIn: new Date().toISOString(),
              },
            },
          ],
        },
      });

      // Act
      const result = await service.getActiveEntries();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('Active');
      expect(result[1].status).toBe('Paused');
    });

    it('should return empty array when no active entries', async () => {
      // Arrange
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: [],
        },
      });

      // Act
      const result = await service.getActiveEntries();

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('getEmployeeSummary', () => {
    it('should calculate employee time summary correctly', async () => {
      // Arrange
      const employeeId = 1;
      const startDate = '2025-11-23T00:00:00Z';
      const endDate = '2025-11-23T23:59:59Z';

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              attributes: {
                status: 'Completed',
                productiveTime: 240, // 4 hours
                laborCost: 80.0,
              },
            },
            {
              id: 2,
              attributes: {
                status: 'Completed',
                productiveTime: 255, // 4.25 hours
                laborCost: 85.0,
              },
            },
          ],
        },
      });

      // Act
      const result = await service.getEmployeeSummary(employeeId, startDate, endDate);

      // Assert
      expect(result).toBeDefined();
      expect(result.totalEntries).toBe(2);
      expect(result.totalHours).toBe('8.25');
      expect(result.totalLaborCost).toBe('165.00');
    });
  });

  describe('labor cost calculation', () => {
    it('should calculate labor cost correctly', async () => {
      // Arrange
      const clockInTime = new Date();
      clockInTime.setHours(clockInTime.getHours() - 4); // 4 hours ago
      const hourlyRate = 25.0;
      const breakTime = 30; // minutes
      const totalTime = 240; // minutes (4 hours)
      const productiveTime = totalTime - breakTime; // 210 minutes (3.5 hours)
      const expectedLaborCost = (productiveTime / 60) * hourlyRate; // 87.50

      // Mock get entry
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              employee: { data: { id: 1 } },
              clockIn: clockInTime.toISOString(),
              breakTime: breakTime,
              status: 'Active',
            },
          },
        },
      });

      // Mock get employee hourly rate
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            attributes: {
              hourlyRate: hourlyRate,
            },
          },
        },
      });

      // Mock update entry
      mockAxiosInstance.put.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            attributes: {
              clockOut: new Date().toISOString(),
              totalTime: totalTime,
              breakTime: breakTime,
              productiveTime: productiveTime,
              laborCost: expectedLaborCost.toFixed(2),
              status: 'Completed',
            },
          },
        },
      });

      // Act
      const result = await service.clockOut({ entryId: 1 });

      // Assert
      expect(result.productiveTime).toBe(productiveTime);
      expect(result.laborCost).toBeCloseTo(expectedLaborCost, 2);
    });
  });

  describe('concurrent users', () => {
    it('should handle multiple employees clocking in one at a time', async () => {
      // Arrange
      const requests = [
        { employeeId: 1, employeePin: '1111', jobId: 100, taskType: 'Printing' },
        { employeeId: 2, employeePin: '2222', jobId: 101, taskType: 'Folding' },
        { employeeId: 3, employeePin: '3333', jobId: 102, taskType: 'Packaging' },
      ];

      const results = [];

      // Act - Process each request sequentially
      for (let index = 0; index < requests.length; index++) {
        const req = requests[index];

        // PIN verification
        mockAxiosInstance.get.mockResolvedValueOnce({
          data: {
            data: {
              id: req.employeeId,
              attributes: { pin: 'hashed', hourlyRate: 20.0 },
            },
          },
        });
        // Use mockResolvedValue (not Once) so it persists across loop iterations
        mockedBcrypt.compare.mockResolvedValue(true as never);

        // Check active entries
        mockAxiosInstance.get.mockResolvedValueOnce({
          data: { data: [] },
        });

        // Get hourly rate
        mockAxiosInstance.get.mockResolvedValueOnce({
          data: {
            data: { attributes: { hourlyRate: 20.0 } },
          },
        });

        // Create entry
        mockAxiosInstance.post.mockResolvedValueOnce({
          data: {
            data: {
              id: index + 1,
              attributes: {
                employee: { data: { id: req.employeeId } },
                job: { data: { id: req.jobId } },
                taskType: req.taskType,
                status: 'Active',
                clockIn: new Date().toISOString(),
                totalTime: 0,
                breakTime: 0,
                productiveTime: 0,
                laborCost: 0,
              },
            },
          },
        });

        const result = await service.clockIn(req);
        results.push(result);
      }

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.status).toBe('Active');
        expect(result.taskType).toBe(requests[index].taskType);
      });
    });
  });
});
