const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI  = process.env.REDIRECT_URI  || 'http://localhost:3001/auth/callback';
const FRONTEND_URL  = process.env.FRONTEND_URL  || 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

function rand(n) {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('');
}
function authHeader() {
  return 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
}
async function spGet(url, token) {
  return axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
}

// ── Auth ──────────────────────────────────────────────────
app.get('/auth/login', (req, res) => {
  const state = rand(16);
  res.cookie('spotify_state', state, { httpOnly: true, sameSite: 'lax' });
  const scopes = ['user-read-private','user-read-email','user-top-read',
    'user-read-recently-played','streaming','user-read-playback-state',
    'user-modify-playback-state'].join(' ');
  const qs = new URLSearchParams({ response_type:'code', client_id:CLIENT_ID,
    scope:scopes, redirect_uri:REDIRECT_URI, state });
  res.redirect(`https://accounts.spotify.com/authorize?${qs}`);
});

app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error || state !== req.cookies.spotify_state)
    return res.redirect(`${FRONTEND_URL}?error=auth_failed`);
  res.clearCookie('spotify_state');
  try {
    const { data } = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({ code, redirect_uri:REDIRECT_URI, grant_type:'authorization_code' }),
      { headers: { Authorization:authHeader(), 'Content-Type':'application/x-www-form-urlencoded' } });
    const qs = new URLSearchParams({ access_token:data.access_token,
      refresh_token:data.refresh_token, expires_in:data.expires_in });
    res.redirect(`${FRONTEND_URL}/callback?${qs}`);
  } catch(e) {
    console.error('[callback]', e.response?.data || e.message);
    res.redirect(`${FRONTEND_URL}?error=token_failed`);
  }
});

app.post('/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'missing' });
  try {
    const { data } = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type:'refresh_token', refresh_token }),
      { headers: { Authorization:authHeader(), 'Content-Type':'application/x-www-form-urlencoded' } });
    res.json(data);
  } catch(e) { res.status(400).json({ error: 'refresh_failed' }); }
});

// ── API proxy ─────────────────────────────────────────────
app.get('/api/me', async (req,res) => {
  const t = req.headers.authorization?.split(' ')[1];
  try { res.json((await spGet('https://api.spotify.com/v1/me', t)).data); }
  catch(e) { res.status(e.response?.status||500).json(e.response?.data); }
});

app.get('/api/top-tracks', async (req,res) => {
  const t = req.headers.authorization?.split(' ')[1];
  const { time_range='medium_term', limit=50 } = req.query;
  try { res.json((await spGet(`https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=${limit}`, t)).data); }
  catch(e) { res.status(e.response?.status||500).json(e.response?.data); }
});

app.get('/api/top-artists', async (req,res) => {
  const t = req.headers.authorization?.split(' ')[1];
  const { time_range='medium_term', limit=50 } = req.query;
  try { res.json((await spGet(`https://api.spotify.com/v1/me/top/artists?time_range=${time_range}&limit=${limit}`, t)).data); }
  catch(e) { res.status(e.response?.status||500).json(e.response?.data); }
});

app.get('/api/recent', async (req,res) => {
  const t = req.headers.authorization?.split(' ')[1];
  try { res.json((await spGet('https://api.spotify.com/v1/me/player/recently-played?limit=50', t)).data); }
  catch(e) { res.status(e.response?.status||500).json(e.response?.data); }
});

app.get('/api/search', async (req,res) => {
  const t = req.headers.authorization?.split(' ')[1];
  const { q, type='track', limit=6 } = req.query;
  try { res.json((await spGet(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}&market=FR`, t)).data); }
  catch(e) { res.status(e.response?.status||500).json(e.response?.data); }
});

app.get('/api/artists/:id/tracks', async (req,res) => {
  const t = req.headers.authorization?.split(' ')[1];
  try { res.json((await spGet(`https://api.spotify.com/v1/artists/${req.params.id}/top-tracks?market=FR`, t)).data); }
  catch(e) { res.status(e.response?.status||500).json(e.response?.data); }
});

app.get('/health', (_, res) => res.json({ ok:true }));

// ── WebSocket 1v1 ─────────────────────────────────────────
const rooms = new Map();
function send(ws, obj) { if (ws?.readyState===1) ws.send(JSON.stringify(obj)); }

wss.on('connection', (ws) => {
  ws.id = rand(8); ws.roomCode = null; ws.role = null;
  ws.on('message', raw => { try { handleWS(ws, JSON.parse(raw)); } catch(e){} });
  ws.on('close', () => {
    if (!ws.roomCode) return;
    const r = rooms.get(ws.roomCode);
    if (!r) return;
    const other = ws.role==='host' ? r.guest : r.host;
    send(other, { type:'opponent_left' });
    rooms.delete(ws.roomCode);
  });
});

function handleWS(ws, msg) {
  switch(msg.type) {
    case 'create_room': {
      const code = rand(4).toUpperCase();
      rooms.set(code, { host:ws, guest:null, settings:msg.settings });
      ws.roomCode=code; ws.role='host';
      send(ws, { type:'room_created', code });
      break;
    }
    case 'join_room': {
      const r = rooms.get(msg.code?.toUpperCase());
      if (!r) return send(ws, { type:'error', msg:'Room introuvable' });
      if (r.guest) return send(ws, { type:'error', msg:'Room pleine' });
      r.guest=ws; ws.roomCode=msg.code.toUpperCase(); ws.role='guest';
      send(ws, { type:'room_joined', settings:r.settings });
      send(r.host, { type:'guest_joined', name:msg.name||'Joueur 2' });
      break;
    }
    case 'artist_update': {
      const r = rooms.get(ws.roomCode); if (!r) return;
      send(ws.role==='host'?r.guest:r.host, { type:'artist_update', artists:msg.artists, mix:msg.mix });
      break;
    }
    case 'game_start': {
      const r = rooms.get(ws.roomCode); if (!r||ws.role!=='host') return;
      send(r.guest, { type:'game_start', tracks:msg.tracks });
      break;
    }
    case 'answer_found': {
      const r = rooms.get(ws.roomCode); if (!r) return;
      send(ws.role==='host'?r.guest:r.host, { type:'opponent_found', time:msg.time, score:msg.score });
      break;
    }
    case 'host_control': {
      const r = rooms.get(ws.roomCode); if (!r||ws.role!=='host') return;
      send(r.guest, { type:'host_control', action:msg.action, value:msg.value });
      break;
    }
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ music-theory server on :${PORT}`));
