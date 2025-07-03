'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import LandingPage from './components/LandingPage';
import LoggedInHome from './components/LoggedInHome';
import TrailerPlayer from './components/TrailerPlayer';
import { Movie, movieApi } from '@mana/shared';

export default function HomePage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    if (!authLoading) {
      const fetchMovies = async () => {
        try {
          console.log('HomePage: Fetching movies...');
          const response = await movieApi.getMovies();
          console.log('HomePage: Movies fetch response:', response);
          if (response.success) {
            setMovies(response.data);
            setFeaturedMovies(response.featuredMovies || []);
          } else {
            setError(response.message || 'Failed to fetch movies');
          }
        } catch (error) {
          console.error('HomePage: Error fetching movies:', error);
          setError(error instanceof Error ? error.message : 'Failed to fetch movies');
        } finally {
          setLoading(false);
        }
      };
      fetchMovies();
    }
  }, [authLoading]);

  if (loading || authLoading) {
    console.log('[DIAG] HomePage: Loading...');
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  if (error) {
    console.error('[DIAG] HomePage: Error state:', error);
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }
  if (!movies.length) {
    console.warn('[DIAG] HomePage: Movies array is empty or not set:', movies);
    return <div className="text-gray-400 text-center py-8">No movies found.</div>;
  }

  if (!isAuthenticated) {
    return <LandingPage trendingMovies={featuredMovies} />;
  }
  return (
    <>
      <LoggedInHome movies={movies} user={user || undefined} />
      {/* Modal for playing selected movie */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="w-[90%] max-w-[600px] relative">
            <TrailerPlayer movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
          </div>
        </div>
      )}
    </>
  );
} 