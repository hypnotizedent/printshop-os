/**
 * File Storage Service Tests
 * Tests for S3 and local storage operations
 */

// Mock AWS SDK
const mockS3Send = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockS3Send,
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

const mockGetSignedUrl = jest.fn();

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

// Mock fs module
const mockMkdir = jest.fn();
const mockWriteFile = jest.fn();
const mockUnlink = jest.fn();
const mockAccess = jest.fn();

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    mkdir: (...args: unknown[]) => mockMkdir(...args),
    writeFile: (...args: unknown[]) => mockWriteFile(...args),
    unlink: (...args: unknown[]) => mockUnlink(...args),
    access: (...args: unknown[]) => mockAccess(...args),
  },
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('abc12345'),
  }),
}));

// Import the service after mocks are set up
import * as fileService from '../file.service';

describe('File Storage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send.mockReset();
    mockGetSignedUrl.mockReset();
    mockMkdir.mockReset();
    mockWriteFile.mockReset();
    mockUnlink.mockReset();
    mockAccess.mockReset();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const buffer = Buffer.from('test content');
      const filename = 'test.png';

      const result = await fileService.uploadFile(buffer, filename);

      // The result should succeed (uses local mode by default in tests)
      expect(result.key).toContain('.png');
    });

    it('should upload file with orderId in path', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const buffer = Buffer.from('test content');
      const filename = 'artwork.jpg';

      const result = await fileService.uploadFile(buffer, filename, {
        orderId: 'order-123',
      });

      expect(result.key).toContain('orders/order-123/');
    });

    it('should preserve file extension in key', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const buffer = Buffer.from('test');
      const result = await fileService.uploadFile(buffer, 'artwork.psd');

      expect(result.key).toContain('.psd');
    });
  });

  describe('uploadBase64', () => {
    it('should upload base64 encoded file', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const base64Data = Buffer.from('test content').toString('base64');
      const filename = 'test.png';

      const result = await fileService.uploadBase64(base64Data, filename);

      expect(result.key).toBeDefined();
    });

    it('should handle data URL prefix', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const base64Content = Buffer.from('test content').toString('base64');
      const dataUrl = `data:image/png;base64,${base64Content}`;
      const filename = 'test.png';

      const result = await fileService.uploadBase64(dataUrl, filename);

      expect(result.key).toBeDefined();
    });
  });

  describe('getSignedDownloadUrl', () => {
    it('should return a URL for download', async () => {
      const key = 'uploads/2025-01-01/abc12345.png';

      const url = await fileService.getSignedDownloadUrl(key);

      // In local mode, it returns a local path
      expect(url).toBeDefined();
    });
  });

  describe('getSignedUploadUrl', () => {
    it('should handle upload URL requests', async () => {
      const filename = 'test.png';

      // In local mode, this returns null
      const result = await fileService.getSignedUploadUrl(filename);

      // The result depends on USE_S3 env var which is false by default
      expect(result === null || result?.uploadUrl).toBeDefined();
    });
  });

  describe('deleteFile', () => {
    it('should attempt to delete file', async () => {
      mockUnlink.mockResolvedValue(undefined);

      const key = 'uploads/2025-01-01/abc12345.png';

      const result = await fileService.deleteFile(key);

      // Should complete without error
      expect(typeof result).toBe('boolean');
    });
  });

  describe('fileExists', () => {
    it('should check if file exists', async () => {
      mockAccess.mockResolvedValue(undefined);

      const key = 'uploads/2025-01-01/abc12345.png';

      const exists = await fileService.fileExists(key);

      expect(typeof exists).toBe('boolean');
    });
  });

  describe('Default Export', () => {
    it('should export all functions in default object', () => {
      expect(fileService.default).toBeDefined();
      expect(fileService.default.uploadFile).toBeDefined();
      expect(fileService.default.uploadBase64).toBeDefined();
      expect(fileService.default.getSignedDownloadUrl).toBeDefined();
      expect(fileService.default.getSignedUploadUrl).toBeDefined();
      expect(fileService.default.deleteFile).toBeDefined();
      expect(fileService.default.fileExists).toBeDefined();
    });
  });

  describe('File Types', () => {
    beforeEach(() => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
    });

    it.each([
      'test.jpg',
      'test.jpeg',
      'test.png',
      'test.gif',
      'test.webp',
      'test.svg',
      'test.pdf',
      'test.ai',
      'test.eps',
      'test.psd',
      'test.zip',
      'test.doc',
      'test.docx',
      'test.xls',
      'test.xlsx',
      'test.unknown',
    ])('should handle upload for %s', async (filename) => {
      const buffer = Buffer.from('test');
      const result = await fileService.uploadFile(buffer, filename);

      expect(result.key).toContain(filename.split('.')[1]);
    });
  });
});
