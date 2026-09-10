import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from './api';

// Images PNG placées dans client/src/ — Vite les bundle automatiquement
const MIX_SOLO_URL = new URL('./mix-solo.png', import.meta.url).href;
const MIX_1V1_URL  = new URL('./mix-1v1.png',  import.meta.url).href;

// ─── spDirect : appelle Spotify directement (bypasse le serveur pour les artistes)
// Le token refresh passe par le serveur (besoin du client_secret).
// Tout le reste appelle api.spotify.com directement depuis le navigateur (CORS supporté).
async function spDirect(path) {
  const expires = parseInt(localStorage.getItem('token_expires') || '0');
  if (expires && Date.now() > expires - 60000) {
    const rt = localStorage.getItem('refresh_token');
    if (rt) {
      try {
        const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${BASE}/auth/refresh`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        });
        const d = await res.json();
        if (d.access_token) {
          localStorage.setItem('access_token', d.access_token);
          localStorage.setItem('token_expires', Date.now() + d.expires_in * 1000);
        }
      } catch (e) {}
    }
  }
  const tok = localStorage.getItem('access_token');
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${tok}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Spotify ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
:root{
  --t1:hsla(0,0%,100%,.92);--t2:hsla(0,0%,100%,.6);--t3:hsla(0,0%,100%,.35);--t4:hsla(0,0%,100%,.18);
  --mR:rgba(0,0,0,.14);--mRb:blur(16px) saturate(1.6) brightness(1.05);
  --mT:rgba(0,0,0,.2);--mTb:blur(24px) saturate(1.7) brightness(1.06);
  --le:inset 0 1px 0 rgba(255,255,255,.38),inset 0 0 0 1px rgba(255,255,255,.12),inset 0 -1px 0 rgba(255,255,255,.2);
  --leS:inset 0 1px 0 rgba(255,255,255,.55),inset 0 0 0 1px rgba(255,255,255,.18),inset 0 -1px 0 rgba(255,255,255,.3);
  --cast:0 16px 40px -8px rgba(8,10,18,.55),0 4px 12px -2px rgba(8,10,18,.35);
  --F:'Inter',-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',system-ui,sans-serif;
  --sp:cubic-bezier(0.16,1,0.3,1);
  --BAR:clamp(48px,3.5vh,60px);--PB:clamp(56px,5vh,72px);
}
*{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;overflow:hidden;}
body{font-family:var(--F);background:#09090b;color:var(--t1);}
input,button{font-family:var(--F);}
input::placeholder{color:var(--t3);}
::-webkit-scrollbar{width:0;height:0;}
.g2{background:var(--mR);backdrop-filter:var(--mRb);-webkit-backdrop-filter:var(--mRb);box-shadow:var(--le);}
.g3{background:var(--mT);backdrop-filter:var(--mTb);-webkit-backdrop-filter:var(--mTb);box-shadow:var(--leS);}
.bg{background:none;border:none;cursor:pointer;color:var(--t2);font-family:var(--F);}
.bs{background:rgba(255,255,255,.95);color:#000;border:none;cursor:pointer;font-family:var(--F);font-weight:600;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes coverRev{from{filter:blur(28px) brightness(.12) saturate(0);transform:scale(.92)}to{filter:blur(0) brightness(1) saturate(1);transform:scale(1)}}
@keyframes wave{0%,100%{transform:scaleY(1)}50%{transform:scaleY(2.8)}}
@keyframes tp{0%,100%{opacity:1}50%{opacity:.6}}
@keyframes kbDrift{0%{transform:scale(1.4) translate(0,0)}25%{transform:scale(1.5) translate(-2.5%,-1.5%)}50%{transform:scale(1.42) translate(2%,2%)}75%{transform:scale(1.5) translate(-1.5%,1.8%)}100%{transform:scale(1.4) translate(0,0)}}
@keyframes bgFadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
.fade{animation:fadeUp .45s var(--sp) both;}
.scalein{animation:scaleIn .45s var(--sp) both;}
.tg{color:#34d399;text-shadow:0 0 clamp(12px,1.5vw,30px) rgba(52,211,153,.45);}
.ta{color:#fbbf24;text-shadow:0 0 clamp(12px,1.5vw,30px) rgba(251,191,36,.45);}
.tr{color:#f87171;text-shadow:0 0 clamp(12px,1.5vw,30px) rgba(248,113,113,.45);animation:tp .5s ease-in-out infinite;}
.rs{position:relative;height:clamp(4px,.38vh,6px);background:rgba(255,255,255,.12);border-radius:999px;}
.rs input[type=range]{-webkit-appearance:none;appearance:none;position:absolute;width:100%;height:100%;background:transparent;outline:none;pointer-events:none;margin:0;padding:0;border:none;top:0;left:0;}
.rs input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:clamp(18px,1.7vh,24px);height:clamp(18px,1.7vh,24px);border-radius:50%;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.55);cursor:grab;pointer-events:all;transition:transform .1s,box-shadow .1s;}
.rs input[type=range]::-webkit-slider-thumb:active{cursor:grabbing;transform:scale(1.15);box-shadow:0 3px 16px rgba(0,0,0,.7);}
.rs input[type=range]::-moz-range-thumb{width:clamp(18px,1.7vh,24px);height:clamp(18px,1.7vh,24px);border-radius:50%;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.55);cursor:grab;pointer-events:all;border:none;}
`;

function saveTokens({access_token,refresh_token,expires_in}){
  localStorage.setItem('access_token',access_token);
  localStorage.setItem('refresh_token',refresh_token);
  localStorage.setItem('token_expires',Date.now()+parseInt(expires_in)*1000);
}
function isLoggedIn(){return!!localStorage.getItem('access_token');}
function logout(){localStorage.clear();window.location.href='/';}

const IC={
  music:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  link:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  game:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4m-2-2v4M14 12h.01M17 12h.01"/></svg>,
  srch:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  xm:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  bk:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  chR:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  pl:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
  pa:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  pv:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4"/><line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2"/></svg>,
  nx:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2"/></svg>,
  vl:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  dr:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  pl2:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

// Cover mix : photo artiste en background + ton PNG par-dessus
function MixCoverTemplate({mode, artistUrl}){
  const tplUrl = mode==='solo' ? MIX_SOLO_URL : MIX_1V1_URL;
  return(
    <div style={{position:'absolute',inset:0}}>
      {/* Photo artiste derrière */}
      {artistUrl
        ? <img src={artistUrl} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}} alt="" crossOrigin="anonymous"/>
        : <div style={{position:'absolute',inset:0,background:mode==='solo'?'linear-gradient(135deg,#0f3460,#16213e)':'linear-gradient(135deg,#533483,#7b2d8b)'}}/>
      }
      {/* Template PNG (fond transparent → photo visible) */}
      <img src={tplUrl} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} alt="" draggable="false"/>
    </div>
  );
}

function DynBg({url,mode}){
  const f={
    neutral:'saturate(1.8) brightness(.35) blur(clamp(55px,7vw,110px))',
    cycle:'saturate(2.4) brightness(.42) blur(clamp(55px,7vw,110px))',
    game:'grayscale(100%) contrast(1.6) brightness(.25) saturate(0) blur(clamp(20px,2.5vw,40px))',
    reveal:'saturate(2.8) brightness(.48) blur(clamp(55px,7vw,110px))',
  }[mode]||'saturate(1.8) brightness(.35) blur(60px)';
  return(
    <div style={{position:'fixed',inset:0,zIndex:0,background:'#09090b',overflow:'hidden'}}>
      {url&&<div key={url} style={{position:'absolute',inset:'-25%',backgroundImage:`url(${url})`,backgroundSize:'cover',backgroundPosition:'center',filter:f,animation:'kbDrift 28s ease-in-out infinite, bgFadeIn 1.2s ease',willChange:'transform,filter'}}/>}
      <div style={{position:'absolute',inset:0,zIndex:1,background:'linear-gradient(to top,rgba(0,0,0,.65) 0%,rgba(0,0,0,.1) 50%,transparent 100%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,zIndex:1,background:'linear-gradient(to bottom,rgba(0,0,0,.3) 0%,transparent 30%)',pointerEvents:'none'}}/>
    </div>
  );
}

function MysteryCover({url,sz}){
  const s=sz||'clamp(180px,22vh,320px)';
  return(
    <div style={{position:'relative',width:s,height:s,borderRadius:'clamp(16px,1.5vw,26px)',overflow:'hidden',flexShrink:0,boxShadow:'0 0 0 1px rgba(255,255,255,.18), 0 16px 48px rgba(0,0,0,.7)'}}>
      {url&&<div style={{position:'absolute',inset:'-18px',backgroundImage:`url(${url})`,backgroundSize:'cover',backgroundPosition:'center',filter:'grayscale(100%) blur(30px) contrast(1.4) brightness(.3) saturate(0)'}}/>}
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.35)',backdropFilter:'blur(4px)'}}/>
      <div style={{position:'absolute',inset:0,zIndex:3,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--F)',fontSize:'clamp(56px,7vw,100px)',fontWeight:700,letterSpacing:'-.05em',color:'rgba(255,255,255,.85)',textShadow:'0 0 40px rgba(255,255,255,.25), 0 2px 8px rgba(0,0,0,.8)'}}>?</div>
      <div style={{position:'absolute',inset:0,zIndex:4,borderRadius:'clamp(16px,1.5vw,26px)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.22),inset 0 0 0 1px rgba(255,255,255,.1)',pointerEvents:'none'}}/>
    </div>
  );
}

function TopBar({label,user,center,onAv,onQuit,dark}){
  // dark=true (mode jeu, fond sombre) → fond plus opaque + bordure + ombre basse pour contraste
  const bg=dark?'rgba(0,0,0,.38)':'rgba(0,0,0,.14)';
  const sh=dark?'inset 0 1px 0 rgba(255,255,255,.28),inset 0 0 0 1px rgba(255,255,255,.08),inset 0 -1px 0 rgba(255,255,255,.12),0 2px 20px rgba(0,0,0,.5)':'var(--le)';
  return(
    <div style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:'var(--BAR)',display:'flex',alignItems:'center',gap:'clamp(12px,1vw,20px)',padding:'0 clamp(16px,1.5vw,32px)',background:bg,backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:sh,transition:'background .4s, box-shadow .4s'}}>
      <div style={{flex:1,display:'flex',alignItems:'center',gap:'clamp(10px,.85vw,16px)'}}>
        {onQuit&&<button onClick={onQuit} className="bg" style={{fontSize:'clamp(12px,.9vw,15px)',display:'flex',alignItems:'center',gap:4,transition:'color .15s'}} onMouseEnter={e=>e.currentTarget.style.color='var(--t1)'} onMouseLeave={e=>e.currentTarget.style.color='var(--t2)'}><span style={{display:'flex'}}>{IC.bk}</span>Quitter</button>}
        <span style={{fontSize:'clamp(11px,.8vw,15px)',fontWeight:600,color:'var(--t3)',letterSpacing:'.02em',whiteSpace:'nowrap'}}>{label}</span>
      </div>
      <div style={{flex:2,display:'flex',justifyContent:'center'}}>{center}</div>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'clamp(7px,.55vw,12px)'}}>
        <span style={{fontSize:'clamp(10px,.7vw,13px)',color:'var(--t3)'}}>{user?.display_name}</span>
        <button onClick={onAv} className="bg" style={{padding:0,borderRadius:'50%'}}>
          {user?.images?.[0]?.url
            ?<img src={user.images[0].url} style={{width:'clamp(24px,1.9vh,32px)',height:'clamp(24px,1.9vh,32px)',borderRadius:'50%',objectFit:'cover',boxShadow:'var(--leS)',transition:'transform .15s',display:'block'}} alt="" onMouseEnter={e=>e.target.style.transform='scale(1.08)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}/>
            :<div style={{width:'clamp(24px,1.9vh,32px)',height:'clamp(24px,1.9vh,32px)',borderRadius:'50%',background:'linear-gradient(135deg,#5865F2,#7c3aed)',boxShadow:'var(--leS)'}}/>}
        </button>
      </div>
    </div>
  );
}

function ProfileModal({user,onClose}){
  return(
    <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',padding:'clamp(56px,5.5vh,72px) clamp(16px,1.5vw,28px) 0'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:'rgba(14,14,20,.96)',backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',boxShadow:'var(--cast)',borderRadius:'clamp(14px,1.2vw,20px)',width:'clamp(240px,22vw,320px)',overflow:'hidden',animation:'slideDown .25s var(--sp)'}}>
        <div style={{padding:'clamp(18px,1.8vh,26px)',borderBottom:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',gap:'clamp(12px,1vw,18px)'}}>
          {user?.images?.[0]?.url?<img src={user.images[0].url} style={{width:'clamp(40px,4vh,54px)',height:'clamp(40px,4vh,54px)',borderRadius:'50%',objectFit:'cover'}} alt=""/>:<div style={{width:'clamp(40px,4vh,54px)',height:'clamp(40px,4vh,54px)',borderRadius:'50%',background:'linear-gradient(135deg,#5865F2,#7c3aed)'}}/>}
          <div>
            <div style={{fontSize:'clamp(13px,.9vw,16px)',fontWeight:600}}>{user?.display_name}</div>
            <div style={{fontSize:'clamp(10px,.72vw,13px)',color:'var(--t3)'}}>Spotify Premium</div>
          </div>
        </div>
        <div style={{padding:'clamp(8px,.8vh,12px) 0'}}>
          {['Stats.fm','Stats for Spotify'].map((n,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:'clamp(10px,.85vw,16px)',padding:'clamp(9px,.9vh,14px) clamp(16px,1.5vw,22px)',opacity:.45,cursor:'not-allowed'}}>
              <span style={{fontSize:'clamp(14px,1.1vw,18px)',color:'var(--t3)',display:'flex'}}>{IC.music}</span>
              <div><div style={{fontSize:'clamp(12px,.85vw,15px)',fontWeight:500}}>{n}</div><div style={{fontSize:'clamp(10px,.7vw,12px)',color:'var(--t3)'}}>Bientôt disponible</div></div>
            </div>
          ))}
          <div style={{margin:'clamp(6px,.6vh,10px) clamp(16px,1.5vw,22px)',height:'1px',background:'rgba(255,255,255,.08)'}}/>
          <button onClick={logout} style={{display:'flex',alignItems:'center',gap:'clamp(10px,.85vw,16px)',padding:'clamp(9px,.9vh,14px) clamp(16px,1.5vw,22px)',width:'100%',background:'none',border:'none',cursor:'pointer',color:'rgba(248,113,113,.8)',fontFamily:'var(--F)',transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(248,113,113,.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{display:'flex'}}>{IC.dr}</span>
            <span style={{fontSize:'clamp(12px,.85vw,15px)',fontWeight:500}}>Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerBar({track,paused,prog,onPause,onSeek,vol,onVolume,revealed,canSeek}){
  if(!track)return null;
  const dur=track.duration_ms||222000;
  const pct=Math.min(100,(prog/Math.max(1,Math.floor(dur/1000)))*100);
  const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  const volRef=useRef(null);
  const seekRef=useRef(null);
  return(
    <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:100,height:'var(--PB)',display:'flex',alignItems:'center',gap:'clamp(10px,.9vw,18px)',padding:'0 clamp(14px,1.4vw,28px)',background:'rgba(0,0,0,.42)',backdropFilter:'blur(28px) saturate(1.8)',WebkitBackdropFilter:'blur(28px) saturate(1.8)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.22),inset 0 0 0 1px rgba(255,255,255,.08),0 -2px 24px rgba(0,0,0,.5)'}}>
      <div style={{width:'clamp(34px,3vh,46px)',height:'clamp(34px,3vh,46px)',borderRadius:'clamp(5px,.45vw,9px)',flexShrink:0,position:'relative',overflow:'hidden',boxShadow:'var(--le)'}}>
        {track.album?.images?.[0]?.url&&<img src={track.album.images[0].url} style={{width:'100%',height:'100%',objectFit:'cover',filter:revealed?'none':'grayscale(100%) brightness(.28)',transition:'filter 1.2s ease'}} alt=""/>}
        {!revealed&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(12px,1.1vh,18px)',fontWeight:700,color:'rgba(255,255,255,.7)'}}>?</div>}
      </div>
      <div style={{width:'clamp(90px,9vw,160px)',flexShrink:0}}>
        <div style={{fontSize:'clamp(10px,.72vw,13px)',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{revealed?track.name:'—'}</div>
        <div style={{fontSize:'clamp(9px,.65vw,12px)',color:'var(--t3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{revealed?track.artists?.map(a=>a.name).join(', '):'—'}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'clamp(7px,.6vw,12px)',flexShrink:0}}>
        {canSeek&&<button className="bg" style={{fontSize:'clamp(13px,1.1vh,18px)',display:'flex'}}>{IC.pv}</button>}
        <button onClick={onPause} style={{width:'clamp(26px,2.4vh,36px)',height:'clamp(26px,2.4vh,36px)',borderRadius:'50%',background:'rgba(255,255,255,.95)',color:'#000',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(10px,.9vh,14px)',flexShrink:0}}>{paused?IC.pl:IC.pa}</button>
        {canSeek&&<button className="bg" style={{fontSize:'clamp(13px,1.1vh,18px)',display:'flex'}}>{IC.nx}</button>}
      </div>
      <div style={{flex:1,display:'flex',alignItems:'center',gap:'clamp(5px,.45vw,9px)'}}>
        <span style={{fontSize:'clamp(9px,.65vw,12px)',color:'var(--t3)',fontVariantNumeric:'tabular-nums',flexShrink:0}}>{fmt(prog)}</span>
        <div ref={seekRef} onClick={canSeek?onSeek:undefined} style={{flex:1,height:'clamp(3px,.28vh,5px)',borderRadius:'999px',background:'rgba(255,255,255,.15)',cursor:canSeek?'pointer':'default',position:'relative'}}>
          <div style={{height:'100%',width:`${pct}%`,background:'rgba(255,255,255,.9)',borderRadius:'999px',transition:'width .8s linear'}}/>
        </div>
        <span style={{fontSize:'clamp(9px,.65vw,12px)',color:'var(--t3)',fontVariantNumeric:'tabular-nums',flexShrink:0}}>{fmt(Math.floor(dur/1000))}</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'clamp(5px,.4vw,8px)',flexShrink:0}}>
        <span style={{fontSize:'clamp(11px,.9vh,15px)',color:'var(--t3)',display:'flex'}}>{IC.vl}</span>
        <div ref={volRef} onClick={(e)=>{
          const r=e.currentTarget.getBoundingClientRect();
          const v=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
          onVolume(v);
        }} style={{width:'clamp(60px,6vw,100px)',height:'clamp(3px,.28vh,5px)',background:'rgba(255,255,255,.15)',borderRadius:'999px',overflow:'hidden',cursor:'pointer',position:'relative'}}>
          <div style={{height:'100%',width:`${vol*100}%`,background:'rgba(255,255,255,.85)',borderRadius:'999px',transition:'width .1s'}}/>
        </div>
      </div>
    </div>
  );
}

function Pill({active,onClick,children,sm}){
  return(
    <button onClick={onClick} style={{padding:sm?'clamp(5px,.5vh,8px) clamp(10px,.9vw,16px)':'clamp(7px,.65vh,11px) clamp(14px,1.3vw,22px)',borderRadius:'999px',border:active?'none':'1px solid rgba(255,255,255,.12)',background:active?'rgba(255,255,255,.95)':'rgba(0,0,0,.14)',backdropFilter:active?'none':'var(--mRb)',WebkitBackdropFilter:active?'none':'var(--mRb)',color:active?'#000':'var(--t2)',fontSize:'clamp(11px,.78vw,15px)',fontWeight:500,cursor:'pointer',transition:'all .15s',outline:'none',boxShadow:active?'0 3px 14px rgba(255,255,255,.14)':'var(--le)'}}>
      {children}
    </button>
  );
}

function rotatePool(tracks,rounds,spacing=5){
  const sh=[...tracks].sort(()=>Math.random()-.5);
  const res=[],rem=[...sh],rec=[];
  while(rem.length>0&&res.length<rounds){
    const idx=rem.findIndex(t=>!rec.includes(t.artists?.[0]?.id));
    const pick=idx===-1?rem.splice(0,1)[0]:rem.splice(idx,1)[0];
    res.push(pick);
    const aid=pick.artists?.[0]?.id;
    if(aid){rec.push(aid);if(rec.length>spacing)rec.shift();}
  }
  return res;
}

export default function App(){
  const[screen,setScreen]=useState(isLoggedIn()?'home':'login');
  const[user,setUser]=useState(null);
  const[topArtists,setTopArtists]=useState([]);
  const[topTracks,setTopTracks]=useState([]);
  const[selArts,setSelArts]=useState([]);
  const[artQ,setArtQ]=useState('');
  const[artRes,setArtRes]=useState([]);
  const[mixPerso,setMixPerso]=useState(false);
  const[gMode,setGMode]=useState('solo');
  const[rounds,setRounds]=useState(10);
  const[dur,setDur]=useState(30);
  const[bgIdx,setBgIdx]=useState(0);
  const[pool,setPool]=useState([]);
  const[cIdx,setCIdx]=useState(0);
  const[timer,setTimer]=useState(30);
  const[paused,setPaused]=useState(false);
  const[revealed,setRevealed]=useState(false);
  const[answer,setAnswer]=useState('');
  const[results,setResults]=useState([]);
  const[score,setScore]=useState(0);
  const[prog,setProg]=useState(0);
  const[vol,setVol]=useState(0.8);
  const[deviceId,setDeviceId]=useState(null);
  const[showProfile,setShowProfile]=useState(false);
  const[loading,setLoading]=useState(false);
  const[mixMode,setMixMode]=useState('solo'); // 'solo' | '1v1'
  const[yearMin,setYearMin]=useState(1900);
  const[yearMax,setYearMax]=useState(2026);
  const[joinCode,setJoinCode]=useState('');
  const[joinOpen,setJoinOpen]=useState(false);
  const[err,setErr]=useState('');
  const timerRef=useRef(null);
  const progRef=useRef(null);
  const bgRef=useRef(null);
  const srchRef=useRef(null);
  const artRef=useRef(null);
  const playerRef=useRef(null);

  // Handle OAuth callback
  useEffect(()=>{
    if(window.location.pathname==='/callback'){
      const p=new URLSearchParams(window.location.search);
      const at=p.get('access_token');
      if(at){saveTokens({access_token:at,refresh_token:p.get('refresh_token'),expires_in:p.get('expires_in')});setScreen('home');}
      window.history.replaceState({},'','/');
    }
  },[]);

  // Load user data — using spDirect (direct Spotify calls)
  useEffect(()=>{
    if(screen==='login')return;
    (async()=>{
      try{
        const[me,arts,trs]=await Promise.all([
          spDirect('/me'),
          spDirect('/me/top/artists?time_range=medium_term&limit=50'),
          spDirect('/me/top/tracks?time_range=medium_term&limit=50'),
        ]);
        setUser(me);setTopArtists(arts.items||[]);setTopTracks(trs.items||[]);
      }catch(e){console.error('load',e);}
    })();
  },[screen==='login']);

  // Spotify Web Playback SDK
  useEffect(()=>{
    if(screen==='login')return;
    window.onSpotifyWebPlaybackSDKReady=()=>{
      const pl=new window.Spotify.Player({
        name:'Music Theory',
        getOAuthToken:cb=>cb(localStorage.getItem('access_token')),
        volume:0.8,
      });
      pl.addListener('ready',({device_id})=>{setDeviceId(device_id);});
      pl.addListener('player_state_changed',st=>{if(!st)return;setPaused(st.paused);setProg(Math.floor(st.position/1000));});
      pl.connect();
      playerRef.current=pl;
    };
    if(!document.querySelector('script[src*="spotify-player"]')){
      const s=document.createElement('script');s.src='https://sdk.scdn.co/spotify-player.js';document.head.appendChild(s);
    }
  },[screen==='login']);

  // BG rotation
  useEffect(()=>{
    if(screen!=='home'||!topTracks.length)return;
    bgRef.current=setInterval(()=>setBgIdx(i=>(i+1)%Math.min(topTracks.length,20)),12000);
    return()=>clearInterval(bgRef.current);
  },[screen,topTracks]);

  // Game timer
  useEffect(()=>{
    clearInterval(timerRef.current);
    if(screen!=='game'||revealed||paused)return;
    timerRef.current=setInterval(()=>{
      setTimer(t=>{if(t<=1){clearInterval(timerRef.current);doReveal();return 0;}return t-1;});
    },1000);
    return()=>clearInterval(timerRef.current);
  },[screen,revealed,paused]);

  // Progress counter
  useEffect(()=>{
    clearInterval(progRef.current);
    if((screen!=='game'&&screen!=='reveal')||paused)return;
    progRef.current=setInterval(()=>setProg(p=>p+1),1000);
    return()=>clearInterval(progRef.current);
  },[screen,paused]);

  // ─── Artist search — spDirect calls Spotify API directly ───
  // Ref pour topArtists — évite de refirer l'effet à chaque chargement d'artiste
  const topArtistsRef = useRef([]);
  useEffect(()=>{ topArtistsRef.current=topArtists; },[topArtists]);

  useEffect(()=>{
    clearTimeout(artRef.current);
    if(artQ.length<2){setArtRes([]);return;}
    artRef.current=setTimeout(async()=>{
      try{
        // api.search via serveur — même chemin que l'autocomplete sons qui fonctionne
        const r=await api.search(artQ,'artist',6);
        const found=r.artists?.items||[];
        console.log('[MT] artist search:',found.length,'results for',artQ);
        // Filtre les artistes déjà dans le top (ref, pas state)
        const topIds=new Set(topArtistsRef.current.map(a=>a.id));
        const filtered=found.filter(a=>!topIds.has(a.id));
        setArtRes(filtered.length>0?filtered:found);
      }catch(e){
        console.error('[MT] artist search failed:',e.message);
        setErr(`Recherche "${artQ}" échouée: ${e.message}`);
      }
    },400);
  },[artQ]); // dépendance artQ seulement — topArtists via ref

  const playTrack=useCallback(async(track)=>{
    if(!deviceId||!track)return;
    try{
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,{
        method:'PUT',
        headers:{Authorization:`Bearer ${localStorage.getItem('access_token')}`,'Content-Type':'application/json'},
        body:JSON.stringify({uris:[`spotify:track:${track.id}`],position_ms:0}),
      });
      setProg(0);
    }catch(e){console.error('play',e);}
  },[deviceId]);

  // ─── Build pool — spDirect calls Spotify API directly ──────
  const buildPool=useCallback(async()=>{
    let tracks=[];
    setErr('');
    if(mixPerso){
      // Fetch all 3 time periods directly from Spotify
      try{
        const[s,m,l]=await Promise.all([
          spDirect('/me/top/tracks?time_range=short_term&limit=50'),
          spDirect('/me/top/tracks?time_range=medium_term&limit=50'),
          spDirect('/me/top/tracks?time_range=long_term&limit=50'),
        ]);
        const seen=new Set();
        tracks=[...(s.items||[]),...(m.items||[]),...(l.items||[])].filter(t=>{
          if(seen.has(t.id))return false;seen.add(t.id);return true;
        });
      }catch(e){
        console.error('mix pool error:',e.message);
        tracks=topTracks; // fallback to already loaded
      }
    }else{
      for(const a of selArts){
        let artTracks=[];
        // APPROCHE 1: top-tracks via serveur (endpoint /api/artists/:id/tracks)
        try{
          const d=await api.artistTracks(a.id);
          artTracks=d.tracks||[];
          console.log('[MT] artistTracks via server for',a.name,':',artTracks.length);
        }catch(e1){
          console.warn('[MT] artistTracks failed:',e1.message,'; fallback search...');
          // APPROCHE 2: search via serveur (même endpoint que autocomplete sons)
          try{
            const r=await api.search(a.name,'track',6);
            const items=r.tracks?.items||[];
            artTracks=items.filter(t=>t.artists.some(ar=>ar.id===a.id||ar.name.toLowerCase()===a.name.toLowerCase()));
            if(!artTracks.length) artTracks=items; // si filtre trop strict, prendre tout
            console.log('[MT] search fallback for',a.name,':',artTracks.length);
          }catch(e2){
            console.error('[MT] both methods failed for',a.name,':',e2.message);
          }
        }
        tracks.push(...artTracks);
      }
    }
    if(!tracks.length)return[];
    // Dédupliquer
    const seen=new Set();
    const unique=tracks.filter(t=>{if(seen.has(t.id))return false;seen.add(t.id);return true;});
    // Filtrer par période de sortie
    const inRange=unique.filter(t=>{
      const y=parseInt(t.album?.release_date?.slice(0,4)||'0');
      if(y===0)return true; // garder si pas de date
      return y>=yearMin&&y<=yearMax;
    });
    if(!inRange.length){
      setErr(`Aucun son trouvé entre ${yearMin} et ${yearMax}. Élargis la période.`);
      return[];
    }
    return rotatePool(inRange,rounds,5);
  },[selArts,mixPerso,topTracks,rounds,yearMin,yearMax]);

  const startGame=useCallback(async()=>{
    setLoading(true);setErr('');
    try{
      const p=await buildPool();
      if(!p.length){
        const names=selArts.map(a=>a.name).join(', ')||'aucun';
        setErr(`Aucun son trouvé pour : ${names}`);
        setLoading(false);return;
      }
      setPool(p);setCIdx(0);setScore(0);setTimer(dur);setRevealed(false);setAnswer('');setProg(0);
      setScreen('game');
      setTimeout(()=>{if(p[0])playTrack(p[0]);},500);
    }catch(e){setErr(`Erreur: ${e.message}`);}
    setLoading(false);
  },[buildPool,dur,playTrack,selArts]);

  const doReveal=useCallback(()=>{clearInterval(timerRef.current);setRevealed(true);setScreen('reveal');},[]);

  const nextRound=useCallback(()=>{
    const n=cIdx+1;
    if(n>=pool.length){setScreen('end');return;}
    setCIdx(n);setTimer(dur);setRevealed(false);setAnswer('');setProg(0);
    setScreen('game');
    setTimeout(()=>{if(pool[n])playTrack(pool[n]);},200);
  },[cIdx,pool,dur,playTrack]);

  const handlePause=useCallback(()=>{
    setPaused(p=>{playerRef.current?.togglePlay();return!p;});
  },[]);

  const handleVolume=useCallback((v)=>{
    const safeVol=Math.max(0,Math.min(1,v));
    setVol(safeVol);
    if(playerRef.current){
      playerRef.current.setVolume(safeVol).catch(()=>{});
      // Forcer mute complet si 0
      if(safeVol===0)playerRef.current.setVolume(0).catch(()=>{});
    }
  },[]);

  // Song autocomplete — keep using api.search (works through server)
  const handleAnswer=useCallback(async(val)=>{
    setAnswer(val);
    if(!val||val.length<2){setResults([]);return;}
    clearTimeout(srchRef.current);
    srchRef.current=setTimeout(async()=>{
      try{const r=await api.search(val,'track',6);setResults(r.tracks?.items||[]);}catch(e){}
    },280);
  },[]);

  const selectAnswer=useCallback((t)=>{
    const curr=pool[cIdx];if(!curr)return;
    setResults([]);
    if(t.id===curr.id){setScore(s=>s+Math.max(10,Math.round((timer/dur)*1000)));doReveal();}
    else setAnswer('');
  },[pool,cIdx,timer,dur,doReveal]);

  const toggleArtist=useCallback((a)=>{
    setSelArts(p=>p.find(x=>x.id===a.id)?p.filter(x=>x.id!==a.id):[...p,a]);
  },[]);

  const track=pool[cIdx]||null;
  const bgUrl=(screen==='game'||screen==='reveal')?track?.album?.images?.[0]?.url:topTracks[bgIdx]?.album?.images?.[0]?.url;
  const bgMode=screen==='game'?'game':screen==='reveal'?'reveal':'cycle';
  const showPB=screen==='game'||screen==='reveal';
  const tc=timer>dur*.5?'g':timer>dur*.25?'a':'r';
  const API=import.meta.env.VITE_API_URL||'http://localhost:3001';
  const topPad='var(--BAR)';
  const botPad=showPB?'var(--PB)':'0px';
  // UX: top artistes visibles par défaut, cachés quand on cherche (résultats globaux Spotify)
  const isSearching=artQ.length>=2;
  const filtLocal=isSearching?[]:topArtists; // cache top artistes pendant la recherche
  const showSPRes=isSearching&&artRes.length>0;
  const showSearching=isSearching&&artRes.length===0;

  // Barre de recherche artiste dans la TopBar (screen==='artists')
  const ArtistSearchBar=(
    <div style={{position:'relative',width:'clamp(260px,32vw,560px)'}}>
      <div style={{display:'flex',alignItems:'center',gap:'clamp(7px,.55vw,11px)',padding:'clamp(6px,.6vh,10px) clamp(12px,1vw,18px)',background:'var(--mT)',backdropFilter:'var(--mTb)',WebkitBackdropFilter:'var(--mTb)',boxShadow:'var(--leS)',borderRadius:'999px'}}>
        <span style={{color:'var(--t3)',fontSize:'clamp(13px,.95vw,17px)',flexShrink:0,display:'flex'}}>{IC.srch}</span>
        <input value={artQ} onChange={e=>setArtQ(e.target.value)} placeholder="Rechercher un artiste Spotify…" style={{background:'none',border:'none',outline:'none',color:'var(--t1)',fontSize:'clamp(12px,.85vw,16px)',flex:1,minWidth:0}}/>
        {artQ&&<button onClick={()=>{setArtQ('');setArtRes([]);}} className="bg" style={{fontSize:'clamp(13px,1vw,18px)',lineHeight:1,display:'flex'}}>{IC.xm}</button>}
      </div>
      {showSPRes&&(
        <div style={{position:'absolute',top:'calc(100% + 8px)',left:0,right:0,zIndex:300,background:'rgba(12,12,18,.97)',backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',boxShadow:'var(--cast)',borderRadius:'clamp(10px,.8vw,16px)',overflow:'hidden',padding:'clamp(4px,.4vh,7px) 0'}}>
          {artRes.map(a=>{const s=selArts.find(x=>x.id===a.id);return(
            <div key={a.id} onMouseDown={()=>toggleArtist(a)} style={{display:'flex',alignItems:'center',gap:'clamp(10px,.8vw,14px)',padding:'clamp(8px,.75vh,12px) clamp(12px,1vw,18px)',cursor:'pointer',transition:'background .1s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.07)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {a.images?.[0]?.url?<img src={a.images[0].url} style={{width:'clamp(32px,3vh,44px)',height:'clamp(32px,3vh,44px)',borderRadius:'50%',objectFit:'cover',flexShrink:0}} alt=""/>:<div style={{width:'clamp(32px,3vh,44px)',height:'clamp(32px,3vh,44px)',borderRadius:'50%',background:'linear-gradient(135deg,#2a1a4a,#1a2a4a)',flexShrink:0}}/>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'clamp(12px,.88vw,16px)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name}</div>
                {a.genres?.[0]&&<div style={{fontSize:'clamp(9px,.65vw,12px)',color:'var(--t3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textTransform:'capitalize'}}>{a.genres[0]}</div>}
              </div>
              {s&&<div style={{width:'clamp(18px,1.6vh,24px)',height:'clamp(18px,1.6vh,24px)',borderRadius:'50%',background:'white',color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(9px,.8vh,12px)',fontWeight:700,flexShrink:0}}>✓</div>}
            </div>
          );})}
        </div>
      )}
    </div>
  );

  const SearchBar=(
    <div style={{position:'relative',width:'clamp(260px,26vw,500px)'}}>
      <div style={{display:'flex',alignItems:'center',gap:'clamp(7px,.55vw,11px)',padding:'clamp(6px,.6vh,10px) clamp(12px,1vw,18px)',background:'var(--mT)',backdropFilter:'var(--mTb)',WebkitBackdropFilter:'var(--mTb)',boxShadow:'var(--leS)',borderRadius:'999px'}}>
        <span style={{color:'var(--t3)',fontSize:'clamp(13px,.95vw,17px)',flexShrink:0,display:'flex'}}>{IC.srch}</span>
        <input value={answer} onChange={e=>handleAnswer(e.target.value)} placeholder="Quel est ce morceau ?" autoFocus style={{background:'none',border:'none',outline:'none',color:'var(--t1)',fontSize:'clamp(12px,.85vw,16px)',flex:1,minWidth:0}}/>
        {answer&&<button onClick={()=>{setAnswer('');setResults([]);}} className="bg" style={{fontSize:'clamp(13px,1vw,18px)',lineHeight:1,display:'flex'}}>{IC.xm}</button>}
      </div>
      {results.length>0&&(
        <div style={{position:'absolute',top:'calc(100% + 8px)',left:0,right:0,zIndex:200,background:'rgba(12,12,18,.97)',backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',boxShadow:'var(--cast)',borderRadius:'clamp(10px,.8vw,16px)',overflow:'hidden',padding:'clamp(4px,.4vh,7px) 0'}}>
          {results.map(t=>(
            <div key={t.id} onMouseDown={()=>selectAnswer(t)} style={{display:'flex',alignItems:'center',gap:'clamp(10px,.8vw,14px)',padding:'clamp(8px,.75vh,12px) clamp(12px,1vw,18px)',cursor:'pointer',transition:'background .1s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {t.album?.images?.[0]?.url&&<img src={t.album.images[0].url} style={{width:'clamp(28px,2.5vh,40px)',height:'clamp(28px,2.5vh,40px)',borderRadius:'clamp(4px,.35vw,7px)',flexShrink:0,objectFit:'cover'}} alt=""/>}
              <div>
                <div style={{fontSize:'clamp(12px,.85vw,16px)',fontWeight:500}}>{t.name}</div>
                <div style={{fontSize:'clamp(10px,.7vw,13px)',color:'var(--t3)'}}>{t.artists?.map(a=>a.name).join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── LOGIN ─────────────────────────────────────────────────
  if(screen==='login'){return(<>
    <style>{CSS}</style>
    <DynBg url={null} mode="neutral"/>
    <div style={{position:'relative',zIndex:10,height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="fade" style={{textAlign:'center',maxWidth:'clamp(260px,28vw,380px)',padding:'0 clamp(18px,2vw,36px)'}}>
        <p style={{fontSize:'clamp(9px,.68vw,12px)',fontWeight:500,color:'var(--t4)',letterSpacing:'.07em',marginBottom:'clamp(10px,1vh,16px)'}}>Bêta privée</p>
        <h1 style={{fontSize:'clamp(40px,5.5vw,88px)',fontWeight:700,letterSpacing:'-.046em',lineHeight:1,marginBottom:'clamp(10px,1vh,16px)'}}>music theory</h1>
        <p style={{fontSize:'clamp(12px,.9vw,16px)',color:'var(--t2)',lineHeight:1.55,marginBottom:'clamp(26px,3vh,48px)'}}>Blindtest. Ta musique. Tes amis.</p>
        <a href={`${API}/auth/login`} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(8px,.65vw,12px)',width:'100%',padding:'clamp(12px,1.2vh,18px) clamp(16px,1.5vw,28px)',borderRadius:'clamp(12px,1vw,18px)',textDecoration:'none',background:'rgba(255,255,255,.96)',color:'#000',fontSize:'clamp(12px,.9vw,17px)',fontWeight:600,boxShadow:'var(--cast)'}}>
          <svg width="clamp(13px,1vw,17px)" height="clamp(13px,1vw,17px)" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
          Se connecter avec Spotify
        </a>
      </div>
    </div>
  </>);}

  return(<>
    <style>{CSS}</style>
    <DynBg url={bgUrl} mode={bgMode}/>
    {showProfile&&<ProfileModal user={user} onClose={()=>setShowProfile(false)}/>}

    {/* TOP BAR */}
    {screen==='home'
      ?<div style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:'var(--BAR)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(16px,1.5vw,32px)',background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)'}}>
          <span style={{fontSize:'clamp(13px,.95vw,18px)',fontWeight:700,letterSpacing:'-.028em'}}>music theory</span>
          <div style={{display:'flex',alignItems:'center',gap:'clamp(7px,.55vw,12px)'}}>
            <span style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t2)'}}>{user?.display_name}</span>
            <button onClick={()=>setShowProfile(p=>!p)} className="bg" style={{padding:0,borderRadius:'50%'}}>
              {user?.images?.[0]?.url?<img src={user.images[0].url} style={{width:'clamp(24px,1.9vh,32px)',height:'clamp(24px,1.9vh,32px)',borderRadius:'50%',objectFit:'cover',transition:'transform .15s',display:'block'}} alt="" onMouseEnter={e=>e.target.style.transform='scale(1.08)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}/>:<div style={{width:'clamp(24px,1.9vh,32px)',height:'clamp(24px,1.9vh,32px)',borderRadius:'50%',background:'linear-gradient(135deg,#5865F2,#7c3aed)'}}/>}
            </button>
          </div>
        </div>
      :<TopBar
          label={screen==='artists'?'blind_test':'Blind_Test'}
          user={user}
          center={screen==='game'?SearchBar:screen==='artists'?ArtistSearchBar:null}
          onAv={()=>setShowProfile(p=>!p)}
          onQuit={(screen==='game'||screen==='reveal')?()=>{clearInterval(timerRef.current);setScreen('home');}:null}
          dark={screen==='game'||screen==='reveal'}/>
    }

    {/* CONTENT */}
    <div style={{position:'relative',zIndex:10,height:'100vh',paddingTop:topPad,paddingBottom:botPad,overflow:'hidden'}}>

      {/* ── HOME */}
      {screen==='home'&&<div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'clamp(18px,2vh,36px) clamp(20px,2vw,40px)'}}>
        <div className="fade" style={{width:'100%',maxWidth:'min(560px,50vw)'}}>
          <h1 style={{fontSize:'clamp(22px,2.5vw,44px)',fontWeight:700,letterSpacing:'-.035em',marginBottom:'clamp(4px,.4vh,8px)'}}>À quoi on joue, {user?.display_name?.split(' ')[0]} ?</h1>
          <p style={{fontSize:'clamp(11px,.78vw,15px)',color:'var(--t2)',marginBottom:'clamp(20px,2.5vh,36px)'}}>Choisis ton mode de jeu</p>
          <div style={{display:'flex',flexDirection:'column',gap:'clamp(9px,.9vh,14px)'}}>
            <div onClick={()=>setScreen('config')} style={{background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)',borderRadius:'clamp(14px,1.2vw,22px)',padding:'clamp(15px,1.6vh,24px) clamp(17px,1.6vw,28px)',display:'flex',alignItems:'center',gap:'clamp(13px,1.1vw,20px)',cursor:'pointer',transition:'background .15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.16)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--mR)'}>
              <div style={{width:'clamp(40px,3.8vh,56px)',height:'clamp(40px,3.8vh,56px)',borderRadius:'clamp(10px,.9vw,15px)',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#5865F2,#7c3aed)',flexShrink:0,fontSize:'clamp(17px,1.7vh,25px)',color:'rgba(255,255,255,.8)',boxShadow:'0 4px 16px rgba(88,101,242,.3)'}}>{IC.music}</div>
              <div style={{flex:1}}><div style={{fontSize:'clamp(14px,.95vw,19px)',fontWeight:600,marginBottom:3}}>Blind_Test</div><div style={{fontSize:'clamp(11px,.76vw,15px)',color:'var(--t2)'}}>Solo ou 1v1 — devine les sons</div></div>
              <span style={{color:'var(--t3)',fontSize:'clamp(17px,1.6vw,25px)',display:'flex'}}>{IC.chR}</span>
            </div>
            {/* Rejoindre avec code input */}
            <div style={{background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)',borderRadius:'clamp(14px,1.2vw,22px)',padding:'clamp(15px,1.6vh,24px) clamp(17px,1.6vw,28px)',cursor:'pointer',transition:'background .15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--mR)'}
              onClick={()=>setJoinOpen(o=>!o)}>
              <div style={{display:'flex',alignItems:'center',gap:'clamp(13px,1.1vw,20px)'}}>
                <div style={{width:'clamp(40px,3.8vh,56px)',height:'clamp(40px,3.8vh,56px)',borderRadius:'clamp(10px,.9vw,15px)',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.18)',flexShrink:0,fontSize:'clamp(17px,1.7vh,25px)',color:'rgba(255,255,255,.7)',boxShadow:'var(--le)'}}>{IC.link}</div>
                <div style={{flex:1}}><div style={{fontSize:'clamp(14px,.95vw,19px)',fontWeight:600,marginBottom:3}}>Rejoindre</div><div style={{fontSize:'clamp(11px,.76vw,15px)',color:'var(--t2)'}}>Rejoindre avec un code</div></div>
                <span style={{color:'var(--t3)',fontSize:'clamp(17px,1.6vw,25px)',display:'flex'}}>{joinOpen?IC.xm:IC.chR}</span>
              </div>
              {joinOpen&&<div style={{marginTop:'clamp(10px,1vh,16px)',display:'flex',gap:'clamp(8px,.7vw,12px)'}} onClick={e=>e.stopPropagation()}>
                <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="Code de la partie (ex: MT·7K4X)" style={{flex:1,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.14)',borderRadius:'clamp(8px,.7vw,12px)',padding:'clamp(9px,.9vh,14px) clamp(12px,1vw,18px)',color:'var(--t1)',fontSize:'clamp(12px,.85vw,15px)',outline:'none',fontFamily:'var(--F)',letterSpacing:'.06em',fontWeight:600}} onKeyDown={e=>e.key==='Enter'&&alert('1v1 en cours de développement — bientôt disponible')}/>
                <button onClick={()=>alert('1v1 en cours de développement — bientôt disponible')} className="bs" style={{padding:'clamp(9px,.9vh,14px) clamp(16px,1.5vw,24px)',borderRadius:'clamp(8px,.7vw,12px)',fontSize:'clamp(12px,.85vw,15px)',flexShrink:0}}>Rejoindre</button>
              </div>}
            </div>
            <div style={{background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)',borderRadius:'clamp(14px,1.2vw,22px)',padding:'clamp(15px,1.6vh,24px) clamp(17px,1.6vw,28px)',display:'flex',alignItems:'center',gap:'clamp(13px,1.1vw,20px)',opacity:.36,cursor:'not-allowed'}}>
              <div style={{width:'clamp(40px,3.8vh,56px)',height:'clamp(40px,3.8vh,56px)',borderRadius:'clamp(10px,.9vw,15px)',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.18)',flexShrink:0,fontSize:'clamp(17px,1.7vh,25px)',color:'rgba(255,255,255,.5)',boxShadow:'var(--le)'}}>{IC.game}</div>
              <div style={{flex:1}}><div style={{fontSize:'clamp(14px,.95vw,19px)',fontWeight:600,marginBottom:3}}>Autres jeux</div><div style={{fontSize:'clamp(11px,.76vw,15px)',color:'var(--t2)'}}>Bientôt disponible</div></div>
            </div>
          </div>
        </div>
      </div>}

      {/* ── CONFIG */}
      {screen==='config'&&<div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'clamp(18px,1.8vh,32px) clamp(20px,2vw,40px)'}}>
        <div className="fade" style={{width:'100%',maxWidth:'min(500px,44vw)'}}>
          <button onClick={()=>setScreen('home')} className="bg" style={{fontSize:'clamp(11px,.8vw,15px)',marginBottom:'clamp(12px,1.2vh,20px)',display:'flex',alignItems:'center',gap:4}}><span style={{display:'flex'}}>{IC.bk}</span>Retour</button>
          <h1 style={{fontSize:'clamp(18px,1.8vw,30px)',fontWeight:700,letterSpacing:'-.03em',marginBottom:'clamp(14px,1.5vh,24px)'}}>Configurer</h1>
          <div style={{display:'flex',flexDirection:'column',gap:'clamp(9px,.9vh,14px)'}}>
            <div className="g2" style={{borderRadius:'clamp(14px,1.2vw,20px)',padding:'clamp(13px,1.4vh,21px) clamp(15px,1.4vw,24px)'}}>
              <p style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t3)',marginBottom:'clamp(9px,.9vh,14px)',fontWeight:500}}>Mode</p>
              <div style={{display:'flex',gap:'clamp(6px,.55vw,10px)'}}><Pill active={gMode==='solo'} onClick={()=>setGMode('solo')}>Solo</Pill><Pill active={gMode==='1v1'} onClick={()=>setGMode('1v1')}>1 vs 1</Pill></div>
            </div>
            <div className="g2" style={{borderRadius:'clamp(14px,1.2vw,20px)',padding:'clamp(13px,1.4vh,21px) clamp(15px,1.4vw,24px)'}}>
              <p style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t3)',marginBottom:'clamp(10px,1vh,16px)',fontWeight:500}}>Manches</p>
              <div style={{display:'flex',alignItems:'center',gap:'clamp(14px,1.4vw,24px)'}}>
                <button onClick={()=>setRounds(r=>Math.max(1,r-5))} style={{width:'clamp(28px,2.5vh,38px)',height:'clamp(28px,2.5vh,38px)',borderRadius:'50%',background:'rgba(0,0,0,.14)',border:'none',color:'var(--t1)',fontSize:'clamp(16px,1.5vh,22px)',cursor:'pointer',boxShadow:'var(--le)',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                <span style={{fontSize:'clamp(24px,2.6vw,42px)',fontWeight:700,minWidth:'clamp(46px,4.2vw,68px)',textAlign:'center',letterSpacing:'-.03em',fontVariantNumeric:'tabular-nums'}}>{rounds}</span>
                <button onClick={()=>setRounds(r=>r+5)} style={{width:'clamp(28px,2.5vh,38px)',height:'clamp(28px,2.5vh,38px)',borderRadius:'50%',background:'rgba(0,0,0,.14)',border:'none',color:'var(--t1)',fontSize:'clamp(16px,1.5vh,22px)',cursor:'pointer',boxShadow:'var(--le)',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
              </div>
            </div>
            <div className="g2" style={{borderRadius:'clamp(14px,1.2vw,20px)',padding:'clamp(13px,1.4vh,21px) clamp(15px,1.4vw,24px)'}}>
              <p style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t3)',marginBottom:'clamp(9px,.9vh,14px)',fontWeight:500}}>Temps par manche</p>
              <div style={{display:'flex',gap:'clamp(6px,.55vw,10px)',flexWrap:'wrap'}}>{[15,20,30,45].map(d=><Pill key={d} active={dur===d} onClick={()=>setDur(d)}>{d}s</Pill>)}</div>
            </div>
            <button onClick={()=>setScreen('artists')} className="bs" style={{width:'100%',padding:'clamp(11px,1.1vh,17px)',borderRadius:'clamp(12px,1vw,18px)',fontSize:'clamp(12px,.88vw,16px)'}}>Choisir les artistes</button>
          </div>
        </div>
      </div>}

      {/* ── ARTISTS */}
      {screen==='artists'&&<div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* ════ ROW : colonne gauche + colonne droite ════ */}
        <div style={{flex:1,display:'flex',overflow:'hidden',minHeight:0}}>

          {/* ── COLONNE GAUCHE : Mix personnalisés ─────────── */}
          <div style={{width:'clamp(200px,20vw,300px)',flexShrink:0,overflowY:'auto',padding:'clamp(14px,1.6vh,24px) clamp(14px,1.4vw,20px)',borderRight:'1px solid rgba(255,255,255,.07)',display:'flex',flexDirection:'column',gap:'clamp(12px,1.3vh,20px)'}}>
            <div>
              <h2 style={{fontSize:'clamp(14px,1.3vw,22px)',fontWeight:700,letterSpacing:'-.03em',marginBottom:'clamp(3px,.3vh,6px)'}}>Mix personnalisés</h2>
              <p style={{fontSize:'clamp(9px,.67vw,13px)',color:'var(--t3)'}}>Basé sur tes écoutes Spotify</p>
            </div>
            {/* Cards Solo + 1v1 */}
            {['solo','1v1'].map(mode=>{
              const active=mixPerso&&mixMode===mode;
              const bgImg=mode==='solo'?topArtists[0]?.images?.[0]?.url:topArtists[1]?.images?.[0]?.url;
                  return(
                <div key={mode} onClick={()=>{setMixPerso(true);setMixMode(mode);}} style={{cursor:'pointer',borderRadius:'clamp(10px,1vw,16px)',overflow:'hidden',position:'relative',width:'100%',aspectRatio:'1',boxShadow:active?'0 0 0 2px rgba(255,255,255,.8),0 0 0 5px rgba(255,255,255,.12)':'0 6px 24px rgba(0,0,0,.4)',transition:'all .2s',flexShrink:0}}>
                  {/* Template CSS (reproduit le design sans fichier externe) */}
                  <MixCoverTemplate mode={mode} artistUrl={bgImg}/>
                  {/* Indicateur sélectionné */}
                  {active&&<div style={{position:'absolute',top:'clamp(6px,.6vh,10px)',left:'clamp(6px,.6vh,10px)',background:'rgba(255,255,255,.95)',color:'#000',borderRadius:'999px',padding:'clamp(2px,.2vh,4px) clamp(7px,.65vw,11px)',fontSize:'clamp(9px,.65vw,12px)',fontWeight:700,backdropFilter:'blur(8px)'}}>✓ Sélectionné</div>}
                </div>
              );
            })}
          </div>

          {/* ── COLONNE DROITE : Grille artistes ───────────── */}
          <div style={{flex:1,overflowY:'auto',padding:'clamp(12px,1.2vh,20px) clamp(20px,2vw,36px) clamp(80px,8vh,120px)'}}>
            <div style={{maxWidth:'min(1200px,96%)',margin:'0 auto'}}>
              <button onClick={()=>setScreen('config')} className="bg" style={{fontSize:'clamp(11px,.8vw,15px)',marginBottom:'clamp(14px,1.6vh,22px)',display:'flex',alignItems:'center',gap:4}}><span style={{display:'flex'}}>{IC.bk}</span>Retour</button>
              <div style={{marginBottom:'clamp(16px,2vh,28px)'}}>
                <h1 style={{fontSize:'clamp(22px,2.6vw,44px)',fontWeight:800,letterSpacing:'-.04em',lineHeight:.92,marginBottom:'clamp(6px,.6vh,10px)'}}>Sélectionne un(e)<br/>ou des artistes</h1>
                <p style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t2)'}}>Sélectionne depuis ton top ou recherche dans tout Spotify</p>
              </div>
              {err&&<div style={{background:'rgba(248,113,113,.12)',border:'1px solid rgba(248,113,113,.3)',borderRadius:'clamp(9px,.8vw,14px)',padding:'clamp(10px,1vh,16px) clamp(14px,1.3vw,20px)',marginBottom:'clamp(12px,1.3vh,20px)',fontSize:'clamp(11px,.8vw,14px)',color:'rgba(248,113,113,.9)'}}>{err}</div>}
              {/* Label */}
              <p style={{fontSize:'clamp(10px,.7vw,13px)',fontWeight:600,color:'var(--t3)',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:'clamp(12px,1.4vh,20px)'}}>Artistes écoutés récemment</p>
              {/* Grille */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(clamp(85px,8.5vw,130px),1fr))',gap:'clamp(14px,1.6vw,26px)'}}>
                {topArtists.map(a=>{const s=selArts.find(x=>x.id===a.id);return(
                  <div key={a.id} onClick={()=>toggleArtist(a)} style={{cursor:'pointer',textAlign:'center'}}>
                    <div style={{position:'relative',marginBottom:'clamp(6px,.6vh,10px)'}}>
                      {a.images?.[0]?.url
                        ?<img src={a.images[0].url} style={{width:'100%',aspectRatio:'1',borderRadius:'50%',objectFit:'cover',display:'block',outline:s?'clamp(2.5px,.22vw,4px) solid rgba(255,255,255,.85)':'none',outlineOffset:'clamp(3px,.25vw,5px)',transition:'all .15s',boxShadow:s?'0 0 0 clamp(5px,.48vw,8px) rgba(255,255,255,.1)':'none'}} alt={a.name}/>
                        :<div style={{width:'100%',paddingBottom:'100%',borderRadius:'50%',background:'linear-gradient(135deg,#1a2a4a,#2a1a4a)',outline:s?'clamp(2.5px,.22vw,4px) solid rgba(255,255,255,.85)':'none',outlineOffset:'clamp(3px,.25vw,5px)',transition:'all .15s'}}/>}
                      {s&&<div style={{position:'absolute',bottom:0,right:0,width:'clamp(18px,1.7vh,26px)',height:'clamp(18px,1.7vh,26px)',borderRadius:'50%',background:'white',color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(9px,.8vh,13px)',fontWeight:700,boxShadow:'0 2px 8px rgba(0,0,0,.4)'}}>✓</div>}
                    </div>
                    <div style={{fontSize:'clamp(9px,.65vw,12px)',fontWeight:500,color:s?'var(--t1)':'var(--t2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name}</div>
                  </div>
                );})}
              </div>

              {/* ── Frise chronologique ─── */}
              <div style={{marginTop:'clamp(32px,4vh,56px)'}}>
                <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'clamp(14px,1.6vh,22px)',gap:'clamp(12px,1.2vw,20px)'}}>
                  <div>
                    <h3 style={{fontSize:'clamp(18px,2vw,32px)',fontWeight:800,letterSpacing:'-.04em',lineHeight:.95,marginBottom:'clamp(5px,.5vh,8px)'}}>Période de sortie</h3>
                    <p style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t3)'}}>Filtre les sons par année de release</p>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <span style={{fontSize:'clamp(20px,2.4vw,40px)',fontWeight:800,letterSpacing:'-.04em',fontVariantNumeric:'tabular-nums'}}>{yearMin}</span>
                    <span style={{fontSize:'clamp(12px,1.4vw,22px)',fontWeight:400,color:'var(--t3)',margin:'0 clamp(5px,.45vw,9px)'}}>—</span>
                    <span style={{fontSize:'clamp(20px,2.4vw,40px)',fontWeight:800,letterSpacing:'-.04em',fontVariantNumeric:'tabular-nums'}}>{yearMax}</span>
                  </div>
                </div>
                <div style={{padding:'0 clamp(10px,1vw,16px)',marginBottom:'clamp(10px,1vh,14px)'}}>
                  <div className="rs">
                    <div style={{position:'absolute',top:0,bottom:0,left:`${(yearMin-1900)/(2026-1900)*100}%`,width:`${(yearMax-yearMin)/(2026-1900)*100}%`,background:'rgba(255,255,255,.75)',borderRadius:'999px',pointerEvents:'none'}}/>
                    <input type="range" min={1900} max={2026} step={1} value={yearMin} onChange={e=>setYearMin(Math.min(parseInt(e.target.value),yearMax-1))} style={{zIndex:yearMin>2015?3:2}}/>
                    <input type="range" min={1900} max={2026} step={1} value={yearMax} onChange={e=>setYearMax(Math.max(parseInt(e.target.value),yearMin+1))} style={{zIndex:3}}/>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'0 clamp(10px,1vw,16px)'}}>
                  {[1900,1920,1940,1960,1980,2000,2010,2020,2026].map(y=>(
                    <span key={y} onClick={()=>{if(Math.abs(y-yearMin)<=Math.abs(y-yearMax))setYearMin(Math.min(y,yearMax-1));else setYearMax(Math.max(y,yearMin+1));}} style={{fontSize:'clamp(8px,.58vw,11px)',color:'var(--t4)',cursor:'pointer',fontVariantNumeric:'tabular-nums',transition:'color .1s'}} onMouseEnter={e=>e.currentTarget.style.color='var(--t2)'} onMouseLeave={e=>e.currentTarget.style.color='var(--t4)'}>{y}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>{/* fin row */}

        {/* ── Barre inférieure ─── */}
        {(selArts.length>0||mixPerso)&&<div style={{flexShrink:0,padding:'clamp(9px,.9vh,14px) clamp(18px,1.8vw,34px)',background:'rgba(0,0,0,.4)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.1),0 -2px 20px rgba(0,0,0,.4)',display:'flex',alignItems:'center',gap:'clamp(9px,.8vw,16px)'}}>
          <div style={{display:'flex',gap:'clamp(6px,.55vw,10px)',flex:1,overflowX:'auto',paddingBottom:2}}>
            {mixPerso&&<div style={{display:'flex',alignItems:'center',gap:'clamp(5px,.4vw,8px)',padding:'clamp(4px,.4vh,7px) clamp(10px,.9vw,16px)',borderRadius:'999px',background:mixMode==='1v1'?'rgba(168,85,247,.22)':'rgba(88,101,242,.22)',boxShadow:`inset 0 1px 0 rgba(255,255,255,.3),inset 0 0 0 1px ${mixMode==='1v1'?'rgba(168,85,247,.35)':'rgba(88,101,242,.35)'}`,flexShrink:0}}>
              <span style={{fontSize:'clamp(10px,.72vw,14px)'}}>Mix {mixMode==='1v1'?'1v1':'Solo'}</span>
              <span onClick={(e)=>{e.stopPropagation();setMixPerso(false);}} className="bg" style={{fontSize:'clamp(12px,.9vw,17px)',lineHeight:1,display:'flex'}}>{IC.xm}</span>
            </div>}
            {selArts.map(a=>(
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:'clamp(5px,.4vw,8px)',padding:'clamp(4px,.4vh,7px) clamp(10px,.9vw,16px) clamp(4px,.4vh,7px) clamp(5px,.4vw,8px)',borderRadius:'999px',background:'rgba(255,255,255,.1)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.18)',flexShrink:0}}>
                {a.images?.[0]?.url&&<img src={a.images[0].url} style={{width:'clamp(16px,1.5vh,22px)',height:'clamp(16px,1.5vh,22px)',borderRadius:'50%',objectFit:'cover'}} alt=""/>}
                <span style={{fontSize:'clamp(10px,.72vw,14px)',whiteSpace:'nowrap'}}>{a.name}</span>
                <span onClick={(e)=>{e.stopPropagation();toggleArtist(a);}} className="bg" style={{fontSize:'clamp(12px,.9vw,17px)',lineHeight:1,display:'flex'}}>{IC.xm}</span>
              </div>
            ))}
          </div>
          <button onClick={startGame} disabled={loading} className="bs" style={{padding:'clamp(10px,1vh,16px) clamp(24px,2.4vw,42px)',borderRadius:'999px',fontSize:'clamp(13px,.9vw,17px)',fontWeight:600,flexShrink:0,opacity:loading?.6:1,boxShadow:'0 4px 20px rgba(255,255,255,.2)'}}>
            {loading?'Chargement…':'Lancer'}
          </button>
        </div>}
      </div>}

            {/* ── GAME */}
      {screen==='game'&&<div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(22px,3vw,60px)',padding:'clamp(14px,1.5vh,26px)'}}>
        <MysteryCover url={track?.album?.images?.[0]?.url} sz="clamp(180px,22vh,340px)"/>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'clamp(12px,1.4vh,22px)'}}>
          <div style={{background:'rgba(0,0,0,.35)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.25),inset 0 0 0 1px rgba(255,255,255,.1)',borderRadius:'999px',padding:'clamp(7px,.7vh,11px) clamp(18px,1.8vw,30px)',display:'flex',gap:'clamp(14px,1.4vw,22px)'}}>
            <span style={{fontSize:'clamp(11px,.8vw,15px)',color:'var(--t2)'}}>Manche <strong style={{color:'var(--t1)'}}>{cIdx+1}</strong>/{pool.length}</span>
            <span style={{color:'var(--t3)'}}>|</span>
            <span style={{fontSize:'clamp(11px,.8vw,15px)',color:'var(--t2)'}}>Score <strong style={{color:'var(--t1)'}}>{score}</strong></span>
          </div>
          <div style={{textAlign:'center'}}>
            <div className={`t${tc}`} style={{fontSize:'clamp(50px,7.5vw,120px)',fontWeight:700,letterSpacing:'-.06em',lineHeight:1,fontVariantNumeric:'tabular-nums',transition:'color .5s'}}>{timer}</div>
            <div style={{height:'clamp(3px,.3vh,5px)',background:'rgba(255,255,255,.1)',borderRadius:'999px',marginTop:'clamp(8px,.8vh,14px)',width:'clamp(110px,13vw,220px)',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${(timer/dur)*100}%`,background:tc==='g'?'#34d399':tc==='a'?'#fbbf24':'#f87171',borderRadius:'999px',transition:'width 1s linear,background .5s'}}/>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'3px',height:'clamp(22px,2.8vh,40px)'}}>
            {[6,14,22,10,18,28,8,16,24,12,26,14,7,20,24].map((h,i)=>(
              <div key={i} style={{width:'clamp(3px,.25vw,5px)',height:h,borderRadius:3,background:`rgba(255,255,255,${.28+(i%3)*.08})`,transformOrigin:'center',animation:paused?'none':`wave ${.48+(i%5)*.12}s ease-in-out ${i*.055}s infinite`}}/>
            ))}
          </div>
          <div style={{display:'flex',gap:'clamp(7px,.6vw,12px)'}}>
            <button onClick={handlePause} style={{borderRadius:'999px',padding:'clamp(7px,.7vh,12px) clamp(14px,1.3vw,22px)',fontSize:'clamp(14px,1.2vh,20px)',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,.12)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,.22)',color:'rgba(255,255,255,.9)',cursor:'pointer',transition:'all .15s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.22)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.12)'}>{paused?IC.pl:IC.pa}</button>
            <button onClick={doReveal} style={{borderRadius:'999px',padding:'clamp(7px,.7vh,12px) clamp(14px,1.3vw,22px)',fontSize:'clamp(11px,.8vw,15px)',background:'rgba(255,255,255,.08)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,.16)',color:'rgba(255,255,255,.75)',cursor:'pointer',transition:'all .15s',fontFamily:'var(--F)'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.16)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'}>Passer</button>
          </div>
        </div>
      </div>}

      {/* ── REVEAL */}
      {screen==='reveal'&&<div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'clamp(14px,1.5vh,26px)'}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'clamp(14px,1.8vh,28px)',width:'100%',maxWidth:'min(420px,38vw)'}}>
          <div style={{width:'clamp(180px,22vh,320px)',height:'clamp(180px,22vh,320px)',borderRadius:'clamp(16px,1.5vw,26px)',overflow:'hidden',animation:'coverRev .75s var(--sp) forwards',boxShadow:'0 28px 80px rgba(0,0,0,.55),var(--leS)'}}>
            {track?.album?.images?.[0]?.url?<img src={track.album.images[0].url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#1a3a5a,#2a1a5a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(50px,7vh,90px)',color:'var(--t1)'}}>{IC.music}</div>}
          </div>
          <div style={{textAlign:'center',animation:'fadeUp .4s ease .35s both',opacity:0}}>
            <h2 style={{fontSize:'clamp(17px,1.8vw,30px)',fontWeight:700,letterSpacing:'-.03em',marginBottom:'clamp(4px,.4vh,8px)'}}>{track?.name}</h2>
            <p style={{fontSize:'clamp(12px,.88vw,16px)',color:'rgba(255,255,255,.65)',marginBottom:'clamp(3px,.3vh,6px)'}}><span style={{color:'var(--t1)',textDecoration:'underline',textDecorationColor:'rgba(255,255,255,.22)',cursor:'pointer'}}>{track?.artists?.map(a=>a.name).join(', ')}</span></p>
            <p style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t3)'}}>{track?.album?.name} · {track?.album?.release_date?.slice(0,4)}</p>
          </div>
          <div className="g2" style={{borderRadius:'clamp(9px,.8vw,15px)',padding:'clamp(9px,.9vh,15px) clamp(16px,1.6vw,26px)',animation:'fadeUp .4s ease .5s both',opacity:0}}>
            <p style={{fontSize:'clamp(11px,.8vw,15px)',fontWeight:500,textAlign:'center'}}>Trouvé en <strong>{Math.max(0,dur-timer)}s</strong> — +{Math.max(10,Math.round((timer/dur)*1000))} pts</p>
          </div>
          <div style={{display:'flex',gap:'clamp(8px,.7vw,14px)',animation:'fadeUp .4s ease .62s both',opacity:0}}>
            {[['👍','rgba(52,211,153,.16)'],['👎','rgba(248,113,113,.16)']].map(([e,h],i)=>(
              <button key={i} className="g2" style={{border:'none',borderRadius:'999px',padding:'clamp(8px,.8vh,14px) clamp(18px,1.8vw,28px)',cursor:'pointer',fontSize:'clamp(15px,1.6vh,24px)',transition:'all .15s'}}
                onMouseEnter={e2=>e2.currentTarget.style.background=h}
                onMouseLeave={e2=>e2.currentTarget.style.background='var(--mR)'}>{e}</button>
            ))}
          </div>
          <button onClick={nextRound} className="bs" style={{padding:'clamp(10px,1vh,16px) clamp(28px,2.8vw,48px)',borderRadius:'999px',fontSize:'clamp(12px,.88vw,16px)',animation:'fadeUp .4s ease .74s both',opacity:0}}>
            {cIdx+1>=pool.length?'Voir les scores':'Suivant'}
          </button>
        </div>
      </div>}

      {/* ── END */}
      {screen==='end'&&<div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'clamp(20px,2vh,40px)'}}>
        <div className="scalein" style={{textAlign:'center'}}>
          <p style={{fontSize:'clamp(11px,.8vw,16px)',color:'var(--t3)',marginBottom:'clamp(7px,.7vh,12px)'}}>Partie terminée</p>
          <h1 style={{fontSize:'clamp(52px,7.5vw,120px)',fontWeight:700,letterSpacing:'-.055em',marginBottom:'clamp(5px,.5vh,10px)'}}>{score}</h1>
          <p style={{fontSize:'clamp(13px,1.1vw,20px)',color:'var(--t2)',marginBottom:'clamp(26px,3vh,48px)'}}>points · {pool.length} manches</p>
          <div style={{display:'flex',gap:'clamp(9px,.9vw,16px)',justifyContent:'center'}}>
            <button onClick={()=>setScreen('home')} className="g2 bg" style={{borderRadius:'999px',padding:'clamp(11px,1.1vh,18px) clamp(22px,2.2vw,40px)',fontSize:'clamp(12px,.87vw,16px)',border:'none'}}>Accueil</button>
            <button onClick={startGame} className="bs" style={{borderRadius:'999px',padding:'clamp(11px,1.1vh,18px) clamp(22px,2.2vw,40px)',fontSize:'clamp(12px,.87vw,16px)'}}>Rejouer</button>
          </div>
        </div>
      </div>}
    </div>

    {showPB&&<PlayerBar
      track={track} paused={paused} prog={prog} vol={vol}
      revealed={revealed} canSeek={revealed}
      onPause={handlePause}
      onVolume={handleVolume}
      onSeek={e=>{
        if(!revealed)return;
        const r=e.currentTarget.getBoundingClientRect();
        const pct=(e.clientX-r.left)/r.width;
        if(track?.duration_ms){const pos=Math.floor(pct*track.duration_ms);setProg(Math.floor(pos/1000));playerRef.current?.seek(pos);}
      }}
    />}
  </>);
}
