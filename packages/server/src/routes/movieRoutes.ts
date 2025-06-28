import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { Movie } from '../models/Movie'; // Corrected import path
import { S3Service } from '../services/s3Service'; // Assuming your S3 service is here
import multer from 'multer';

const router = express.Router();

// Wrapper to handle async errors
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };

// Configure Multer for file uploads (adjust as needed for your setup)
const upload = multer(); // Or configure storage options

router.post('/upload', upload.fields([{ name: 'videoFile' }, { name: 'thumbnailFile' }]), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const videoFile = (req.files as any)?.videoFile?.[0];
    const thumbnailFile = (req.files as any)?.thumbnailFile?.[0];
    const { title, description, genre, releaseYear, rating, featured, duration, director, cast } = req.body;

    if (!videoFile || !thumbnailFile) {
        return res.status(400).json({ success: false, message: 'Video and thumbnail files are required.' });
    }

    // Upload video to S3
    console.log('Starting video upload to S3...');
    const videoKey = `videos/${Date.now()}-${videoFile.originalname}`;
    const videoUrl = await S3Service.uploadFile(videoFile, videoKey);
    console.log('Video uploaded successfully to S3');

    // Upload thumbnail to S3
    console.log('Starting thumbnail upload to S3...');
    const thumbnailKey = `thumbnails/${Date.now()}-${thumbnailFile.originalname}`;
    const thumbnailUrl = await S3Service.uploadFile(thumbnailFile, thumbnailKey);
    console.log('Thumbnail uploaded successfully to S3');

    // Create movie document
    console.log('Creating movie document in database...');
    const movie = new Movie({
      title,
      description,
      genre: JSON.parse(genre),
      releaseYear: parseInt(releaseYear),
      rating: parseFloat(rating),
      thumbnailUrl,
      videoUrl,
      featured: featured === 'true',
      duration: parseInt(duration),
      director,
      cast: JSON.parse(cast || '["Unknown"]'),
    });

    await movie.save();
    console.log('Movie document created successfully');

    res.json({ success: true, movie });
  } catch (error) {
    console.error('Error in movie upload:', error);
    // Pass the error to the next middleware for centralized error handling
    next(error);
  }
}));

export default router; // Export the router 