'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface Movie {
  _id: string;
  title: string;
  description: string;
  genre: string;
  rating: number;
  thumbnailUrl: string;
  videoUrl: string;
  featured: boolean;
  releaseYear?: number;
  duration: number;
}

// Form state type allows number | '' for numeric fields
type NewMovieForm = {
  title: string;
  description: string;
  genre: string;
  director: string;
  rating: number | '';
  thumbnailUrl: string;
  videoUrl: string;
  featured: boolean;
  duration: number | '';
  releaseYear: number | '';
};

export default function MovieManagement() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMovie, setNewMovie] = useState<NewMovieForm>({
    title: '',
    description: '',
    genre: '',
    director: '',
    rating: '',
    thumbnailUrl: '',
    videoUrl: '',
    featured: false,
    duration: '',
    releaseYear: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [selectedTrailer, setSelectedTrailer] = useState<File | null>(null);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [editingFeatured, setEditingFeatured] = useState<boolean>(false);
  const [updatingFeaturedId, setUpdatingFeaturedId] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const trailerInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedThumbnail(e.target.files[0]);
    }
  };

  const handleTrailerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedTrailer(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required number fields
    if (
      newMovie.releaseYear === '' ||
      newMovie.rating === '' ||
      newMovie.duration === ''
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        return;
      }

      if (!selectedFile || !selectedThumbnail) {
        toast.error('Please select both video and thumbnail files');
        return;
      }

      if (!selectedTrailer) {
        toast.error('Please select a trailer file');
        return;
      }

      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('thumbnail', selectedThumbnail);
      formData.append('trailer', selectedTrailer);
      formData.append('title', newMovie.title);
      formData.append('description', newMovie.description);
      formData.append('genre', JSON.stringify([newMovie.genre]));
      formData.append('releaseYear', newMovie.releaseYear.toString());
      formData.append('rating', newMovie.rating.toString());
      formData.append('featured', newMovie.featured.toString());
      formData.append('duration', newMovie.duration.toString());
      formData.append('director', newMovie.director);

      const loadingToast = toast.loading('Uploading movie...');

      const response = await fetch('http://localhost:3000/api/movies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success('Movie added successfully');
        setNewMovie({
          title: '',
          description: '',
          genre: '',
          director: '',
          rating: '',
          thumbnailUrl: '',
          videoUrl: '',
          featured: false,
          duration: '',
          releaseYear: '',
        });
        setSelectedFile(null);
        setSelectedThumbnail(null);
        setSelectedTrailer(null);
        if (videoInputRef.current) videoInputRef.current.value = '';
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
        if (trailerInputRef.current) trailerInputRef.current.value = '';
        fetchMovies();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error adding movie');
    }
  };

  const fetchMovies = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        return;
      }

      const response = await fetch('http://localhost:3000/api/movies?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMovies(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error fetching movies');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    if (!confirm('Are you sure you want to delete this movie?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        return;
      }

      const response = await fetch(`http://localhost:3000/api/movies/${movieId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Movie deleted successfully');
        fetchMovies();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error deleting movie');
    }
  };

  const handleEditClick = (movie: Movie) => {
    setEditingMovieId(movie._id);
    setEditingFeatured(movie.featured);
  };

  const handleSaveEdit = async (movieId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        return;
      }
      const response = await fetch(`http://localhost:3000/api/movies/${movieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ featured: editingFeatured }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Movie updated successfully');
        setEditingMovieId(null);
        fetchMovies();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating movie');
    }
  };

  const handleToggleFeatured = async (movie: Movie) => {
    setUpdatingFeaturedId(movie._id);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        return;
      }
      const response = await fetch(`http://localhost:3000/api/movies/${movie._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ featured: !movie.featured }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Featured status updated');
        fetchMovies();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating featured status');
    } finally {
      setUpdatingFeaturedId(null);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Add New Movie</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={newMovie.title}
              onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm bg-white text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newMovie.description}
              onChange={(e) => setNewMovie({ ...newMovie, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm bg-white text-gray-900"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Genre</label>
            <input
              type="text"
              value={newMovie.genre}
              onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm bg-white text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Release Year</label>
            <input
              type="number"
              value={newMovie.releaseYear === '' ? '' : newMovie.releaseYear}
              onChange={e => {
                const val = e.target.value;
                setNewMovie({ ...newMovie, releaseYear: val === '' ? '' : Number(val) });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm bg-white text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rating</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={newMovie.rating === '' ? '' : newMovie.rating}
              onChange={e => {
                const val = e.target.value;
                setNewMovie({ ...newMovie, rating: val === '' ? '' : Number(val) });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm bg-white text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input
              type="number"
              value={newMovie.duration === '' ? '' : newMovie.duration}
              onChange={e => {
                const val = e.target.value;
                setNewMovie({ ...newMovie, duration: val === '' ? '' : Number(val) });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm bg-white text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Director</label>
            <input
              type="text"
              value={newMovie.director}
              onChange={e => setNewMovie({ ...newMovie, director: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm bg-white text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Video File</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm bg-white text-gray-900"
              required
              ref={videoInputRef}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Thumbnail Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm bg-white text-gray-900"
              required
              ref={thumbnailInputRef}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Trailer File</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleTrailerChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm bg-white text-gray-900"
              required
              ref={trailerInputRef}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={newMovie.featured}
              onChange={(e) => setNewMovie({ ...newMovie, featured: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm font-medium text-gray-700">Featured Movie</label>
          </div>
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-semibold transition-colors">
            Add Movie
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Movies List</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thumbnail</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Genre</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Release Year</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movies.map((movie) => (
                  <tr key={movie._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {movie.thumbnailUrl ? (
                        <img
                          src={movie.thumbnailUrl}
                          alt={movie.title}
                          className="h-12 w-20 object-cover rounded border border-gray-200"
                          onError={e => (e.currentTarget.src = '/no-image.png')}
                        />
                      ) : (
                        <span className="text-xs text-gray-500">No Image</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{movie.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{movie.releaseYear}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{movie.duration}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{movie.rating}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleFeatured(movie)}
                        disabled={updatingFeaturedId === movie._id}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full focus:outline-none transition ${
                          movie.featured ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        } ${updatingFeaturedId === movie._id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-200 hover:text-purple-900'}`}
                        title="Toggle Featured"
                      >
                        {updatingFeaturedId === movie._id ? (
                          <svg className="animate-spin h-4 w-4 mr-1 inline-block text-purple-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                        ) : (
                          movie.featured ? 'Yes' : 'No'
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteMovie(movie._id)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 