'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const sections = [['/', 'Home'], ['/creators', 'Browse creators'], ['/#brief-copilot', 'Brief Copilot'], ['/#fit-engine', 'Explainable Fit'], ['/#proof', 'Production Passports'], ['/#how-it-works', 'How It Works'], ['/#rights', 'Rights Receipts'], ['/briefs', 'Production Briefs'], ['/project-overview', 'Project overview']];

export function Navbar({signedIn,role}:{signedIn:boolean;role?:'creator'|'brand'|null}) {
  const pathname=usePathname();
  const dialog=useRef<HTMLDialogElement>(null), trigger=useRef<HTMLButtonElement>(null);
  const header=useRef<HTMLElement>(null), previousOverflow=useRef<string|null>(null);
  const [menuOpen,setMenuOpen]=useState(false);
  function restoreScroll(){if(previousOverflow.current!==null){document.body.style.overflow=previousOverflow.current;previousOverflow.current=null;}}
  useEffect(()=>{
    dialog.current?.close();
    if(previousOverflow.current!==null){document.body.style.overflow=previousOverflow.current;previousOverflow.current=null;}
    const updateHeader=()=>header.current?.classList.toggle('header-scrolled',window.scrollY>24);
    updateHeader();window.addEventListener('scroll',updateHeader,{passive:true});
    return()=>{window.removeEventListener('scroll',updateHeader);if(previousOverflow.current!==null){document.body.style.overflow=previousOverflow.current;previousOverflow.current=null;}};
  },[pathname]);
  function close(){dialog.current?.close();restoreScroll();}
  return <header ref={header} className={'site-header '+(pathname==='/'?'header-home':'header-app')}>
    <nav aria-label="Main navigation" className="site-nav">
      <div className="nav-identity"><button ref={trigger} type="button" onClick={()=>{dialog.current?.showModal();previousOverflow.current=document.body.style.overflow;document.body.style.overflow='hidden';setMenuOpen(true);}} aria-label="Open navigation menu" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="navigation-menu" className="nav-pill menu-trigger"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button><Link href="/" className="nav-brand" aria-label="Creation Mart home"><Image src="/design/logo.webp" alt="" width={28} height={28}/><span>Creation Mart</span></Link></div>
      <div className="workspace-nav"><Link href="/creators" aria-current={pathname==='/creators'?'page':undefined}>Browse creators</Link>{role==='creator'?<><Link href="/creator" aria-current={pathname==='/creator'?'page':undefined}>My workspace</Link><Link href="/briefs">Find briefs</Link></>:role==='brand'?<><Link href="/brand" aria-current={pathname==='/brand'?'page':undefined}>My workspace</Link><Link href="/briefs/new">New brief</Link></>:<Link href="/#how-it-works">How it works</Link>}</div>
      <div className="nav-actions">{signedIn?<><Link href="/dashboard" className="nav-pill">Dashboard</Link><form action="/api/v1/sign-out" method="post"><button type="submit" className="nav-pill">Sign out</button></form></>:<><Link href="/sign-in" className="nav-pill">Sign in</Link><Link href="/sign-in?mode=signup" className="nav-pill nav-start">Get Started</Link></>}</div>
    </nav>
    <dialog ref={dialog} id="navigation-menu" className="navigation-dialog" aria-labelledby="navigation-title" onClose={()=>{restoreScroll();setMenuOpen(false);trigger.current?.focus();}}>
      <div className="mx-auto max-w-7xl px-6 sm:px-12">
        <div className="menu-heading"><h2 id="navigation-title" className="text-xl font-black">Creation Mart</h2><button autoFocus type="button" className="nav-pill" onClick={close}>Close navigation menu</button></div>
        <div className="grid gap-12 py-8 lg:grid-cols-[1.5fr_1fr]">
          <nav aria-label="Explore Creation Mart" className="flex flex-col gap-4">{signedIn&&<><Link href="/dashboard" onClick={close} className="menu-link">My workspace</Link><Link href="/account/password" onClick={close} className="menu-link">Account security</Link></>}{sections.map(([href,label],i)=><Link key={href} href={href} onClick={close} className="menu-link"><span className="text-xs text-[#fc114c]">{String(i+1).padStart(2,'0')}</span>{label}</Link>)}</nav>
          <div className="self-center rounded-3xl border border-white/15 bg-white/5 p-8"><p className="text-xs font-bold tracking-widest text-[#fc114c]">CREATIVE WORK, WITH THE PROCESS BEHIND IT</p><p className="mt-4 text-sm leading-relaxed text-neutral-300">Inspect production passports, understand each fit score, and review usage declarations before accepting a delivery.</p><Link href="/briefs/new" onClick={close} className="mt-8 inline-flex rounded-full bg-brand-gradient px-6 py-3 text-sm font-bold text-white">Start a brief</Link></div>
        </div>
      </div>
    </dialog>
  </header>;
}
