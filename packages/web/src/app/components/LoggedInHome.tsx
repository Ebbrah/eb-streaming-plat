import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MovieCard from './MovieCard';
import TrailerPlayer from './TrailerPlayer';

interface Movie {
  _id: string;
  title: string;
  description?: string;
  genre?: string | string[];
  thumbnailUrl: string;
  videoUrl?: string;
  trailerUrl?: string;
  featured?: boolean;
  releaseYear?: number;
  rating?: number;
}

interface User {
  name: string;
  profilePicture?: string;
  role?: string;
  isSuperAdmin?: boolean;
}

interface LoggedInHomeProps {
  movies: Movie[];
  user?: User;
}

export default function LoggedInHome({ movies, user }: LoggedInHomeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const handleThumbnailClick = (movie: Movie) => {
    console.log('LoggedInHome: Thumbnail clicked for movie:', movie.title, movie._id);
    setSelectedMovie(movie);
  };

  const handleClosePlayer = () => {
    setSelectedMovie(null);
  };

  // --- HERO SECTION: Cycle through featured movie trailers ---
  const featuredMovies = movies.filter((m) => m.featured && (m.trailerUrl || m.videoUrl));
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  useEffect(() => {
    if (featuredMovies.length < 2) return;
    const interval = setInterval(() => {
      setCurrentHeroIdx((idx) => (idx + 1) % featuredMovies.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredMovies.length]);
  const heroMovie = featuredMovies[currentHeroIdx];

  // Only display these genres
  const allowedGenres = [
    'Semina 2020 - 2025',
    'Kongamano 2020 - 2025',
    'Semina 2015 - 2019',
    'Semina 2010 - 2014',
    'Semina 2005 - 2009',
    'Semina 2000 - 2004',
    'Semina 1995 - 1999',
    'Semina 1990 - 1994',
  ];

  // Filter movies to only those with allowed genres
  const filteredMovies = movies.filter(movie =>
    Array.isArray(movie.genre)
      ? movie.genre.some(g => typeof g === 'string' && allowedGenres.includes(g))
      : typeof movie.genre === 'string' && allowedGenres.includes(movie.genre)
  );

  // Build genreMap only from filteredMovies and allowedGenres
  const genreMap: { [genre: string]: Movie[] } = {};
  filteredMovies.forEach((movie) => {
    (Array.isArray(movie.genre) ? movie.genre : [movie.genre]).forEach((g) => {
      if (typeof g === 'string' && allowedGenres.includes(g)) {
        if (!genreMap[g]) genreMap[g] = [];
        genreMap[g].push(movie);
      }
    });
  });

  console.log('[DIAG] LoggedInHome: movies prop:', movies);
  if (movies.length) {
    console.log('[DIAG] Sample movie:', movies[0]);
  }
  console.log('[DIAG] LoggedInHome: genreMap:', genreMap);
  if (!movies.length) {
    console.warn('[DIAG] LoggedInHome: movies is empty:', movies);
  }
  if (Object.keys(genreMap).length === 0) {
    console.warn('[DIAG] LoggedInHome: genreMap is empty:', genreMap);
  }

  const textStyle = {
    color: '#FFFFEE',
    textShadow: '0 2px 8px #000, 0 0px 2px #000',
  };

  const menuItems = [
    { label: 'Mana', href: '/' },
    { label: 'Search', href: '#' },
    { label: 'Movies', href: '#' },
    { label: 'About CADF', href: '#' },
    { label: 'Agiza kitabu', href: '#' },
  ];

  const isAdmin = user?.role === 'admin' || user?.isSuperAdmin;

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-br from-[#1a052a] via-[#2a093c] to-[#4b2066] opacity-95" style={{backgroundPosition: '0% 50%'}} />
      {/* Soft vignette overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, rgba(26,5,42,0.85) 100%)'}} />
      {/* Top Bar */}
      <header className="relative z-20 flex justify-between items-center px-8 py-6 bg-gradient-to-b from-[#1a052a] via-[#1a052a] to-[#2a093c]">
        {/* Left: CADF Logo */}
        <span className="text-4xl font-extrabold tracking-tight" style={textStyle}>CADF</span>
        {/* Right: Menu Icon, Admin, Welcome, Profile, Sign Out */}
        <div className="flex items-center space-x-4">
          {/* Menu Icon */}
          <button
            className="focus:outline-none p-2 rounded hover:bg-white/10"
            aria-label="Open menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#FFFFEE', filter: 'drop-shadow(0 2px 8px #000)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Dropdown Menu */}
          {menuOpen && (
            <div
              className="absolute right-8 top-20 border border-gray-700 rounded-lg shadow-lg py-2 px-4 z-50 min-w-[180px] animate-fade-in"
              style={{ background: 'rgba(42,9,60,0.4)' }}
            >
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block py-2 px-2 text-lg font-medium hover:bg-white/10 rounded text-white"
                  style={textStyle}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
          {/* Admin Button (only for admin/super admin) */}
          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded"
            >
              Admin
            </button>
          )}
          {/* Welcome and Profile */}
          <span className="text-lg font-semibold" style={textStyle}>
            Welcome{user?.name ? `, ${user.name}` : ''}
          </span>
          <a href="/profile" className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-400 hover:ring-2 hover:ring-purple-400 transition">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </a>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/auth/login';
            }}
            className="ml-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>
      {/* Hero Banner with Cycling Trailer Player */}
      {heroMovie && (
        <div className="relative w-full pt-2 pb-2">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-10" />
          <div className="relative z-20">
            <TrailerPlayer movie={featuredMovies[0]} />
          </div>
        </div>
      )}
      {/* Genre Rows - only allowed genres */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 py-8">
        {allowedGenres.map((genre) =>
          genreMap[genre] && genreMap[genre].length > 0 ? (
            <section key={genre} className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">{genre}</h2>
              <div className="w-full overflow-x-auto overflow-y-hidden flex flex-nowrap space-x-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pb-2">
                {genreMap[genre].map((movie) => (
                  <div key={movie._id} className="min-w-[220px] max-w-xs flex-shrink-0">
                    <MovieCard movie={movie} onClick={handleThumbnailClick} />
                  </div>
                ))}
              </div>
            </section>
          ) : null
        )}
      </div>
      {/* Modal for playing selected movie */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80"
          style={{
            top: 0,
            left: 0,
            width: '100% !important',
            height: '100% !important',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          <div className="w-[90%] max-w-[960px] relative" style={{
            paddingTop: '5%',
            maxHeight: '60vh',
            overflow: 'hidden',
            marginTop: '5vh',
          }}>
            <TrailerPlayer movie={selectedMovie} onClose={handleClosePlayer} />
          </div>
        </div>
      )}
    </div>
  );
} 