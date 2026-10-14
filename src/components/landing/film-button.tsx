'use client';
import { useEffect, useRef, useState } from 'react';
export function FilmButton({className=''}:{className?:string}){
 const dialog=useRef<HTMLDialogElement>(null),video=useRef<HTMLVideoElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const previousOverflow=useRef<string|null>(null);
 useEffect(()=>()=>{if(previousOverflow.current!==null)document.body.style.overflow=previousOverflow.current;},[]);
 return <><button ref={trigger} type="button" className={'landing-action '+className} aria-haspopup="dialog" onClick={()=>{dialog.current?.showModal();previousOverflow.current=document.body.style.overflow;document.body.style.overflow='hidden';}}>▶ WATCH THE CREATIVE FILM</button><dialog ref={dialog} className="film-dialog" aria-label="Creative process film" onClose={()=>{video.current?.pause();if(previousOverflow.current!==null){document.body.style.overflow=previousOverflow.current;previousOverflow.current=null;}trigger.current?.focus();}}><div className="flex flex-wrap items-center justify-between gap-4 p-4"><h2 className="text-lg font-bold">The creative process</h2><button autoFocus type="button" className="nav-pill" onClick={()=>dialog.current?.close()}>Close film</button></div><video ref={video} src="/design/video-project.webm" controls playsInline preload="none" aria-label="Creative process film"/><p className="p-4 text-xs text-neutral-300">A look inside the creative process.</p></dialog></>;
}
export function BackgroundFilm({src,poster,className,controls=true}:{src:string;poster?:string;className?:string;controls?:boolean}){
 const video=useRef<HTMLVideoElement>(null),[paused,setPaused]=useState(true);
 const manualPaused=useRef(false),inView=useRef(false),syncPlayback=useRef<()=>void>(()=>{});
 useEffect(()=>{
   const film=video.current;if(!film)return;
   const query=window.matchMedia('(prefers-reduced-motion: reduce)');
   manualPaused.current=query.matches;
   const apply=()=>{if(manualPaused.current||!inView.current||document.hidden)film.pause();else void film.play().catch(()=>setPaused(true));};
   syncPlayback.current=apply;
   const motionChanged=()=>{manualPaused.current=query.matches;apply();};
   const observer=new IntersectionObserver(entries=>{inView.current=entries[0].isIntersecting;apply();},{threshold:0.05});
   observer.observe(film);query.addEventListener('change',motionChanged);document.addEventListener('visibilitychange',apply);
   return()=>{observer.disconnect();query.removeEventListener('change',motionChanged);document.removeEventListener('visibilitychange',apply);film.pause();syncPlayback.current=()=>{};};
 },[]);
 return <><video ref={video} className={className} src={src} poster={poster} muted loop playsInline preload="metadata" disablePictureInPicture tabIndex={-1} aria-hidden="true" onPlay={()=>setPaused(false)} onPause={()=>setPaused(true)}/>{controls&&<button type="button" className="film-toggle" aria-label={paused?'Play background film':'Pause background film'} aria-pressed={!paused} onClick={()=>{manualPaused.current=!paused;syncPlayback.current();}}>{paused?'Play film':'Pause film'}</button>}</>;
}
