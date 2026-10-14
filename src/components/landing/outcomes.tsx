"use client";

export function Outcomes() {
  return (
    <section id="outcomes" className="relative bg-[#fbfbfb] text-black py-24 sm:py-32 border-t border-neutral-200">
      <div className="mx-auto max-w-7xl px-6 sm:px-12">
        {/* Header with right link */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">
              TRANSPARENT OUTCOMES
            </p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-black">
              Clear requirements. No guesswork.
            </h2>
            <p className="mt-3 text-base sm:text-lg leading-relaxed text-neutral-600">
              Understand each match, review the latest version, and keep the complete delivery history.
            </p>
          </div>

          <div>
            <a
              href="/creators"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:text-[#fc114c]"
            >
              <span>SEE MORE RESULTS</span>
              <span>→</span>
            </a>
          </div>
        </div>

        {/* 3 Pastel Outcome Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Fit dimensions (6) */}
          <div className="flex items-center gap-6 rounded-3xl border border-[#a7f3d0] bg-[#ecfdf5] p-7 sm:p-8 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d1fae5] text-[#059669]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-black text-black tracking-tight">6</p>
              <h3 className="text-sm font-bold text-black mt-1">Fit dimensions</h3>
              <p className="text-xs text-neutral-500 mt-0.5">From outcomes to evidence</p>
            </div>
          </div>

          {/* Card 2: Rights states (3) */}
          <div className="flex items-center gap-6 rounded-3xl border border-[#fecaca] bg-[#fef2f2] p-7 sm:p-8 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fee2e2] text-[#dc2626]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-black text-black tracking-tight">3</p>
              <h3 className="text-sm font-bold text-black mt-1">Rights states</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Compatible, review, or blocked</p>
            </div>
          </div>

          {/* Card 3: Shared production brief (1) */}
          <div className="flex items-center gap-6 rounded-3xl border border-[#bfdbfe] bg-[#eff6ff] p-7 sm:p-8 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#dbeafe] text-[#2563eb]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-black text-black tracking-tight">1</p>
              <h3 className="text-sm font-bold text-black mt-1">Shared production brief</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Frozen through delivery</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
