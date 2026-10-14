"use client";

import Image from "next/image";

export function RightsPreview() {
  return (
    <section id="rights" className="relative bg-[#07080a] text-white py-24 sm:py-32 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 sm:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1.3fr] items-center">
          {/* Left Column: Heading & 3 Bullets */}
          <div className="flex flex-col gap-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              RIGHTS &amp; RECEIPTS · ILLUSTRATIVE PREVIEW
            </p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white">
              Clear rights.<br />Visible conditions.
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-neutral-400">
              Every collaboration comes with clear usage rights, deliverables tracking and immutable receipts — so you always know what you can use, where and for how long.
            </p>

            {/* 3 Value Props */}
            <div className="space-y-5 pt-2">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-neutral-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="4" />
                    <path d="M7 7h.01M7 12h.01M7 17h.01M12 7h5M12 12h5M12 17h5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Clear usage rights</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Define and track usage rights upfront.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-neutral-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Frozen requirements</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Versioned records of deliverables and declarations.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-neutral-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Easy license management</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Compare permitted uses, territories and duration.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="/briefs/new"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/15 hover:scale-105 active:scale-95"
              >
                <span>LEARN ABOUT RIGHTS</span>
                <span>→</span>
              </a>
            </div>
          </div>

          {/* Right Column: Rights Fit Receipt Card */}
          <div className="rounded-3xl border border-white/10 bg-[#121418] p-6 sm:p-8 shadow-2xl">
            {/* Header: Title + VERIFIED Badge */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
              <h3 className="text-base font-bold text-white">
                Rights Fit Receipt
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-3 py-1 text-xs font-bold text-emerald-400">
                <span>✓</span> DECLARED
              </span>
            </div>

            {/* Split: Parameters Table & Creator Drink Asset */}
            <div className="grid gap-6 sm:grid-cols-[1.3fr_0.9fr] items-center">
              {/* Parameters List */}
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[11px] text-neutral-400">Campaign</span>
                  <p className="font-semibold text-white mt-0.5">Summer Refresh Campaign</p>
                </div>

                <div>
                  <span className="text-[11px] text-neutral-400">Creator</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative h-5 w-5 overflow-hidden rounded-full bg-neutral-800">
                      <Image
                        src="/design/creator_sarah.jpg"
                        alt="Sarah Avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-semibold text-white">@sarah.outside</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-neutral-400">Deliverables</span>
                  <p className="font-semibold text-white mt-0.5">3 videos + 5 UGC photos</p>
                </div>

                <div>
                  <span className="text-[11px] text-neutral-400">Usage Rights</span>
                  <p className="font-semibold text-white mt-0.5">Social, Web, Paid Media</p>
                </div>

                <div>
                  <span className="text-[11px] text-neutral-400">Term</span>
                  <p className="font-semibold text-white mt-0.5">12 months</p>
                </div>

                <div>
                  <span className="text-[11px] text-neutral-400">Frozen selection receipt</span>
                  <p className="font-mono text-cyan-400  flex items-center gap-1 mt-0.5">
                    Saved with the engagement <span className="text-[10px]">↗</span>
                  </p>
                </div>
              </div>

              {/* Creator Asset with Signature */}
              <div className="relative flex flex-col items-center">
                <div className="relative aspect-[3/4] w-full max-w-[180px] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-lg">
                  <Image
                    src="/design/receipt_drink.jpg"
                    alt="Summer Drink Campaign Visual"
                    fill
                    className="object-cover"
                  />
                  {/* Subtle vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  {/* Stylized Signature Script */}
                  <div className="absolute bottom-3 left-3 text-white/80 font-serif italic text-sm tracking-widest drop-shadow">
                    Sarah
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
