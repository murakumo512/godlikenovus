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

  const isSingle = ambassadors.length === 1;

  return (
    <ScrollSection
      id="ambassadors"
      showDivider={true}
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Clean Editorial Header */}
        <div className="mb-10 md:mb-14 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            {homeSections.baBadge && (
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E11D2E] block mb-2">
                {homeSections.baBadge}
              </span>
            )}
            <h2 className="font-display text-4xl sm:text-6xl font-bold uppercase text-white leading-[0.94]">
              {homeSections.baTitleWhite || "BRAND"}{" "}
              <span className="text-[#E11D2E]">
                {homeSections.baTitleAccent || "AMBASSADOR"}
              </span>
            </h2>
          </div>
          {homeSections.baSubtitle && (
            <p className="text-zinc-400 text-sm sm:text-base max-w-md leading-relaxed">
              {homeSections.baSubtitle}
            </p>
          )}
        </div>

        {/* Editorial Portrait Showcase: Big Photo + Bold Name, then Team below on scroll */}
        <div
          className={
            isSingle
              ? "max-w-3xl mx-auto"
              : "grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14"
          }
        >
          {ambassadors.map((ba) => (
            <article
              key={ba.id}
              onClick={() => setSelectedBa(ba)}
              className="group cursor-pointer"
            >
              {/* Large Prominent Portrait (Fotonya Terpampang Gede) */}
              <div className="relative w-full aspect-[3/3.9] sm:aspect-[3/3.8] overflow-hidden bg-zinc-900/60">
                <SmartMedia
                  src={ba.photo}
                  alt={ba.name}
                  fit="contain-ambient"
                  className="w-full h-full"
                  imgClassName="group-hover:scale-[1.03] transition duration-700 ease-out"
                  mutedLoop
                  showVideoBadge
                />

                {/* Subtle bottom vignette so overlaid name reads naturally */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/55 to-transparent z-10" />

                {/* Big Editorial Name at the bottom of the portrait */}
                <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-8">
                  <h3 className="font-display text-4xl sm:text-6xl font-bold uppercase text-white leading-[0.92] tracking-tight group-hover:text-zinc-100 transition">
                    {ba.name}
                  </h3>
                </div>
              </div>

              {/* Below the portrait as user scrolls down: Team & subtle click cue */}
              <div className="pt-4 pb-2 border-b border-white/12 flex items-center justify-between gap-4">
                <div>
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    Team
                  </span>
                  <span className="text-sm sm:text-base font-medium text-zinc-200">
                    {ba.team || "Godlike Novus"}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-zinc-400 group-hover:text-[#E11D2E] transition">
                  Lihat Profil
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Brand Ambassador Detail Modal (Nickname, Team, Games Played, Social Media) */}
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
            className="relative w-full max-w-4xl max-h-[90vh] md:h-[82vh] overflow-hidden bg-[#0e0e11] border border-white/10 shadow-2xl flex flex-col md:grid md:grid-cols-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Top Header */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0e0e11] shrink-0">
              <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                Brand Ambassador
              </span>
              <button
                type="button"
                onClick={() => setSelectedBa(null)}
                className="p-1 text-zinc-300 hover:text-white cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              data-lenis-prevent
              className="flex-1 overflow-y-auto overscroll-contain md:overflow-hidden md:col-span-12 md:grid md:grid-cols-12 md:h-full"
            >
              {/* Left / Top: Full Uncropped Photo or Video (Click like IG to view full original) */}
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
                    className="w-full h-auto md:h-full md:w-full object-contain select-none"
                  />
                )}
              </div>

              {/* Right / Bottom: Profile Info (Nickname, Team, Games, Socials) */}
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

                <div className="p-5 sm:p-7 space-y-6">
                  <div>
                    <h3 className="font-display text-4xl sm:text-5xl font-bold uppercase text-white leading-none">
                      {selectedBa.name}
                    </h3>
                  </div>

                  {/* Natural Editorial Spec Rows */}
                  <div className="divide-y divide-white/10 border-y border-white/10 text-sm">
                    {selectedBa.nickname && (
                      <div className="py-3 flex items-baseline justify-between gap-4">
                        <span className="text-zinc-500">Nickname / IGN</span>
                        <span className="font-semibold text-white text-right">
                          {selectedBa.nickname}
                        </span>
                      </div>
                    )}
                    {selectedBa.team && (
                      <div className="py-3 flex items-baseline justify-between gap-4">
                        <span className="text-zinc-500">Team</span>
                        <span className="font-medium text-zinc-200 text-right">
                          {selectedBa.team}
                        </span>
                      </div>
                    )}
                    {selectedBa.games.length > 0 && (
                      <div className="py-3 flex items-baseline justify-between gap-4">
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
                      className="text-sm text-zinc-300 leading-relaxed"
                    />
                  )}

                  {/* Social Media Links */}
                  {selectedBa.socials.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="block text-xs font-medium uppercase tracking-widest text-zinc-500">
                        Sosial Media
                      </span>
                      <div className="divide-y divide-white/10 border-t border-white/10">
                        {selectedBa.socials.map((soc) => (
                          <a
                            key={soc.id}
                            href={soc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2.5 flex items-center justify-between gap-3 text-sm text-zinc-200 hover:text-[#E11D2E] transition group"
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
