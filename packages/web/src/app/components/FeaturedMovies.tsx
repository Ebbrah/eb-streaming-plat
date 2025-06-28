import MovieCard from './MovieCard';

export default function FeaturedMovies({ movies }: { movies: any[] }) {
  if (!movies.length) return null;
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-2">Featured</h2>
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {movies.map(movie => (
          <div key={movie._id} className="min-w-[200px]">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </div>
  );
} 