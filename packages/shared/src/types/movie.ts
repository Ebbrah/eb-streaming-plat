export interface Movie {
  _id: string;
  title: string;
  description?: string;
  genre?: string;
  thumbnailUrl: string;
  videoUrl?: string;
  trailerUrl?: string;
  featured?: boolean;
  releaseYear?: number;
  rating?: number;
  hlsManifestUrl?: string;
}

export interface MovieResponse {
  success: boolean;
  data: Movie[];
  featuredMovies?: Movie[];
  message?: string;
} 