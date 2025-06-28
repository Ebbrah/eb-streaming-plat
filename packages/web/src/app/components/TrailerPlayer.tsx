import React, { useState, useEffect, useRef } from 'react';
import HlsPlayer from 'react-hls-player';

interface TrailerPlayerProps {
  movies?: any[];
  trailerDuration?: number; // in milliseconds
  movie?: any; // single movie mode
  onClose?: () => void;
}

export default function TrailerPlayer({ movies = [], trailerDuration = 10000, movie, onClose }: TrailerPlayerProps) {
  // If movie is provided, play that movie only
  const featuredTrailers = movie ? [movie] : (movies.filter(m => m.featured && (m.trailerUrl || m.videoUrl || m.hlsManifestUrl)));
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (!featuredTrailers.length) {
    return (
      <div className="mb-8 w-full aspect-w-16 aspect-h-9 bg-gray-800 flex items-center justify-center text-white">
        No featured trailers available
      </div>
    );
  }

  const currentMovie = featuredTrailers[current];
  const trailerUrl = currentMovie.trailerUrl || currentMovie.videoUrl || currentMovie.hlsManifestUrl;
  const description = currentMovie.description
    ? currentMovie.description.slice(0, 120) + (currentMovie.description.length > 120 ? '...' : '')
    : '';

  const handleError = (e: any) => {
    console.error('Video loading error:', e);
    setError(`Failed to load video: ${e.message || 'Unknown error'}`);
  };

  const handleVideoLoad = () => {
    console.log('Video loaded successfully');
    setError(null);
  };

  const isHls = trailerUrl && (trailerUrl.endsWith('.m3u8') || trailerUrl.includes('/hls/'));

  console.log('Current movie:', currentMovie);
  console.log('Current trailer URL:', trailerUrl);
  console.log('Is HLS:', isHls);

  return (
    <div className="mb-8 w-full">
      <div className="relative w-full" style={{ paddingTop: '35%' }}>
        {onClose && (
          <button onClick={onClose} className="absolute top-2 right-2 z-20 bg-black/60 text-white rounded-full p-2 hover:bg-black/80">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {error ? (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-white">
            {error}
          </div>
        ) : isHls ? (
          <HlsPlayer
            key={trailerUrl}
            src={trailerUrl}
            autoPlay={true}
            controls={true}
            muted={false}
            loop={false}
            width="100%"
            height="100%"
            playerRef={playerRef}
            onError={handleError}
            onLoad={handleVideoLoad}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <video
            key={trailerUrl}
            ref={videoRef}
            src={trailerUrl}
            width="100%"
            height="100%"
            muted={false}
            loop={false}
            playsInline
            autoPlay
            controls={true}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={handleError}
            onLoadedData={handleVideoLoad}
          />
        )}
        {/* Overlay description at the bottom of the video */}
        <div
          className="absolute bottom-0 left-0 w-full px-6 py-4"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0.0) 100%)',
            paddingBottom: '40px',
          }}
        >
          <p className="text-white text-lg font-medium" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
} 