// ─── Config ──────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SP   = 'https://api.spotify.com/v1';

// ─── Token refresh (must go through server — needs client_secret) ─
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

// ─── Direct Spotify API caller ──────────────────────────────────
// Bypasses the server proxy → no CORS issues, no proxy failures,
// and Spotify automatically uses the token's market (no restriction).
async function spFetch(path) {
  const expires = parseInt(localStorage.getItem('token_expires') || '0');
  if (expires && Date.now() > expires - 60000) await refreshToken();

  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No access token');

  const res = await fetch(`${SP}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Spotify ${res.status}: ${JSON.stringify(body)}`);
  }
  return res.json();
}

// ─── API surface ────────────────────────────────────────────────
export const api = {
  // User profile
  me: () => spFetch('/me'),

  // Single time range
  topTracks: (time_range = 'medium_term') =>
    spFetch(`/me/top/tracks?time_range=${time_range}&limit=50`),

  // All 3 periods combined → up to ~150 unique tracks for mix perso
  topTracksAll: async () => {
    const [s, m, l] = await Promise.all([
      spFetch('/me/top/tracks?time_range=short_term&limit=50'),
      spFetch('/me/top/tracks?time_range=medium_term&limit=50'),
      spFetch('/me/top/tracks?time_range=long_term&limit=50'),
    ]);
    const seen = new Set();
    const all = [...(s.items || []), ...(m.items || []), ...(l.items || [])].filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
    return { items: all };
  },

  // Top artists
  topArtists: (time_range = 'medium_term') =>
    spFetch(`/me/top/artists?time_range=${time_range}&limit=50`),

  // Search tracks (autocomplete during game)
  search: (q, type = 'track', limit = 6) =>
    spFetch(`/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`),

  // Search full Spotify artist catalog
  searchArtists: (q) =>
    spFetch(`/search?q=${encodeURIComponent(q)}&type=artist&limit=12`),

  // Artist top tracks — direct call, Spotify uses token market automatically
  artistTracks: (id) => spFetch(`/artists/${id}/top-tracks`),

  loginUrl: () => `${BASE}/auth/login`,
};
