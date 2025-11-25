import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface LabelData {
    jobId: string;
    printavoId?: string;
    customerName: string;
    jobNickname: string;
    quantity: number;
    sizes?: string;
    dueDate: string;
    notes?: string;
}

export class LabelGenerator {
    /**
     * Generates a 4x6 inch PDF label
     */
    static async generatePDF(data: LabelData): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            try {
                // Create document - 4x6 inches (288x432 points)
                const doc = new PDFDocument({
                    size: [288, 432], // 4x6 inches in points (72 dpi)
                    margin: 18, // 0.25 inch margin
                    autoFirstPage: true,
                });

                const buffers: Buffer[] = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));
                doc.on('error', reject);

                // Generate QR Code
                const qrUrl = `https://printshop-os.com/jobs/${data.jobId}`;
                const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 0 });

                // --- Layout ---

                // Header: Logo Text & Job ID
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#4b5563').text('PRINTSHOP OS', 18, 18);
                doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text(`Job #${data.printavoId || data.jobId}`, 18, 32);

                // QR Code (Top Right)
                doc.image(qrDataUrl, 288 - 18 - 72, 18, { width: 72, height: 72 });

                // Customer Name
                doc.moveDown(2);
                doc.font('Helvetica-Bold').fontSize(8).fillColor('#6b7280').text('CUSTOMER', 18, 80);
                doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000').text(data.customerName, 18, 92, {
                    width: 288 - 36,
                    lineGap: -2,
                });

                // Divider
                const yPos = doc.y + 10;
                doc.moveTo(18, yPos).lineTo(288 - 18, yPos).strokeColor('#e5e7eb').lineWidth(1).stroke();

                // Job Nickname
                doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000').text(data.jobNickname, 18, yPos + 15, {
                    width: 288 - 36,
                });

                // Quantity
                doc.moveDown(0.5);
                doc.font('Helvetica-Bold').fontSize(8).fillColor('#6b7280').text('QUANTITY');
                doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000').text(`${data.quantity.toLocaleString()} pieces`);

                // Sizes
                if (data.sizes) {
                    doc.moveDown(0.5);
                    doc.font('Helvetica-Bold').fontSize(8).fillColor('#6b7280').text('SIZES');
                    doc.font('Helvetica').fontSize(10).fillColor('#000000').text(data.sizes);
                }

                // Due Date
                doc.moveDown(1);
                doc.font('Helvetica-Bold').fontSize(8).fillColor('#6b7280').text('DUE DATE');
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#dc2626').text(new Date(data.dueDate).toLocaleDateString());

                // Notes
                if (data.notes) {
                    const noteY = doc.y + 10;
                    doc.moveTo(18, noteY).lineTo(288 - 18, noteY).strokeColor('#e5e7eb').lineWidth(1).stroke();

                    doc.font('Helvetica-Bold').fontSize(8).fillColor('#6b7280').text('NOTES', 18, noteY + 10);
                    doc.font('Helvetica').fontSize(9).fillColor('#000000').text(data.notes, 18, noteY + 22, {
                        width: 288 - 36,
                        height: 50,
                        ellipsis: true,
                    });
                }

                // Footer ID
                doc.font('Courier').fontSize(8).fillColor('#9ca3af').text(`ID: ${data.jobId}`, 18, 432 - 20, {
                    align: 'right',
                    width: 288 - 36,
                });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}
