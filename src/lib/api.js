const BASE = '/api';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('cwc_token') : null; }

async function api(endpoint, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${endpoint}`, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const auth = {
  register: (body) => api('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => api('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
};

export const movies = {
  list: (params) => api(`/movies?${new URLSearchParams(params || {})}`),
  get: (id) => api(`/movies/${id}`),
  create: (body) => api('/movies', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/movies/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/movies/${id}`, { method: 'DELETE' }),
};

export const admin = {
  dashboard: () => api('/admin/dashboard'),
  users: () => api('/admin/users'),
};

export const categories = {
  list: () => api('/categories'),
};

export function setToken(t) { localStorage.setItem('cwc_token', t); }
export function clearToken() { localStorage.removeItem('cwc_token'); }
export function isLoggedIn() { return !!getToken(); }
