const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() { return localStorage.getItem('access_token'); }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

export async function refreshToken() {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_expires', Date.now() + data.expires_in * 1000);
      return true;
    }
  } catch (e) { console.error('refresh error', e); }
  return false;
}

async function apiFetch(path, opts = {}) {
  const expires = parseInt(localStorage.getItem('token_expires') || '0');
  if (expires && Date.now() > expires - 60000) await refreshToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status} ${path}`);
  return res.json();
}

export const api = {
  me: () => apiFetch('/api/me'),
  topTracks: (time_range = 'medium_term') => apiFetch(`/api/top-tracks?time_range=${time_range}&limit=50`),
  // All 3 time periods combined (~150 unique tracks for mix)
  topTracksAll: () => apiFetch('/api/top-tracks-all'),
  topArtists: (time_range = 'medium_term') => apiFetch(`/api/top-artists?time_range=${time_range}&limit=50`),
  recent: () => apiFetch('/api/recent'),
  search: (q, type = 'track', limit = 6) => apiFetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`),
  // Search full Spotify artist catalog (beyond user's top 50)
  searchArtists: (q) => apiFetch(`/api/search-artists?q=${encodeURIComponent(q)}`),
  artistTracks: (artistId) => apiFetch(`/api/artists/${artistId}/tracks`),
  loginUrl: () => `${BASE}/auth/login`,
};
