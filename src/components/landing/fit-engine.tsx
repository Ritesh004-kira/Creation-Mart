"use client";

import Image from "next/image";

const matchFactors = [
  { name: "Outcomes", pct: 92 },
  { name: "Style", pct: 90 },
  { name: "Workflow", pct: 94 },
  { name: "Formats", pct: 88 },
  { name: "Availability", pct: 100 },
  { name: "Evidence completeness", pct: 90 },
];

const whyReasons = [
  "Requested outputs are covered",
  "Creates authentic outdoor content",
  "Documented production workflow",
  "Declared schedule is compatible",
  "Current preview file checks",
];

export function FitEngine() {
  return (
    <section id="fit-engine" className="relative bg-[#07080a] text-white py-24 sm:py-32 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 sm:px-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] items-center">
          {/* Left Column: Heading & 4 Capabilities */}
          <div className="flex flex-col gap-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              EXPLAINABLE FIT ENGINE
            </p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white">
              Smarter matches.<br />Clearer creative collaborations.
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-neutral-400">
              Compare your brief with six production signals: outcomes, style, workflow, formats, availability, and evidence. Explore the reasons behind every real creator match.
            </p>

            {/* 4 Feature Items */}
            <div className="space-y-4 pt-2">
              {[
                "Multi-signal creator analysis",
                "Explainable match reasoning",
                "Exact output and capability pairing",
                "Persistent shortlists and comparison",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-neutral-300">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="4" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-neutral-200">{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <a
                href="/creators"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/15 hover:scale-105 active:scale-95"
              >
                <span>SEE HOW IT WORKS</span>
                <span>→</span>
              </a>
            </div>
          </div>

          {/* Right Column: 2x2 Grid of Match Diagnostics Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Card 1: Illustrative fit score (93 / 100) */}
            <div className="rounded-2xl border border-white/10 bg-[#121418] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-400 mb-3">
                  Illustrative fit score
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <span className="whitespace-nowrap text-5xl font-black text-white">91.5<span className="ml-1 text-xs font-medium text-neutral-400">/100</span></span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-3 py-1 text-xs font-bold text-emerald-400">
                    <span>✓</span> Example fit
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-neutral-400">
                  Illustrative score from six weighted production signals. Publish a brief to see matches from real creator records.
                </p>
              </div>
            </div>

            {/* Card 2: Sarah Profile Summary */}
            <div className="rounded-2xl border border-white/10 bg-[#121418] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative h-11 w-11 overflow-hidden rounded-full border border-white/20 bg-neutral-800">
                    <Image
                      src="/design/creator_sarah.jpg"
                      alt="Sarah Avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">Example creator</span>
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-white text-[9px] font-black">
                        ✓
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">Outdoor · Travel · Lifestyle</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                  <div>
                    <p className="text-base font-black text-white">MP4</p>
                    <p className="text-[10px] uppercase font-bold text-neutral-400">Formats</p>
                  </div>
                  <div>
                    <p className="text-base font-black text-white">3 steps</p>
                    <p className="text-[10px] uppercase font-bold text-neutral-400">Workflow</p>
                  </div>
                  <div>
                    <p className="text-base font-black text-white">Yes</p>
                    <p className="text-[10px] uppercase font-bold text-neutral-400">Available</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Match Factors Progress Bars */}
            <div className="rounded-2xl border border-white/10 bg-[#121418] p-6 shadow-xl">
              <p className="text-xs font-bold text-neutral-300 mb-4">
                Match Factors
              </p>
              <div className="space-y-2.5">
                {matchFactors.map((m) => (
                  <div key={m.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400 text-[11px]">{m.name}</span>
                      <span className="font-bold text-white text-[11px]">{m.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#fc6e1c] to-[#fc114c]"
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4: Why this match? */}
            <div className="rounded-2xl border border-white/10 bg-[#121418] p-6 shadow-xl">
              <p className="text-xs font-bold text-neutral-300 mb-4">
                Why this match?
              </p>
              <ul className="space-y-3 text-xs text-neutral-300">
                {whyReasons.map((r) => (
                  <li key={r} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-red-500/40 bg-red-950/60 text-red-400 text-[10px]">
                      ✓
                    </span>
                    <span className="text-[11px] leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
