'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { admin, movies, categories } from '@/lib/api';
import { useRouter } from 'next/navigation';

function DashboardStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    admin.dashboard().then(setStats).catch(() => {});
  }, []);
  if (!stats) return <div className="text-gray-500 animate-pulse">Loading stats...</div>;
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label: 'Users', value: stats.users, color: 'text-blue-400' },
        { label: 'Movies', value: stats.movies, color: 'text-green-400' },
        { label: 'Categories', value: stats.categories, color: 'text-purple-400' },
      ].map(s => (
        <div key={s.label} className="bg-[#1f1f1f] rounded-lg p-4 text-center">
          <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
          <div className="text-sm text-gray-500 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function UsersTable() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    admin.users().then(d => setUsers(d.users || [])).catch(() => {});
  }, []);
  return (
    <div className="bg-[#1f1f1f] rounded-lg overflow-hidden mb-8">
      <h3 className="text-lg font-semibold p-4 border-b border-[#333]">Users</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left border-b border-[#333]">
              <th className="p-3">User</th><th className="p-3">Email</th><th className="p-3">Role</th>
              <th className="p-3">Status</th><th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-[#2a2a2a] hover:bg-[#282828]">
                <td className="p-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold">
                    {(u.displayName || u.username)[0].toUpperCase()}
                  </div>
                  {u.displayName || u.username}
                </td>
                <td className="p-3 text-gray-400">{u.email}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${u.role === 'superadmin' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3">
                  {u.isBanned ? <span className="text-red-400">Banned</span> : u.isActive ? <span className="text-green-400">Active</span> : <span className="text-gray-500">Inactive</span>}
                </td>
                <td className="p-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MovieManager() {
  const [movies, setMovies] = useState([]);
  const [cats, setCats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', slug: '', description: '', thumbnail: '', videoUrl: '', duration: 0, region: 'hollywood', category: '' });
  const [error, setError] = useState('');

  const load = () => {
    movies.list({ limit: 200 }).then(d => setMovies(d.movies || [])).catch(() => {});
    categories.list().then(d => setCats(d.categories || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const reset = () => { setForm({ title: '', slug: '', description: '', thumbnail: '', videoUrl: '', duration: 0, region: 'hollywood', category: '' }); setEditId(null); setError(''); };
  const update = (k) => (e) => setForm({ ...form, [k]: k === 'duration' ? parseInt(e.target.value) || 0 : e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title) { setError('Title required'); return; }
    try {
      if (editId) {
        await movies.update(editId, form);
      } else {
        await movies.create(form);
      }
      setShowForm(false);
      reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this movie?')) return;
    try {
      await movies.delete(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const startEdit = (m) => {
    setForm({ title: m.title, slug: m.slug || '', description: m.description || '', thumbnail: m.thumbnail || '', videoUrl: m.videoUrl || '', duration: m.duration || 0, region: m.region || 'hollywood', category: m.category || '' });
    setEditId(m.id);
    setShowForm(true);
  };

  return (
    <div className="bg-[#1f1f1f] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#333]">
        <h3 className="text-lg font-semibold">Movies</h3>
        <button onClick={() => { reset(); setShowForm(!showForm); }} className="text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition">
          {showForm ? 'Cancel' : '+ Add Movie'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-[#333] space-y-3">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-2 rounded">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Title *</label>
              <input value={form.title} onChange={update('title')} className="w-full bg-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slug</label>
              <input value={form.slug} onChange={update('slug')} className="w-full bg-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="auto-generated" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thumbnail URL</label>
              <input value={form.thumbnail} onChange={update('thumbnail')} className="w-full bg-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Video URL (YouTube embed)</label>
              <input value={form.videoUrl} onChange={update('videoUrl')} className="w-full bg-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="https://www.youtube.com/embed/..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Duration (seconds)</label>
              <input type="number" value={form.duration} onChange={update('duration')} className="w-full bg-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Region</label>
              <select value={form.region} onChange={update('region')} className="w-full bg-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500">
                <option value="hollywood">Hollywood</option>
                <option value="bollywood">Bollywood</option>
                <option value="south">South Indian</option>
                <option value="anime">Anime</option>
                <option value="bengali">Bengali</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <input value={form.category} onChange={update('category')} className="w-full bg-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="Action, Drama, etc." />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea value={form.description} onChange={update('description')} rows={2} className="w-full bg-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500" />
          </div>
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm px-6 py-2 rounded transition">
            {editId ? 'Update Movie' : 'Add Movie'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left border-b border-[#333]">
              <th className="p-3">Title</th><th className="p-3">Region</th><th className="p-3">Category</th>
              <th className="p-3">Views</th><th className="p-3">Added</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map(m => (
              <tr key={m.id} className="border-b border-[#2a2a2a] hover:bg-[#282828]">
                <td className="p-3">
                  <a href={`/movie/${m.slug || m.id}`} className="hover:text-red-400 transition">{m.title}</a>
                </td>
                <td className="p-3 text-gray-400 capitalize">{m.region}</td>
                <td className="p-3 text-gray-400">{m.category || '—'}</td>
                <td className="p-3 text-gray-400">{m.views || 0}</td>
                <td className="p-3 text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <button onClick={() => startEdit(m)} className="text-blue-400 hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {movies.length === 0 && <p className="text-center text-gray-500 py-8">No movies yet. Add your first one!</p>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'superadmin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="flex justify-center pt-32"><div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" /></div>;
  if (user.role !== 'superadmin') return null;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      <DashboardStats />
      <UsersTable />
      <MovieManager />
    </div>
  );
}
