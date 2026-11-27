"use client";

import { useEffect, useRef } from "react";
import { SponsorItem } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";
import { trackAnalytics } from "@/lib/analytics-client";

export function SponsorRollingStrip({
  sponsors,
}: {
  sponsors: SponsorItem[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const halfWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const didDragRef = useRef(false);

  // Repeat just enough times to fill wide screens seamlessly
  const unitCount = Math.max(2, Math.ceil(6 / Math.max(1, sponsors.length)));
  const halfItems = Array.from({ length: unitCount }, () => sponsors).flat();
  const loopItems = [...halfItems, ...halfItems];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || sponsors.length === 0) return;

    const measure = () => {
      halfWidthRef.current = track.scrollWidth / 2;
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(track);

    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(32, now - lastTime);
      lastTime = now;

      const half = halfWidthRef.current;
      if (!pausedRef.current && !draggingRef.current && half > 0) {
        offsetRef.current += (dt * 42) / 1000; // ~42px/sec smooth glide
        if (offsetRef.current >= half) {
          offsetRef.current -= half;
        }
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [sponsors.length]);

  if (sponsors.length === 0) return null;

  const normalizeHref = (raw?: string) => {
    const val = (raw || "").trim();
    if (!val) return "";
    if (/^https?:\/\//i.test(val)) return val;
    return `https://${val}`;
  };

  const applyDragOffset = (nextOffset: number) => {
    const track = trackRef.current;
    const half = halfWidthRef.current;
    if (!track || half <= 0) return;
    let wrapped = nextOffset % half;
    if (wrapped < 0) wrapped += half;
    offsetRef.current = wrapped;
    track.style.transform = `translate3d(${-wrapped}px, 0, 0)`;
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
        draggingRef.current = false;
      }}
      onPointerDown={(e) => {
        draggingRef.current = true;
        didDragRef.current = false;
        startXRef.current = e.clientX;
        startOffsetRef.current = offsetRef.current;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        const dx = e.clientX - startXRef.current;
        if (Math.abs(dx) > 6) didDragRef.current = true;
        applyDragOffset(startOffsetRef.current - dx);
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
      style={{ touchAction: "pan-y" }}
      className="relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing py-5 sm:py-6 border-y border-white/10"
    >
      <div
        ref={trackRef}
        style={{ willChange: "transform" }}
        className="flex items-center gap-10 sm:gap-16 w-max px-4"
      >
        {loopItems.map((sp, idx) => {
          const href = normalizeHref(sp.website);
          return (
            <a
              key={`${sp.id}-${idx}`}
              href={href || "#sponsors"}
              target={href ? "_blank" : undefined}
              rel={href ? "noopener noreferrer" : undefined}
              draggable={false}
              onClick={(e) => {
                if (didDragRef.current) {
                  e.preventDefault();
                  didDragRef.current = false;
                  return;
                }
                if (!href) {
                  e.preventDefault();
                }
                trackAnalytics({
                  type: "media",
                  mediaKey: `sponsor:${sp.id}`,
                  mediaLabel: sp.name,
                  mediaCategory: "Sponsor",
                  mediaUrl: sp.logo,
                });
              }}
              title={href ? `${sp.name} — Buka link` : sp.name}
              className="group shrink-0 flex flex-col items-center justify-center gap-2 opacity-85 hover:opacity-100 transition"
            >
              <img
                src={assetUrl(sp.logo)}
                alt={sp.name}
                draggable={false}
                decoding="async"
                className="h-11 sm:h-14 md:h-16 w-auto max-w-[150px] sm:max-w-[185px] object-contain group-hover:scale-105 transition duration-300"
              />
              <span className="text-[11px] sm:text-xs font-medium tracking-wide text-zinc-400 group-hover:text-white transition whitespace-nowrap">
                {sp.name}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
