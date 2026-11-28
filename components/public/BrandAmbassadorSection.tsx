"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Images, X } from "lucide-react";
import { BrandAmbassador, HomeSectionsConfig } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";
import { collectVisibleMediaList, isAnyVideoUrl } from "@/lib/media";
import { trackAnalytics } from "@/lib/analytics-client";
import { useHistoryBack } from "@/lib/use-history-back";
import { ScrollSection, useLockBodyAndLenis } from "./SmoothScroll";
import {
  LightboxMediaItem,
  LinkifiedText,
  MediaCarousel,
  ModalPortal,
  SmartMedia,
} from "./MediaDisplay";
import { SocialIcon } from "./SocialIcon";

/**
 * Default Godlike Accent (Gambar 2 style):
 * Chamfered glowing crimson frame with top logo tab, stacked WELCOME / TO GODLIKE headline,
 * and bottom glowing AMBASSADOR badge.
 */
function DefaultGodlikeAccent({
  ba,
  logo,
}: {
  ba: BrandAmbassador;
  logo?: string;
}) {
  const headline = ba.accentHeadline?.trim() || "WELCOME";
  const subline = ba.accentSubline?.trim() || "TO GODLIKE";
  const label = ba.accentLabel?.trim() || "AMBASSADOR";
  const accentLogo = ba.accentLogo || logo;

  return (
    <div className="relative w-full h-full flex flex-col justify-between py-[8%] pr-[7%] pl-[4%] select-none">
      {/* Chamfered Glowing HUD Frame SVG (Inspired directly by Gambar 2) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 260 190"
        fill="none"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-y-[7%] right-[6%] left-[2%] w-[92%] h-[86%] overflow-visible"
        style={{
          filter: "drop-shadow(0 0 8px rgba(225,29,46,0.75))",
        }}
      >
        {/* Top Logo Tab Box */}
        <path
          d="M 148 2 H 248 L 258 12 V 40 H 140 V 10 Z"
          fill="rgba(225,29,46,0.14)"
          stroke="#E11D2E"
          strokeWidth="1.8"
          vectorEffect="non-scaling-stroke"
        />
        {/* Outer Connecting Bracket */}
        <path
          d="M 258 40 V 144 H 20 L 8 156 V 178 L 18 188 H 246 L 258 176 V 144"
          fill="rgba(225,29,46,0.12)"
          stroke="#E11D2E"
          strokeWidth="1.8"
          vectorEffect="non-scaling-stroke"
        />
        {/* Right Spine Line */}
        <path
          d="M 250 40 V 144"
          stroke="#E11D2E"
          strokeWidth="2.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Top Right Logo inside Chamfered Tab */}
      <div className="relative z-10 flex justify-end pr-[3%] pt-[1%]">
        {accentLogo && (
          <img
            src={assetUrl(accentLogo)}
            alt="Godlike"
            className="h-[6.2cqw] max-h-9 w-auto object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]"
          />
        )}
      </div>

      {/* Center Bold Stacked Display Text */}
      <div className="relative z-10 my-auto pl-[4%] pr-[5%] text-left">
        <div className="font-display font-extrabold uppercase leading-[0.88] tracking-wide text-[#E11D2E] text-[6.8cqw] drop-shadow-[0_2px_12px_rgba(225,29,46,0.45)]">
          {headline}
        </div>
        <div className="font-display font-extrabold uppercase leading-[0.9] tracking-wide text-white text-[6.6cqw] mt-[0.6cqw]">
          {subline}
        </div>
      </div>

      {/* Bottom Glowing Ambassador Tag */}
      <div className="relative z-10 pl-[5%] pb-[1.5%]">
        <span className="font-display font-bold uppercase tracking-[0.18em] text-white text-[3.1cqw]">
          {label}
        </span>
      </div>
    </div>
  );
}

function AmbassadorLandscapeCard({
  ba,
  logo,
}: {
  ba: BrandAmbassador;
  logo?: string;
}) {
  // Mode C: 100% Custom Full Landscape Banner uploaded by Admin
  if (ba.bannerImage) {
    return (
      <SmartMedia
        src={ba.bannerImage}
        alt={ba.name}
        fit="contain-ambient"
        className="absolute inset-0 w-full h-full"
        imgClassName="group-hover:scale-[1.02] transition duration-700"
        mutedLoop
      />
    );
  }

  // Mode A & B: Left = Person Photo, Right = Default Godlike Accent OR Custom Uploaded Accent Image
  return (
    <div className="absolute inset-0 bg-[#050507] overflow-hidden">
      {/* Unified Bottom Crimson Studio Floor Glow (Gambar 2 signature glow) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-[#E11D2E]/85 via-[#E11D2E]/25 to-transparent z-[1]" />

      {/* Subtle ambient crimson aura behind the person */}
      <div
        className="pointer-events-none absolute -left-[6%] top-[10%] w-[52%] h-[80%] rounded-full blur-2xl opacity-25 z-[1]"
        style={{
          background:
            "radial-gradient(circle, rgba(225,29,46,0.65) 0%, transparent 70%)",
        }}
      />

      {/* LEFT SIDE: Person Photo / Cutout */}
      <div className="absolute inset-y-0 left-0 w-[50%] z-[10] flex items-end justify-center overflow-hidden">
        {isAnyVideoUrl(ba.photo) ? (
          <SmartMedia
            src={ba.photo}
            alt={ba.name}
            fit="cover"
            className="w-full h-full"
            mutedLoop
          />
        ) : (
          <img
            src={assetUrl(ba.photo)}
            alt={ba.name}
            className="h-[95%] w-full object-contain object-bottom group-hover:scale-[1.04] transition duration-700 ease-out drop-shadow-[0_8px_24px_rgba(0,0,0,0.75)]"
          />
        )}
      </div>

      {/* RIGHT SIDE: Custom Uploaded Accent Image OR Default Godlike Accent */}
      <div className="absolute inset-y-0 right-0 w-[54%] z-[15] flex items-center justify-center">
        {ba.accentImage ? (
          <img
            src={assetUrl(ba.accentImage)}
            alt=""
            className="w-full h-full object-contain p-[4%]"
          />
        ) : (
          <DefaultGodlikeAccent ba={ba} logo={logo} />
        )}
      </div>
    </div>
  );
}

export function BrandAmbassadorSection({
  ambassadors: rawAmbassadors,
  homeSections,
  fallbackLogo,
  onInspectMedia,
}: {
  ambassadors: BrandAmbassador[];
  homeSections: HomeSectionsConfig;
  fallbackLogo?: string;
  onInspectMedia: (item: LightboxMediaItem) => void;
}) {
  const ambassadors = (rawAmbassadors || []).filter(
    (ba) => ba.enabled !== false
  );
  const [selectedBa, setSelectedBa] = useState<BrandAmbassador | null>(null);

  useLockBodyAndLenis(Boolean(selectedBa));
  useHistoryBack(Boolean(selectedBa), () => setSelectedBa(null), "ba");

  if (ambassadors.length === 0) return null;

  const isSingle = ambassadors.length === 1;

  return (
    <ScrollSection
      id="ambassadors"
      showDivider={true}
      className="py-10 sm:py-16 md:py-20 px-3.5 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-5 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
          <div>
            {homeSections.baBadge && (
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#E11D2E] block mb-1 sm:mb-2">
                {homeSections.baBadge}
              </span>
            )}
            <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-[0.94]">
              {homeSections.baTitleWhite || "BRAND"}{" "}
              <span className="godlike-gradient-text">
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

        {/* Landscape 16:9 Banner Cards (Left Person + Right Godlike Accent / Custom Upload) */}
        <div
          className={
            isSingle
              ? "max-w-3xl mx-auto"
              : "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
          }
        >
          {ambassadors.map((ba) => {
            const baMediaCount = collectVisibleMediaList(
              ba.hiddenImages,
              ba.bannerImage,
              ba.photo,
              ba.images
            ).length;
            return (
            <article
              key={ba.id}
              onClick={() => {
                setSelectedBa(ba);
                trackAnalytics({
                  type: "media",
                  mediaKey: `ba:${ba.id}`,
                  mediaLabel: `${ba.name} (BA)`,
                  mediaCategory: "Brand Ambassador",
                  mediaUrl: ba.bannerImage || ba.photo,
                });
              }}
              className="group cursor-pointer"
            >
              <div className="@container relative w-full aspect-[16/9] overflow-hidden rounded-lg border border-white/12 bg-[#050507] group-hover:border-[#E11D2E]/70 transition shadow-lg">
                <AmbassadorLandscapeCard ba={ba} logo={fallbackLogo} />
                {baMediaCount > 1 && (
                  <span className="absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1 rounded-full bg-black/75 border border-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Images className="w-3 h-3" />
                    {baMediaCount}
                  </span>
                )}
              </div>

              <div className="pt-2.5 sm:pt-3 flex items-center justify-between gap-3 px-0.5">
                <div className="min-w-0">
                  <h3 className="font-display text-xl sm:text-2xl font-bold uppercase text-white leading-none truncate group-hover:text-[#E11D2E] transition">
                    {ba.name}
                  </h3>
                  <span className="block text-xs text-zinc-400 truncate mt-1">
                    {ba.team || "Godlike Novus"}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-[#E11D2E] transition shrink-0">
                  Lihat Profil
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
            );
          })}
        </div>
      </div>

      {/* Detail Modal on Click: Nickname, Team, Games Played, Social Media */}
      <AnimatePresence>
      {selectedBa && (
        <ModalPortal>
        <motion.div
          role="dialog"
          aria-modal="true"
          data-lenis-prevent
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 h-[100dvh] z-[80] bg-black/90 p-2.5 sm:p-5 pb-6 sm:pb-5 flex items-center justify-center"
          onClick={() => setSelectedBa(null)}
        >
          <motion.div
            data-lenis-prevent
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl max-h-[82dvh] sm:max-h-[90dvh] md:h-[82dvh] rounded-lg overflow-hidden bg-[#0e0e11] border border-white/12 shadow-2xl flex flex-col md:grid md:grid-cols-12"
            onClick={(e) => e.stopPropagation()}
          >
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
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain md:overflow-hidden md:col-span-12 md:grid md:grid-cols-12 md:h-full"
            >
              <MediaCarousel
                items={collectVisibleMediaList(
                  selectedBa.hiddenImages,
                  selectedBa.bannerImage,
                  selectedBa.photo,
                  selectedBa.images
                )}
                alt={selectedBa.name}
                fit="contain"
                className="md:col-span-6 min-h-0 md:h-full shrink-0"
                stageClassName="h-[34dvh] sm:h-[40dvh] md:h-auto md:min-h-[240px]"
                onInspect={(url, idx) =>
                  onInspectMedia({
                    url,
                    items: collectVisibleMediaList(
                      selectedBa.hiddenImages,
                      selectedBa.bannerImage,
                      selectedBa.photo,
                      selectedBa.images
                    ),
                    initialIndex: idx,
                    title: selectedBa.name,
                    caption: `${selectedBa.nickname} — ${selectedBa.team}`,
                  })
                }
              />

              <div
                data-lenis-prevent
                className="md:col-span-6 min-h-0 md:h-full md:overflow-y-auto overscroll-contain border-t md:border-t-0 md:border-l border-white/10 flex flex-col bg-[#0e0e11]"
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

                <div className="p-4 pb-10 sm:p-6 space-y-5">
                  <h3 className="font-display text-3xl sm:text-4xl font-bold uppercase text-white leading-none">
                    {selectedBa.name}
                  </h3>

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
          </motion.div>
        </motion.div>
        </ModalPortal>
      )}
      </AnimatePresence>
    </ScrollSection>
  );
}
