"use client";

import { useRef, useState } from "react";
import { SponsorItem } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";
import { trackAnalytics } from "@/lib/analytics-client";

export function SponsorRollingStrip({
  sponsors,
}: {
  sponsors: SponsorItem[];
}) {
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const baseDragRef = useRef(0);
  const didDragRef = useRef(false);

  if (sponsors.length === 0) return null;

  // Repeat just enough times so -50% loop is seamless on desktop & mobile
  const unitCount = Math.max(2, Math.ceil(6 / Math.max(1, sponsors.length)));
  const halfItems = Array.from({ length: unitCount }, () => sponsors).flat();
  const loopItems = [...halfItems, ...halfItems];

  const normalizeHref = (raw?: string) => {
    const val = (raw || "").trim();
    if (!val) return "";
    if (/^https?:\/\//i.test(val)) return val;
    return `https://${val}`;
  };

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        draggingRef.current = false;
      }}
      onPointerDown={(e) => {
        draggingRef.current = true;
        didDragRef.current = false;
        setPaused(true);
        startXRef.current = e.clientX;
        baseDragRef.current = dragX;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        const dx = e.clientX - startXRef.current;
        if (Math.abs(dx) > 6) didDragRef.current = true;
        // Clamp drag offset cleanly
        const next = Math.max(-320, Math.min(320, baseDragRef.current + dx));
        setDragX(next);
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        setPaused(false);
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
        setPaused(false);
      }}
      style={{ touchAction: "pan-y" }}
      className="relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing py-5 sm:py-6 border-y border-white/10"
    >
      <div
        style={{
          transform: dragX !== 0 ? `translate3d(${dragX}px, 0, 0)` : undefined,
          transition: draggingRef.current ? "none" : "transform 0.35s ease-out",
        }}
      >
        <div
          className="animate-sponsor-marquee items-center gap-10 sm:gap-16 px-4"
          style={{
            animationPlayState: paused ? "paused" : "running",
          }}
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
    </div>
  );
}
