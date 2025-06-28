import request from 'supertest';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { app } from '../index';
import { Movie } from '../models/Movie';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { S3Service } from '../services/s3Service';

// Increase timeout for all tests in this file
jest.setTimeout(120000); // 2 minutes

// Ensure test files directory exists
const testFilesDir = path.join(__dirname, '../test-files');
if (!fs.existsSync(testFilesDir)) {
  fs.mkdirSync(testFilesDir, { recursive: true });
}

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

describe('Movie Endpoints', () => {
  let adminToken: string;
  let adminUser: any;
  let testMovieId: string;

  beforeAll(async () => {
    // Connect to MongoDB with increased timeout
    await mongoose.connect(process.env.MONGODB_URI || '', {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
    });

    // Drop all indexes from the movies collection
    await Movie.collection.dropIndexes();

    // Find or create admin user
    adminUser = await User.findOne({ email: 'superadmin@example.com' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'superadmin@example.com',
        password: 'password123',
        name: 'Super Admin',
        isAdmin: true
      });
    }

    // Generate JWT token
    adminToken = jwt.sign(
      { _id: adminUser._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Upload test video to S3
    const videoPath = path.join(testFilesDir, 'test-video.mp4');
    const videoBuffer = fs.readFileSync(videoPath);
    const videoKey = `videos/${Date.now()}-test-video.mp4`;
    
    // Create a mock file object
    const videoFile = {
      buffer: videoBuffer,
      mimetype: 'video/mp4',
      originalname: 'test-video.mp4'
    } as Express.Multer.File;

    // Upload to S3
    await S3Service.uploadFile(videoFile, videoKey);

    // Create a test movie for streaming tests
    const movieData = {
      title: 'Streaming Test Movie',
      description: 'A movie for testing streaming functionality',
      genre: ['Action'],
      rating: 8.0,
      releaseYear: 2024,
      cast: ['Test Actor'],
      director: 'Test Director',
      duration: 120,
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      videoUrl: 'https://example.com/video.mp4',
      videoKey: videoKey, // Use the actual S3 key
      hlsManifestUrl: 'https://example.com/hls/master.m3u8',
      hlsSegments: [
        { quality: '240p', url: 'https://example.com/hls/240p/playlist.m3u8' },
        { quality: '360p', url: 'https://example.com/hls/360p/playlist.m3u8' },
        { quality: '480p', url: 'https://example.com/hls/480p/playlist.m3u8' },
        { quality: '720p', url: 'https://example.com/hls/720p/playlist.m3u8' }
      ]
    };

    const movie = await Movie.create(movieData);
    testMovieId = movie._id.toString();
  });

  afterAll(async () => {
    // Clean up test data
    await Movie.deleteMany({});
    // Close MongoDB connection
    await mongoose.connection.close();
  });

  describe('POST /api/movies', () => {
    it('should create a new movie with real video file', async () => {
      const movieData = {
        title: 'Sample Movie',
        description: 'A sample movie for testing video upload functionality',
        genre: ['Action', 'Adventure'],
        rating: 8.5,
        releaseYear: 2024,
        cast: ['John Doe', 'Jane Smith'],
        director: 'Test Director',
        duration: 120
      };

      const videoPath = path.join(testFilesDir, 'test-video.mp4');
      const thumbnailPath = path.join(testFilesDir, 'test-thumbnail.jpg');

      // Debug: Check if video file exists and print its size
      if (!fs.existsSync(videoPath)) {
        throw new Error(`[POST /api/movies] Test video file does not exist at path: ${videoPath}`);
      } else {
        const stats = fs.statSync(videoPath);
        console.log(`[DEBUG] [POST /api/movies] Test video path: ${videoPath}, size: ${stats.size} bytes`);
      }

      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', movieData.title)
        .field('description', movieData.description)
        .field('genre', JSON.stringify(movieData.genre))
        .field('rating', movieData.rating)
        .field('releaseYear', movieData.releaseYear)
        .field('cast', JSON.stringify(movieData.cast))
        .field('director', movieData.director)
        .field('duration', movieData.duration)
        .attach('thumbnail', thumbnailPath)
        .attach('video', videoPath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.title).toBe(movieData.title);
      expect(response.body.data.thumbnailUrl).toBeDefined();
      expect(response.body.data.videoUrl).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/movies')
        .field('title', 'Test Movie');

      expect(response.status).toBe(401);
    });

    it('should fail without required files', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Test Movie');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Thumbnail and video files are required');
    });
  });

  describe('GET /api/movies/:id/stream', () => {
    it('should stream video with range request', async () => {
      const response = await request(app)
        .get(`/api/movies/${testMovieId}/stream`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Range', 'bytes=0-1023');

      expect(response.status).toBe(206);
      expect(response.headers['content-type']).toBe('video/mp4');
      expect(response.headers['accept-ranges']).toBe('bytes');
      expect(response.headers['content-range']).toBeDefined();
      expect(response.headers['content-length']).toBeDefined();
    });

    it('should stream video without range request', async () => {
      const response = await request(app)
        .get(`/api/movies/${testMovieId}/stream`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('video/mp4');
      expect(response.headers['content-length']).toBeDefined();
      expect(response.body).toBeDefined();
    }, 180000); // Increase timeout to 3 minutes

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/movies/${testMovieId}/stream`);

      expect(response.status).toBe(401);
    });

    it('should fail with invalid movie id', async () => {
      const response = await request(app)
        .get('/api/movies/invalid-id/stream')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/movies/:id/signed-url', () => {
    it('should get a signed URL for direct streaming', async () => {
      const response = await request(app)
        .get(`/api/movies/${testMovieId}/signed-url`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.signedUrl).toBeDefined();
      expect(response.body.data.expiresIn).toBe(3600);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/movies/${testMovieId}/signed-url`);

      expect(response.status).toBe(401);
    });

    it('should fail with invalid movie id', async () => {
      const response = await request(app)
        .get('/api/movies/invalid-id/signed-url')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/movies/:id/hls', () => {
    it('should get HLS manifest for a movie with transcoded video', async () => {
      const response = await request(app)
        .get(`/api/movies/${testMovieId}/hls`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.manifestUrl).toBeDefined();
      expect(response.body.data.segments).toBeDefined();
      expect(Array.isArray(response.body.data.segments)).toBe(true);
      expect(response.body.data.segments.length).toBeGreaterThan(0);
      expect(response.body.data.segments[0]).toHaveProperty('quality');
      expect(response.body.data.segments[0]).toHaveProperty('url');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/movies/${testMovieId}/hls`);

      expect(response.status).toBe(401);
    });

    it('should fail with invalid movie id', async () => {
      const response = await request(app)
        .get('/api/movies/invalid-id/hls')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should fail for movie without HLS manifest', async () => {
      // Create a movie without HLS manifest
      const movieData = {
        title: 'Non-HLS Movie',
        description: 'A movie without HLS transcoding',
        genre: ['Action'],
        rating: 8.0,
        releaseYear: 2024,
        cast: ['Test Actor'],
        director: 'Test Director',
        duration: 120,
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        videoUrl: 'https://example.com/video.mp4',
        videoKey: 'videos/test.mp4'
      };

      const movie = await Movie.create(movieData);

      const response = await request(app)
        .get(`/api/movies/${movie._id}/hls`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('HLS manifest not available for this movie');

      // Clean up
      await Movie.findByIdAndDelete(movie._id);
    });
  });

  describe('GET /api/movies/search', () => {
    beforeAll(async () => {
      // Create text index
      await Movie.collection.createIndex({ title: 'text', description: 'text' });

      // Create test movies for search
      const testMovies = [
        {
          title: 'Sample Movie 1',
          description: 'A sample movie for testing search',
          genre: ['Action', 'Adventure'],
          rating: 8.5,
          releaseYear: 2024,
          cast: ['John Doe'],
          director: 'Test Director',
          duration: 120,
          thumbnailUrl: 'https://example.com/thumbnail1.jpg',
          videoUrl: 'https://example.com/video1.mp4',
          videoKey: 'videos/test1.mp4'
        },
        {
          title: 'Sample Movie 2',
          description: 'Another sample movie for testing search',
          genre: ['Action', 'Drama'],
          rating: 8.0,
          releaseYear: 2024,
          cast: ['Jane Smith'],
          director: 'Test Director',
          duration: 120,
          thumbnailUrl: 'https://example.com/thumbnail2.jpg',
          videoUrl: 'https://example.com/video2.mp4',
          videoKey: 'videos/test2.mp4'
        }
      ];

      // Delete existing test movies
      await Movie.deleteMany({ title: { $regex: '^Sample Movie' } });

      // Insert new test movies
      await Movie.insertMany(testMovies);

      // Verify test data
      const count = await Movie.countDocuments({ title: { $regex: '^Sample Movie' } });
      console.log('Test movies created:', count);
    });

    afterAll(async () => {
      // Clean up test movies
      await Movie.deleteMany({ title: { $regex: '^Sample Movie' } });
      // Drop text index
      await Movie.collection.dropIndex('title_text_description_text');
    });

    it('should search movies by title', async () => {
      const response = await request(app)
        .get('/api/movies?title=Sample');
      console.log('Search response:', response.body);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter movies by genre', async () => {
      const response = await request(app)
        .get('/api/movies?genre=Action');
      console.log('Genre filter response:', response.body);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter movies by year', async () => {
      const response = await request(app)
        .get('/api/movies?year=2024');
      console.log('Year filter response:', response.body);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter movies by rating', async () => {
      const response = await request(app)
        .get('/api/movies?rating=8.0');
      console.log('Rating filter response:', response.body);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
}); 