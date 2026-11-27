"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { HeroHighlightSlide, SiteData } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";

export function HeroHighlightCarousel({
  data,
  onOpenScrim,
}: {
  data: SiteData;
  onOpenScrim: () => void;
}) {
  const slides = useMemo<HeroHighlightSlide[]>(() => {
    const custom = (data.heroHighlights || []).filter(
      (s) => s.enabled !== false && s.title.trim()
    );
    if (custom.length > 0) return custom;

    const auto: HeroHighlightSlide[] = [
      {
        id: "hl-main",
        badge: `${data.branding.teamName} · ${data.branding.estYear}`,
        title: data.branding.tagline || "RISE BEYOND LIMITS",
        subtitle:
          data.branding.heroSubtitle ||
          "Organisasi esports kompetitif dengan roster berprestasi, turnamen komunitas, dan merchandise resmi.",
        image:
          data.homeSections.heroBgImage ||
          data.branding.logoTagline ||
          data.branding.logoWhite,
        ctaText: data.branding.heroCtaPrimary || "Lihat Roster",
        ctaHref: data.homeSections.heroCtaPrimaryHref || "#roster",
      },
      {
        id: "hl-scrim",
        badge: data.homeSections.scrimBadge || "Tantang Tim Kami",
        title: `${data.homeSections.scrimTitleWhite || "SCRIM"} ${
          data.homeSections.scrimTitleAccent || "REQUEST"
        }`,
        subtitle:
          data.homeSections.scrimSubtitle ||
          "Siap uji strategi dan mekanik tim kamu melawan skuad Godlike Novus? Ajukan jadwal scrim sekarang.",
        image: data.homeSections.scrimImage || "/images/scrim-swords.svg",
        ctaText: data.homeSections.scrimButtonText || "Ajukan Scrim Request",
        ctaHref: "#scrim-modal",
      },
    ];

    const firstEvent = data.gallery.find((g) => g.enabled !== false);
    if (firstEvent) {
      auto.push({
        id: `hl-gal-${firstEvent.id}`,
        badge: firstEvent.category || "Event & Turnamen",
        title: firstEvent.title,
        subtitle: firstEvent.description,
        image: firstEvent.image,
        ctaText: "Lihat Gallery",
        ctaHref: "#gallery",
      });
    }

    const firstProduct = data.store.find((p) => p.enabled !== false);
    if (firstProduct) {
      auto.push({
        id: `hl-store-${firstProduct.id}`,
        badge: "Official Store",
        title: firstProduct.name,
        subtitle: firstProduct.description,
        image: firstProduct.image,
        ctaText: "Buka Store",
        ctaHref: "#store",
      });
    }

    return auto;
  }, [data]);

  const [index, setIndex] = useState(0);
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const safeIdx = index % Math.max(1, slides.length);
  const current = slides[safeIdx];

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const handleSwipeStart = (clientX: number, clientY: number) => {
    swipeStartXRef.current = clientX;
    swipeStartYRef.current = clientY;
  };

  const handleSwipeEnd = (clientX: number, clientY: number) => {
    if (swipeStartXRef.current === null || swipeStartYRef.current === null) return;
    const dx = clientX - swipeStartXRef.current;
    const dy = clientY - swipeStartYRef.current;
    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
    if (slides.length <= 1) return;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        setIndex((prev) => (prev + 1) % slides.length);
      } else {
        setIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
  };

  if (!current) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8">
      <div
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          handleSwipeStart(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => handleSwipeEnd(e.clientX, e.clientY)}
        onPointerCancel={() => {
          swipeStartXRef.current = null;
          swipeStartYRef.current = null;
        }}
        style={{ touchAction: "pan-y" }}
        className="godlike-card group relative overflow-hidden rounded-xl min-h-[340px] sm:min-h-[420px] md:min-h-[460px] flex items-end select-none cursor-grab active:cursor-grabbing"
      >
        {/* Background Media */}
        {current.image && (
          <div className="pointer-events-none absolute inset-0">
            <img
              src={assetUrl(current.image)}
              alt={current.title}
              className="w-full h-full object-cover object-center opacity-40 transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#09090d] via-[#09090d]/85 to-[#1a060b]/55" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090d] via-transparent to-transparent" />
          </div>
        )}

        {/* Watermark / Visual on Right */}
        {current.image && (
          <div className="pointer-events-none hidden md:flex absolute right-8 lg:right-14 top-1/2 -translate-y-1/2 w-56 h-56 lg:w-72 lg:h-72 items-center justify-center opacity-90">
            <img
              src={assetUrl(current.image)}
              alt=""
              className="max-w-full max-h-full object-contain drop-shadow-[0_12px_36px_rgba(225,29,46,0.28)]"
            />
          </div>
        )}

        {/* Content Bottom-Left */}
        <div className="relative z-10 w-full p-6 sm:p-10 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl space-y-3 sm:space-y-4">
            {current.badge && (
              <span className="block text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#E11D2E]">
                {current.badge}
              </span>
            )}
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold uppercase text-white leading-[0.95]">
              {current.title}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-zinc-300 leading-relaxed line-clamp-3">
              {current.subtitle}
            </p>
            {current.ctaText && (
              <div className="pt-1">
                {current.ctaHref === "#scrim-modal" ? (
                  <button
                    type="button"
                    onClick={onOpenScrim}
                    className="inline-flex items-center gap-2 rounded bg-white hover:bg-zinc-100 text-zinc-950 px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg transition cursor-pointer"
                  >
                    {current.ctaText}
                    <ArrowRight className="w-4 h-4 text-[#E11D2E]" />
                  </button>
                ) : (
                  <a
                    href={current.ctaHref || "#roster"}
                    className="inline-flex items-center gap-2 rounded bg-white hover:bg-zinc-100 text-zinc-950 px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg transition"
                  >
                    {current.ctaText}
                    <ArrowRight className="w-4 h-4 text-[#E11D2E]" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Slide Dots + Arrows (Team Liquid Style) */}
          {slides.length > 1 && (
            <div className="flex items-center gap-3 self-start md:self-end">
              <div className="flex items-center gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === safeIdx
                        ? "w-7 bg-[#E11D2E]"
                        : "w-2 bg-white/30 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  aria-label="Sebelumnya"
                  onClick={() =>
                    setIndex((prev) => (prev - 1 + slides.length) % slides.length)
                  }
                  className="p-1.5 rounded border border-white/15 bg-black/50 text-zinc-300 hover:text-white hover:border-[#E11D2E] transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Berikutnya"
                  onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
                  className="p-1.5 rounded border border-white/15 bg-black/50 text-zinc-300 hover:text-white hover:border-[#E11D2E] transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
