const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SP   = 'https://api.spotify.com/v1';

// ─── Token refresh (passe par le serveur — besoin du client_secret) ─────────
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

// ─── Appel via le serveur proxy (search, artistTracks) ───────────────────────
// On route search et artistTracks par le serveur parce qu'ils fonctionnent
// déjà pour l'autocomplete des sons — même chemin, mêmes headers.
async function apiFetch(path) {
  await ensureFreshToken();
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Server ${res.status}: ${path}`);
  return res.json();
}

// ─── Appel direct Spotify (données utilisateur) ───────────────────────────────
// Les données perso (top tracks, top artists, me) fonctionnent en direct —
// Spotify supporte CORS pour ces endpoints.
export async function spFetch(path) {
  await ensureFreshToken();
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${SP}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Spotify ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}

export const api = {
  // Données perso — direct Spotify (CORS OK pour /me/top/*)
  me: () => spFetch('/me'),
  topTracks: (tr = 'medium_term') => spFetch(`/me/top/tracks?time_range=${tr}&limit=50`),
  topArtists: (tr = 'medium_term') => spFetch(`/me/top/artists?time_range=${tr}&limit=50`),

  // Mix perso = 3 périodes combinées (~150 tracks uniques)
  topTracksAll: async () => {
    const [s, m, l] = await Promise.all([
      spFetch('/me/top/tracks?time_range=short_term&limit=50'),
      spFetch('/me/top/tracks?time_range=medium_term&limit=50'),
      spFetch('/me/top/tracks?time_range=long_term&limit=50'),
    ]);
    const seen = new Set();
    const all = [...(s.items||[]), ...(m.items||[]), ...(l.items||[])].filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
    return { items: all };
  },

  // Search via serveur — FONCTIONNE pour les sons (autocomplete en jeu),
  // donc aussi pour les artistes. limit=6 identique à ce qui marche.
  search: (q, type = 'track', limit = 6, offset = 0) =>
    apiFetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}&offset=${offset}`),

  // Tracks d'un artiste via serveur (endpoint /api/artists/:id/tracks)
  artistTracks: (id) => apiFetch(`/api/artists/${id}/tracks`),
  // Catalogue complet : server fait albums+tracks en une requête (pas de limit issues)
  artistAllTracks: (id) => apiFetch(`/api/artists/${id}/all-tracks`),
  // Catalogue complet : albums puis tracks par batch
  artistAlbums: (id) => apiFetch(`/api/artists/${id}/albums`),
  albums: (ids) => apiFetch(`/api/albums?ids=${ids.join(',')}`),

  loginUrl: () => `${BASE}/auth/login`,
};
