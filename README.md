# music theory — blindtest Spotify

## Structure
```
music-theory/
├── server/     → backend Node.js (déployer sur Railway)
└── client/     → frontend React/Vite (déployer sur Vercel)
```

## Variables d'environnement

### server/.env (Railway)
```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
REDIRECT_URI=https://TON_URL.railway.app/auth/callback
FRONTEND_URL=https://TON_URL.vercel.app
```

### client/.env (Vercel)
```
VITE_API_URL=https://TON_URL.railway.app
```

## Spotify Developer Dashboard
- Redirect URI à ajouter : `https://TON_URL.railway.app/auth/callback`
- Scopes : user-read-private, user-read-email, user-top-read, user-read-recently-played, streaming, user-read-playback-state, user-modify-playback-state
