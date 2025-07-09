const express = require('express');
const router = express.Router();
const MovieController = require('../controllers/movieController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const auth = require('../middleware/auth');
const requireActiveSubscription = require('../middleware/subscription');

// Create a new movie (admin only)
router.post('/', auth, requireActiveSubscription, upload.single('video'), MovieController.createMovie);

// Get all movies (premium)
router.get('/', auth, requireActiveSubscription, MovieController.getAllMovies);

// Get movie streaming URL (premium)
router.get('/:movieId/stream', auth, requireActiveSubscription, MovieController.getStreamingUrl);

// Delete movie (admin only)
router.delete('/:movieId', auth, requireActiveSubscription, MovieController.deleteMovie);

module.exports = router; 