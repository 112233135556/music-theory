import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from './api';

const CSS = `
@import url('https://fonts.spikerko.org/spicy-lyrics/source.css');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
:root {
  --t1:hsla(0,0%,100%,.92);--t2:hsla(0,0%,100%,.6);--t3:hsla(0,0%,100%,.35);--t4:hsla(0,0%,100%,.18);
  --mUT:rgba(0,0,0,.06);--mUTb:blur(8px) saturate(1.5) brightness(1.04);
  --mR:rgba(0,0,0,.14);--mRb:blur(16px) saturate(1.6) brightness(1.05);
  --mT:rgba(0,0,0,.2);--mTb:blur(24px) saturate(1.7) brightness(1.06);
  --le:inset 0 1px 0 rgba(255,255,255,.38),inset 0 0 0 1px rgba(255,255,255,.12),inset 0 -1px 0 rgba(255,255,255,.2);
  --leS:inset 0 1px 0 rgba(255,255,255,.55),inset 0 0 0 1px rgba(255,255,255,.18),inset 0 -1px 0 rgba(255,255,255,.3);
  --cast:0 16px 40px -8px rgba(8,10,18,.55),0 4px 12px -2px rgba(8,10,18,.35);
  --F:SpicyLyrics,'Inter',-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',system-ui,sans-serif;
  --sp:cubic-bezier(0.16,1,0.3,1);
  --BAR:clamp(48px,3.5vh,60px);
  --PB:clamp(56px,5vh,72px);
}
*{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;overflow:hidden;}
body{font-family:var(--F);background:#09090b;color:var(--t1);}
input,button{font-family:var(--F);}
input::placeholder{color:var(--t3);}
::-webkit-scrollbar{width:0;height:0;}
.g2{background:var(--mR);backdrop-filter:var(--mRb);-webkit-backdrop-filter:var(--mRb);box-shadow:var(--le);}
.g3{background:var(--mT);backdrop-filter:var(--mTb);-webkit-backdrop-filter:var(--mTb);box-shadow:var(--leS);}
.btn-glass{background:var(--mR);backdrop-filter:var(--mRb);-webkit-backdrop-filter:var(--mRb);box-shadow:var(--le);border:none;cursor:pointer;color:var(--t2);font-family:var(--F);transition:all .15s;}
.btn-glass:hover{background:rgba(255,255,255,.18);}
.btn-solid{background:rgba(255,255,255,.95);color:#000;border:none;cursor:pointer;font-family:var(--F);font-weight:600;box-shadow:0 4px 20px rgba(255,255,255,.15);}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes coverReveal{from{filter:blur(28px) brightness(.12) saturate(0);transform:scale(.92)}to{filter:blur(0) brightness(1) saturate(1);transform:scale(1)}}
@keyframes wave{0%,100%{transform:scaleY(1)}50%{transform:scaleY(2.8)}}
@keyframes timerPulse{0%,100%{opacity:1}50%{opacity:.6}}
@keyframes bgKenBurns{
  0%{transform:scale(1.4) translate(0%,0%)}
  20%{transform:scale(1.48) translate(-2.5%,-1.5%)}
  40%{transform:scale(1.42) translate(2%,2%)}
  60%{transform:scale(1.5) translate(-1.5%,1.8%)}
  80%{transform:scale(1.44) translate(2.5%,-1%)}
  100%{transform:scale(1.4) translate(0%,0%)}
}
@keyframes bgFadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
.fade{animation:fadeUp .45s var(--sp) both;}
.scale{animation:scaleIn .45s var(--sp) both;}
.timer-g{color:#34d399;text-shadow:0 0 clamp(12px,1.5vw,30px) rgba(52,211,153,.45);}
.timer-a{color:#fbbf24;text-shadow:0 0 clamp(12px,1.5vw,30px) rgba(251,191,36,.45);}
.timer-r{color:#f87171;text-shadow:0 0 clamp(12px,1.5vw,30px) rgba(248,113,113,.45);animation:timerPulse .5s ease-in-out infinite;}
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
  search:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  x:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  back:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  chevR:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  play:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
  pause:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  prev:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4"/><line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2"/></svg>,
  next:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2"/></svg>,
  vol:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  door:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  plus:<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

// ── Dynamic Background ──────────────────────────────────────
// Two layers: bottom always drifts, top fades between URLs
function DynBg({url,mode}){
  const f={
    neutral:'saturate(1.8) brightness(.35) blur(clamp(55px,7vw,110px))',
    cycle:'saturate(2.4) brightness(.42) blur(clamp(55px,7vw,110px))',
    game:'grayscale(100%) contrast(1.6) brightness(.25) saturate(0) blur(clamp(20px,2.5vw,40px))',
    reveal:'saturate(2.8) brightness(.48) blur(clamp(55px,7vw,110px))',
  }[mode]||'saturate(1.8) brightness(.35) blur(60px)';
  return(
    <div style={{position:'fixed',inset:0,zIndex:0,background:'#09090b',overflow:'hidden'}}>
      {url&&(
        <div key={url} style={{position:'absolute',inset:'-25%',backgroundImage:`url(${url})`,backgroundSize:'cover',backgroundPosition:'center',filter:f,animation:'bgKenBurns 28s ease-in-out infinite, bgFadeIn 1.2s ease',willChange:'transform,filter'}}/>
      )}
      <div style={{position:'absolute',inset:0,zIndex:1,background:'linear-gradient(to top,rgba(0,0,0,.65) 0%,rgba(0,0,0,.1) 50%,transparent 100%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,zIndex:1,background:'linear-gradient(to bottom,rgba(0,0,0,.3) 0%,transparent 30%)',pointerEvents:'none'}}/>
    </div>
  );
}

function MysteryCover({url,sz}){
  const s=sz||'clamp(180px,22vh,320px)';
  return(
    <div style={{position:'relative',width:s,height:s,borderRadius:'clamp(16px,1.5vw,26px)',overflow:'hidden',flexShrink:0}}>
      {url&&<div style={{position:'absolute',inset:'-18px',backgroundImage:`url(${url})`,backgroundSize:'cover',backgroundPosition:'center',filter:'grayscale(100%) blur(30px) contrast(1.4) brightness(.3) saturate(0)'}}/>}
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.3)',backdropFilter:'blur(4px)'}}/>
      <div style={{position:'absolute',inset:0,zIndex:3,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--F)',fontSize:'clamp(56px,7vw,100px)',fontWeight:700,letterSpacing:'-.05em',color:'rgba(255,255,255,.75)',textShadow:'0 2px 28px rgba(0,0,0,.7)'}}>?</div>
      <div style={{position:'absolute',inset:0,zIndex:4,borderRadius:'clamp(16px,1.5vw,26px)',boxShadow:'var(--leS)',pointerEvents:'none'}}/>
    </div>
  );
}

function TopBar({label,user,center,onAvatar,onQuit}){
  return(
    <div style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:'var(--BAR)',display:'flex',alignItems:'center',gap:'clamp(12px,1vw,20px)',padding:'0 clamp(16px,1.5vw,32px)',background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)'}}>
      <div style={{flex:1,display:'flex',alignItems:'center',gap:'clamp(10px,.85vw,16px)'}}>
        {onQuit&&<button onClick={onQuit} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:'clamp(12px,.9vw,15px)',display:'flex',alignItems:'center',gap:4,fontFamily:'var(--F)',transition:'color .15s'}} onMouseEnter={e=>e.currentTarget.style.color='var(--t2)'} onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}><span style={{fontSize:'clamp(12px,.9vw,15px)',display:'flex'}}>{IC.back}</span>Quitter</button>}
        <span style={{fontSize:'clamp(11px,.8vw,15px)',fontWeight:600,color:onQuit?'var(--t3)':'var(--t2)',letterSpacing:'.02em',whiteSpace:'nowrap'}}>{label}</span>
      </div>
      <div style={{flex:2,display:'flex',justifyContent:'center'}}>{center}</div>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'clamp(7px,.55vw,12px)'}}>
        <span style={{fontSize:'clamp(10px,.7vw,13px)',color:'var(--t3)'}}>{user?.display_name}</span>
        <button onClick={onAvatar} style={{background:'none',border:'none',cursor:'pointer',padding:0,borderRadius:'50%'}}>
          {user?.images?.[0]?.url
            ?<img src={user.images[0].url} style={{width:'clamp(24px,1.9vh,32px)',height:'clamp(24px,1.9vh,32px)',borderRadius:'50%',objectFit:'cover',boxShadow:'var(--leS)',transition:'transform .15s'}} alt="" onMouseEnter={e=>e.target.style.transform='scale(1.08)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}/>
            :<div style={{width:'clamp(24px,1.9vh,32px)',height:'clamp(24px,1.9vh,32px)',borderRadius:'50%',background:'linear-gradient(135deg,#5865F2,#7c3aed)',boxShadow:'var(--leS)'}}/>}
        </button>
      </div>
    </div>
  );
}

function ProfileModal({user,onClose}){
  return(
    <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',padding:'clamp(56px,5.5vh,72px) clamp(16px,1.5vw,28px) 0'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:'rgba(14,14,20,.96)',backdropFilter:'blur(40px) saturate(2)',WebkitBackdropFilter:'blur(40px) saturate(2)',boxShadow:'var(--cast)',borderRadius:'clamp(14px,1.2vw,20px)',width:'clamp(240px,22vw,320px)',overflow:'hidden',animation:'slideDown .25s var(--sp)'}}>
        <div style={{padding:'clamp(18px,1.8vh,26px)',borderBottom:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',gap:'clamp(12px,1vw,18px)'}}>
          {user?.images?.[0]?.url?<img src={user.images[0].url} style={{width:'clamp(40px,4vh,54px)',height:'clamp(40px,4vh,54px)',borderRadius:'50%',objectFit:'cover',boxShadow:'var(--leS)'}} alt=""/>:<div style={{width:'clamp(40px,4vh,54px)',height:'clamp(40px,4vh,54px)',borderRadius:'50%',background:'linear-gradient(135deg,#5865F2,#7c3aed)'}}/>}
          <div>
            <div style={{fontSize:'clamp(13px,.9vw,16px)',fontWeight:600,color:'var(--t1)'}}>{user?.display_name}</div>
            <div style={{fontSize:'clamp(10px,.72vw,13px)',color:'var(--t3)'}}>Spotify Premium</div>
          </div>
        </div>
        <div style={{padding:'clamp(8px,.8vh,12px) 0'}}>
          {['Stats.fm','Stats for Spotify'].map((n,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:'clamp(10px,.85vw,16px)',padding:'clamp(9px,.9vh,14px) clamp(16px,1.5vw,22px)',opacity:.5,cursor:'not-allowed'}}>
              <span style={{fontSize:'clamp(14px,1.1vw,18px)',color:'var(--t3)',display:'flex'}}>{IC.music}</span>
              <div>
                <div style={{fontSize:'clamp(12px,.85vw,15px)',fontWeight:500,color:'var(--t1)'}}>{n}</div>
                <div style={{fontSize:'clamp(10px,.7vw,12px)',color:'var(--t3)'}}>Bientôt disponible</div>
              </div>
            </div>
          ))}
          <div style={{margin:'clamp(6px,.6vh,10px) clamp(16px,1.5vw,22px)',height:'1px',background:'rgba(255,255,255,.08)'}}/>
          <button onClick={logout} style={{display:'flex',alignItems:'center',gap:'clamp(10px,.85vw,16px)',padding:'clamp(9px,.9vh,14px) clamp(16px,1.5vw,22px)',width:'100%',background:'none',border:'none',cursor:'pointer',color:'rgba(248,113,113,.8)',fontFamily:'var(--F)',transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(248,113,113,.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{display:'flex'}}>{IC.door}</span>
            <span style={{fontSize:'clamp(12px,.85vw,15px)',fontWeight:500}}>Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerBar({track,paused,progress,onPause,onSeek,revealed,canSeek}){
  if(!track)return null;
  const dur=track.duration_ms||222000;
  const pct=Math.min(100,(progress/Math.max(1,Math.floor(dur/1000)))*100);
  const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  return(
    <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:100,height:'var(--PB)',display:'flex',alignItems:'center',gap:'clamp(10px,.9vw,18px)',padding:'0 clamp(14px,1.4vw,28px)',background:'var(--mT)',backdropFilter:'var(--mTb)',WebkitBackdropFilter:'var(--mTb)',boxShadow:'var(--leS)'}}>
      <div style={{width:'clamp(34px,3vh,46px)',height:'clamp(34px,3vh,46px)',borderRadius:'clamp(5px,.45vw,9px)',flexShrink:0,position:'relative',overflow:'hidden',boxShadow:'var(--le)'}}>
        {track.album?.images?.[0]?.url&&<img src={track.album.images[0].url} style={{width:'100%',height:'100%',objectFit:'cover',filter:revealed?'none':'grayscale(100%) brightness(.28)',transition:'filter 1.2s ease'}} alt=""/>}
        {!revealed&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(12px,1.1vh,18px)',fontWeight:700,color:'rgba(255,255,255,.7)'}}>?</div>}
      </div>
      <div style={{width:'clamp(90px,9vw,160px)',flexShrink:0}}>
        <div style={{fontSize:'clamp(10px,.72vw,13px)',fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{revealed?track.name:'—'}</div>
        <div style={{fontSize:'clamp(9px,.65vw,12px)',color:'var(--t3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{revealed?track.artists?.map(a=>a.name).join(', '):'—'}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'clamp(7px,.6vw,12px)',flexShrink:0}}>
        {canSeek&&<button style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:'clamp(13px,1.1vh,18px)',display:'flex'}}>{IC.prev}</button>}
        <button onClick={onPause} style={{width:'clamp(26px,2.4vh,36px)',height:'clamp(26px,2.4vh,36px)',borderRadius:'50%',background:'rgba(255,255,255,.95)',color:'#000',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(10px,.9vh,14px)',flexShrink:0}}>{paused?IC.play:IC.pause}</button>
        {canSeek&&<button style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:'clamp(13px,1.1vh,18px)',display:'flex'}}>{IC.next}</button>}
      </div>
      <div style={{flex:1,display:'flex',alignItems:'center',gap:'clamp(5px,.45vw,9px)'}}>
        <span style={{fontSize:'clamp(9px,.65vw,12px)',color:'var(--t3)',fontVariantNumeric:'tabular-nums',flexShrink:0}}>{fmt(progress)}</span>
        <div onClick={canSeek?onSeek:undefined} style={{flex:1,height:'clamp(3px,.28vh,5px)',borderRadius:'999px',background:'rgba(255,255,255,.15)',cursor:canSeek?'pointer':'default',position:'relative'}}>
          <div style={{height:'100%',width:`${pct}%`,background:'rgba(255,255,255,.9)',borderRadius:'999px',transition:'width .8s linear'}}/>
        </div>
        <span style={{fontSize:'clamp(9px,.65vw,12px)',color:'var(--t3)',fontVariantNumeric:'tabular-nums',flexShrink:0}}>{fmt(Math.floor(dur/1000))}</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'clamp(5px,.4vw,8px)',flexShrink:0}}>
        <span style={{fontSize:'clamp(11px,.9vh,15px)',color:'var(--t3)',display:'flex'}}>{IC.vol}</span>
        <div style={{width:'clamp(55px,5vw,90px)',height:'clamp(3px,.28vh,4px)',background:'rgba(255,255,255,.15)',borderRadius:'999px',overflow:'hidden',cursor:'pointer'}}>
          <div style={{height:'100%',width:'70%',background:'rgba(255,255,255,.8)',borderRadius:'999px'}}/>
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
  const shuffled=[...tracks].sort(()=>Math.random()-.5);
  const result=[],remaining=[...shuffled],recent=[];
  while(remaining.length>0&&result.length<rounds){
    const idx=remaining.findIndex(t=>!recent.includes(t.artists?.[0]?.id));
    const pick=idx===-1?remaining.splice(0,1)[0]:remaining.splice(idx,1)[0];
    result.push(pick);
    const aid=pick.artists?.[0]?.id;
    if(aid){recent.push(aid);if(recent.length>spacing)recent.shift();}
  }
  return result;
}

export default function App(){
  const[screen,setScreen]=useState(isLoggedIn()?'home':'login');
  const[user,setUser]=useState(null);
  const[topArtists,setTopArtists]=useState([]);
  const[topTracks,setTopTracks]=useState([]);
  const[selArts,setSelArts]=useState([]);
  const[artSearch,setArtSearch]=useState('');
  const[artSearchRes,setArtSearchRes]=useState([]);
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
  const[progress,setProgress]=useState(0);
  const[deviceId,setDeviceId]=useState(null);
  const[loggedIn,setLoggedIn]=useState(isLoggedIn());
  const[showProfile,setShowProfile]=useState(false);
  const[loading,setLoading]=useState(false);
  const[joinCode,setJoinCode]=useState('');
  const[joinMode,setJoinMode]=useState(false);
  const timerRef=useRef(null);
  const progRef=useRef(null);
  const bgRef=useRef(null);
  const searchRef=useRef(null);
  const artSearchRef=useRef(null);
  const playerRef=useRef(null);

  useEffect(()=>{
    if(window.location.pathname==='/callback'){
      const p=new URLSearchParams(window.location.search);
      const at=p.get('access_token');
      if(at){saveTokens({access_token:at,refresh_token:p.get('refresh_token'),expires_in:p.get('expires_in')});setLoggedIn(true);setScreen('home');}
      window.history.replaceState({},'','/');
    }
  },[]);

  useEffect(()=>{
    if(!loggedIn)return;
    (async()=>{
      try{
        const[me,arts,trs]=await Promise.all([api.me(),api.topArtists(),api.topTracks()]);
        setUser(me);setTopArtists(arts.items||[]);setTopTracks(trs.items||[]);
      }catch(e){console.error('load',e);}
    })();
  },[loggedIn]);

  useEffect(()=>{
    if(!loggedIn)return;
    window.onSpotifyWebPlaybackSDKReady=()=>{
      const pl=new window.Spotify.Player({
        name:'Music Theory',
        getOAuthToken:cb=>cb(localStorage.getItem('access_token')),
        volume:0.8,
      });
      pl.addListener('ready',({device_id})=>{setDeviceId(device_id);console.log('SDK ready',device_id);});
      pl.addListener('player_state_changed',st=>{if(!st)return;setPaused(st.paused);setProgress(Math.floor(st.position/1000));});
      pl.connect();
      playerRef.current=pl;
    };
    if(!document.querySelector('script[src*="spotify-player"]')){
      const s=document.createElement('script');s.src='https://sdk.scdn.co/spotify-player.js';document.head.appendChild(s);
    }
  },[loggedIn]);

  // BG rotation — slower (12s) to let the ken burns effect be visible
  useEffect(()=>{
    if(screen!=='home'||!topTracks.length)return;
    bgRef.current=setInterval(()=>setBgIdx(i=>(i+1)%Math.min(topTracks.length,20)),12000);
    return()=>clearInterval(bgRef.current);
  },[screen,topTracks]);

  // Artist search — full Spotify catalog
  useEffect(()=>{
    clearTimeout(artSearchRef.current);
    if(artSearch.length<2){setArtSearchRes([]);return;}
    artSearchRef.current=setTimeout(async()=>{
      try{
        const r=await api.searchArtists(artSearch);
        const found=r.artists?.items||[];
        // Filter out artists already in topArtists to avoid duplicates
        const topIds=new Set(topArtists.map(a=>a.id));
        setArtSearchRes(found.filter(a=>!topIds.has(a.id)));
      }catch(e){console.error('artist search',e);}
    },350);
  },[artSearch,topArtists]);

  useEffect(()=>{
    clearInterval(timerRef.current);
    if(screen!=='game'||revealed||paused)return;
    timerRef.current=setInterval(()=>{
      setTimer(t=>{if(t<=1){clearInterval(timerRef.current);doReveal();return 0;}return t-1;});
    },1000);
    return()=>clearInterval(timerRef.current);
  },[screen,revealed,paused]);

  useEffect(()=>{
    clearInterval(progRef.current);
    if((screen!=='game'&&screen!=='reveal')||paused)return;
    progRef.current=setInterval(()=>setProgress(p=>p+1),1000);
    return()=>clearInterval(progRef.current);
  },[screen,paused]);

  const playTrack=useCallback(async(track)=>{
    if(!deviceId||!track)return;
    try{
      const res=await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,{
        method:'PUT',
        headers:{Authorization:`Bearer ${localStorage.getItem('access_token')}`,'Content-Type':'application/json'},
        body:JSON.stringify({uris:[`spotify:track:${track.id}`],position_ms:0}),
      });
      if(res.ok)setProgress(0);
      else console.error('play failed',res.status);
    }catch(e){console.error('play',e);}
  },[deviceId]);

  const buildPool=useCallback(async()=>{
    let tracks=[];
    if(mixPerso){
      // Use all 3 time periods for max diversity
      try{const r=await api.topTracksAll();tracks=r.items||[];}
      catch(e){tracks=topTracks;}
    }else{
      for(const a of selArts){
        try{const d=await api.artistTracks(a.id);tracks.push(...(d.tracks||[]));}
        catch(e){console.error('artist tracks',a.name,e);}
      }
    }
    if(!tracks.length)return[];
    // Remove duplicates
    const seen=new Set();
    const unique=tracks.filter(t=>{if(seen.has(t.id))return false;seen.add(t.id);return true;});
    return rotatePool(unique,rounds,5);
  },[selArts,mixPerso,topTracks,rounds]);

  const startGame=useCallback(async()=>{
    setLoading(true);
    try{
      const p=await buildPool();
      if(!p.length){
        setLoading(false);
        alert('Aucun son trouvé. Active le Mix personnel ou sélectionne d\'autres artistes.');
        return;
      }
      setPool(p);setCIdx(0);setScore(0);setTimer(dur);setRevealed(false);setAnswer('');setProgress(0);
      setScreen('game');
      setTimeout(()=>{if(p[0])playTrack(p[0]);},500);
    }catch(e){console.error('startGame',e);}
    setLoading(false);
  },[buildPool,dur,playTrack]);

  const doReveal=useCallback(()=>{clearInterval(timerRef.current);setRevealed(true);setScreen('reveal');},[]);

  const nextRound=useCallback(()=>{
    const n=cIdx+1;
    if(n>=pool.length){setScreen('end');return;}
    setCIdx(n);setTimer(dur);setRevealed(false);setAnswer('');setProgress(0);
    setScreen('game');
    setTimeout(()=>{if(pool[n])playTrack(pool[n]);},200);
  },[cIdx,pool,dur,playTrack]);

  const handlePause=useCallback(()=>{
    setPaused(p=>{playerRef.current?.togglePlay();return!p;});
  },[]);

  const handleAnswer=useCallback(async(val)=>{
    setAnswer(val);
    if(!val||val.length<2){setResults([]);return;}
    clearTimeout(searchRef.current);
    searchRef.current=setTimeout(async()=>{
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

  // Artists to show: filtered local + Spotify search results
  const filteredLocal=topArtists.filter(a=>a.name.toLowerCase().includes(artSearch.toLowerCase()));
  const showSpotifyResults=artSearch.length>=2&&artSearchRes.length>0;

  const SearchBar=(
    <div style={{position:'relative',width:'clamp(260px,26vw,500px)'}}>
      <div style={{display:'flex',alignItems:'center',gap:'clamp(7px,.55vw,11px)',padding:'clamp(6px,.6vh,10px) clamp(12px,1vw,18px)',background:'var(--mT)',backdropFilter:'var(--mTb)',WebkitBackdropFilter:'var(--mTb)',boxShadow:'var(--leS)',borderRadius:'999px'}}>
        <span style={{color:'var(--t3)',fontSize:'clamp(13px,.95vw,17px)',flexShrink:0,display:'flex'}}>{IC.search}</span>
        <input value={answer} onChange={e=>handleAnswer(e.target.value)} placeholder="Quel est ce morceau ?" autoFocus style={{background:'none',border:'none',outline:'none',color:'var(--t1)',fontSize:'clamp(12px,.85vw,16px)',flex:1,minWidth:0}}/>
        {answer&&<button onClick={()=>{setAnswer('');setResults([]);}} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:'clamp(13px,1vw,18px)',lineHeight:1,display:'flex'}}>{IC.x}</button>}
      </div>
      {results.length>0&&(
        <div style={{position:'absolute',top:'calc(100% + 8px)',left:0,right:0,zIndex:200,background:'rgba(12,12,18,.97)',backdropFilter:'blur(32px) saturate(2)',WebkitBackdropFilter:'blur(32px) saturate(2)',boxShadow:'var(--cast)',borderRadius:'clamp(10px,.8vw,16px)',overflow:'hidden',padding:'clamp(4px,.4vh,7px) 0'}}>
          {results.map(t=>(
            <div key={t.id} onMouseDown={()=>selectAnswer(t)} style={{display:'flex',alignItems:'center',gap:'clamp(10px,.8vw,14px)',padding:'clamp(8px,.75vh,12px) clamp(12px,1vw,18px)',cursor:'pointer',transition:'background .1s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {t.album?.images?.[0]?.url&&<img src={t.album.images[0].url} style={{width:'clamp(28px,2.5vh,40px)',height:'clamp(28px,2.5vh,40px)',borderRadius:'clamp(4px,.35vw,7px)',flexShrink:0,objectFit:'cover'}} alt=""/>}
              <div>
                <div style={{fontSize:'clamp(12px,.85vw,16px)',fontWeight:500,color:'var(--t1)'}}>{t.name}</div>
                <div style={{fontSize:'clamp(10px,.7vw,13px)',color:'var(--t3)'}}>{t.artists?.map(a=>a.name).join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if(!loggedIn){return(<>
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

    {screen==='home'
      ?<div style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:'var(--BAR)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(16px,1.5vw,32px)',background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)'}}>
          <span style={{fontSize:'clamp(13px,.95vw,18px)',fontWeight:700,letterSpacing:'-.028em',color:'var(--t1)'}}>music theory</span>
          <div style={{display:'flex',alignItems:'center',gap:'clamp(7px,.55vw,12px)'}}>
            <span style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t2)'}}>{user?.display_name}</span>
            <button onClick={()=>setShowProfile(p=>!p)} style={{background:'none',border:'none',cursor:'pointer',padding:0,borderRadius:'50%'}}>
              {user?.images?.[0]?.url?<img src={user.images[0].url} style={{width:'clamp(24px,1.9vh,32px)',height:'clamp(24px,1.9vh,32px)',borderRadius:'50%',objectFit:'cover',transition:'transform .15s'}} alt="" onMouseEnter={e=>e.target.style.transform='scale(1.08)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}/>:<div style={{width:'clamp(24px,1.9vh,32px)',height:'clamp(24px,1.9vh,32px)',borderRadius:'50%',background:'linear-gradient(135deg,#5865F2,#7c3aed)'}}/>}
            </button>
          </div>
        </div>
      :screen!=='login'&&<TopBar label="Blind_Test" user={user} center={screen==='game'?SearchBar:null} onAvatar={()=>setShowProfile(p=>!p)} onQuit={(screen==='game'||screen==='reveal')?()=>{clearInterval(timerRef.current);setScreen('home');}:null}/>
    }

    <div style={{position:'relative',zIndex:10,height:'100vh',paddingTop:topPad,paddingBottom:botPad,overflow:'hidden'}}>

      {screen==='home'&&<div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'clamp(18px,2vh,36px) clamp(20px,2vw,40px)'}}>
        <div className="fade" style={{width:'100%',maxWidth:'min(560px,50vw)'}}>
          <h1 style={{fontSize:'clamp(22px,2.5vw,44px)',fontWeight:700,letterSpacing:'-.035em',marginBottom:'clamp(4px,.4vh,8px)'}}>À quoi on joue, {user?.display_name?.split(' ')[0]} ?</h1>
          <p style={{fontSize:'clamp(11px,.78vw,15px)',color:'var(--t2)',marginBottom:'clamp(20px,2.5vh,36px)'}}>Choisis un mode de jeu</p>
          <div style={{display:'flex',flexDirection:'column',gap:'clamp(9px,.9vh,14px)'}}>
            {[
              {label:'Blind_Test',sub:'Solo ou 1v1 — devine les sons',icon:IC.music,grad:'linear-gradient(135deg,#5865F2,#7c3aed)',action:()=>setScreen('config'),active:true},
              {label:'Rejoindre',sub:'Rejoindre avec un code',icon:IC.link,grad:null,active:true,isJoin:true},
              {label:'Autres jeux',sub:'Bientôt disponible',icon:IC.game,grad:null,active:false,off:true},
            ].map(c=>(
              <div key={c.label} onClick={c.off?undefined:c.isJoin?()=>setJoinMode(m=>!m):c.action} style={{background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)',borderRadius:'clamp(14px,1.2vw,22px)',padding:'clamp(15px,1.6vh,24px) clamp(17px,1.6vw,28px)',display:'flex',alignItems:'center',gap:'clamp(13px,1.1vw,20px)',cursor:c.off?'not-allowed':c.active?'pointer':'default',opacity:c.off?.36:1,transition:'background .15s',flexDirection:c.isJoin&&joinMode?'column':'row',alignItems:c.isJoin&&joinMode?'flex-start':'center'}}
                onMouseEnter={e=>!c.off&&c.active&&!joinMode&&(e.currentTarget.style.background='rgba(255,255,255,.16)')}
                onMouseLeave={e=>!c.off&&(e.currentTarget.style.background='var(--mR)')}>
                <div style={{display:'flex',alignItems:'center',gap:'clamp(13px,1.1vw,20px)',width:'100%'}}>
                  <div style={{width:'clamp(40px,3.8vh,56px)',height:'clamp(40px,3.8vh,56px)',borderRadius:'clamp(10px,.9vw,15px)',display:'flex',alignItems:'center',justifyContent:'center',background:c.grad||'rgba(0,0,0,.16)',flexShrink:0,fontSize:'clamp(17px,1.7vh,25px)',color:'rgba(255,255,255,.8)',boxShadow:c.grad?'0 4px 16px rgba(88,101,242,.3)':'var(--le)'}}>{c.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'clamp(14px,.95vw,19px)',fontWeight:600,marginBottom:3}}>{c.label}</div>
                    <div style={{fontSize:'clamp(11px,.76vw,15px)',color:'var(--t2)'}}>{c.sub}</div>
                  </div>
                  {c.active&&!c.off&&<span style={{color:'var(--t3)',fontSize:'clamp(17px,1.6vw,25px)',display:'flex'}}>{joinMode&&c.isJoin?IC.x:IC.chevR}</span>}
                </div>
                {c.isJoin&&joinMode&&<div style={{width:'100%',display:'flex',gap:'clamp(8px,.7vw,12px)',paddingTop:'clamp(8px,.8vh,12px)'}} onClick={e=>e.stopPropagation()}>
                  <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().slice(0,6))} placeholder="Code de la partie (ex: MT·7K4X)" style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'clamp(8px,.7vw,12px)',padding:'clamp(9px,.9vh,14px) clamp(12px,1vw,18px)',color:'var(--t1)',fontSize:'clamp(12px,.85vw,15px)',outline:'none',fontFamily:'var(--F)',letterSpacing:'.06em',fontWeight:600}} onKeyDown={e=>e.key==='Enter'&&alert('Fonctionnalité 1v1 en cours de développement')}/>
                  <button onClick={()=>alert('Fonctionnalité 1v1 en cours de développement')} className="btn-solid" style={{padding:'clamp(9px,.9vh,14px) clamp(16px,1.5vw,24px)',borderRadius:'clamp(8px,.7vw,12px)',fontSize:'clamp(12px,.85vw,15px)',flexShrink:0}}>Rejoindre</button>
                </div>}
              </div>
            ))}
          </div>
        </div>
      </div>}

      {screen==='config'&&<div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'clamp(18px,1.8vh,32px) clamp(20px,2vw,40px)'}}>
        <div className="fade" style={{width:'100%',maxWidth:'min(500px,44vw)'}}>
          <button onClick={()=>setScreen('home')} style={{background:'none',border:'none',color:'var(--t3)',fontSize:'clamp(11px,.8vw,15px)',cursor:'pointer',fontFamily:'var(--F)',marginBottom:'clamp(12px,1.2vh,20px)',display:'flex',alignItems:'center',gap:4}}><span style={{display:'flex'}}>{IC.back}</span>Retour</button>
          <h1 style={{fontSize:'clamp(18px,1.8vw,30px)',fontWeight:700,letterSpacing:'-.03em',marginBottom:'clamp(14px,1.5vh,24px)'}}>Configurer</h1>
          <div style={{display:'flex',flexDirection:'column',gap:'clamp(9px,.9vh,14px)'}}>
            <div style={{background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)',borderRadius:'clamp(14px,1.2vw,20px)',padding:'clamp(13px,1.4vh,21px) clamp(15px,1.4vw,24px)'}}>
              <p style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t3)',marginBottom:'clamp(9px,.9vh,14px)',fontWeight:500}}>Mode</p>
              <div style={{display:'flex',gap:'clamp(6px,.55vw,10px)'}}><Pill active={gMode==='solo'} onClick={()=>setGMode('solo')}>Solo</Pill><Pill active={gMode==='1v1'} onClick={()=>setGMode('1v1')}>1 vs 1</Pill></div>
              {gMode==='1v1'&&<div style={{marginTop:'clamp(10px,1vh,16px)',padding:'clamp(10px,1vh,16px)',background:'rgba(255,255,255,.04)',borderRadius:'clamp(9px,.8vw,14px)',boxShadow:'var(--le)'}}>
                <p style={{fontSize:'clamp(9px,.67vw,13px)',color:'var(--t3)',marginBottom:'clamp(5px,.5vh,9px)'}}>Code</p>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><span style={{fontSize:'clamp(16px,1.6vw,26px)',fontWeight:700,letterSpacing:'.12em',fontVariantNumeric:'tabular-nums'}}>MT·7K4X</span><Pill sm>Copier</Pill></div>
              </div>}
            </div>
            <div style={{background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)',borderRadius:'clamp(14px,1.2vw,20px)',padding:'clamp(13px,1.4vh,21px) clamp(15px,1.4vw,24px)'}}>
              <p style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t3)',marginBottom:'clamp(10px,1vh,16px)',fontWeight:500}}>Manches</p>
              <div style={{display:'flex',alignItems:'center',gap:'clamp(14px,1.4vw,24px)'}}>
                <button onClick={()=>setRounds(r=>Math.max(1,r-5))} style={{width:'clamp(28px,2.5vh,38px)',height:'clamp(28px,2.5vh,38px)',borderRadius:'50%',background:'rgba(0,0,0,.14)',border:'none',color:'var(--t1)',fontSize:'clamp(16px,1.5vh,22px)',cursor:'pointer',boxShadow:'var(--le)',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                <span style={{fontSize:'clamp(24px,2.6vw,42px)',fontWeight:700,minWidth:'clamp(46px,4.2vw,68px)',textAlign:'center',letterSpacing:'-.03em',fontVariantNumeric:'tabular-nums'}}>{rounds}</span>
                <button onClick={()=>setRounds(r=>r+5)} style={{width:'clamp(28px,2.5vh,38px)',height:'clamp(28px,2.5vh,38px)',borderRadius:'50%',background:'rgba(0,0,0,.14)',border:'none',color:'var(--t1)',fontSize:'clamp(16px,1.5vh,22px)',cursor:'pointer',boxShadow:'var(--le)',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
              </div>
            </div>
            <div style={{background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)',borderRadius:'clamp(14px,1.2vw,20px)',padding:'clamp(13px,1.4vh,21px) clamp(15px,1.4vw,24px)'}}>
              <p style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t3)',marginBottom:'clamp(9px,.9vh,14px)',fontWeight:500}}>Temps par manche</p>
              <div style={{display:'flex',gap:'clamp(6px,.55vw,10px)',flexWrap:'wrap'}}>{[15,20,30,45].map(d=><Pill key={d} active={dur===d} onClick={()=>setDur(d)}>{d}s</Pill>)}</div>
            </div>
            <button onClick={()=>setScreen('artists')} className="btn-solid" style={{width:'100%',padding:'clamp(11px,1.1vh,17px)',borderRadius:'clamp(12px,1vw,18px)',fontSize:'clamp(12px,.88vw,16px)'}}>Choisir les artistes</button>
          </div>
        </div>
      </div>}

      {screen==='artists'&&<div style={{height:'100%',overflowY:'auto',padding:'clamp(12px,1.2vh,20px) clamp(20px,2vw,40px) clamp(70px,7vh,110px)'}}>
        <div style={{maxWidth:'min(1400px,92vw)',margin:'0 auto'}}>
          <button onClick={()=>setScreen('config')} style={{background:'none',border:'none',color:'var(--t3)',fontSize:'clamp(11px,.8vw,15px)',cursor:'pointer',fontFamily:'var(--F)',marginBottom:'clamp(11px,1.1vh,18px)',display:'flex',alignItems:'center',gap:4}}><span style={{display:'flex'}}>{IC.back}</span>Retour</button>
          <h1 style={{fontSize:'clamp(18px,1.8vw,30px)',fontWeight:700,letterSpacing:'-.03em',marginBottom:'clamp(3px,.3vh,6px)'}}>Tes artistes</h1>
          <p style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t2)',marginBottom:'clamp(12px,1.3vh,22px)'}}>Sélectionne depuis ton top ou recherche dans tout Spotify</p>

          {/* Search bar */}
          <div style={{background:'var(--mT)',backdropFilter:'var(--mTb)',WebkitBackdropFilter:'var(--mTb)',boxShadow:'var(--leS)',borderRadius:'999px',padding:'clamp(8px,.8vh,13px) clamp(13px,1.2vw,20px)',display:'flex',alignItems:'center',gap:'clamp(7px,.6vw,12px)',marginBottom:'clamp(12px,1.3vh,20px)'}}>
            <span style={{color:'var(--t3)',fontSize:'clamp(13px,1vw,18px)',display:'flex'}}>{IC.search}</span>
            <input value={artSearch} onChange={e=>setArtSearch(e.target.value)} placeholder="Rechercher n'importe quel artiste Spotify..." style={{background:'none',border:'none',outline:'none',color:'var(--t1)',fontSize:'clamp(12px,.85vw,16px)',flex:1}}/>
            {artSearch&&<button onClick={()=>{setArtSearch('');setArtSearchRes([]);}} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',display:'flex'}}>{IC.x}</button>}
          </div>

          {/* Mix perso */}
          <div onClick={()=>setMixPerso(!mixPerso)} style={{background:mixPerso?'rgba(88,101,242,.14)':'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:mixPerso?'inset 0 1px 0 rgba(255,255,255,.55),inset 0 0 0 1px rgba(88,101,242,.3),inset 0 -1px 0 rgba(255,255,255,.3)':'var(--le)',borderRadius:'clamp(14px,1.2vw,20px)',padding:'clamp(12px,1.3vh,20px) clamp(15px,1.4vw,24px)',display:'flex',alignItems:'center',gap:'clamp(11px,.95vw,18px)',cursor:'pointer',marginBottom:'clamp(12px,1.3vh,20px)',transition:'all .15s'}}>
            <div style={{width:'clamp(36px,3.4vh,52px)',height:'clamp(36px,3.4vh,52px)',borderRadius:'clamp(9px,.8vw,14px)',flexShrink:0,background:'linear-gradient(135deg,#5865F2,#7c3aed,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(15px,1.5vh,22px)',color:'white',boxShadow:'0 4px 16px rgba(88,101,242,.28)'}}>{IC.music}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:'clamp(12px,.87vw,17px)',fontWeight:600,marginBottom:3}}>Mix personnel {mixPerso&&'✓'}</div>
              <div style={{fontSize:'clamp(10px,.73vw,14px)',color:'var(--t2)'}}>Sons de tes 3 périodes d'écoute (~150 tracks)</div>
            </div>
          </div>

          {/* Spotify search results (above fold) */}
          {showSpotifyResults&&<>
            <p style={{fontSize:'clamp(9px,.67vw,13px)',fontWeight:500,color:'rgba(88,101,242,.8)',marginBottom:'clamp(9px,.9vh,15px)'}}>Résultats Spotify</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(clamp(55px,5.8vw,105px),1fr))',gap:'clamp(12px,1.2vw,22px)',marginBottom:'clamp(16px,1.6vh,26px)'}}>
              {artSearchRes.map(a=>{
                const s=selArts.find(x=>x.id===a.id);
                return(
                  <div key={a.id} onClick={()=>toggleArtist(a)} style={{cursor:'pointer',textAlign:'center'}}>
                    <div style={{position:'relative',marginBottom:'clamp(5px,.5vh,8px)'}}>
                      {a.images?.[0]?.url?<img src={a.images[0].url} style={{width:'100%',aspectRatio:'1',borderRadius:'50%',objectFit:'cover',display:'block',outline:s?'clamp(2px,.18vw,3px) solid rgba(255,255,255,.75)':'none',outlineOffset:'clamp(2px,.18vw,3px)',transition:'all .15s'}} alt={a.name}/>:<div style={{width:'100%',paddingBottom:'100%',borderRadius:'50%',background:'linear-gradient(135deg,#2a1a4a,#1a2a4a)',outline:s?'clamp(2px,.18vw,3px) solid rgba(255,255,255,.75)':'none',outlineOffset:'clamp(2px,.18vw,3px)'}}/>}
                      {s?<div style={{position:'absolute',bottom:0,right:0,width:'clamp(15px,1.4vh,22px)',height:'clamp(15px,1.4vh,22px)',borderRadius:'50%',background:'white',color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(8px,.7vh,12px)',fontWeight:700}}>✓</div>:<div style={{position:'absolute',bottom:0,right:0,width:'clamp(15px,1.4vh,22px)',height:'clamp(15px,1.4vh,22px)',borderRadius:'50%',background:'rgba(88,101,242,.8)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(9px,.8vh,13px)'}}>{IC.plus}</div>}
                    </div>
                    <div style={{fontSize:'clamp(8px,.62vw,12px)',fontWeight:500,color:s?'var(--t1)':'var(--t2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name}</div>
                  </div>
                );
              })}
            </div>
          </>}

          {/* Top artists */}
          <p style={{fontSize:'clamp(9px,.67vw,13px)',fontWeight:500,color:'var(--t3)',marginBottom:'clamp(9px,.9vh,15px)'}}>
            {artSearch?`Ton top — "${artSearch}"`:'Basé sur tes écoutes Spotify'}
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(clamp(55px,5.8vw,105px),1fr))',gap:'clamp(12px,1.2vw,22px)'}}>
            {filteredLocal.map(a=>{
              const s=selArts.find(x=>x.id===a.id);
              return(
                <div key={a.id} onClick={()=>toggleArtist(a)} style={{cursor:'pointer',textAlign:'center'}}>
                  <div style={{position:'relative',marginBottom:'clamp(5px,.5vh,8px)'}}>
                    {a.images?.[0]?.url?<img src={a.images[0].url} style={{width:'100%',aspectRatio:'1',borderRadius:'50%',objectFit:'cover',display:'block',outline:s?'clamp(2px,.18vw,3px) solid rgba(255,255,255,.75)':'none',outlineOffset:'clamp(2px,.18vw,3px)',transition:'all .15s'}} alt={a.name}/>:<div style={{width:'100%',paddingBottom:'100%',borderRadius:'50%',background:'linear-gradient(135deg,#1a2a4a,#2a1a4a)',outline:s?'clamp(2px,.18vw,3px) solid rgba(255,255,255,.75)':'none',outlineOffset:'clamp(2px,.18vw,3px)',transition:'all .15s'}}/>}
                    {s&&<div style={{position:'absolute',bottom:0,right:0,width:'clamp(15px,1.4vh,22px)',height:'clamp(15px,1.4vh,22px)',borderRadius:'50%',background:'white',color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(8px,.7vh,12px)',fontWeight:700}}>✓</div>}
                  </div>
                  <div style={{fontSize:'clamp(8px,.62vw,12px)',fontWeight:500,color:s?'var(--t1)':'var(--t2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {(selArts.length>0||mixPerso)&&<div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:100,padding:'clamp(9px,.9vh,14px) clamp(18px,1.8vw,34px)',background:'var(--mT)',backdropFilter:'var(--mTb)',WebkitBackdropFilter:'var(--mTb)',boxShadow:'var(--leS)',display:'flex',alignItems:'center',gap:'clamp(9px,.8vw,16px)'}}>
          <div style={{display:'flex',gap:'clamp(6px,.55vw,10px)',flex:1,overflowX:'auto',paddingBottom:2}}>
            {mixPerso&&<div style={{display:'flex',alignItems:'center',gap:'clamp(5px,.4vw,8px)',padding:'clamp(3px,.3vh,6px) clamp(9px,.8vw,14px)',borderRadius:'999px',background:'rgba(88,101,242,.22)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.3),inset 0 0 0 1px rgba(88,101,242,.35)',flexShrink:0}}>
              <span style={{fontSize:'clamp(10px,.72vw,14px)'}}>Mix perso</span>
              <span onClick={()=>setMixPerso(false)} style={{cursor:'pointer',fontSize:'clamp(12px,.9vw,17px)',color:'var(--t3)',lineHeight:1,display:'flex'}}>{IC.x}</span>
            </div>}
            {selArts.map(a=>(
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:'clamp(5px,.4vw,8px)',padding:'clamp(3px,.3vh,6px) clamp(9px,.8vw,14px) clamp(3px,.3vh,6px) clamp(5px,.4vw,8px)',borderRadius:'999px',background:'rgba(0,0,0,.14)',boxShadow:'var(--le)',flexShrink:0}}>
                {a.images?.[0]?.url&&<img src={a.images[0].url} style={{width:'clamp(15px,1.4vh,22px)',height:'clamp(15px,1.4vh,22px)',borderRadius:'50%',objectFit:'cover'}} alt=""/>}
                <span style={{fontSize:'clamp(10px,.72vw,14px)',whiteSpace:'nowrap'}}>{a.name}</span>
                <span onClick={()=>toggleArtist(a)} style={{cursor:'pointer',fontSize:'clamp(12px,.9vw,17px)',color:'var(--t3)',lineHeight:1,display:'flex'}}>{IC.x}</span>
              </div>
            ))}
          </div>
          <button onClick={startGame} disabled={loading} className="btn-solid" style={{padding:'clamp(9px,.9vh,14px) clamp(22px,2.2vw,38px)',borderRadius:'999px',fontSize:'clamp(12px,.87vw,16px)',flexShrink:0,opacity:loading?.6:1}}>
            {loading?'Chargement…':'Lancer'}
          </button>
        </div>}
      </div>}

      {screen==='game'&&<div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(22px,3vw,60px)',padding:'clamp(14px,1.5vh,26px)'}}>
        <MysteryCover url={track?.album?.images?.[0]?.url} sz="clamp(180px,22vh,340px)"/>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'clamp(12px,1.4vh,22px)'}}>
          <div style={{background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)',borderRadius:'999px',padding:'clamp(7px,.7vh,11px) clamp(18px,1.8vw,30px)',display:'flex',gap:'clamp(14px,1.4vw,22px)'}}>
            <span style={{fontSize:'clamp(11px,.8vw,15px)',color:'var(--t2)'}}>Manche <strong style={{color:'var(--t1)'}}>{cIdx+1}</strong>/{pool.length}</span>
            <span style={{color:'var(--t3)'}}>|</span>
            <span style={{fontSize:'clamp(11px,.8vw,15px)',color:'var(--t2)'}}>Score <strong style={{color:'var(--t1)'}}>{score}</strong></span>
          </div>
          <div style={{textAlign:'center'}}>
            <div className={`timer-${tc}`} style={{fontSize:'clamp(50px,7.5vw,120px)',fontWeight:700,letterSpacing:'-.06em',lineHeight:1,fontVariantNumeric:'tabular-nums',transition:'color .5s'}}>{timer}</div>
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
            <button onClick={handlePause} className="btn-glass" style={{borderRadius:'999px',padding:'clamp(7px,.7vh,12px) clamp(14px,1.3vw,22px)',fontSize:'clamp(14px,1.2vh,20px)',display:'flex',alignItems:'center',justifyContent:'center'}}>{paused?IC.play:IC.pause}</button>
            <button onClick={doReveal} className="btn-glass" style={{borderRadius:'999px',padding:'clamp(7px,.7vh,12px) clamp(14px,1.3vw,22px)',fontSize:'clamp(11px,.8vw,15px)'}}>Passer</button>
          </div>
        </div>
      </div>}

      {screen==='reveal'&&<div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'clamp(14px,1.5vh,26px)'}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'clamp(14px,1.8vh,28px)',width:'100%',maxWidth:'min(420px,38vw)'}}>
          <div style={{width:'clamp(180px,22vh,320px)',height:'clamp(180px,22vh,320px)',borderRadius:'clamp(16px,1.5vw,26px)',overflow:'hidden',animation:'coverReveal .75s var(--sp) forwards',boxShadow:'0 28px 80px rgba(0,0,0,.55),var(--leS)'}}>
            {track?.album?.images?.[0]?.url?<img src={track.album.images[0].url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#1a3a5a,#2a1a5a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(50px,7vh,90px)',color:'var(--t1)'}}>{IC.music}</div>}
          </div>
          <div style={{textAlign:'center',animation:'fadeUp .4s ease .35s both',opacity:0}}>
            <h2 style={{fontSize:'clamp(17px,1.8vw,30px)',fontWeight:700,letterSpacing:'-.03em',marginBottom:'clamp(4px,.4vh,8px)'}}>{track?.name}</h2>
            <p style={{fontSize:'clamp(12px,.88vw,16px)',color:'rgba(255,255,255,.65)',marginBottom:'clamp(3px,.3vh,6px)'}}><span style={{color:'var(--t1)',textDecoration:'underline',textDecorationColor:'rgba(255,255,255,.22)',cursor:'pointer'}}>{track?.artists?.map(a=>a.name).join(', ')}</span></p>
            <p style={{fontSize:'clamp(10px,.72vw,14px)',color:'var(--t3)'}}>{track?.album?.name} · {track?.album?.release_date?.slice(0,4)}</p>
          </div>
          <div style={{background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)',borderRadius:'clamp(9px,.8vw,15px)',padding:'clamp(9px,.9vh,15px) clamp(16px,1.6vw,26px)',animation:'fadeUp .4s ease .5s both',opacity:0}}>
            <p style={{fontSize:'clamp(11px,.8vw,15px)',fontWeight:500,textAlign:'center'}}>Trouvé en <strong>{Math.max(0,dur-timer)}s</strong> — +{Math.max(10,Math.round((timer/dur)*1000))} pts</p>
          </div>
          <div style={{display:'flex',gap:'clamp(8px,.7vw,14px)',animation:'fadeUp .4s ease .62s both',opacity:0}}>
            {[['👍','rgba(52,211,153,.16)'],['👎','rgba(248,113,113,.16)']].map(([e,h],i)=>(
              <button key={i} style={{background:'var(--mR)',backdropFilter:'var(--mRb)',WebkitBackdropFilter:'var(--mRb)',boxShadow:'var(--le)',border:'none',borderRadius:'999px',padding:'clamp(8px,.8vh,14px) clamp(18px,1.8vw,28px)',cursor:'pointer',fontSize:'clamp(15px,1.6vh,24px)',transition:'all .15s'}}
                onMouseEnter={e2=>e2.currentTarget.style.background=h}
                onMouseLeave={e2=>e2.currentTarget.style.background='var(--mR)'}>{e}</button>
            ))}
          </div>
          <button onClick={nextRound} className="btn-solid" style={{padding:'clamp(10px,1vh,16px) clamp(28px,2.8vw,48px)',borderRadius:'999px',fontSize:'clamp(12px,.88vw,16px)',animation:'fadeUp .4s ease .74s both',opacity:0}}>
            {cIdx+1>=pool.length?'Voir les scores':'Suivant'}
          </button>
        </div>
      </div>}

      {screen==='end'&&<div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'clamp(20px,2vh,40px)'}}>
        <div className="scale" style={{textAlign:'center'}}>
          <p style={{fontSize:'clamp(11px,.8vw,16px)',color:'var(--t3)',marginBottom:'clamp(7px,.7vh,12px)'}}>Partie terminée</p>
          <h1 style={{fontSize:'clamp(52px,7.5vw,120px)',fontWeight:700,letterSpacing:'-.055em',marginBottom:'clamp(5px,.5vh,10px)'}}>{score}</h1>
          <p style={{fontSize:'clamp(13px,1.1vw,20px)',color:'var(--t2)',marginBottom:'clamp(26px,3vh,48px)'}}>points · {pool.length} manches</p>
          <div style={{display:'flex',gap:'clamp(9px,.9vw,16px)',justifyContent:'center'}}>
            <button onClick={()=>setScreen('home')} className="btn-glass" style={{borderRadius:'999px',padding:'clamp(11px,1.1vh,18px) clamp(22px,2.2vw,40px)',fontSize:'clamp(12px,.87vw,16px)'}}>Accueil</button>
            <button onClick={startGame} className="btn-solid" style={{borderRadius:'999px',padding:'clamp(11px,1.1vh,18px) clamp(22px,2.2vw,40px)',fontSize:'clamp(12px,.87vw,16px)'}}>Rejouer</button>
          </div>
        </div>
      </div>}
    </div>

    {showPB&&<PlayerBar track={track} paused={paused} progress={progress} revealed={revealed} canSeek={revealed}
      onPause={handlePause}
      onSeek={e=>{if(!revealed)return;const r=e.currentTarget.getBoundingClientRect();const pct=(e.clientX-r.left)/r.width;if(track?.duration_ms){const pos=Math.floor(pct*track.duration_ms);setProgress(Math.floor(pos/1000));playerRef.current?.seek(pos);}}}/>}
  </>);
}
