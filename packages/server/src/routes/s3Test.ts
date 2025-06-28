import express, { Request, Response } from 'express';
import multer from 'multer';
import { S3Service } from '../services/s3Service';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    }
});

// Test upload endpoint
router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        // Upload to S3
        const key = `test/${Date.now()}-${req.file.originalname}`;
        const url = await S3Service.uploadFile(req.file, key);

        res.status(200).json({
            message: 'File uploaded successfully',
            url,
            key
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error uploading file', error: (error as Error).message });
    }
});

// Test signed URL generation
router.get('/signed-url/:key', async (req: Request, res: Response): Promise<void> => {
    try {
        const { key } = req.params;
        const signedUrl = await S3Service.getSignedUrl(key);
        res.status(200).json({ signedUrl });
    } catch (error) {
        console.error('Signed URL error:', error);
        res.status(500).json({ message: 'Error generating signed URL', error: (error as Error).message });
    }
});

export default router; 