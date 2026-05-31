'use client';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/movies?limit=50').then(r => r.json()).then(d => {
      setMovies(d.movies || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-32"><div className="animate-pulse text-2xl text-gray-500">Loading...</div></div>;

  return (
    <div className="px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Trending Movies</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {movies.map(m => (
          <a key={m.id} href={`/movie/${m.slug || m.id}`} className="group">
            <div className="aspect-[2/3] bg-[#1f1f1f] rounded overflow-hidden">
              {m.thumbnail ? (
                <img src={m.thumbnail} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-5xl">🎬</div>
              )}
            </div>
            <p className="mt-2 text-sm truncate group-hover:text-white">{m.title}</p>
          </a>
        ))}
      </div>
      {movies.length === 0 && <p className="text-center text-gray-500 py-20">No movies yet. Add some from the admin panel!</p>}
    </div>
  );
}
