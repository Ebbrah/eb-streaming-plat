import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TrailerPlayer from './TrailerPlayer';

interface TrendingMovie {
  _id: string;
  title: string;
  thumbnailUrl: string;
  trailerUrl?: string;
  videoUrl?: string;
  hlsManifestUrl?: string;
  description?: string;
}

interface LandingPageProps {
  trendingMovies?: TrendingMovie[];
}

export default function LandingPage({ trendingMovies = [] }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TrendingMovie | null>(null);
  const router = useRouter();

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      router.push(`/auth/login?register=1&email=${encodeURIComponent(email)}`);
    } else {
      router.push('/auth/login?register=1');
    }
  };

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

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background image overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/background.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 flex justify-between items-center px-8 py-6">
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
          <span className="text-4xl font-extrabold tracking-tight" style={textStyle}>CADF</span>
          {/* Dropdown Menu */}
          {menuOpen && (
            <div
              className="absolute left-8 top-20 border border-gray-700 rounded-lg shadow-lg py-2 px-4 z-50 min-w-[180px] animate-fade-in"
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
        </div>
        <button
          onClick={() => router.push('/auth/login')}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="inline-block px-6 py-8 rounded-xl" style={{ background: 'rgba(0,0,0,0.05)' }}>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-lg" style={textStyle}>
            Lisha Kondoo Zangu
          </h1>
          <h2 className="text-xl md:text-2xl mb-4 font-medium" style={textStyle}>
            Christopher & Diana Mwakasege Foundation (CADF)
          </h2>
          <p className="text-lg mb-6" style={textStyle}>
            Jifunze neno la Mungu kupitia mafundisho ya Neno la Mungu kupitia kwa Mwl Christopher na Diana Mwakasege
            <br />
            yaliyofanyika katika semina na makongamano tofauti toka mwaka 1990
          </p>
          <form onSubmit={handleGetStarted} className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xl mx-auto">
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full sm:w-2/3 px-4 py-3 rounded bg-white/90 text-black text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white text-lg font-semibold rounded"
            >
              Jiunge Sasa
            </button>
          </form>
        </div>
      </main>

      {/* Trending Now Row */}
      <section className="relative z-10 w-full max-w-6xl mx-auto mt-12 mb-8">
        <h3 className="text-2xl font-bold mb-4 px-4" style={textStyle}>Trending Now</h3>
        <div className="flex flex-nowrap space-x-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 px-4 pb-4">
          {trendingMovies.length > 0 ? trendingMovies.map((movie, idx) => (
            <div 
              key={movie._id} 
              className="min-w-[240px] max-w-[320px] aspect-w-16 aspect-h-9 flex-shrink-0 relative cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={() => setSelectedMovie(movie)}
            >
              <img
                src={movie.thumbnailUrl}
                alt={movie.title}
                className="w-full h-full object-cover rounded-lg shadow-lg border-2 border-gray-800"
                style={{ aspectRatio: '16/9' }}
              />
              <span className="absolute left-2 bottom-2 text-3xl font-extrabold drop-shadow-lg" style={textStyle}>{idx + 1}</span>
            </div>
          )) : [1,2,3,4,5,6].map((n) => (
            <div key={n} className="min-w-[240px] max-w-[320px] aspect-w-16 aspect-h-9 flex-shrink-0 relative">
              <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center text-gray-300" style={{ aspectRatio: '16/9' }}>No Image</div>
              <span className="absolute left-2 bottom-2 text-3xl font-extrabold drop-shadow-lg" style={textStyle}>{n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Trailer Preview Modal */}
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
            <TrailerPlayer movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
          </div>
        </div>
      )}
    </div>
  );
} 