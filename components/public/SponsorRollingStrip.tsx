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
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);
  const didDragRef = useRef(false);

  // Repeat items enough times so seamless infinite rolling works even with 1-4 sponsors
  const unitCount = Math.max(4, Math.ceil(10 / Math.max(1, sponsors.length)));
  const halfItems = Array.from({ length: unitCount }, () => sponsors).flat();
  const loopItems = [...halfItems, ...halfItems];

  useEffect(() => {
    const el = trackRef.current;
    if (!el || sponsors.length === 0) return;

    let rafId = 0;
    const step = () => {
      if (!pausedRef.current && !draggingRef.current && el.scrollWidth > el.clientWidth) {
        el.scrollLeft += 0.65;
        const halfWidth = el.scrollWidth / 2;
        if (el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
        }
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [sponsors.length]);

  if (sponsors.length === 0) return null;

  const normalizeHref = (raw?: string) => {
    const val = (raw || "").trim();
    if (!val) return "";
    if (/^https?:\/\//i.test(val)) return val;
    return `https://${val}`;
  };

  return (
    <div
      ref={trackRef}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
        draggingRef.current = false;
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") return;
        const el = trackRef.current;
        if (!el) return;
        draggingRef.current = true;
        didDragRef.current = false;
        startXRef.current = e.clientX;
        startScrollRef.current = el.scrollLeft;
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current || e.pointerType !== "mouse") return;
        const el = trackRef.current;
        if (!el) return;
        const dx = e.clientX - startXRef.current;
        if (Math.abs(dx) > 6) didDragRef.current = true;
        el.scrollLeft = startScrollRef.current - dx;
        const halfWidth = el.scrollWidth / 2;
        if (el.scrollLeft >= halfWidth) el.scrollLeft -= halfWidth;
        else if (el.scrollLeft < 0) el.scrollLeft += halfWidth;
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onTouchStart={() => {
        pausedRef.current = true;
      }}
      onTouchEnd={() => {
        pausedRef.current = false;
      }}
      className="relative w-full overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing py-5 sm:py-6 border-y border-white/10"
    >
      <div className="flex items-center gap-10 sm:gap-16 w-max px-4">
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
