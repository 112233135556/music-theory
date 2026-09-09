import React, { useEffect, useState, useCallback } from 'react';
import { api } from './api';

// ─── Styles injectés ───────────────────────────────────────
const CSS = `
  @import url('https://fonts.cdnfonts.com/css/sf-pro-display');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --F:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',system-ui,sans-serif;
    --t1:hsla(0,0%,100%,.92);--t2:hsla(0,0%,100%,.6);--t3:hsla(0,0%,100%,.35);--t4:hsla(0,0%,100%,.18);
    --matReg:rgba(0,0,0,.1);--matBlur:blur(12px) saturate(1.6) brightness(1.05);
    --matThick:rgba(0,0,0,.12);--matThickBlur:blur(16px) saturate(1.7) brightness(1.06);
    --le:inset 0 1px 0 rgba(255,255,255,.38),inset 0 0 0 1px rgba(255,255,255,.12),inset 0 -1px 0 rgba(255,255,255,.2);
    --leS:inset 0 1px 0 rgba(255,255,255,.55),inset 0 0 0 1px rgba(255,255,255,.18),inset 0 -1px 0 rgba(255,255,255,.3);
    --cast:0 16px 40px -8px rgba(8,10,18,.55),0 4px 12px -2px rgba(8,10,18,.35);
  }
  body{font-family:var(--F);background:#09090b;color:var(--t1);min-height:100vh;}
  input,button{font-family:var(--F);}
  input::placeholder{color:var(--t3);}
  ::-webkit-scrollbar{width:0;}
  .glass{background:var(--matReg);backdrop-filter:var(--matBlur);-webkit-backdrop-filter:var(--matBlur);box-shadow:var(--le);}
  .glass2{background:var(--matThick);backdrop-filter:var(--matThickBlur);-webkit-backdrop-filter:var(--matThickBlur);box-shadow:var(--leS);}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .fade{animation:fadeIn .4s ease both;}
`;

// ─── Token storage ─────────────────────────────────────────
function saveTokens({ access_token, refresh_token, expires_in }) {
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
  localStorage.setItem('token_expires', Date.now() + parseInt(expires_in) * 1000);
}
function isLoggedIn() { return !!localStorage.getItem('access_token'); }
function logout() { localStorage.clear(); window.location.href = '/'; }

// ─── Hook: current page from hash ─────────────────────────
function usePage() {
  const [page, setPage] = useState(window.location.pathname);
  useEffect(() => {
    const handler = () => setPage(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);
  return page;
}

// ─── Page: Callback (handles Spotify redirect) ─────────────
function CallbackPage({ onDone }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get('access_token');
    if (access_token) {
      saveTokens({
        access_token,
        refresh_token: params.get('refresh_token'),
        expires_in: params.get('expires_in'),
      });
    }
    window.history.replaceState({}, '', '/');
    onDone();
  }, [onDone]);
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
    <p style={{ color:'var(--t2)' }}>Connexion en cours...</p>
  </div>;
}

// ─── Page: Login ──────────────────────────────────────────
function LoginPage() {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'radial-gradient(ellipse at 30% 20%,rgba(45,10,106,.6) 0%,transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(10,26,90,.5) 0%,transparent 60%),#09090b' }}>
      <div className="fade" style={{ textAlign:'center', maxWidth:320, padding:'0 24px' }}>
        <p style={{ fontSize:11, fontWeight:500, color:'var(--t4)', letterSpacing:'.05em', marginBottom:12 }}>Bêta privée</p>
        <h1 style={{ fontSize:52, fontWeight:700, letterSpacing:'-.045em', lineHeight:1, marginBottom:14 }}>music theory</h1>
        <p style={{ fontSize:14, color:'var(--t2)', lineHeight:1.55, marginBottom:36 }}>Blindtest. Ta musique. Tes amis.</p>
        <a href={`${API_BASE}/auth/login`} style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          width:'100%', padding:'14px 20px', borderRadius:14, textDecoration:'none',
          background:'rgba(255,255,255,.96)', color:'#000', fontSize:14, fontWeight:600,
          boxShadow:'var(--cast)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Se connecter avec Spotify
        </a>
      </div>
    </div>
  );
}

// ─── Page: Home (après connexion) ─────────────────────────
function HomePage() {
  const [user, setUser] = useState(null);
  const [topArtists, setTopArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [meData, artistsData] = await Promise.all([
          api.me(),
          api.topArtists(),
        ]);
        setUser(meData);
        setTopArtists(artistsData.items || []);
      } catch(e) {
        console.error(e);
        setError('Erreur de connexion à Spotify. Reconnecte-toi.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <p style={{ color:'var(--t2)' }}>Chargement...</p>
    </div>
  );

  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:16 }}>
      <p style={{ color:'rgba(248,113,113,.9)' }}>{error}</p>
      <button onClick={logout} style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'rgba(255,255,255,.1)', color:'var(--t1)', cursor:'pointer', boxShadow:'var(--le)' }}>Se déconnecter</button>
    </div>
  );

  return (
    <div className="fade" style={{ minHeight:'100vh', padding:'0 0 40px',
      background:'radial-gradient(ellipse at 20% 10%,rgba(18,20,55,.8) 0%,transparent 55%),radial-gradient(ellipse at 80% 90%,rgba(15,10,40,.7) 0%,transparent 55%),#09090b' }}>

      {/* Top bar */}
      <div className="glass" style={{ position:'sticky', top:0, zIndex:50, height:52, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px' }}>
        <span style={{ fontSize:15, fontWeight:700, letterSpacing:'-.028em' }}>music theory</span>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:'var(--t2)' }}>{user?.display_name}</span>
          {user?.images?.[0]?.url
            ? <img src={user.images[0].url} alt="" style={{ width:26, height:26, borderRadius:'50%', objectFit:'cover', boxShadow:'var(--leS)' }} />
            : <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#5865F2,#7c3aed)', boxShadow:'var(--leS)' }} />
          }
          <button onClick={logout} style={{ fontSize:11, color:'var(--t3)', background:'none', border:'none', cursor:'pointer', marginLeft:4 }}>Déco</button>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'32px 24px 0' }}>
        <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:'-.03em', marginBottom:6 }}>
          Bonjour, {user?.display_name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize:13, color:'var(--t2)', marginBottom:28 }}>Qu'est-ce qu'on joue aujourd'hui ?</p>

        {/* Mode cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:32 }}>
          {[
            { label:'Blind_Test', sub:'Solo ou 1v1 — devine les sons', icon:'🎵', active:true },
            { label:'Rejoindre avec un code', sub:'Rejoindre une partie existante', icon:'🔗', active:true },
            { label:'Autres jeux', sub:'Bientôt disponible', icon:'🎮', active:false },
          ].map(card => (
            <div key={card.label} className="glass" style={{ borderRadius:16, padding:'16px 18px', display:'flex', alignItems:'center', gap:14, opacity:card.active?1:.4, cursor:card.active?'pointer':'not-allowed' }}>
              <div style={{ width:40, height:40, borderRadius:11, background:card.active?'linear-gradient(135deg,#5865F2,#7c3aed)':'rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, boxShadow:card.active?'0 4px 14px rgba(88,101,242,.35)':'none' }}>{card.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>{card.label}</div>
                <div style={{ fontSize:12, color:'var(--t2)' }}>{card.sub}</div>
              </div>
              {card.active && <span style={{ color:'var(--t3)', fontSize:20 }}>›</span>}
            </div>
          ))}
        </div>

        {/* Top artists preview */}
        {topArtists.length > 0 && (
          <>
            <p style={{ fontSize:12, fontWeight:500, color:'var(--t3)', marginBottom:12 }}>Tes artistes Spotify</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'12px 8px' }}>
              {topArtists.slice(0, 12).map(a => (
                <div key={a.id} style={{ textAlign:'center' }}>
                  {a.images?.[0]?.url
                    ? <img src={a.images[0].url} alt={a.name} style={{ width:'100%', aspectRatio:'1', borderRadius:'50%', objectFit:'cover', display:'block', marginBottom:6 }} />
                    : <div style={{ width:'100%', paddingBottom:'100%', borderRadius:'50%', background:'linear-gradient(135deg,#1a2a4a,#2a1a4a)', marginBottom:6 }} />
                  }
                  <div style={{ fontSize:10, fontWeight:500, color:'var(--t2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────
export default function App() {
  const page = usePage();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  const handleLogin = useCallback(() => {
    setLoggedIn(true);
    window.history.pushState({}, '', '/');
  }, []);

  if (page === '/callback') return <CallbackPage onDone={handleLogin} />;
  if (!loggedIn) return <LoginPage />;
  return <HomePage />;
}
