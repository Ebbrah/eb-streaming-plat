export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  watchlist: string[];
  watchHistory: WatchHistory[];
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  genre: string[];
  rating: number;
  releaseYear: number;
  cast: string[];
  director: string;
}

export interface WatchHistory {
  movieId: string;
  progress: number;
  lastWatched: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
} 