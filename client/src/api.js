const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SP   = 'https://api.spotify.com/v1';

// ─── Rate limiter global : max ~2 req/sec pour éviter le 429 ─────────────────
// Toutes les requêtes (Railway + direct Spotify) partagent ce compteur
// car elles utilisent le même access_token.
let _lastReq = 0;
const RATE_MS = 600; // 600ms entre requêtes (~1.6/sec, safe pour éviter 429)

async function throttle() {
  const wait = Math.max(0, RATE_MS - (Date.now() - _lastReq));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  _lastReq = Date.now();
}

// ─── Token refresh (serveur seulement — besoin du client_secret) ─────────────
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

// ─── Appel via serveur Railway (search, artistTracks) ───────────────────────
async function apiFetch(path, _retry=2) {
  await throttle();
  await ensureFreshToken();
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429) {
    if (_retry <= 0) throw new Error('Rate limit 429 — réessaie dans quelques secondes');
    const wait = Math.max(8000, (parseInt(res.headers.get('Retry-After') || '8') + 2) * 1000);
    console.warn(`[api] Railway 429 → 1 retry dans ${Math.round(wait/1000)}s`);
    await new Promise(r => setTimeout(r, wait));
    return apiFetch(path, 0); // max 1 retry
  }
  if (!res.ok) throw new Error(`Server ${res.status}: ${path}`);
  return res.json();
}

// ─── Appel direct Spotify (données perso, pool building) ────────────────────
// Partage le même rate limiter que apiFetch → pas de double-dépense du quota
export async function spFetch(path, _retry=2) {
  await throttle();
  await ensureFreshToken();
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No access token');
  const res = await fetch(`${SP}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429) {
    if (_retry <= 0) throw new Error('Rate limit 429 — réessaie dans quelques secondes');
    const wait = Math.max(8000, (parseInt(res.headers.get('Retry-After') || '8') + 2) * 1000);
    console.warn(`[api] Spotify 429 → 1 retry dans ${Math.round(wait/1000)}s`);
    await new Promise(r => setTimeout(r, wait));
    return spFetch(path, 0); // max 1 retry
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
  // Search via Railway (garde le rate limiter global via throttle)
  search: (q, type = 'track', limit = 6, offset = 0) =>
    apiFetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}&offset=${offset}`),
  artistTracks: (id) => apiFetch(`/api/artists/${id}/tracks`),
  artistAllTracks: (id) => apiFetch(`/api/artists/${id}/all-tracks`),
  artistAlbums: (id) => apiFetch(`/api/artists/${id}/albums`),
  albums: (ids) => apiFetch(`/api/albums?ids=${ids.join(',')}`),
  loginUrl: () => `${BASE}/auth/login`,
};
