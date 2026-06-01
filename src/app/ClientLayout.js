'use client';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

function NavBar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/90 to-transparent px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <a href="/" className="text-red-600 font-bold text-2xl tracking-tight">CINEWORLD</a>
        <a href="/" className="text-sm hover:text-gray-300 transition">Home</a>
        <a href="/premium" className="text-sm text-amber-400 hover:text-amber-300 transition">Premium</a>
        {user?.role === 'superadmin' && (
          <a href="/admin" className="text-sm hover:text-gray-300 transition">Admin</a>
        )}
      </div>
      <div className="flex items-center gap-4">
        {loading ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <a href="/profile" className="text-sm text-gray-300 hover:text-white transition">
              {user.displayName || user.username}
            </a>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 transition">
              Logout
            </button>
          </div>
        ) : (
          <>
            <a href="/login" className="text-sm hover:text-gray-300 transition">Login</a>
            <a href="/register" className="text-sm bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded transition">Sign Up</a>
          </>
        )}
      </div>
    </nav>
  );
}

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <NavBar />
      <main className="pt-16">{children}</main>
    </AuthProvider>
  );
}
