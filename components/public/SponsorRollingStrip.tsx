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
    <div className="w-full py-4 sm:py-6">
      <div className="flex flex-wrap items-stretch justify-center gap-3.5 sm:gap-6">
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
              className="group w-[calc(50%-0.4375rem)] sm:w-[195px] md:w-[215px] rounded-md border border-white/10 bg-zinc-950/70 hover:border-[#E11D2E]/50 p-4 sm:p-5 flex flex-col items-center justify-center gap-3 transition"
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
              <span className="text-[11px] sm:text-xs font-medium tracking-wide text-zinc-300 group-hover:text-white transition text-center line-clamp-1">
                {sp.name}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
