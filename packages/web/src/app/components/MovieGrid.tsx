import MovieCard from './MovieCard';

export default function MovieGrid({ movies }: { movies: any[] }) {
  if (!movies.length) return <div className="text-gray-400 text-center py-8">No movies found.</div>;
  return (
    <div className="w-full flex flex-col space-y-8 py-4">
      {movies.map(movie => (
        <div key={movie._id} className="w-full">
          <MovieCard movie={movie} />
        </div>
      ))}
    </div>
  );
} 