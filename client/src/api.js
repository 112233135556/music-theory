const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SP   = 'https://api.spotify.com/v1';

// ─── Rate limiter UNIQUEMENT pour les calls directs Spotify (spFetch) ───────
// apiFetch (Railway) n'a pas besoin de throttle côté client
let _lastDirect = 0;
const DIRECT_MS = 500; // 500ms entre calls directs Spotify

async function throttleDirect() {
  const wait = Math.max(0, DIRECT_MS - (Date.now() - _lastDirect));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  _lastDirect = Date.now();
}

// ─── Token refresh ────────────────────────────────────────────────────────────
export async function refreshToken() {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });
    const d = await res.json();
    if (d.access_token) {
      localStorage.setItem('access_token', d.access_token);
      localStorage.setItem('token_expires', Date.now() + d.expires_in * 1000);
      return true;
    }
  } catch (e) { console.error('[api] refresh error', e); }
  return false;
}

async function ensureFreshToken() {
  const expires = parseInt(localStorage.getItem('token_expires') || '0');
  if (expires && Date.now() > expires - 60000) await refreshToken();
}

// ─── Rate limiter léger pour apiFetch (Railway) ──────────────────────────────
let _lastRailway = 0;
const RAILWAY_MS = 200; // 200ms minimum entre calls Railway (moins strict que direct)
async function throttleRailway() {
  const wait = Math.max(0, RAILWAY_MS - (Date.now() - _lastRailway));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  _lastRailway = Date.now();
}

// ─── apiFetch : appel via Railway (search, artistTracks) ─────────────────────
async function apiFetch(path, _retry=1) {
  await throttleRailway();
  await ensureFreshToken();
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429) {
    if (_retry <= 0) throw new Error('Rate limit 429 — réessaie dans quelques secondes');
    const wait = Math.max(5000, (parseInt(res.headers.get('Retry-After') || '5') + 1) * 1000);
    console.warn(`[api] Railway 429 → retry dans ${Math.round(wait/1000)}s`);
    await new Promise(r => setTimeout(r, wait));
    return apiFetch(path, 0);
  }
  if (!res.ok) throw new Error(`Server ${res.status}: ${path}`);
  return res.json();
}

// ─── spFetch : appel direct Spotify (données perso uniquement) ────────────────
// Throttlé à 500ms — utilisé SEULEMENT pour /me/top/* et /me (user data)
export async function spFetch(path, _retry=1) {
  await throttleDirect();
  await ensureFreshToken();
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No access token');
  const res = await fetch(`${SP}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429) {
    if (_retry <= 0) throw new Error('Rate limit 429');
    const wait = Math.max(8000, (parseInt(res.headers.get('Retry-After') || '8') + 2) * 1000);
    console.warn(`[api] Spotify 429 → retry dans ${Math.round(wait/1000)}s`);
    await new Promise(r => setTimeout(r, wait));
    return spFetch(path, 0);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Spotify ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}

export const api = {
  me: () => spFetch('/me'),
  topTracks: (tr = 'medium_term') => spFetch(`/me/top/tracks?time_range=${tr}&limit=50`),
  topTracksAll: async () => {
    const [s, m, l] = await Promise.all([
      spFetch('/me/top/tracks?time_range=short_term&limit=50'),
      spFetch('/me/top/tracks?time_range=medium_term&limit=50'),
      spFetch('/me/top/tracks?time_range=long_term&limit=50'),
    ]);
    const seen = new Set();
    const all = [...(s.items||[]), ...(m.items||[]), ...(l.items||[])].filter(t => {
      if (seen.has(t.id)) return false; seen.add(t.id); return true;
    });
    return { items: all };
  },
  topArtists: (tr = 'medium_term') => spFetch(`/me/top/artists?time_range=${tr}&limit=50`),
  // Search via Railway — PAS de throttle client, réactif pour la recherche artiste
  search: (q, type = 'track', limit = 6, offset = 0) =>
    apiFetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}&offset=${offset}`),
  artistTracks: (id) => apiFetch(`/api/artists/${id}/tracks`),
  artistAllTracks: (id) => apiFetch(`/api/artists/${id}/all-tracks`),
  artistAlbums: (id) => apiFetch(`/api/artists/${id}/albums`),
  albums: (ids) => apiFetch(`/api/albums?ids=${ids.join(',')}`),
  loginUrl: () => `${BASE}/auth/login`,
};
