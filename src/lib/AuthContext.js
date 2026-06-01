'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, setToken, clearToken, isLoggedIn } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!isLoggedIn()) { setLoading(false); return; }
    try {
      const data = await auth.me();
      setUser(data.user);
    } catch {
      clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const data = await auth.login({ email, password });
    setToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const register = async (email, username, password, displayName) => {
    const data = await auth.register({ email, username, password, displayName });
    setToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
