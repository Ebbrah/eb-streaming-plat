import express, { Request, Response } from 'express';
import { Review } from '../models/Review';
import { auth } from '../middleware/auth';

const router = express.Router();

// Submit a review
router.post('/', auth, async (req: Request, res: Response): Promise<void> => {
  const { movieId, rating, review } = req.body;
  const userId = (req as any).user._id;

  try {
    const newReview = new Review({
      movieId,
      userId,
      rating,
      review
    });
    await newReview.save();
    res.status(201).json({ success: true, data: newReview });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'You have already reviewed this movie' });
      return;
    }
    res.status(500).json({ message: 'Error submitting review', error });
  }
});

// Fetch reviews for a movie
router.get('/movies/:movieId', async (req: Request, res: Response): Promise<void> => {
  const { movieId } = req.params;
  try {
    const reviews = await Review.find({ movieId }).populate('userId', 'name');
    res.status(200).json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching reviews', error });
  }
});

export default router; 