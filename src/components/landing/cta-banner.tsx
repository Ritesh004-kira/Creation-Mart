"use client";
import { FilmButton } from "./film-button";

export function CtaBanner() {
  return (
    <section id="start" className="relative overflow-hidden bg-[#07080a] text-white py-28 sm:py-36 border-t border-white/10">
      {/* Decorative curved neon portal arches on left and right as shown in reference */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 h-[340px] w-64 rounded-[70px] border border-red-500/25 bg-red-500/[0.03] shadow-[0_0_80px_rgba(252,17,76,0.1)] blur-[0.5px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-1/2 -translate-y-1/2 h-[340px] w-64 rounded-[70px] border border-red-500/25 bg-red-500/[0.03] shadow-[0_0_80px_rgba(252,17,76,0.1)] blur-[0.5px]"
      />

      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[550px] rounded-full bg-red-600/10 blur-[120px]"
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 sm:px-12 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-5">
          READY TO GET STARTED?
        </p>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.06] text-white drop-shadow-md">
          Turn your next idea<br />into shared, memorable work.
        </h2>

        <p className="mt-6 text-base sm:text-lg leading-relaxed text-neutral-300 max-w-xl mx-auto drop-shadow">
          Bring a clear brief and a creative process. Build your next project together.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/briefs/new"
            className="rounded-full bg-gradient-to-r from-[#ff4155] to-[#fc114c] px-9 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-red-500/30 transition-all hover:brightness-110 hover:scale-105 active:scale-95"
          >
            GET STARTED
          </a>
          <FilmButton className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-4 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/15 hover:scale-105 active:scale-95"/>
        </div>
      </div>
    </section>
  );
}
