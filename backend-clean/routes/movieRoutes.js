const express = require('express');
const router = express.Router();
const MovieController = require('../controllers/movieController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Create a new movie (admin only)
router.post('/', upload.single('video'), MovieController.createMovie);

// Get all movies
router.get('/', MovieController.getAllMovies);

// Get movie streaming URL
router.get('/:movieId/stream', MovieController.getStreamingUrl);

// Delete movie (admin only)
router.delete('/:movieId', MovieController.deleteMovie);

module.exports = router; 