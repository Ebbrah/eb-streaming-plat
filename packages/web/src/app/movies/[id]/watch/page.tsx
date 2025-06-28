'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import HlsPlayer from 'react-hls-player';

export default function MovieWatchPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    console.log('MovieWatchPage: useParams ID:', id);
    if (!id) {
      console.error('MovieWatchPage: Movie ID is undefined!');
      setLoading(false);
      // Optionally set an error state to display a message to the user
      return;
    }
    
    console.log('Fetching movie with ID:', id);
    fetch(`/api/movies/${id}`)
      .then(res => {
        console.log('Movie fetch response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Movie data:', data);
        if (data.success) {
          setMovie(data.data);
          console.log('Movie set:', data.data);
        } else {
          console.error('Failed to fetch movie:', data.message);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching movie:', error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!movie) return <div>Movie not found.</div>;

  console.log('Rendering movie:', movie);
  const isHls = movie.hlsManifestUrl && movie.hlsManifestUrl.endsWith('.m3u8');
  console.log('Is HLS:', isHls, 'Video URL:', movie.videoUrl, 'HLS URL:', movie.hlsManifestUrl);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">{movie.title}</h1>
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        {isHls ? (
          <HlsPlayer
            key={movie.hlsManifestUrl}
            src={movie.hlsManifestUrl}
            autoPlay={true}
            controls={true}
            muted={false}
            loop={false}
            width="100%"
            height="100%"
            playerRef={playerRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <video
            key={movie.videoUrl}
            ref={videoRef}
            src={movie.videoUrl}
            width="100%"
            height="100%"
            controls
            autoPlay
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
    </div>
  );
} 