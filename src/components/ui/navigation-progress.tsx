'use client';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function NavigationProgress(){
  const router=useRouter();
  const [pending,startTransition]=useTransition();
  const [requests,setRequests]=useState(0);
  useEffect(()=>{
    const request=(event:Event)=>setRequests(count=>Math.max(0,count+(event as CustomEvent<number>).detail));
    const navigate=(event:MouseEvent)=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const link=(event.target as Element).closest?.('a[href]') as HTMLAnchorElement|null;
      if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self')||link.getAttribute('aria-disabled')==='true')return;
      const url=new URL(link.href,window.location.href);
      if(url.origin!==window.location.origin||url.protocol!==window.location.protocol)return;
      if(url.pathname===window.location.pathname&&url.search===window.location.search)return;
      event.preventDefault();
      startTransition(()=>router.push(url.pathname+url.search+url.hash));
    };
    window.addEventListener('creation-request',request);
    document.addEventListener('click',navigate,true);
    return()=>{window.removeEventListener('creation-request',request);document.removeEventListener('click',navigate,true);};
  },[router]);
  return pending||requests>0?<div className="global-progress" role="status" aria-live="polite"><span className="progress-track" aria-hidden="true"/><span className="progress-badge"><span className="spinner" aria-hidden="true"/>{pending?'Opening page…':'Working…'}</span></div>:null;
}
