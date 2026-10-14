"use client";
import { useState } from "react";
import Link from "next/link";

const trustItems = [
  {
    title: "Creator declared",
    desc: "Capabilities and process described by the creator.",
    iconColor: "bg-[#f3e8ff] text-[#9333ea]",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Evidence attached",
    desc: "Supporting material tied to a specific claim.",
    iconColor: "bg-[#dcfce7] text-[#16a34a]",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "File checked",
    desc: "Actual file headers, dimensions and hashes checked.",
    iconColor: "bg-[#ffedd5] text-[#ea580c]",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    title: "Private deliveries",
    desc: "Files shared only with project participants.",
    iconColor: "bg-[#dbeafe] text-[#2563eb]",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export function Trust() {
  const [offset,setOffset]=useState(0);
  const ordered=[...trustItems.slice(offset),...trustItems.slice(0,offset)];
  return (
    <section id="proof" className="relative bg-[#fbfbfb] text-black py-24 sm:py-32 border-t border-neutral-200">
      <div className="section-container mx-auto max-w-7xl px-6 sm:px-12">
        {/* Header with Carousel Navigation on the Right */}
        <div data-reveal className="section-heading flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">
              PRODUCTION PASSPORTS
            </p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-black">
              Clear evidence. Better decisions.
            </h2>
            <p className="mt-3 text-base sm:text-lg leading-relaxed text-neutral-600">
              See the workflow, tools, and human decisions behind the work. Every evidence label tells you exactly what has been checked.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous evidence cards" onClick={()=>setOffset(value=>(value+3)%4)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 shadow-sm transition-all hover:bg-neutral-100 hover:text-black cursor-pointer"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next evidence cards" onClick={()=>setOffset(value=>(value+1)%4)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 shadow-sm transition-all hover:bg-neutral-100 hover:text-black cursor-pointer"
            >
              →
            </button>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div data-reveal className="trust-cards grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ordered.map((item) => (
            <div
              key={item.title}
              className="group flex flex-col justify-between rounded-3xl border border-neutral-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:border-neutral-400 hover:shadow-md"
            >
              <div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconColor} mb-6`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-black mb-2">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-neutral-500">
                  {item.desc}
                </p>
              </div>

              <div className="pt-8">
                <Link href="/creators" aria-label={"Explore "+item.title} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 text-xs transition-transform group-hover:translate-x-1">
                  →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
