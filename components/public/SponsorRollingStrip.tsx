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
      <div className="flex flex-wrap items-stretch justify-center gap-4 sm:gap-6">
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
              className="godlike-card group w-[calc(50%-0.5rem)] sm:w-[210px] md:w-[230px] rounded-lg p-5 sm:p-6 flex flex-col items-center justify-center gap-3.5"
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
                <span className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-100 group-hover:text-white transition line-clamp-1">
                  {sp.name}
                </span>
                {sp.tier && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E11D2E]">
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
