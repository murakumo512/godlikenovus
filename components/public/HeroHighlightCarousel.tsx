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
    const rawCustom = data.heroHighlights || [];
    if (rawCustom.length > 0) {
      return rawCustom.filter((s) => s.enabled !== false && s.title.trim());
    }

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
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const axisLockRef = useRef<"x" | "y" | null>(null);
  const didDragRef = useRef(false);

  const safeIdx = slides.length > 0 ? index % slides.length : 0;

  useEffect(() => {
    if (slides.length <= 1 || isDragging) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [slides.length, isDragging]);

  const finishDrag = (dx: number) => {
    const width = containerRef.current?.clientWidth || 600;
    const threshold = Math.min(90, Math.max(45, width * 0.14));

    if (slides.length > 1 && Math.abs(dx) > threshold) {
      if (dx < 0) {
        setIndex((prev) => (prev + 1) % slides.length);
      } else {
        setIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
    setIsDragging(false);
    setDragOffsetPx(0);
    pointerIdRef.current = null;
    axisLockRef.current = null;
  };

  if (slides.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8">
      <div
        ref={containerRef}
        onPointerDown={(e) => {
          if (slides.length <= 1) return;
          if (e.pointerType === "mouse" && e.button !== 0) return;
          const target = e.target as HTMLElement | null;
          if (target?.closest("a, button, [data-carousel-control]")) return;
          pointerIdRef.current = e.pointerId;
          startXRef.current = e.clientX;
          startYRef.current = e.clientY;
          axisLockRef.current = null;
          didDragRef.current = false;
          setDragOffsetPx(0);
        }}
        onPointerMove={(e) => {
          if (pointerIdRef.current !== e.pointerId) return;
          const dx = e.clientX - startXRef.current;
          const dy = e.clientY - startYRef.current;

          if (!axisLockRef.current) {
            if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
              axisLockRef.current = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
              if (axisLockRef.current === "x") {
                setIsDragging(true);
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              }
            }
          }

          if (axisLockRef.current === "y") {
            setIsDragging(false);
            setDragOffsetPx(0);
            pointerIdRef.current = null;
            return;
          }

          if (axisLockRef.current === "x") {
            if (Math.abs(dx) > 8) didDragRef.current = true;
            setDragOffsetPx(dx);
          }
        }}
        onPointerUp={(e) => {
          if (pointerIdRef.current !== e.pointerId) return;
          const dx = e.clientX - startXRef.current;
          try {
            (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
          } catch {
            // ignore if not captured
          }
          finishDrag(axisLockRef.current === "x" ? dx : 0);
        }}
        onPointerCancel={() => {
          finishDrag(0);
        }}
        onClickCapture={(e) => {
          if (didDragRef.current) {
            e.preventDefault();
            e.stopPropagation();
            didDragRef.current = false;
          }
        }}
        style={{ touchAction: slides.length > 1 ? "pan-y pinch-zoom" : undefined }}
        className={`godlike-highlight-bg relative overflow-hidden rounded-xl select-none ${
          slides.length > 1 ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {/* Distinct geometric diagonal esports pattern overlay */}
        <div
          className="godlike-highlight-pattern pointer-events-none absolute inset-0 z-0"
          aria-hidden="true"
        />

        {/* Sliding Horizontal Track (1:1 real-time drag follow) */}
        <div
          className="relative z-10 flex w-full"
          style={{
            transform: `translate3d(calc(-${safeIdx * 100}% + ${dragOffsetPx}px), 0, 0)`,
            transition: isDragging
              ? "none"
              : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "transform",
          }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="relative w-full shrink-0 min-h-[340px] sm:min-h-[420px] md:min-h-[460px] flex items-end overflow-hidden"
            >
              {/* Subtle Background Image Blended Over Crimson Motif */}
              {slide.image && (
                <div className="pointer-events-none absolute inset-0">
                  <img
                    src={assetUrl(slide.image)}
                    alt={slide.title}
                    draggable={false}
                    className="w-full h-full object-cover object-center opacity-22 mix-blend-luminosity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#24040a]/90 via-[#4a0815]/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1f0308]/85 via-transparent to-transparent" />
                </div>
              )}

              {/* Featured Visual on Right */}
              {slide.image && (
                <div className="pointer-events-none hidden md:flex absolute right-8 lg:right-14 top-1/2 -translate-y-1/2 w-56 h-56 lg:w-72 lg:h-72 items-center justify-center opacity-90">
                  <img
                    src={assetUrl(slide.image)}
                    alt=""
                    draggable={false}
                    className="max-w-full max-h-full object-contain drop-shadow-[0_12px_36px_rgba(225,29,46,0.28)]"
                  />
                </div>
              )}

              {/* Content Bottom-Left */}
              <div className="relative z-10 w-full p-6 sm:p-10 md:p-12 pb-16 sm:pb-12">
                <div className="max-w-xl space-y-3 sm:space-y-4">
                  {slide.badge && (
                    <span className="block text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">
                      {slide.badge}
                    </span>
                  )}
                  <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold uppercase text-white leading-[0.95]">
                    {slide.title}
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-zinc-300 leading-relaxed line-clamp-3">
                    {slide.subtitle}
                  </p>
                  {slide.ctaText && (
                    <div className="pt-1">
                      {slide.ctaHref === "#scrim-modal" ? (
                        <button
                          type="button"
                          onClick={onOpenScrim}
                          className="inline-flex items-center gap-2 rounded bg-white hover:bg-zinc-100 text-zinc-950 px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg transition cursor-pointer"
                        >
                          {slide.ctaText}
                          <ArrowRight className="w-4 h-4 text-[#E11D2E]" />
                        </button>
                      ) : (
                        <a
                          href={slide.ctaHref || "#roster"}
                          draggable={false}
                          className="inline-flex items-center gap-2 rounded bg-white hover:bg-zinc-100 text-zinc-950 px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg transition"
                        >
                          {slide.ctaText}
                          <ArrowRight className="w-4 h-4 text-[#E11D2E]" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed Overlay Slide Dots + Arrows */}
        {slides.length > 1 && (
          <div
            data-carousel-control="true"
            className="absolute bottom-5 right-6 sm:bottom-8 sm:right-10 z-20 flex items-center gap-3"
          >
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
            <div className="flex items-center gap-1 ml-1">
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
  );
}
