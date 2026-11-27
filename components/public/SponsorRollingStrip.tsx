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
    <div className="w-full py-6 sm:py-8 border-y border-white/10">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 items-center justify-items-center">
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
              className="group w-full flex flex-col items-center justify-center gap-2.5 px-3 py-3 opacity-85 hover:opacity-100 transition"
            >
              <img
                src={assetUrl(sp.logo)}
                alt={sp.name}
                loading="lazy"
                decoding="async"
                className="h-12 sm:h-14 md:h-16 w-auto max-w-[160px] sm:max-w-[185px] object-contain group-hover:scale-105 transition duration-200"
              />
              <span className="text-[11px] sm:text-xs font-medium tracking-wide text-zinc-400 group-hover:text-white transition text-center">
                {sp.name}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
