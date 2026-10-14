"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

export function BriefCopilot() {
  const [activeTab, setActiveTab] = useState<"brief" | "creators">("brief");

  return (
    <section id="brief-copilot" className="relative bg-[#fbfbfb] text-black py-24 sm:py-32 border-t border-neutral-200">
      <div className="section-container mx-auto max-w-7xl px-6 sm:px-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] items-center">
          {/* Left Column: Heading & 3 Feature Points */}
          <div data-reveal className="flex flex-col gap-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
              BRIEF COPILOT
            </p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-black">
              From idea to the perfect creator brief — in minutes.
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-neutral-600">
              Our Brief Copilot turns a rough idea into a clear production brief with goals, deliverables, references, and usage requirements — ready for your review.
            </p>

            {/* 3 Value Props */}
            <div className="space-y-6 pt-2">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-neutral-200 shadow-sm text-neutral-800">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-black">Turn ideas into briefs</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Describe your campaign in plain language. Template assistance starts your brief and shows the questions still to answer.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-neutral-200 shadow-sm text-neutral-800">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-black">Get smart creator matches</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Automatically surface the best-fit creators based on outcomes, style, workflow, formats, availability, and evidence.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-neutral-200 shadow-sm text-neutral-800">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="6" r="3" />
                    <circle cx="6" cy="18" r="3" />
                    <line x1="20" y1="4" x2="8.12" y2="15.88" />
                    <line x1="14.47" y1="14.48" x2="20" y2="20" />
                    <line x1="8.12" y1="8.12" x2="12" y2="12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-black">Align on deliverables</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Clear scopes, timelines, and usage rights from the start.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="/briefs/new"
                className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-neutral-800 hover:scale-105 active:scale-95"
              >
                <span>TRY BRIEF COPILOT</span>
                <span>→</span>
              </a>
            </div>
          </div>

          {/* Source design preview; operational editor is linked above. */}
          <div data-reveal className="copilot-preview rounded-[32px] border border-[#fee2e2] bg-[#fff5f5] p-5 sm:p-7 shadow-lg">
            <div className="flex justify-end mb-5">
              <div className="preview-switch inline-flex items-center gap-1 rounded-full bg-neutral-200/50 p-1 text-[11px] font-bold" role="group" aria-label="Brief Copilot preview">
                <button
                  type="button"
                  aria-pressed={activeTab === "brief"}
                  onClick={() => setActiveTab("brief")}
                  className={`rounded-full px-4 py-1.5 transition-all cursor-pointer ${
                    activeTab === "brief"
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-500 hover:text-black"
                  }`}
                >
                  TEMPLATE BRIEF
                </button>
                <button
                  type="button"
                  aria-pressed={activeTab === "creators"}
                  onClick={() => setActiveTab("creators")}
                  className={`rounded-full px-4 py-1.5 transition-all cursor-pointer ${
                    activeTab === "creators"
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-500 hover:text-black"
                  }`}
                >
                  MATCHING CREATORS
                </button>
              </div>
            </div>

            {/* Tab 1: AI Generated Brief */}
            {activeTab === "brief" ? (
              <div key="brief" className="preview-panel copilot-cards grid gap-4">
                {/* Card 1: Brief Copilot Input & Extraction */}
                <div className="rounded-2xl border border-neutral-100 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="h-2 w-2 rounded-full bg-[#fc114c]" />
                      <span className="text-xs font-bold text-black">Brief Copilot</span>
                    </div>

                    {/* Chat input box */}
                    <div className="relative rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-xs leading-relaxed text-neutral-800 mb-5">
                      <p>
                        Launch a summer campaign for our new drink. Fun, outdoorsy, authentic UGC style.
                      </p>
                      <div className="mt-3 flex justify-end">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fc114c] text-white text-xs font-bold shadow-sm">
                          →
                        </span>
                      </div>
                    </div>

                    {/* Extracted campaign specs */}
                    <div className="space-y-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#fc114c] text-[9px]">
                          ●
                        </span>
                        <div>
                          <span className="font-bold text-black">Campaign goal</span>
                          <p className="text-neutral-500 text-[11px]">Drive awareness &amp; trials</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#fc114c] text-[9px]">
                          ●
                        </span>
                        <div>
                          <span className="font-bold text-black">Target audience</span>
                          <p className="text-neutral-500 text-[11px]">Gen Z, outdoor enthusiasts</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#fc114c] text-[9px]">
                          ●
                        </span>
                        <div>
                          <span className="font-bold text-black">Key message</span>
                          <p className="text-neutral-500 text-[11px]">Real moments, real refreshment</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#fc114c] text-[9px]">
                          ●
                        </span>
                        <div>
                          <span className="font-bold text-black">Deliverables</span>
                          <p className="text-neutral-500 text-[11px]">3 video concepts + 5 UGC assets</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#fc114c] text-[9px]">
                          ●
                        </span>
                        <div>
                          <span className="font-bold text-black">Tone &amp; style</span>
                          <p className="text-neutral-500 text-[11px]">Authentic, upbeat, adventurous</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Summer Refresh Campaign Preview */}
                <div className="rounded-2xl border border-neutral-100 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="h-2 w-2 rounded-full bg-[#fc114c]" />
                      <Link href="/briefs/new" className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-neutral-600 hover:bg-neutral-50 transition-colors">
                        <span>✎</span> EDIT
                      </Link>
                    </div>

                    <h3 className="text-sm font-bold text-black">
                      Summer Refresh Campaign
                    </h3>
                    <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed">
                      A high-energy, authentic campaign showcasing real people enjoying our new drink outdoors. UGC style, upbeat and natural.
                    </p>

                    {/* 3 Moodboard Inspiration Photos */}
                    <div className="mt-5 grid grid-cols-3 gap-2.5">
                      <div className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100 shadow-sm border border-neutral-200">
                        <Image
                          src="/design/brief_inspo1.jpg"
                          alt="Summer Drink Inspiration"
                          fill
                          sizes="(max-width: 768px) 33vw, 150px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100 shadow-sm border border-neutral-200">
                        <Image
                          src="/design/brief_inspo2.jpg"
                          alt="Outdoor Mountain Scenery"
                          fill
                          sizes="(max-width: 768px) 33vw, 150px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100 shadow-sm border border-neutral-200">
                        <Image
                          src="/design/brief_inspo3.jpg"
                          alt="Creator in Sunglasses"
                          fill
                          sizes="(max-width: 768px) 33vw, 150px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    </div>

                    {/* Category Tags */}
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {["UGC Style", "Outdoor", "Authentic", "Gen Z"].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[10px] font-semibold text-neutral-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Tab 2: Matching Creators Preview */
              <div key="creators" className="preview-panel rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-black uppercase tracking-wider">Example production styles</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Illustrative preview
                  </span>
                </div>

                <div className="preview-creators grid gap-3">
                  <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2">
                      <Image src="/design/creator_sarah.jpg" alt="Sarah" fill sizes="(max-width: 639px) 80vw, 240px" className="object-cover" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black">@sarah.outside</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Example</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Outdoor · Video production</p>
                  </div>

                  <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2">
                      <Image src="/design/creator_lily.jpg" alt="Lily" fill sizes="(max-width: 639px) 80vw, 240px" className="object-cover" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black">@lily.travels</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Example</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Travel · Visual storytelling</p>
                  </div>

                  <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2">
                      <Image src="/design/creator_jake.jpg" alt="Jake" fill sizes="(max-width: 639px) 80vw, 240px" className="object-cover" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black">@jake.creates</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Example</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Lifestyle · Product films</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
