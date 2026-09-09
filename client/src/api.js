// ─── API client ────────────────────────────────────────────
// Toutes les requêtes vers ton serveur Railway passent par ici

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Récupère le token stocké localement
function getToken() {
  return localStorage.getItem('access_token');
}

// Header d'auth Spotify
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

// Refresh le token si expiré
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

// Wrapper qui gère le refresh auto si token expiré
async function apiFetch(path, opts = {}) {
  const expires = parseInt(localStorage.getItem('token_expires') || '0');
  if (expires && Date.now() > expires - 60000) {
    await refreshToken();
  }
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export const api = {
  // Profil utilisateur
  me: () => apiFetch('/api/me'),

  // Top tracks (time_range: short_term | medium_term | long_term)
  topTracks: (time_range = 'medium_term') =>
    apiFetch(`/api/top-tracks?time_range=${time_range}&limit=50`),

  // Top artistes
  topArtists: (time_range = 'medium_term') =>
    apiFetch(`/api/top-artists?time_range=${time_range}&limit=50`),

  // Récemment écouté
  recent: () => apiFetch('/api/recent'),

  // Recherche (tracks ou artists)
  search: (q, type = 'track', limit = 6) =>
    apiFetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`),

  // Top tracks d'un artiste (pour construire la pool de sons)
  artistTracks: (artistId) => apiFetch(`/api/artists/${artistId}/tracks`),

  // URL de login Spotify
  loginUrl: () => `${BASE}/auth/login`,
};
