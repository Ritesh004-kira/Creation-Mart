"use client";
import { BackgroundFilm, FilmButton } from "./film-button";

export function Hero() {
  return (
    <section className="landing-hero relative flex w-full flex-col justify-between overflow-hidden bg-black text-white" aria-labelledby="hero-title">
      {/* Background Film with FEVO-style subtle dark scrim */}
      <div className="absolute inset-0 overflow-hidden" >
        <BackgroundFilm className="h-full w-full object-cover scale-105" src="/design/hero.webm" poster="/design/hero-poster.jpg"/>
        {/* Cinematic gradient overlays matching FEVO's hero scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/50" />
        <div className="pointer-events-none absolute inset-0 bg-black/25 backdrop-brightness-95" />
      </div>

      {/* Top spacer for fixed header */}
      <div className="hero-top-space" aria-hidden="true" />

      {/* Center Hero Content — Exact FEVO Display Typography */}
      <div className="hero-content relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-black/60 px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] uppercase text-red-400 backdrop-blur-md shadow-lg shadow-red-500/10">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          THE AI CREATOR MARKETPLACE
        </div>

        <h1 id="hero-title" className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.04] text-white max-w-4xl drop-shadow-md">
          Create Shared<br className="hidden sm:inline" /> Memorable Work
        </h1>

        <p className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl font-normal text-neutral-200 leading-relaxed drop-shadow">
          A modern way to connect, create and ship work with the right creators. Less searching. More signal. A marketplace built for what&apos;s next.
        </p>

        <div className="landing-actions mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <a
            href="/onboarding"
            className="landing-action landing-action-primary rounded-full bg-gradient-to-r from-[#ff4155] to-[#fc114c] px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-red-500/30"
          >
            GET STARTED
          </a>
          <FilmButton className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/50 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/10 hover:scale-105 active:scale-95"/>
        </div>
      </div>

      {/* FEVO Bouncing Down Arrow Indicator */}
      <div className="hero-scroll relative z-10 flex flex-col items-center">
        <a
          href="#brief-copilot"
          aria-label="Scroll to content"
          className="group flex min-h-11 min-w-11 flex-col items-center justify-center text-white/70 transition-colors hover:text-[#fc114c]"
        >
          <div className="hero-scroll-arrow">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white group-hover:text-[#fc114c] transition-colors drop-shadow-md"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </a>
      </div>
    </section>
  );
}
