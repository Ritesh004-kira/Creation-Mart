'use client';
import { useEffect, useRef, useState } from 'react';
export function FilmButton({className=''}:{className?:string}){
 const dialog=useRef<HTMLDialogElement>(null),video=useRef<HTMLVideoElement>(null),trigger=useRef<HTMLButtonElement>(null);
 return <><button ref={trigger} type="button" className={className} onClick={()=>dialog.current?.showModal()}>▶ WATCH THE CREATIVE FILM</button><dialog ref={dialog} className="film-dialog" aria-label="Creative process film" onClose={()=>{video.current?.pause();trigger.current?.focus();}}><div className="flex items-center justify-between gap-4 p-4"><h2 className="text-lg font-bold">The creative process</h2><button type="button" className="nav-pill" onClick={()=>dialog.current?.close()}>Close film</button></div><video ref={video} src="/design/video-project.webm" controls playsInline preload="none" aria-label="Creative process film"/><p className="p-4 text-xs text-neutral-300">Creative film from the supplied design archive. Portfolio evidence is scoped separately.</p></dialog></>;
}
export function BackgroundFilm({src,poster,className}:{src:string;poster?:string;className?:string}){
 const video=useRef<HTMLVideoElement>(null),[paused,setPaused]=useState(false);
 useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');const apply=()=>{setPaused(query.matches);if(query.matches)video.current?.pause();else void video.current?.play().catch(()=>setPaused(true));};apply();query.addEventListener('change',apply);return()=>query.removeEventListener('change',apply);},[]);
 return <><video ref={video} className={className} src={src} poster={poster} muted loop playsInline preload="metadata" disablePictureInPicture tabIndex={-1} aria-hidden="true"/><button type="button" className="film-toggle" aria-label={paused?'Play background film':'Pause background film'} onClick={()=>{if(paused)void video.current?.play().then(()=>setPaused(false)).catch(()=>{});else {video.current?.pause();setPaused(true);}}}>{paused?'Play film':'Pause film'}</button></>;
}
