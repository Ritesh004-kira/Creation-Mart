'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { DiscoveryResult } from '@/server/services/discovery';
const creatorPortraits=['/design/creator_sarah.jpg','/design/creator_jake.jpg','/design/creator_maria.jpg','/design/creator_ryan.jpg','/design/creator_lily.jpg'];

export function Creators({data,categories}:{data:DiscoveryResult|null;categories:{slug:string;label:string}[]}){
  const [active,setActive]=useState('');
  return <section id="creators" className="bg-[#fbfbfb] py-24 text-black sm:py-32"><div className="mx-auto max-w-7xl px-6 sm:px-12">
    <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="mb-3 text-xs font-bold tracking-[.2em] text-neutral-500">THE CREATOR NETWORK</p><h2 className="text-3xl leading-[1.08] font-black sm:text-5xl">Work with exceptional creators.</h2><p className="mt-3 text-lg text-neutral-600">Explore published work and the process behind it.</p></div><Link href="/creators" className="text-xs font-bold tracking-wider text-black">BROWSE ALL CREATORS →</Link></div>
    <div className="mb-12 flex flex-wrap gap-2"><button type="button" aria-pressed={!active} onClick={()=>setActive('')} className={'category-pill '+(!active?'selected':'')}>Featured</button>{categories.slice(0,6).map(c=><Link key={c.slug} href={'/creators?specialties='+encodeURIComponent(c.slug)} className="category-pill">{c.label}</Link>)}<button type="button" aria-pressed={active==='available'} onClick={()=>setActive(active?'':'available')} className={'category-pill '+(active?'selected':'')}>Available now</button></div>
    {!data?<div role="alert" className="card"><h3>Creator discovery is temporarily unavailable</h3><p>Please retry to load published portfolios.</p><Link href="/creators">Retry discovery</Link></div>:<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">{data.items.map((c,index)=>({creator:c,portrait:creatorPortraits[index%creatorPortraits.length]})).filter(({creator:c})=>!active||c.available).map(({creator:c,portrait})=><article key={c.id} className="creator-feature group rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm"><div className="block overflow-hidden rounded-xl bg-neutral-100"><div className="creator-cover"><Image src={portrait} alt="Illustrative creator portrait" width={480} height={360} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 33vw, 20vw" className="h-full w-full object-cover"/></div></div><div className="px-1 pt-4"><Link href={'/creators/'+c.slug} className="text-sm font-bold text-black">{c.displayName}</Link><p className="mt-1 text-xs text-neutral-600">{c.headline}</p><div className="mt-4 flex justify-between gap-2 border-t border-neutral-100 pt-3 text-[11px]"><span>{c.available?'Available':'Unavailable'}</span><span>{c.isDemo?'Illustrative profile':'Creator declared'}</span></div></div></article>)}</div>}
  </div></section>;
}


