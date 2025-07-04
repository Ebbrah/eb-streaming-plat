const Movie = require('../models/Movie');
const S3Service = require('../services/s3Service');

class MovieController {
    // Create a new movie (admin only)
    static async createMovie(req, res) {
        try {
            const { title, description, genre, releaseYear } = req.body;
            const videoFile = req.file;

            if (!videoFile) {
                return res.status(400).json({ message: 'Video file is required' });
            }

            // Upload video to S3
            const videoKey = `movies/${Date.now()}-${videoFile.originalname}`;
            const videoUrl = await S3Service.uploadFile(videoFile, videoKey);

            // Ensure genre is always set
            let safeGenre = genre;
            if (!safeGenre || (typeof safeGenre === 'string' && safeGenre.trim() === '')) {
                safeGenre = 'Other';
            }

            // Create movie in database
            const movie = new Movie({
                title,
                description,
                genre: safeGenre,
                releaseYear,
                videoKey,
                videoUrl
            });

            await movie.save();
            res.status(201).json(movie);
        } catch (error) {
            console.error('Error creating movie:', error);
            res.status(500).json({ message: 'Error creating movie' });
        }
    }

    // Get movie streaming URL
    static async getStreamingUrl(req, res) {
        try {
            const { movieId } = req.params;
            const movie = await Movie.findById(movieId);

            if (!movie) {
                return res.status(404).json({ message: 'Movie not found' });
            }

            // Generate signed URL for streaming
            const streamingUrl = await S3Service.getSignedUrl(movie.videoKey);
            res.json({ streamingUrl });
        } catch (error) {
            console.error('Error getting streaming URL:', error);
            res.status(500).json({ message: 'Error generating streaming URL' });
        }
    }

    // Delete movie (admin only)
    static async deleteMovie(req, res) {
        try {
            const { movieId } = req.params;
            const movie = await Movie.findById(movieId);

            if (!movie) {
                return res.status(404).json({ message: 'Movie not found' });
            }

            // Delete video from S3
            await S3Service.deleteFile(movie.videoKey);

            // Delete movie from database
            await Movie.findByIdAndDelete(movieId);
            res.json({ message: 'Movie deleted successfully' });
        } catch (error) {
            console.error('Error deleting movie:', error);
            res.status(500).json({ message: 'Error deleting movie' });
        }
    }

    // Get all movies
    static async getAllMovies(req, res) {
        try {
            const movies = await Movie.find({}, '-videoKey');
            if (movies.length) {
                console.log('Sample movie from DB:', movies[0]);
            } else {
                console.log('No movies found in DB.');
            }
            res.json({ success: true, data: movies });
        } catch (error) {
            console.error('Error getting movies:', error);
            res.status(500).json({ message: 'Error getting movies' });
        }
    }
}

module.exports = MovieController; 