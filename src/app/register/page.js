'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', username: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { email, username, password } = form;
    if (!email || !username || !password) { setError('Email, username, and password required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(email, username, password, form.displayName);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#1f1f1f] rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input type="text" value={form.username} onChange={update('username')}
              className="w-full bg-[#333] rounded px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="cooluser" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Display Name</label>
            <input type="text" value={form.displayName} onChange={update('displayName')}
              className="w-full bg-[#333] rounded px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="Cool User" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" value={form.email} onChange={update('email')}
              className="w-full bg-[#333] rounded px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="you@email.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input type="password" value={form.password} onChange={update('password')}
              className="w-full bg-[#333] rounded px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="Min 6 characters" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded transition">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <a href="/login" className="text-red-500 hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}
