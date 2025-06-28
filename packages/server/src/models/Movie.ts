import mongoose, { Schema, Document } from 'mongoose';

export interface IMovie extends Document {
  title: string;
  description: string;
  genre: string[];
  rating: number;
  releaseYear: number;
  cast: string[];
  director: string;
  duration: number;
  thumbnailUrl: string;
  videoUrl: string;
  videoKey: string;
  hlsManifestUrl?: string;
  hlsSegments?: Array<{
    quality: string;
    url: string;
  }>;
  trailerUrl?: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MovieSchema: Schema<IMovie> = new Schema(
  {
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: [{ type: String, required: true }],
  rating: { type: Number, required: true },
  releaseYear: { type: Number, required: true },
    cast: [{ type: String }],
    director: { type: String },
    duration: { type: Number, required: true }, // Duration in minutes or seconds, adjust as needed
  thumbnailUrl: { type: String, required: true },
    videoUrl: { type: String }, // Direct video URL for non-HLS
    videoKey: { type: String, required: true }, // S3 key for the original video file
    hlsManifestUrl: { type: String }, // HLS master manifest URL
    hlsSegments: [
      {
        quality: { type: String },
        url: { type: String }
      }
    ], // URLs to HLS segment playlists
  trailerUrl: { type: String },
  featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Optional: Add a text index for searching
MovieSchema.index({ title: 'text', description: 'text' });

// Create indexes
MovieSchema.index({ title: 1 });
MovieSchema.index({ genre: 1 });
MovieSchema.index({ releaseYear: 1 });
MovieSchema.index({ rating: 1 });

export const Movie = mongoose.model<IMovie>('Movie', MovieSchema); 