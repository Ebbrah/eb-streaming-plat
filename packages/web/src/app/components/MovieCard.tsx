import Link from 'next/link';
import { useState } from 'react';

export default function MovieCard({ movie, onClick }: { movie: any; onClick?: (movie: any) => void }) {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(movie);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative rounded-xl overflow-hidden shadow-lg bg-gray-900 border border-gray-800 hover:scale-105 hover:shadow-2xl transition-all duration-300 ease-in-out cursor-pointer group w-full transform hover:-translate-y-1"
      style={{ aspectRatio: '16/9', minHeight: 5 }}
    >
      {/* Thumbnail Image */}
      <div className="relative w-full h-full">
        {!imageError ? (
          <img
            src={movie.thumbnailUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            style={{ aspectRatio: '16/9', minHeight: 5 }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400 text-lg">No Image</span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300">
            <div className="bg-blue-600/90 p-4 rounded-full shadow-lg transform group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-bold text-white text-lg truncate mb-1 group-hover:text-blue-400 transition-colors duration-300">
            {movie.title}
          </h3>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-blue-400 font-medium">
              {movie.releaseYear}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-300">
              {Array.isArray(movie.genre) ? movie.genre[0] : movie.genre}
            </span>
          </div>
          {movie.rating && (
            <div className="mt-2 flex items-center">
              <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-yellow-400 font-medium">{movie.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 