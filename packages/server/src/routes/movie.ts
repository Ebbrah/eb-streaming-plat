import express, { Request, Response, RequestHandler } from 'express';
import { body } from 'express-validator';
import { Movie } from '../models/Movie';
import { User } from '../models/User';
import { auth } from '../middleware/auth';
import { admin } from '../middleware/admin';
import fs from 'fs';
import path from 'path';
import { S3Service } from '../services/s3Service';
import multer from 'multer';
import mongoose from 'mongoose';
import { TranscodingService } from '../services/transcodingService';
import os from 'os';
// const sharp = require('sharp');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

interface AuthRequest extends Request {
  user?: any;
}

interface MovieQuery extends Request {
  query: {
    page?: string;
    limit?: string;
    genre?: string;
    search?: string;
    title?: string;
    year?: string;
    rating?: string;
  };
}

// Get all movies with pagination and filters
router.get('/', async (req: MovieQuery, res: Response) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const genre = req.query.genre;
    const search = req.query.search || req.query.title;
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const rating = req.query.rating ? parseFloat(req.query.rating) : undefined;

    console.log('Search params:', { page, limit, genre, search, year, rating });

    const query: any = {};
    
    // Handle text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Handle filters
    if (genre) query.genre = genre;
    if (year) query.releaseYear = year;
    if (rating) query.rating = { $gte: rating };

    console.log('MongoDB query:', JSON.stringify(query, null, 2));

    // First, get all featured movies regardless of other filters
    const featuredMovies = await Movie.find({ 
      featured: true, 
      thumbnailUrl: { $exists: true, $ne: '' } 
    })
    .sort({ createdAt: -1 })
    .limit(6);

    // Then get the regular movies based on filters and pagination
    const movies = await Movie.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Movie.countDocuments(query);

    console.log('Found movies:', movies.length);
    console.log('Found featured movies:', featuredMovies.length);

    res.json({
      success: true,
      data: movies,
      featuredMovies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error in movie search:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching movies',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get movie by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    console.log('Server API: Received request for movie ID:', req.params.id);
    const movie = await Movie.findById(req.params.id);
    console.log('Server API: Result of Movie.findById:', movie);

    if (!movie) {
      console.log('Server API: Movie not found for ID:', req.params.id);
      res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
      return;
    }

    console.log('Server API: Found movie:', movie.title);
    res.json({
      success: true,
      data: movie,
    });
  } catch (error) {
    console.error('Server API: Error fetching movie:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching movie',
      error: (error as Error).message,
    });
  }
});

// Add movie to watchlist
router.post('/:id/watchlist', auth, async (req: AuthRequest, res: Response) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
      return;
    }

    const user = req.user;
    if (user.watchlist.includes(req.params.id)) {
      res.status(400).json({
        success: false,
        message: 'Movie already in watchlist',
      });
      return;
    }

    user.watchlist.push(req.params.id);
    await user.save();

    res.json({
      success: true,
      message: 'Movie added to watchlist',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding movie to watchlist',
    });
  }
});

// Remove movie from watchlist
router.delete('/:id/watchlist', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    user.watchlist = user.watchlist.filter(
      (id: string) => id.toString() !== req.params.id
    );
    await user.save();

    res.json({
      success: true,
      message: 'Movie removed from watchlist',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing movie from watchlist',
    });
  }
});

// Update watch progress
router.post('/:id/progress', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { progress } = req.body;
    const user = req.user;

    const watchHistory = user.watchHistory.find(
      (item: any) => item.movieId.toString() === req.params.id
    );

    if (watchHistory) {
      watchHistory.progress = progress;
      watchHistory.lastWatched = new Date();
    } else {
      user.watchHistory.push({
        movieId: req.params.id,
        progress,
        lastWatched: new Date(),
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Watch progress updated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating watch progress',
    });
  }
});

// Update movie (admin only)
router.put('/:id', auth, admin, async (req: AuthRequest, res: Response) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) {
      res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
      return;
    }
    res.json({
      success: true,
      data: movie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating movie',
    });
  }
});

// Delete movie (admin only)
router.delete('/:id', auth, admin, async (req: AuthRequest, res: Response) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
      return;
    }
    res.json({
      success: true,
      message: 'Movie deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting movie',
    });
  }
});

// Create new movie (admin only)
const createMovieHandler: RequestHandler = async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.thumbnail || !files.video || !files.trailer) {
      res.status(400).json({
        success: false,
        message: 'Thumbnail, video, and trailer files are required'
      });
      return;
    }

    // Process thumbnail to ensure 16:9 aspect ratio
    // const sharp = require('sharp');
    const thumbnailBuffer = files.thumbnail[0].buffer;

    // Upload processed thumbnail to S3
    const thumbnailKey = `thumbnails/${Date.now()}-${files.thumbnail[0].originalname}`;
    const thumbnailUrl = await S3Service.uploadFile(
      { ...files.thumbnail[0], buffer: thumbnailBuffer },
      thumbnailKey
    );

    // Upload video to S3
    const videoKey = `videos/${Date.now()}-${files.video[0].originalname}`;
    const videoUrl = await S3Service.uploadFile(files.video[0], videoKey);

    // Upload trailer to S3
    const trailerKey = `trailers/${Date.now()}-${files.trailer[0].originalname}`;
    const trailerUrl = await S3Service.uploadFile(files.trailer[0], trailerKey);

    // Create temporary directory for transcoding
    const tempDir = path.join(os.tmpdir(), `transcode-${Date.now()}`);
    const tempVideoPath = path.join(tempDir, files.video[0].originalname);
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(tempVideoPath, files.video[0].buffer);

    // Transcode video to HLS
    const transcodingResult = await TranscodingService.transcodeVideo({
      inputPath: tempVideoPath,
      outputDir: tempDir,
      videoKey,
      qualities: [
        { height: 240, bitrate: '400k' },
        { height: 360, bitrate: '800k' },
        { height: 480, bitrate: '1400k' },
        { height: 720, bitrate: '2800k' }
      ]
    });

    // Parse genre field robustly
    let genre: string[] = [];
    if (req.body.genre) {
      if (typeof req.body.genre === 'string') {
        try {
          genre = JSON.parse(req.body.genre);
        } catch {
          genre = [req.body.genre];
        }
      } else if (Array.isArray(req.body.genre)) {
        genre = req.body.genre;
      }
    }

    // Create movie document
    const movie = new Movie({
      ...req.body,
      thumbnailUrl,
      videoUrl,
      videoKey,
      hlsManifestUrl: transcodingResult.manifestUrl,
      hlsSegments: transcodingResult.segments,
      genre,
      duration: parseInt(req.body.duration),
      rating: parseFloat(req.body.rating),
      releaseYear: parseInt(req.body.releaseYear),
      trailerUrl
    });

    await movie.save();

    // Clean up temporary files
    fs.rmSync(tempDir, { recursive: true, force: true });

    res.status(201).json({
      success: true,
      data: movie
    });
    return;
  } catch (error) {
    console.error('Error creating movie:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating movie',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

router.post(
  '/',
  auth,
  admin,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'trailer', maxCount: 1 }
  ]),
  createMovieHandler
);

// Stream movie video (VOD, auth required)
router.get('/:id/stream', auth, async (req: AuthRequest, res: Response) => {
  try {
    // Check for valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
      return;
    }
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
      return;
    }

    // Use videoKey as the S3 key
    const s3Key = movie.videoKey;
    if (!s3Key) {
      res.status(404).json({
        success: false,
        message: 'No S3 key found for this movie',
      });
      return;
    }

    // Stream from S3 with range support
    await S3Service.streamFile(res, s3Key, req.headers.range);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error streaming video',
      error: (error as Error).message,
    });
  }
});

// Get signed URL for direct S3 streaming (auth required)
router.get('/:id/signed-url', auth, async (req: AuthRequest, res: Response) => {
  try {
    // Check for valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
      return;
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
      return;
    }

    // Use videoKey as the S3 key
    const s3Key = movie.videoKey;
    if (!s3Key) {
      res.status(404).json({
        success: false,
        message: 'No S3 key found for this movie',
      });
      return;
    }

    // Generate signed URL that expires in 1 hour
    const signedUrl = await S3Service.getSignedUrl(s3Key, 3600);

    res.json({
      success: true,
      data: {
        signedUrl,
        expiresIn: 3600, // URL expires in 1 hour
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating signed URL',
      error: (error as Error).message,
    });
  }
});

// Get HLS manifest for adaptive streaming (auth required)
router.get('/:id/hls', auth, async (req: AuthRequest, res: Response) => {
  try {
    // Check for valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
      return;
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
      return;
    }

    if (!movie.hlsManifestUrl) {
      res.status(404).json({
        success: false,
        message: 'HLS manifest not available for this movie',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        manifestUrl: movie.hlsManifestUrl,
        segments: movie.hlsSegments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting HLS manifest',
      error: (error as Error).message,
    });
  }
});

// Search movies with filters
router.get('/search', async (req: MovieQuery, res: Response) => {
  try {
    const { title, genre, year, rating } = req.query;
    console.log('Search query:', { title, genre, year, rating });
    
    const query: any = {};

    if (title) {
      // Use regex search instead of text search
      query.title = { $regex: title, $options: 'i' };
    }
    if (genre) {
      query.genre = { $in: [genre] };
    }
    if (year) {
      query.releaseYear = parseInt(year);
    }
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    console.log('MongoDB query:', JSON.stringify(query, null, 2));
    
    const movies = await Movie.find(query)
      .sort({ createdAt: -1 });
    console.log('Found movies:', movies.length);

    res.json({
      success: true,
      data: movies
    });
  } catch (error) {
    console.error('Error in movie search:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching movies',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

export default router; 