import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index';
import { User } from '../models/User';
import { Movie } from '../models/Movie';
import { Review } from '../models/Review';
import jwt from 'jsonwebtoken';

describe('Review Endpoints', () => {
  let adminToken: string;
  let adminUser: any;
  let testMovieId: string;

  beforeAll(async () => {
    // Create or find admin user
    adminUser = await User.findOne({ email: 'reviewadmin@example.com' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'reviewadmin@example.com',
        password: 'password123',
        name: 'Review Admin',
        isAdmin: true
      });
    }
    adminToken = jwt.sign(
      { _id: adminUser._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Create a test movie
    const movie = await Movie.create({
      title: 'Review Test Movie',
      description: 'A movie for review endpoint testing',
      genre: ['Drama'],
      rating: 7.5,
      releaseYear: 2023,
      cast: ['Actor A'],
      director: 'Director B',
      duration: 100,
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      videoUrl: 'https://example.com/video.mp4',
      videoKey: 'videos/review-test.mp4'
    });
    testMovieId = movie._id.toString();
  });

  afterAll(async () => {
    await Review.deleteMany({});
    await Movie.deleteMany({});
    await User.deleteMany({ email: 'reviewadmin@example.com' });
    await mongoose.connection.close();
  });

  it('should submit a review for a movie', async () => {
    const response = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movieId: testMovieId,
        rating: 5,
        review: 'Fantastic movie!'
      });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data.rating).toBe(5);
    expect(response.body.data.review).toBe('Fantastic movie!');
  });

  it('should not allow submitting multiple reviews by the same user for the same movie', async () => {
    const response = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movieId: testMovieId,
        rating: 4,
        review: 'Second review should fail.'
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('You have already reviewed this movie');
  });

  it('should fetch reviews for a movie', async () => {
    const response = await request(app)
      .get(`/api/reviews/movies/${testMovieId}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]).toHaveProperty('review');
    expect(response.body.data[0]).toHaveProperty('rating');
    expect(response.body.data[0]).toHaveProperty('userId');
  });
}); 