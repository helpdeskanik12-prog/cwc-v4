'use client';
import { useState, useEffect } from 'react';

export default function MoviePage({ params }) {
  const [movie, setMovie] = useState(null);
  const id = params?.id;

  useEffect(() => {
    if (!id) return;
    fetch(`/api/movies/${id}`).then(r => r.json()).then(d => setMovie(d.movie));
  }, [id]);

  if (!movie) return <div className="flex justify-center pt-32"><div className="animate-pulse text-2xl text-gray-500">Loading...</div></div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
      {movie.category && <span className="text-sm bg-red-600 px-2 py-1 rounded mr-2">{movie.category}</span>}
      <span className="text-sm text-gray-400">{movie.region?.toUpperCase()}</span>

      <div className="mt-6 aspect-video bg-black rounded overflow-hidden">
        {movie.videoUrl ? (
          <iframe src={movie.videoUrl} className="w-full h-full" allowFullScreen allow="autoplay;encrypted-media" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-6xl">🎬</div>
        )}
      </div>

      {movie.description && <p className="mt-6 text-gray-300 leading-relaxed">{movie.description}</p>}

      {movie.duration > 0 && <p className="mt-4 text-sm text-gray-500">Duration: {Math.floor(movie.duration / 60)}m {movie.duration % 60}s</p>}
      <p className="text-sm text-gray-500">Views: {movie.views || 0} | Rating: {movie.rating || 'N/A'}</p>
    </div>
  );
}
