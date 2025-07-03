import { Movie, MovieResponse } from '../types/movie';

// Use environment variable or fallback to deployed backend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const movieApi = {
  async getMovies(limit: number = 1000): Promise<MovieResponse> {
    try {
      console.log('Fetching movies from:', `${API_URL}/api/movies?limit=${limit}`);
      const response = await fetchWithTimeout(`${API_URL}/api/movies?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Diagnostic logging
      if (Array.isArray(data)) {
        console.warn('[DIAG] movieApi.getMovies: Data is an array, not an object. Length:', data.length);
      } else if (data && typeof data === 'object') {
        console.log('[DIAG] movieApi.getMovies: Data keys:', Object.keys(data));
        if (Array.isArray(data.data)) {
          console.log('[DIAG] movieApi.getMovies: data.data is an array. Length:', data.data.length);
        } else {
          console.warn('[DIAG] movieApi.getMovies: data.data is not an array:', data.data);
        }
      } else {
        console.error('[DIAG] movieApi.getMovies: Data is not an array or object:', data);
      }
      console.log('Movies fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Error fetching movies:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to fetch movies'
      };
    }
  },

  async getMovieById(id: string): Promise<Movie | null> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/movies/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching movie:', error);
      return null;
    }
  }
}; 