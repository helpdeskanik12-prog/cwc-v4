'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) return <div className="flex justify-center pt-32"><div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" /></div>;
  if (!user) return null;

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="bg-[#1f1f1f] rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-[#333]">
          <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-2xl font-bold">
            {(user.displayName || user.username)[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.displayName || user.username}</h2>
            <p className="text-sm text-gray-400">@{user.username}</p>
          </div>
          {user.role === 'superadmin' && (
            <span className="ml-auto bg-red-600/20 text-red-400 text-xs px-3 py-1 rounded-full">Admin</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Email</span>
            <p className="mt-1">{user.email}</p>
          </div>
          <div>
            <span className="text-gray-500">Member Since</span>
            <p className="mt-1">{new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div>
            <span className="text-gray-500">Status</span>
            <p className="mt-1">
              {user.isBanned ? <span className="text-red-400">Banned</span> : user.isActive ? <span className="text-green-400">Active</span> : <span className="text-gray-400">Inactive</span>}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Last Login</span>
            <p className="mt-1">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#333]">
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-6 py-2 rounded transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
