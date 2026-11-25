"use client";

import { useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { BrandAmbassador, HomeSectionsConfig } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";
import { isAnyVideoUrl } from "@/lib/media";
import { ScrollSection, useLockBodyAndLenis } from "./SmoothScroll";
import {
  LightboxMediaItem,
  LinkifiedText,
  SmartMedia,
} from "./MediaDisplay";
import { SocialIcon } from "./SocialIcon";

export function BrandAmbassadorSection({
  ambassadors,
  homeSections,
  onInspectMedia,
}: {
  ambassadors: BrandAmbassador[];
  homeSections: HomeSectionsConfig;
  onInspectMedia: (item: LightboxMediaItem) => void;
}) {
  const [selectedBa, setSelectedBa] = useState<BrandAmbassador | null>(null);

  useLockBodyAndLenis(Boolean(selectedBa));

  if (!ambassadors || ambassadors.length === 0) return null;

  return (
    <ScrollSection
      id="ambassadors"
      showDivider={true}
      className="py-10 sm:py-16 md:py-20 px-3.5 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Clean Editorial Header */}
        <div className="mb-5 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
          <div>
            {homeSections.baBadge && (
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#E11D2E] block mb-1 sm:mb-2">
                {homeSections.baBadge}
              </span>
            )}
            <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-[0.94]">
              {homeSections.baTitleWhite || "BRAND"}{" "}
              <span className="text-[#E11D2E]">
                {homeSections.baTitleAccent || "AMBASSADOR"}
              </span>
            </h2>
          </div>
          {homeSections.baSubtitle && (
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md leading-relaxed">
              {homeSections.baSubtitle}
            </p>
          )}
        </div>

        {/*
          - Mobile (< sm): Compact IG-style 2-col / 3-col square grid (hemat ruang, tidak perlu scroll jauh!)
          - Laptop (lg:grid-cols-4): Slightly larger than 5-col Roster Player cards (~280px wide, tidak kegedean!)
        */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5 lg:gap-6">
          {ambassadors.map((ba) => (
            <article
              key={ba.id}
              onClick={() => setSelectedBa(ba)}
              className="group cursor-pointer overflow-hidden rounded-md border border-white/10 bg-zinc-950/70 hover:border-white/25 transition flex flex-col"
            >
              {/* Compact Square on Mobile -> Portrait (slightly bigger than player card) on Laptop */}
              <div className="relative w-full aspect-square sm:aspect-[3/3.6] overflow-hidden bg-zinc-900">
                <SmartMedia
                  src={ba.photo}
                  alt={ba.name}
                  fit="contain-ambient"
                  className="w-full h-full"
                  imgClassName="group-hover:scale-[1.04] transition duration-500 ease-out"
                  mutedLoop
                  showVideoBadge
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10" />

                <div className="absolute inset-x-0 bottom-0 z-20 p-2.5 sm:p-4">
                  <h3 className="font-display text-lg sm:text-2xl lg:text-3xl font-bold uppercase text-white leading-none tracking-tight truncate">
                    {ba.name}
                  </h3>
                </div>
              </div>

              {/* Below Photo: Team name + subtle profile cue */}
              <div className="px-2.5 py-2 sm:px-4 sm:py-3 border-t border-white/8 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="hidden sm:block text-[10px] uppercase tracking-wider text-zinc-500">
                    Team
                  </span>
                  <span className="block text-[11px] sm:text-sm font-medium text-zinc-300 truncate">
                    {ba.team || "Godlike Novus"}
                  </span>
                </div>

                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 group-hover:text-[#E11D2E] shrink-0 transition" />
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Instagram-Style Detail Modal on Click: Big Full Photo + Nickname, Team, Games Played, Socials */}
      {selectedBa && (
        <div
          role="dialog"
          aria-modal="true"
          data-lenis-prevent
          className="fixed inset-0 z-50 bg-black/88 backdrop-blur-sm p-2.5 sm:p-5 flex items-center justify-center"
          onClick={() => setSelectedBa(null)}
        >
          <div
            data-lenis-prevent
            className="relative w-full max-w-4xl max-h-[90vh] md:h-[82vh] rounded-lg overflow-hidden bg-[#0e0e11] border border-white/12 shadow-2xl flex flex-col md:grid md:grid-cols-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sticky Top Header */}
            <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#0e0e11] shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 truncate pr-2">
                {selectedBa.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedBa(null)}
                className="p-1 text-zinc-300 hover:text-white cursor-pointer shrink-0"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              data-lenis-prevent
              className="flex-1 overflow-y-auto overscroll-contain md:overflow-hidden md:col-span-12 md:grid md:grid-cols-12 md:h-full"
            >
              {/* Left / Top: Full Large Uncropped Photo or Video (Click photo directly to zoom 1:1) */}
              <div
                onClick={() => {
                  if (!isAnyVideoUrl(selectedBa.photo)) {
                    onInspectMedia({
                      url: selectedBa.photo,
                      title: selectedBa.name,
                      caption: `${selectedBa.nickname} — ${selectedBa.team}`,
                    });
                  }
                }}
                className={`md:col-span-6 bg-black flex items-center justify-center md:h-full overflow-hidden ${
                  isAnyVideoUrl(selectedBa.photo) ? "" : "cursor-zoom-in"
                }`}
              >
                {isAnyVideoUrl(selectedBa.photo) ? (
                  <SmartMedia
                    src={selectedBa.photo}
                    alt={selectedBa.name}
                    fit="contain"
                    className="w-full md:h-full aspect-video"
                    controls
                    mutedLoop={false}
                  />
                ) : (
                  <img
                    src={assetUrl(selectedBa.photo)}
                    alt={selectedBa.name}
                    className="w-full max-h-[58vh] md:max-h-none h-auto md:h-full md:w-full object-contain select-none"
                  />
                )}
              </div>

              {/* Right / Bottom: Full Profile Details */}
              <div
                data-lenis-prevent
                className="md:col-span-6 md:h-full md:overflow-y-auto overscroll-contain border-t md:border-t-0 md:border-l border-white/10 flex flex-col bg-[#0e0e11]"
              >
                <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0e0e11]/95 backdrop-blur-xs z-10">
                  <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                    Brand Ambassador
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedBa(null)}
                    className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                    aria-label="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                  <div>
                    <h3 className="font-display text-3xl sm:text-4xl font-bold uppercase text-white leading-none">
                      {selectedBa.name}
                    </h3>
                  </div>

                  <div className="divide-y divide-white/10 border-y border-white/10 text-xs sm:text-sm">
                    {selectedBa.nickname && (
                      <div className="py-2.5 flex items-baseline justify-between gap-4">
                        <span className="text-zinc-500">Nickname / IGN</span>
                        <span className="font-semibold text-white text-right">
                          {selectedBa.nickname}
                        </span>
                      </div>
                    )}
                    {selectedBa.team && (
                      <div className="py-2.5 flex items-baseline justify-between gap-4">
                        <span className="text-zinc-500">Team</span>
                        <span className="font-medium text-zinc-200 text-right">
                          {selectedBa.team}
                        </span>
                      </div>
                    )}
                    {selectedBa.games.length > 0 && (
                      <div className="py-2.5 flex items-baseline justify-between gap-4">
                        <span className="text-zinc-500 shrink-0">Main Game</span>
                        <span className="font-medium text-zinc-200 text-right">
                          {selectedBa.games.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedBa.bio && (
                    <LinkifiedText
                      text={selectedBa.bio}
                      className="text-xs sm:text-sm text-zinc-300 leading-relaxed"
                    />
                  )}

                  {selectedBa.socials.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                        Sosial Media
                      </span>
                      <div className="divide-y divide-white/10 border-t border-white/10">
                        {selectedBa.socials.map((soc) => (
                          <a
                            key={soc.id}
                            href={soc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-zinc-200 hover:text-[#E11D2E] transition group"
                          >
                            <span className="inline-flex items-center gap-2.5">
                              <SocialIcon
                                platform={soc.platform}
                                className="w-4 h-4 text-zinc-400 group-hover:text-[#E11D2E] transition"
                              />
                              <span className="capitalize text-zinc-400">
                                {soc.platform}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-medium">
                              {soc.label}
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ScrollSection>
  );
}
