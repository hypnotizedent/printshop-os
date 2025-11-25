import { Router, Request, Response } from 'express';
import { LabelGenerator, type LabelData } from '../labels/label-generator';

const router = Router();

/**
 * GET /api/jobs/:jobId/label
 * Returns a 4x6 PDF label for the specified job.
 */
router.get('/:jobId/label', async (req: Request, res: Response) => {
    const { jobId } = req.params;
    // In a real implementation you would fetch job details from DB.
    // For demo purposes we use placeholder data.
    const mockJob: LabelData = {
        jobId,
        printavoId: jobId,
        customerName: 'Demo Customer',
        jobNickname: 'Demo Job',
        quantity: 100,
        dueDate: new Date().toISOString(),
        notes: 'Generated via API',
    };

    try {
        const pdfBuffer = await LabelGenerator.generatePDF(mockJob);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="label-${jobId}.pdf"`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Label generation error', err);
        res.status(500).json({ error: 'Failed to generate label' });
    }
});

export default router;
