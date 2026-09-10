import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api, spFetch as spDirect } from './api'; // spDirect partage le rate limiter global

// Images PNG
const MIX_SOLO_URL = new URL('./mix-solo.png', import.meta.url).href;
const MIX_1V1_URL  = new URL('./mix-1v1.png',  import.meta.url).href;

// WebSocket URL — même host que l'API REST
const WS_URL=(import.meta.env.VITE_API_URL||'http://localhost:3001')
  .replace('https://','wss://').replace('http://','ws://');

// Frise — chaque année sélectionnable, labels affichés seulement en 0/5
const YEAR_STEPS=Array.from({length:127},(_,i)=>1900+i); // 1900→2026
const YN=126;
const YEAR_LABELS=YEAR_STEPS.filter(y=>y%5===0||y===2026); // 1900,1905,...,2025,2026


function saveTokens({access_token,refresh_token,expires_in}){
  localStorage.setItem('access_token',access_token);
  localStorage.setItem('refresh_token',refresh_token);
  localStorage.setItem('token_expires',Date.now()+parseInt(expires_in)*1000);
}
function isLoggedIn(){return!!localStorage.getItem('access_token');}
function logout(){localStorage.clear();window.location.href='/';}

const CSS=`
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
.btn-glass{background:var(--mR);backdrop-filter:var(--mRb);-webkit-backdrop-filter:var(--mRb);box-shadow:var(--le);color:var(--t1);cursor:pointer;font-family:var(--F);}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes coverRev{from{filter:blur(28px) brightness(.12) saturate(0);transform:scale(.92)}to{filter:blur(0) brightness(1) saturate(1);transform:scale(1)}}
@keyframes wave{0%,100%{transform:scaleY(1)}50%{transform:scaleY(2.8)}}
@keyframes tp{0%,100%{opacity:1}50%{opacity:.6}}
@keyframes kbDrift{0%{transform:scale(1.4) translate(0,0)}25%{transform:scale(1.5) translate(-2.5%,-1.5%)}50%{transform:scale(1.42) translate(2%,2%)}75%{transform:scale(1.5) translate(-1.5%,1.8%)}100%{transform:scale(1.4) translate(0,0)}}
@keyframes bgFadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fade{animation:fadeUp .45s var(--sp) both;}
.scalein{animation:scaleIn .45s var(--sp) both;}
.tg{color:#34d399;text-shadow:0 0 clamp(12px,1.5vw,30px) rgba(52,211,153,.45);}
.ta{color:#fbbf24;text-shadow:0 0 clamp(12px,1.5vw,30px) rgba(251,191,36,.45);}
.tr{color:#f87171;text-shadow:0 0 clamp(12px,1.5vw,30px) rgba(248,113,113,.45);animation:tp .5s ease-in-out infinite;}
/* ── Slider dual-thumb frise — taille fixe px pour zoom-proof ── */
.rs{position:relative;height:24px;display:flex;align-items:center;}
.rs input[type=range]{position:absolute;width:100%;height:4px;appearance:none;-webkit-appearance:none;background:transparent;pointer-events:none;outline:none;margin:0;padding:0;}
.rs input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:white;cursor:pointer;pointer-events:auto;box-shadow:0 2px 8px rgba(0,0,0,.4);transition:transform .1s;}
.rs input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.2);}
.rs input[type=range]::-webkit-slider-thumb:active{transform:scale(1.1);}
.rs input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:white;cursor:pointer;pointer-events:auto;border:none;box-shadow:0 2px 8px rgba(0,0,0,.4);}
.rs::before{content:'';position:absolute;left:9px;right:9px;height:4px;background:rgba(255,255,255,.12);border-radius:999px;}
`;

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
  x:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  chevR:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

function MixCoverTemplate({mode,artistUrl}){
  const tplUrl=mode==='solo'?MIX_SOLO_URL:MIX_1V1_URL;
  return(
    <div style={{position:'absolute',inset:0}}>
      {artistUrl
        ?<img src={artistUrl} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}} alt="" crossOrigin="anonymous"/>
        :<div style={{position:'absolute',inset:0,background:mode==='solo'?'linear-gradient(135deg,#0f3460,#16213e)':'linear-gradient(135deg,#533483,#7b2d8b)'}}/>
      }
      {/* Overlay dégradé sur la photo */}
      <div style={{position:'absolute',inset:0,background:mode==='solo'?'linear-gradient(to bottom,rgba(10,5,30,.45),rgba(10,5,30,.62))':'linear-gradient(to bottom,rgba(30,5,30,.45),rgba(30,5,30,.62))'}}/>
      {/* Template PNG par dessus */}
      <img src={tplUrl} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
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
        {track.album?.images?.[0]?.url&&<img src={track.album.images[0].url} style={{width:'100%',height:'100%',objectFit:'cover',filter:revealed?'none':'grayscale(100%) brightness(.05) blur(4px)',transition:'filter 1.2s ease',opacity:revealed?1:.4}} alt=""/>}
        {!revealed&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.65)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(12px,1.1vh,18px)',fontWeight:700,color:'rgba(255,255,255,.5)'}}>?</div>}
      </div>
      <div style={{width:'clamp(90px,9vw,160px)',flexShrink:0}}>
        <div style={{fontSize:'clamp(10px,.72vw,13px)',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{revealed?track.name:''}</div>
        <div style={{fontSize:'clamp(9px,.65vw,12px)',color:'var(--t3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{revealed?track.artists?.map(a=>a.name).join(', '):''}</div>
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
  const[mixCoverIdx,setMixCoverIdx]=useState({solo:0,v1:1});
  const[loadingMsg,setLoadingMsg]=useState('');
  const[guestArtists,setGuestArtists]=useState(null); // déclenche le build du pool Mix 1v1
  const[roundSolved,setRoundSolved]=useState(false);
  // ── 1v1 states ──────────────────────────────────────────────────────────
  const[wsOk,setWsOk]=useState(false);
  const[roomCode,setRoomCode]=useState('');
  const[roomRole,setRoomRole]=useState(null); // 'host'|'guest'|null
  const[opponentScore,setOpponentScore]=useState(0);
  const[opponentInfo,setOpponentInfo]=useState(null); // {name,avatar}
  const[tempPool,setTempPool]=useState([]); // pool stocké pendant l'attente guest // true = trouvé, false = passé/timer
  const[mixMode,setMixMode]=useState('solo'); // 'solo' | '1v1'
  const[minIdx,setMinIdx]=useState(105); // 2005
  // maxIdx déjà défini plus bas via useState(YN)
  const[maxIdx,setMaxIdx]=useState(YN); // 2026
  const yearMin=YEAR_STEPS[minIdx];
  const yearMax=YEAR_STEPS[maxIdx];
  const[joinCode,setJoinCode]=useState('');
  const[joinOpen,setJoinOpen]=useState(false);
  const[err,setErr]=useState('');
  const timerRef=useRef(null);
  const progRef=useRef(null);
  const bgRef=useRef(null);
  const srchRef=useRef(null);
  const artRef=useRef(null);
  const playerRef=useRef(null);
  const selArtsRef=useRef([]);    // ref stable pour background loading
  const roundsRef=useRef(10);
  const wsRef=useRef(null);         // WebSocket instance
  const tempPoolRef=useRef([]);     // pool 1v1 en attente
  const roomCodeRef=useRef('');     // ref du code room (lu dans la boucle d'attente)
  const doRevealRef=useRef(null);   // ref vers doReveal pour WS handler
  const nextRoundRef=useRef(null);  // ref vers nextRound
  const handlePauseRef=useRef(null);
  const playTrackRef=useRef(null);
  const durRef=useRef(30);
  const hostArtistsRef=useRef([]);   // top 50 artistes du host (Mix 1v1)
  const mixModeRef=useRef('solo');   // ref stable pour WS handler
  const fetchAllSongsRef=useRef(null); // ref vers fetchAllSongs
  const yearMinRef=useRef(1900);
  const yearMaxRef=useRef(2026);
  useEffect(()=>{selArtsRef.current=selArts;},[selArts]);
  useEffect(()=>{roundsRef.current=rounds;},[rounds]);

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
        const arts_=arts.items||[];
        setUser(me);setTopArtists(arts_);setTopTracks(trs.items||[]);
        if(arts_.length>0){
          const n=arts_.length;
          const s=Math.floor(Math.random()*n);
          let v=Math.floor(Math.random()*n);
          while(v===s&&n>1)v=Math.floor(Math.random()*n);
          setMixCoverIdx({solo:s,v1:v});
        }
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

  // Sync refs pour WebSocket handler (toujours à jour)
  useEffect(()=>{durRef.current=dur;},[dur]);
  useEffect(()=>{roundsRef.current=rounds;},[rounds]);

  // ── WebSocket 1v1 ─────────────────────────────────────────────────────────
  // Handler WS (défini inline → toujours à jour via messageHandlerRef)
  const messageHandlerRef=useRef(null);
  messageHandlerRef.current=(msg)=>{
    const send=(obj)=>wsRef.current?.readyState===1&&wsRef.current.send(JSON.stringify(obj));
    switch(msg.type){
      case 'room_created':
        setRoomCode(msg.code);
        roomCodeRef.current=msg.code; // sync ref pour la boucle d'attente dans startGame
        break;
      case 'guest_joined':{
        setOpponentInfo({name:msg.name||'Joueur 2'});
        if(mixModeRef.current==='1v1'){
          // Mix 1v1 : attendre les artistes du guest (ils arrivent via share_artists → guest_artists)
          break;
        }
        // Mode normal : envoyer pool existant au guest immédiatement
        const pool=tempPoolRef.current;
        send({type:'game_start',tracks:pool});
        setPool(pool);setCIdx(0);setScore(0);setOpponentScore(0);
        setTimer(durRef.current);setRevealed(false);setAnswer('');setProg(0);
        setRoundSolved(false);
        setScreen('game');
        setTimeout(()=>{if(pool[0])playTrackRef.current?.(pool[0]);},500);
        break;}
      case 'guest_artists':{
        // Host reçoit top artistes du guest → déclenche le useEffect qui build le pool combiné
        setGuestArtists(msg.artists||[]);
        break;}
      case 'game_start':{
        const tr=msg.tracks||[];
        setPool(tr);setCIdx(0);setScore(0);setOpponentScore(0);
        setTimer(durRef.current);setRevealed(false);setAnswer('');setProg(0);
        setRoundSolved(false);
        setScreen('game');
        setTimeout(()=>{if(tr[0])playTrackRef.current?.(tr[0]);},500);
        break;}
      case 'opponent_found':
        setOpponentScore(msg.score||0);
        if(!doRevealRef.current)return;
        doRevealRef.current();
        break;
      case 'host_control':
        if(msg.action==='next')nextRoundRef.current?.();
        if(msg.action==='pause')handlePauseRef.current?.();
        if(msg.action==='reveal')doRevealRef.current?.(); // host timer expired
        break;
      case 'room_joined':
        setRoomCode((msg.code||'').toUpperCase());
        setRoomRole('guest');
        setOpponentInfo({name:msg.hostName||'Host'});
        if(msg.settings?.mixMode==='1v1'){
          // Mix 1v1 : envoyer automatiquement les top 50 artistes (1 an) au host
          spDirect('/me/top/artists?time_range=medium_term&limit=50')
            .then(data=>{
              wsRef.current?.send(JSON.stringify({type:'share_artists',artists:data.items||[]}));
            })
            .catch(()=>{
              wsRef.current?.send(JSON.stringify({type:'share_artists',artists:[]}));
            });
        }
        setScreen('waiting');
        break;
      case 'opponent_left':
        setErr('Ton adversaire a quitté la partie.');
        setRoomRole(null);setRoomCode('');
        setScreen('home');
        break;
      case 'error':
        setErr(msg.msg||'Erreur room — vérifie le code');
        break;
    }
  };

  // Connexion WebSocket dès la connexion Spotify
  useEffect(()=>{
    if(screen==='login')return;
    const ws=new WebSocket(WS_URL);
    wsRef.current=ws;
    ws.onopen=()=>setWsOk(true);
    ws.onclose=()=>setWsOk(false);
    ws.onerror=()=>setWsOk(false);
    ws.onmessage=(e)=>{try{messageHandlerRef.current?.(JSON.parse(e.data));}catch(err){}};
    return()=>{ws.close();wsRef.current=null;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[screen==='login']);

  const sendWS=useCallback((obj)=>{
    if(wsRef.current?.readyState===1)wsRef.current.send(JSON.stringify(obj));
  },[]);

  // ── useEffect Mix 1v1 : build pool combiné quand guestArtists arrive ──────
  useEffect(()=>{
    if(!guestArtists)return;
    const hostArts=hostArtistsRef.current||[];
    const seen=new Set(hostArts.map(a=>a.id));
    const combined=[...hostArts,...guestArtists.filter(a=>!seen.has(a.id))];
    console.log(`[MT] Mix 1v1: ${combined.length} artistes combinés`);
    const minY=yearMinRef.current, maxY=yearMaxRef.current;
    setLoading(true);
    setLoadingMsg(`Mix 1v1 — chargement ${combined.length} artistes…`);
    fetchAllSongsRef.current?.(combined,minY,maxY,(msg)=>setLoadingMsg(msg))
      .then(rawTracks=>{
        const playable=rawTracks.filter(t=>t.is_playable!==false);
        const base=playable.length>0?playable:rawTracks;
        const inRange=base.filter(t=>{
          const y=parseInt(t.album?.release_date?.slice(0,4)||'0');
          if(y===0)return true;if(minY===maxY)return y===minY;return y>=minY&&y<=maxY;
        });
        const pool=inRange.length>0?inRange:base;
        const finalPool=[...pool].sort(()=>Math.random()-0.5).slice(0,roundsRef.current);
        wsRef.current?.send(JSON.stringify({type:'game_start',tracks:finalPool}));
        setPool(finalPool);setCIdx(0);setScore(0);setOpponentScore(0);
        setTimer(durRef.current);setRevealed(false);setAnswer('');setProg(0);setRoundSolved(false);
        setLoading(false);setLoadingMsg('');setGuestArtists(null);
        setScreen('game');
        setTimeout(()=>{if(finalPool[0])playTrackRef.current?.(finalPool[0]);},500);
      })
      .catch(e=>{setErr(`Erreur Mix 1v1: ${e.message}`);setLoading(false);setLoadingMsg('');setGuestArtists(null);});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[guestArtists]);

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
      setTimer(t=>{
        if(t<=1){
          clearInterval(timerRef.current);
          // En 1v1 host : broadcaster le reveal (le guest a son propre timer mais peut désynchroniser)
          if(roomRole==='host') sendWS({type:'host_control',action:'reveal'});
          doReveal();
          return 0;
        }
        return t-1;
      });
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
        // api.search → Railway proxy → Spotify
        // Pas de throttle client partagé avec pool building → toujours réactif
        const r=await api.search(artQ,'artist',6);
        const found=r.artists?.items||[];
        console.log('[MT] artist search:',found.length,'résultats pour',artQ);
        // Ne pas filtrer les top50 — l'user doit pouvoir les retrouver en recherche
        setArtRes(found);
      }catch(e){
        if(e.message?.includes('429')){
          // Rate limit : vider silencieusement, l'user peut réessayer
          setArtRes([]);
        }else{
          console.warn('[MT] artist search error:',e.message);
          setArtRes([]);
        }
      }
    },400);
  },[artQ]); // dépendance artQ seulement — topArtists via ref

  const playTrack=useCallback(async(track)=>{
    if(!deviceId||!track)return;
    const tok=localStorage.getItem('access_token');
    // Étape 1 : transférer la lecture vers notre device SDK (évite le 403)
    try{
      await fetch('https://api.spotify.com/v1/me/player',{
        method:'PUT',
        headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json'},
        body:JSON.stringify({device_ids:[deviceId],play:false}),
      });
      await new Promise(r=>setTimeout(r,500)); // laisser le temps au transfer
    }catch(e){}
    // Étape 2 : lancer le son
    try{
      const res=await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,{
        method:'PUT',
        headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json'},
        body:JSON.stringify({uris:[`spotify:track:${track.id}`],position_ms:0}),
      });
      if(res.ok){
        setProg(0);
      }else if(res.status===403){
        // Track géo-restreinte ou indisponible → skip silencieux vers le suivant
        console.warn('[MT] 403 sur',track.name,'→ auto-skip');
        setTimeout(()=>nextRoundRef.current?.(),800);
      }else if(res.status===404){
        // Device ID invalide → reconnect SDK
        playerRef.current?.disconnect();
        setTimeout(()=>playerRef.current?.connect(),800);
      }else{
        console.warn('[MT] play erreur',res.status);
      }
    }catch(e){console.error('[MT] play error',e.message);}
  },[deviceId]);

  // ─── Queries par tranches de 3 ans + filtre artist: strict ─────────────
  const yearQueriesFor=(artistName,minY,maxY)=>{
    const queries=[];
    // Tranches de 3 ans → résultats distincts + couvre toute la carrière
    for(let y=minY;y<=maxY-3;y+=3){
      const end=Math.min(y+3,maxY);
      queries.push(`artist:"${artistName}" year:${y}-${end}`);
    }
    // Requête générale artiste (pour les hits récents)
    queries.push(`artist:"${artistName}"`);
    return queries;
  };


  // ─── isMainArtist : artiste principal uniquement + exclure non-playable ─────
  const isMainArtist=(track,artistId,nameLow)=>{
    if(track.is_playable===false)return false;
    const first=track.artists?.[0];
    return first?.id===artistId||first?.name?.toLowerCase()===nameLow;
  };

  // ─── fetchAllSongs : 1250ms/req = 0.8 req/sec, 2× sous la limite Spotify ────
  // Early stop adaptatif : arrêt dès 2 offsets consécutifs sans nouveau son
  // Calcul : max 9 offsets × 1250ms = 11.25s pour un gros artiste
  const FETCH_DELAY = 1250;
  const fetchAllSongs=async(artists,minY,maxY,onProgress)=>{
    const all=[]; const seenIds=new Set();
    for(const a of artists){
      const nameLow=a.name.toLowerCase();
      const fn=t=>isMainArtist(t,a.id,nameLow);
      onProgress&&onProgress(`${a.name}…`,all.length);
      let artistCount=0;
      let emptyStreak=0;

      // limit=50 via Railway → max 150 sons en 3 requêtes (offsets 0, 50, 100)
      // Early stop si Spotify retourne < 50 résultats = catalogue épuisé
      for(const off of[0,50,100]){
        try{
          const r=await api.search(`artist:"${a.name}"`, 'track', 50, off);
          const items=r.tracks?.items||[];
          let newFound=0;
          for(const t of items.filter(fn)){
            if(!seenIds.has(t.id)){seenIds.add(t.id);all.push(t);newFound++;artistCount++;}
          }
          onProgress&&onProgress(`${a.name} — ${artistCount} sons`,all.length);
          // Catalogue épuisé si Spotify retourne < 50 résultats
          if(items.length<50)break;
          if(newFound===0)break;
        }catch(e){
          if(e.message?.includes('429')){
            console.warn('[MT] 429 → pause 20s');
            await new Promise(r=>setTimeout(r,20000));
          }
          break;
        }
        await new Promise(r=>setTimeout(r,FETCH_DELAY));
      }

      // Requête fallback sans guillemets (capte les artistes peu indexés)
      if(artistCount<8){
        try{
          const r=await api.search(a.name,'track',6,0);
          const items=r.tracks?.items||[];
          for(const t of items.filter(fn)){
            if(!seenIds.has(t.id)){seenIds.add(t.id);all.push(t);artistCount++;}
          }
          await new Promise(r=>setTimeout(r,FETCH_DELAY));
        }catch(e){}
      }

      console.log(`[MT] ${a.name}: ${artistCount} sons (${Math.ceil((Math.min(artistCount/6,9)+1)*FETCH_DELAY/1000)}s)`);
    }
    return all;
  };

  
