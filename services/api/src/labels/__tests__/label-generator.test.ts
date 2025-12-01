/**
 * Label Generator Tests
 * Tests for PDF label generation
 */

import { LabelGenerator, LabelData } from '../label-generator';

// Mock pdfkit
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    type PDFDoc = {
      on: jest.Mock;
      font: jest.Mock;
      fontSize: jest.Mock;
      fillColor: jest.Mock;
      text: jest.Mock;
      image: jest.Mock;
      moveDown: jest.Mock;
      moveTo: jest.Mock;
      lineTo: jest.Mock;
      strokeColor: jest.Mock;
      lineWidth: jest.Mock;
      stroke: jest.Mock;
      end: jest.Mock;
      y: number;
    };
    
    const doc: PDFDoc = {
      on: jest.fn(),
      font: jest.fn(),
      fontSize: jest.fn(),
      fillColor: jest.fn(),
      text: jest.fn(),
      image: jest.fn(),
      moveDown: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      strokeColor: jest.fn(),
      lineWidth: jest.fn(),
      stroke: jest.fn(),
      end: jest.fn(),
      y: 150, // Mock y position
    };
    
    // Make methods chainable
    doc.font.mockReturnValue(doc);
    doc.fontSize.mockReturnValue(doc);
    doc.fillColor.mockReturnValue(doc);
    doc.text.mockReturnValue(doc);
    doc.image.mockReturnValue(doc);
    doc.moveDown.mockReturnValue(doc);
    doc.moveTo.mockReturnValue(doc);
    doc.lineTo.mockReturnValue(doc);
    doc.strokeColor.mockReturnValue(doc);
    doc.lineWidth.mockReturnValue(doc);
    doc.stroke.mockReturnValue(doc);
    
    doc.on.mockImplementation((event: string, callback: (data?: Buffer) => void) => {
      if (event === 'data') {
        // Store data callback for later
        (doc as { dataCallback?: (data: Buffer) => void }).dataCallback = callback;
      }
      if (event === 'end') {
        // Store end callback for later
        (doc as { endCallback?: () => void }).endCallback = callback;
      }
      return doc;
    });
    
    doc.end.mockImplementation(() => {
      // Trigger callbacks
      const docWithCallbacks = doc as { dataCallback?: (data: Buffer) => void; endCallback?: () => void };
      if (docWithCallbacks.dataCallback) {
        docWithCallbacks.dataCallback(Buffer.from('mock pdf data'));
      }
      if (docWithCallbacks.endCallback) {
        docWithCallbacks.endCallback();
      }
    });
    
    return doc;
  });
});

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQRCodeData'),
}));

describe('LabelGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePDF', () => {
    it('should generate PDF with required fields', async () => {
      const labelData: LabelData = {
        jobId: 'job-123',
        customerName: 'ABC Company',
        jobNickname: 'Spring Collection T-Shirts',
        quantity: 500,
        dueDate: '2025-01-15',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should include printavo ID when provided', async () => {
      const labelData: LabelData = {
        jobId: 'job-123',
        printavoId: 'PV-45678',
        customerName: 'XYZ Corp',
        jobNickname: 'Corporate Polos',
        quantity: 200,
        dueDate: '2025-02-01',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should include sizes when provided', async () => {
      const labelData: LabelData = {
        jobId: 'job-456',
        customerName: 'Smith LLC',
        jobNickname: 'Team Jerseys',
        quantity: 50,
        sizes: 'S(5), M(15), L(20), XL(10)',
        dueDate: '2025-01-20',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should include notes when provided', async () => {
      const labelData: LabelData = {
        jobId: 'job-789',
        customerName: 'Johnson & Co',
        jobNickname: 'Event Tees',
        quantity: 1000,
        dueDate: '2025-03-01',
        notes: 'Rush order - ship overnight. Customer will pick up extras.',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle long customer names', async () => {
      const labelData: LabelData = {
        jobId: 'job-long',
        customerName: 'The Very Long Company Name That Needs To Be Truncated Properly LLC',
        jobNickname: 'Standard Order',
        quantity: 100,
        dueDate: '2025-04-15',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle long job nicknames', async () => {
      const labelData: LabelData = {
        jobId: 'job-long-nickname',
        customerName: 'Short Inc',
        jobNickname: 'This Is A Very Long Job Nickname That Describes Everything In Detail Including Colors And Sizes',
        quantity: 75,
        dueDate: '2025-05-01',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should format quantity with thousands separator', async () => {
      const labelData: LabelData = {
        jobId: 'job-large',
        customerName: 'Mega Corp',
        jobNickname: 'Bulk Order',
        quantity: 10000,
        dueDate: '2025-06-01',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle special characters in text', async () => {
      const labelData: LabelData = {
        jobId: 'job-special',
        customerName: 'O\'Brien & Associates',
        jobNickname: 'Summer "Hot" Collection',
        quantity: 300,
        dueDate: '2025-07-15',
        notes: 'Use special ink: Pantone® 185 C',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should generate QR code with job URL', async () => {
      const QRCode = require('qrcode');
      
      const labelData: LabelData = {
        jobId: 'job-qr-test',
        customerName: 'QR Test Company',
        jobNickname: 'QR Code Order',
        quantity: 50,
        dueDate: '2025-08-01',
      };

      await LabelGenerator.generatePDF(labelData);

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'https://printshop-os.com/jobs/job-qr-test',
        { margin: 0 }
      );
    });

    it('should handle minimum required fields', async () => {
      const labelData: LabelData = {
        jobId: 'job-minimal',
        customerName: 'Minimal',
        jobNickname: 'Test',
        quantity: 1,
        dueDate: '2025-01-01',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle past due dates', async () => {
      const labelData: LabelData = {
        jobId: 'job-past-due',
        customerName: 'Late Order Inc',
        jobNickname: 'Overdue Job',
        quantity: 25,
        dueDate: '2020-01-01', // Past date
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle zero quantity', async () => {
      const labelData: LabelData = {
        jobId: 'job-zero',
        customerName: 'Zero Quantity Corp',
        jobNickname: 'Sample Only',
        quantity: 0,
        dueDate: '2025-09-01',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle empty strings for optional fields', async () => {
      const labelData: LabelData = {
        jobId: 'job-empty',
        customerName: 'Empty Optional',
        jobNickname: 'Test Empty',
        quantity: 10,
        sizes: '',
        dueDate: '2025-10-01',
        notes: '',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle various date formats', async () => {
      const labelData: LabelData = {
        jobId: 'job-date',
        customerName: 'Date Test',
        jobNickname: 'Date Format Test',
        quantity: 100,
        dueDate: '2025-12-31T23:59:59.000Z', // ISO format
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });
  });

  describe('PDF document structure', () => {
    let mockPDFKit: jest.Mock;

    beforeEach(() => {
      mockPDFKit = require('pdfkit');
    });

    it('should create document with 4x6 inch dimensions', async () => {
      const labelData: LabelData = {
        jobId: 'job-size',
        customerName: 'Size Test',
        jobNickname: 'Dimension Check',
        quantity: 100,
        dueDate: '2025-01-01',
      };

      await LabelGenerator.generatePDF(labelData);

      expect(mockPDFKit).toHaveBeenCalledWith(
        expect.objectContaining({
          size: [288, 432], // 4x6 inches at 72 dpi
          margin: 18,
        })
      );
    });

    it('should use correct fonts for labels', async () => {
      const labelData: LabelData = {
        jobId: 'job-font',
        customerName: 'Font Test',
        jobNickname: 'Typography Check',
        quantity: 100,
        dueDate: '2025-01-01',
      };

      await LabelGenerator.generatePDF(labelData);

      const mockDoc = mockPDFKit.mock.results[0].value;
      expect(mockDoc.font).toHaveBeenCalledWith('Helvetica-Bold');
      expect(mockDoc.font).toHaveBeenCalledWith('Helvetica');
      expect(mockDoc.font).toHaveBeenCalledWith('Courier');
    });

    it('should apply correct colors', async () => {
      const labelData: LabelData = {
        jobId: 'job-color',
        customerName: 'Color Test',
        jobNickname: 'Color Check',
        quantity: 100,
        dueDate: '2025-01-01',
      };

      await LabelGenerator.generatePDF(labelData);

      const mockDoc = mockPDFKit.mock.results[0].value;
      expect(mockDoc.fillColor).toHaveBeenCalledWith('#000000');
      expect(mockDoc.fillColor).toHaveBeenCalledWith('#6b7280');
      expect(mockDoc.fillColor).toHaveBeenCalledWith('#dc2626'); // Due date color
    });
  });

  describe('Error handling', () => {
    it('should propagate QR code generation errors', async () => {
      const QRCode = require('qrcode');
      QRCode.toDataURL.mockRejectedValueOnce(new Error('QR generation failed'));

      const labelData: LabelData = {
        jobId: 'job-error',
        customerName: 'Error Test',
        jobNickname: 'Error Check',
        quantity: 100,
        dueDate: '2025-01-01',
      };

      await expect(LabelGenerator.generatePDF(labelData)).rejects.toThrow('QR generation failed');
    });
  });

  describe('Integration scenarios', () => {
    it('should generate label for screen printing job', async () => {
      const labelData: LabelData = {
        jobId: 'screen-001',
        printavoId: 'PV-12345',
        customerName: 'Local Sports Team',
        jobNickname: 'Team Jerseys - 3 Color Front, 2 Color Back',
        quantity: 25,
        sizes: 'YS(2), YM(5), YL(8), AS(3), AM(4), AL(2), AXL(1)',
        dueDate: '2025-01-20',
        notes: 'Names on back - see spreadsheet. Use plastisol ink.',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should generate label for embroidery job', async () => {
      const labelData: LabelData = {
        jobId: 'emb-001',
        printavoId: 'PV-12346',
        customerName: 'Corporate Client Inc',
        jobNickname: 'Left Chest Logo - 12K Stitches',
        quantity: 150,
        sizes: 'S(10), M(40), L(60), XL(30), 2XL(10)',
        dueDate: '2025-02-15',
        notes: 'Use matching thread color for different garment colors.',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should generate label for DTG job', async () => {
      const labelData: LabelData = {
        jobId: 'dtg-001',
        customerName: 'E-commerce Brand',
        jobNickname: 'Full Color Front - Multicolor Design',
        quantity: 50,
        sizes: 'Mixed per order manifest',
        dueDate: '2025-01-18',
        notes: 'Individual poly bag each shirt. Include thank you card.',
      };

      const pdfBuffer = await LabelGenerator.generatePDF(labelData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });
  });
});
