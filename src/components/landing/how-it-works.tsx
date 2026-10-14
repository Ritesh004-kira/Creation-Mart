"use client";

import { BackgroundFilm } from './film-button';

const steps = [
  {
    num: "1",
    numColor: "bg-red-950/80 text-red-400 border border-red-500/30",
    iconBg: "bg-gradient-to-r from-[#ff4155] to-[#fc114c] text-white",
    title: "Create a brief",
    desc: "Define exact outputs, usage, budget and timeline.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    num: "2",
    numColor: "bg-purple-950/80 text-purple-400 border border-purple-500/30",
    iconBg: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white",
    title: "Find your match",
    desc: "Discover eligible creators with clear fit reasons.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
  },
  {
    num: "3",
    numColor: "bg-amber-950/80 text-amber-400 border border-amber-500/30",
    iconBg: "bg-gradient-to-r from-amber-500 to-orange-600 text-white",
    title: "Collaborate",
    desc: "Align on deliverables, rights and timelines in one place.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    num: "4",
    numColor: "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30",
    iconBg: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
    title: "Track & deliver",
    desc: "Monitor progress and get final assets, ready to use.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-black text-white py-24 sm:py-32 border-t border-white/10">
      {/* Background Video (Video Project.webm) with balanced opacity */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <BackgroundFilm
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          src="/design/video-project.webm"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/85 via-black/35 to-black/90" />
      </div>

      <div className="section-container relative z-10 mx-auto max-w-7xl px-6 sm:px-12">
        <div className="workflow-layout grid gap-12 items-center">
          {/* Left Column: Heading & Button */}
          <div data-reveal className="flex flex-col gap-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              COLLABORATION WORKFLOW
            </p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white drop-shadow-md">
              Built for frictionless collaboration.
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-neutral-300 drop-shadow">
              From brief to final delivery, everything you need to collaborate with creators in one place.
            </p>

            <div className="pt-2">
              <a
                href="/briefs/new"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/60 px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/15 hover:scale-105 active:scale-95"
              >
                <span>EXPLORE THE WORKFLOW</span>
                <span>→</span>
              </a>
            </div>
          </div>

          {/* Right Column: 4 Workflow Steps */}
          <div data-reveal className="workflow-cards grid gap-6 grid-cols-1 sm:grid-cols-2">
            {steps.map((s) => (
              <div
                key={s.num}
                className="flex flex-col rounded-3xl border border-white/15 bg-black/55 p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-white/30 hover:bg-black/70"
              >
                {/* Step indicator pills */}
                <div className="flex items-center gap-2.5 mb-5">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${s.numColor}`}>
                    {s.num}
                  </span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md ${s.iconBg}`}>
                    {s.icon}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">
                  {s.title}
                </h3>
                <p className="text-xs leading-relaxed text-neutral-300">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
