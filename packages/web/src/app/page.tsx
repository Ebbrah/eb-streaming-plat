'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import LandingPage from './components/LandingPage';
import LoggedInHome from './components/LoggedInHome';
import TrailerPlayer from './components/TrailerPlayer';
import { Movie, movieApi } from '@mana/shared';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { isAuthenticated, loading: authLoading, user, subscriptionStatus, ensureTestSubscription } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated but subscription is not active, redirect to payment
    // UNLESS user is admin/superadmin
    const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
    const disableAutoCreation = process.env.NEXT_PUBLIC_DISABLE_AUTO_SUBSCRIPTION === 'true';

    const isAdmin = user?.role === 'admin' || user?.isSuperAdmin;

    if (
      isAuthenticated &&
      subscriptionStatus &&
      subscriptionStatus.status !== 'active' &&
      !isAdmin
    ) {
      console.log('[HOMEPAGE] Subscription not active, checking conditions...');
      if (isTestMode && !disableAutoCreation) {
        console.log('[HOMEPAGE] Calling ensureTestSubscription...');
        // In test mode, try to ensure test subscription exists before redirecting
        ensureTestSubscription().then(() => {
          // After ensuring subscription, check again
          if (subscriptionStatus && subscriptionStatus.status !== 'active') {
            router.push('/payment?expired=1');
          }
        }).catch(() => {
          // If ensuring subscription fails, redirect to payment
          router.push('/payment?expired=1');
        });
      } else {
        console.log('[HOMEPAGE] Redirecting to payment immediately...');
        // Not in test mode or auto-creation disabled, redirect immediately
        router.push('/payment?expired=1');
      }
    }
  }, [isAuthenticated, subscriptionStatus, router, ensureTestSubscription, user]);

  useEffect(() => {
    if (!authLoading) {
      const fetchMovies = async () => {
        try {
          if (isAuthenticated) {
            console.log('HomePage: Authenticated, fetching all movies...');
            const response = await movieApi.getMovies(1000, true);
            console.log('HomePage: Movies fetch response:', response);
            if (response.success) {
              setMovies(response.data);
              setFeaturedMovies(response.featuredMovies || []);
            } else {
              setError(response.message || 'Failed to fetch movies');
            }
          } else {
            console.log('HomePage: Unauthenticated, fetching public featured movies...');
            const response = await movieApi.getMovies(1000, false);
            console.log('HomePage: Public featured movies response:', response);
            if (response.success) {
              setFeaturedMovies(response.data || []);
              setMovies([]); // No full movies for unauthenticated users
            } else {
              setError(response.message || 'Failed to fetch featured movies');
            }
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
  }, [authLoading, isAuthenticated]);

  if (loading || authLoading) {
    console.log('[DIAG] HomePage: Loading...');
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  if (error) {
    console.error('[DIAG] HomePage: Error state:', error);
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }
  if (!isAuthenticated) {
    return <LandingPage featuredMovies={featuredMovies} />;
  }
  // If subscription is not active, don't render premium content (redirect will happen in useEffect)
  if (subscriptionStatus && subscriptionStatus.status !== 'active' && !(user?.role === 'admin' || user?.isSuperAdmin)) {
    return null;
  }
  if (!movies.length) {
    console.warn('[DIAG] HomePage: Movies array is empty or not set:', movies);
    return <div className="text-gray-400 text-center py-8">No movies found.</div>;
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