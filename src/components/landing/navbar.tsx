'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const sections = [['/', 'Home'], ['/creators', 'Browse creators'], ['/#brief-copilot', 'Brief Copilot'], ['/#fit-engine', 'Explainable Fit'], ['/#proof', 'Production Passports'], ['/#how-it-works', 'How It Works'], ['/#rights', 'Rights Receipts'], ['/briefs', 'Production Briefs']];

export function Navbar({signedIn}:{signedIn:boolean}) {
  const pathname=usePathname();
  const dialog=useRef<HTMLDialogElement>(null), trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{dialog.current?.close();},[pathname]);
  function close(){dialog.current?.close();document.body.style.overflow='';}
  return <header className={'site-header '+(pathname==='/'?'header-home':'header-app')}>
    <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between gap-3">
      <button ref={trigger} type="button" onClick={()=>{dialog.current?.showModal();document.body.style.overflow='hidden';}} aria-label="Open navigation menu" className="nav-pill menu-trigger">•••</button>
      <Link href="/" aria-label="Creation Mart home" className="brand-emblem"><Image src="/design/logo.webp" alt="" width={34} height={34} priority/></Link>
      <div className="flex items-center gap-2">{signedIn?<><Link href="/dashboard" className="nav-pill">Dashboard</Link><form action="/api/v1/sign-out" method="post"><button type="submit" className="nav-pill">Sign out</button></form></>:<><Link href="/sign-in" className="nav-pill">Sign in</Link><Link href="/onboarding" className="nav-pill nav-start">Get Started</Link></>}</div>
    </nav>
    <dialog ref={dialog} className="navigation-dialog" aria-labelledby="navigation-title" onClose={()=>{document.body.style.overflow='';trigger.current?.focus();}}>
      <div className="mx-auto max-w-7xl px-6 sm:px-12">
        <div className="flex items-center justify-between gap-4 py-6"><h2 id="navigation-title" className="text-xl font-black">Creation Mart</h2><button autoFocus type="button" className="nav-pill" onClick={close}>Close navigation menu</button></div>
        <div className="grid gap-12 py-8 lg:grid-cols-[1.5fr_1fr]">
          <nav aria-label="Explore Creation Mart" className="flex flex-col gap-4">{sections.map(([href,label],i)=><Link key={href} href={href} onClick={close} className="menu-link"><span className="text-xs text-[#fc114c]">{String(i+1).padStart(2,'0')}</span>{label}</Link>)}</nav>
          <div className="self-center rounded-3xl border border-white/15 bg-white/5 p-8"><p className="text-xs font-bold tracking-widest text-[#fc114c]">CREATIVE WORK, WITH THE PROCESS BEHIND IT</p><p className="mt-4 text-sm leading-relaxed text-neutral-300">Inspect production passports, understand each fit score, and review usage declarations before accepting a delivery.</p><Link href="/briefs/new" onClick={close} className="mt-8 inline-flex rounded-full bg-brand-gradient px-6 py-3 text-sm font-bold text-white">Start a brief</Link></div>
        </div>
      </div>
    </dialog>
  </header>;
}
