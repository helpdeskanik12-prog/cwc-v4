'use client';
import { useState, useEffect } from 'react';

const REGIONS = ['', 'hollywood', 'bollywood', 'south', 'anime', 'bengali'];

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = (p = 1) => {
    setLoading(true);
    const params = { limit: 24, page: p };
    if (search) params.search = search;
    if (region) params.region = region;
    fetch(`/api/movies?${new URLSearchParams(params)}`)
      .then(r => r.json())
      .then(d => { setMovies(d.movies || []); setTotal(d.total || 0); setPage(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(1);
  };

  return (
    <div className="px-6 py-8">
      {/* Search + Filter Bar */}
      <div className="max-w-5xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search movies..."
            className="flex-1 bg-[#1f1f1f] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <select
            value={region} onChange={e => { setRegion(e.target.value); }}
            className="bg-[#1f1f1f] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="">All Regions</option>
            <option value="hollywood">Hollywood</option>
            <option value="bollywood">Bollywood</option>
            <option value="south">South Indian</option>
            <option value="anime">Anime</option>
            <option value="bengali">Bengali</option>
          </select>
          <button type="submit" className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition">
            Search
          </button>
        </form>
      </div>

      <h1 className="text-3xl font-bold mb-6">
        {region ? `${region.charAt(0).toUpperCase() + region.slice(1)} Movies` : 'Trending Movies'}
        {search && <span className="text-lg text-gray-400 font-normal ml-2">— "{search}"</span>}
      </h1>

      {loading ? (
        <div className="flex justify-center pt-16">
          <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies.map(m => (
              <a key={m.id} href={`/movie/${m.slug || m.id}`} className="group">
                <div className="aspect-[2/3] bg-[#1f1f1f] rounded-lg overflow-hidden relative">
                  {m.thumbnail ? (
                    <img src={m.thumbnail} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-5xl">🎬</div>
                  )}
                  {m.region && (
                    <span className="absolute top-2 left-2 text-[10px] bg-black/70 px-1.5 py-0.5 rounded uppercase">{m.region}</span>
                  )}
                  {m.duration > 0 && (
                    <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 px-1.5 py-0.5 rounded">
                      {Math.floor(m.duration / 60)}m
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm truncate group-hover:text-white transition">{m.title}</p>
                {m.category && <p className="text-xs text-gray-500 truncate">{m.category}</p>}
              </a>
            ))}
          </div>

          {movies.length === 0 && (
            <p className="text-center text-gray-500 py-20">
              {search ? `No movies found for "${search}"` : 'No movies yet. Add some from the admin panel!'}
            </p>
          )}

          {/* Pagination */}
          {total > 24 && (
            <div className="flex justify-center gap-4 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                className="bg-[#1f1f1f] hover:bg-[#333] disabled:opacity-30 px-5 py-2 rounded text-sm transition"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400 py-2">Page {page}</span>
              <button
                disabled={page * 24 >= total}
                onClick={() => load(page + 1)}
                className="bg-[#1f1f1f] hover:bg-[#333] disabled:opacity-30 px-5 py-2 rounded text-sm transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
