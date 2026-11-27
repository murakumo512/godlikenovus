"use client";

import { SponsorItem } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";
import { trackAnalytics } from "@/lib/analytics-client";

export function SponsorRollingStrip({
  sponsors,
}: {
  sponsors: SponsorItem[];
}) {
  if (sponsors.length === 0) return null;

  const normalizeHref = (raw?: string) => {
    const val = (raw || "").trim();
    if (!val) return "";
    if (/^https?:\/\//i.test(val)) return val;
    return `https://${val}`;
  };

  return (
    <div className="godlike-sponsor-bg relative w-full overflow-hidden rounded-xl px-4 sm:px-8 md:px-12 py-8 sm:py-12">
      {/* Subtle flowing contour waves (Team Liquid-inspired in brighter Godlike crimson) */}
      <div
        className="godlike-sponsor-waves pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-wrap items-stretch justify-center gap-4 sm:gap-6 md:gap-8">
        {sponsors.map((sp) => {
          const href = normalizeHref(sp.website);
          return (
            <a
              key={sp.id}
              href={href || "#sponsors"}
              target={href ? "_blank" : undefined}
              rel={href ? "noopener noreferrer" : undefined}
              onClick={(e) => {
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
              className="group w-[calc(50%-0.5rem)] sm:w-[210px] md:w-[230px] rounded-xl border-2 border-transparent hover:border-[#ff5c72] bg-transparent hover:bg-black/15 hover:shadow-[0_0_26px_rgba(255,92,114,0.28)] px-4 py-5 sm:px-6 sm:py-7 flex flex-col items-center justify-center gap-3 transition-all duration-200"
            >
              <div className="w-full h-16 sm:h-20 flex items-center justify-center overflow-hidden">
                <img
                  src={assetUrl(sp.logo)}
                  alt={sp.name}
                  loading="lazy"
                  decoding="async"
                  className="max-h-full max-w-full w-auto object-contain group-hover:scale-105 transition duration-200"
                />
              </div>
              <div className="flex flex-col items-center gap-0.5 text-center">
                <span className="text-xs sm:text-sm font-semibold tracking-wide text-white/95 group-hover:text-white transition line-clamp-1">
                  {sp.name}
                </span>
                {sp.tier && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200/90">
                    {sp.tier}
                  </span>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
