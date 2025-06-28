'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function MovieDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/movies/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setMovie(data.data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!movie) return <div>Movie not found.</div>;

  const movieId = movie?._id;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row gap-8 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-6">
        <img
          src={movie.thumbnailUrl}
          alt={movie.title}
          className="w-full md:w-64 h-80 object-cover rounded-xl shadow-lg border border-gray-800"
        />
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl font-extrabold mb-4 text-white tracking-tight drop-shadow-lg">{movie.title}</h1>
            <p className="text-gray-300 mb-4 text-lg leading-relaxed">{movie.description}</p>
            <div className="flex flex-wrap gap-10 mb-4">
              {Array.isArray(movie.genre) ? movie.genre.map((g: string) => (
                <span key={g} className="px-3 py-1 bg-blue-800/80 text-blue-200 rounded-full text-xs font-semibold uppercase tracking-wide shadow">
                  {g}
                </span>
              )) : (
                <span className="px-3 py-1 bg-blue-800/80 text-blue-200 rounded-full text-xs font-semibold uppercase tracking-wide shadow">
                  {movie.genre}
                </span>
              )}
              <span className="px-3 py-1 bg-gray-800 text-gray-200 rounded-full text-xs font-semibold shadow">
                {movie.releaseYear}
              </span>
              <span className="px-3 py-1 bg-yellow-700 text-yellow-200 rounded-full text-xs font-semibold shadow">
                ★ {movie.rating}
              </span>
            </div>
          </div>
          <button
            className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-full shadow-lg transition drop-shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            onClick={() => {
              console.log('MovieDetailsPage: Navigating to watch page for movie ID:', movieId);
              if (movieId) {
                router.push(`/movies/${movieId}/watch`);
              } else {
                console.error('MovieDetailsPage: Cannot navigate to watch page, movie ID is undefined.');
              }
            }}
          >
            ▶ Watch Now
          </button>
        </div>
      </div>
    </div>
  );
} 