"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Images, Sparkles, Video, X } from "lucide-react";
import { ContentCreator, HomeSectionsConfig } from "@/lib/types";
import { collectVisibleMediaList } from "@/lib/media";
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

const PLATFORM_LABELS: Record<ContentCreator["platform"], string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  twitch: "Twitch",
  facebook: "Facebook",
  other: "Creator",
};

export function CreatorsSection({
  creators: rawCreators,
  homeSections,
  onInspectMedia,
}: {
  creators: ContentCreator[];
  homeSections: HomeSectionsConfig;
  onInspectMedia: (item: LightboxMediaItem) => void;
}) {
  const creators = rawCreators.filter((c) => c.enabled !== false);
  const [selectedCreator, setSelectedCreator] = useState<ContentCreator | null>(
    null
  );

  useLockBodyAndLenis(Boolean(selectedCreator));
  useHistoryBack(
    Boolean(selectedCreator),
    () => setSelectedCreator(null),
    "creator"
  );

  const normalizeHref = (raw?: string) => {
    const val = (raw || "").trim();
    if (!val) return "";
    if (/^https?:\/\//i.test(val)) return val;
    return `https://${val}`;
  };

  return (
    <ScrollSection id="creators" showDivider={true}>
      <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            {(homeSections.creatorsBadge || "Creator Network") && (
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#E11D2E] block mb-1.5">
                {homeSections.creatorsBadge || "Creator Network"}
              </span>
            )}
            <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-[0.94]">
              {homeSections.creatorsTitleWhite || "CONTENT CREATOR"}{" "}
              <span className="godlike-gradient-text">
                {homeSections.creatorsTitleAccent || "HUB"}
              </span>
            </h2>
          </div>
          {homeSections.creatorsSubtitle && (
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md sm:text-right leading-relaxed">
              {homeSections.creatorsSubtitle}
            </p>
          )}
        </div>

        {creators.length === 0 ? (
          <div className="godlike-card rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E11D2E]">
                <Sparkles className="w-3.5 h-3.5" />
                Open Creator Recruitment
              </div>
              <p className="text-sm text-zinc-300 max-w-xl leading-relaxed">
                Daftar kreator konten resmi akan tampil di sini. Tambahkan profil
                streamer &amp; kreator dari Admin tab Content Creator Hub, atau
                matikan seksi ini di Urutan Section.
              </p>
            </div>
            <a
              href="#contact"
              className="shrink-0 inline-flex items-center gap-2 bg-[#E11D2E] hover:bg-red-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition"
            >
              Kolaborasi Creator
            </a>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
            {creators.map((creator) => {
              const mediaList = collectVisibleMediaList(
                creator.hiddenImages,
                creator.photo,
                creator.images,
                creator.videoUrl
              );
              return (
                <article
                  key={creator.id}
                  onClick={() => {
                    setSelectedCreator(creator);
                    trackAnalytics({
                      type: "media",
                      mediaKey: `creator:${creator.id}`,
                      mediaLabel: creator.name,
                      mediaCategory: "Creator",
                      mediaUrl: creator.photo,
                    });
                  }}
                  className="godlike-card group w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.125rem)] cursor-pointer overflow-hidden rounded-md flex flex-col"
                >
                  <div className="relative aspect-[4/4.4] bg-zinc-900 overflow-hidden">
                    <SmartMedia
                      src={creator.photo}
                      alt={creator.name}
                      fit="contain-ambient"
                      className="w-full h-full"
                      imgClassName="group-hover:scale-105 transition duration-500"
                      showVideoBadge
                    />
                    <span className="absolute top-2 left-2 z-10 rounded bg-black/80 border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      {PLATFORM_LABELS[creator.platform] || "Creator"}
                    </span>
                    {mediaList.length > 1 && (
                      <span className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/75 border border-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Images className="w-3 h-3" />
                        {mediaList.length}
                      </span>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 border-t border-white/8 flex-1 flex flex-col justify-between gap-2">
                    <div>
                      <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#E11D2E] leading-snug break-words">
                        {creator.role || PLATFORM_LABELS[creator.platform]}
                      </span>
                      <h3 className="font-display text-base sm:text-xl font-bold uppercase text-white group-hover:text-[#E11D2E] transition leading-snug break-words mt-0.5">
                        {creator.name}
                      </h3>
                      {creator.handle && (
                        <p className="text-xs text-zinc-400 break-words mt-0.5">
                          {creator.handle}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/8 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                      <span>{creator.followers || "Official Creator"}</span>
                      <span className="text-zinc-200 font-medium group-hover:text-[#E11D2E] transition">
                        Profil →
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Focused Instagram-Style Creator Profile Modal */}
        <AnimatePresence>
          {selectedCreator && (
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
                onClick={() => setSelectedCreator(null)}
              >
                <motion.div
                  data-lenis-prevent
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-4xl max-h-[82dvh] sm:max-h-[90dvh] md:h-[82dvh] rounded-lg overflow-hidden bg-[#0e0e11] border border-white/12 shadow-2xl flex flex-col md:grid md:grid-cols-12"
                >
                  <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#0e0e11] shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 pr-2">
                      {selectedCreator.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCreator(null)}
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
                        selectedCreator.hiddenImages,
                        selectedCreator.photo,
                        selectedCreator.images,
                        selectedCreator.videoUrl
                      )}
                      alt={selectedCreator.name}
                      fit="contain"
                      className="md:col-span-6 shrink-0 md:h-full"
                      stageClassName="aspect-[4/3] md:aspect-auto md:h-full md:min-h-[240px]"
                      onInspect={(url, idx) =>
                        onInspectMedia({
                          url,
                          items: collectVisibleMediaList(
                            selectedCreator.hiddenImages,
                            selectedCreator.photo,
                            selectedCreator.images,
                            selectedCreator.videoUrl
                          ),
                          initialIndex: idx,
                          title: selectedCreator.name,
                          caption: selectedCreator.bio || selectedCreator.handle,
                        })
                      }
                    />

                    <div
                      data-lenis-prevent
                      className="md:col-span-6 min-h-0 md:h-full md:overflow-y-auto overscroll-contain border-t md:border-t-0 md:border-l border-white/10 flex flex-col bg-[#0e0e11]"
                    >
                      <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0e0e11]/95 z-10">
                        <span className="text-xs font-medium uppercase tracking-widest text-[#E11D2E]">
                          {PLATFORM_LABELS[selectedCreator.platform]} Creator
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedCreator(null)}
                          className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                          aria-label="Tutup"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-4 pb-10 sm:p-6 space-y-4">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#E11D2E] block">
                            {selectedCreator.role ||
                              PLATFORM_LABELS[selectedCreator.platform]}
                          </span>
                          <h3 className="font-display text-3xl sm:text-4xl font-bold uppercase text-white leading-tight mt-0.5">
                            {selectedCreator.name}
                          </h3>
                          {selectedCreator.handle && (
                            <p className="text-sm text-zinc-400 mt-0.5">
                              {selectedCreator.handle}
                              {selectedCreator.followers
                                ? ` · ${selectedCreator.followers}`
                                : ""}
                            </p>
                          )}
                        </div>

                        {selectedCreator.bio && (
                          <LinkifiedText
                            text={selectedCreator.bio}
                            className="text-sm text-zinc-200 leading-relaxed"
                          />
                        )}

                        {selectedCreator.channelUrl && (
                          <div className="pt-2">
                            <a
                              href={normalizeHref(selectedCreator.channelUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-[#E11D2E] hover:bg-red-600 px-5 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white transition"
                            >
                              <Video className="w-4 h-4" />
                              Kunjungi Channel{" "}
                              {PLATFORM_LABELS[selectedCreator.platform]}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
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
      </div>
    </ScrollSection>
  );
}
