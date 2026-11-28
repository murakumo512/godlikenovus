"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Users } from "lucide-react";
import { SiteData } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";
import {
  LightboxMediaItem,
  MediaLightbox,
  SmartMedia,
} from "./MediaDisplay";
import { SmoothScrollProvider } from "./SmoothScroll";

export function ManagementPageClient({ data }: { data: SiteData }) {
  const [lightboxItem, setLightboxItem] = useState<LightboxMediaItem | null>(
    null
  );

  const siteTheme = data.branding.siteTheme || "dark-crimson";
  const navbarLogo = data.branding.navbarLogo || data.branding.logoWhite;
  const activeDivisions = (data.management || []).filter(
    (d) => d.enabled !== false
  );

  const normalizeHref = (raw?: string) => {
    const val = (raw || "").trim();
    if (!val) return "";
    if (/^https?:\/\//i.test(val)) return val;
    return `https://${val}`;
  };

  return (
    <SmoothScrollProvider>
      <div
        data-site-theme={siteTheme}
        className="min-h-screen bg-[#0a0a0c] text-zinc-100"
      >
        {/* Top Sticky Bar */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0c]/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
            <Link
              href="/#management"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-200 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4 text-[#E11D2E]" />
              Kembali ke Home
            </Link>

            <Link href="/" className="flex items-center gap-2.5">
              <img
                src={assetUrl(navbarLogo)}
                alt={data.branding.teamName}
                className="h-8 w-auto object-contain"
              />
              <span className="font-display text-base sm:text-lg font-bold uppercase tracking-wide text-white hidden sm:inline">
                {data.branding.teamName}
              </span>
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
          {/* Page Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E11D2E] block">
              {data.homeSections.managementBadge || "Struktur Organisasi"}
            </span>
            <h1 className="font-display text-4xl sm:text-6xl font-bold uppercase text-white leading-[0.94]">
              {data.homeSections.managementTitleWhite || "OUR"}{" "}
              <span className="godlike-gradient-text">
                {data.homeSections.managementTitleAccent || "MANAGEMENT"}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              {data.homeSections.managementSubtitle ||
                "Tim manajemen di balik operasional, divisi kompetitif, media, komunitas, dan kemitraan Godlike Novus."}
            </p>
          </div>

          {/* Dynamic Divisions List */}
          {activeDivisions.length === 0 ? (
            <div className="godlike-card rounded-lg p-8 text-center text-sm text-zinc-400">
              Belum ada divisi management yang diaktifkan.
            </div>
          ) : (
            <div className="space-y-14">
              {activeDivisions.map((division) => {
                const members = (division.members || []).filter(
                  (m) => m.enabled !== false
                );
                return (
                  <section key={division.id} className="space-y-6">
                    <div className="border-b border-white/10 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                      <div>
                        <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase text-white leading-tight">
                          {division.name}
                        </h2>
                        {division.description && (
                          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                            {division.description}
                          </p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 shrink-0">
                        <Users className="w-3.5 h-3.5 text-[#E11D2E]" />
                        {members.length} Pengurus
                      </span>
                    </div>

                    {members.length === 0 ? (
                      <p className="text-xs sm:text-sm text-zinc-500 italic">
                        Anggota divisi {division.name} segera diperbarui melalui
                        Admin.
                      </p>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                        {members.map((member) => {
                          const href = normalizeHref(member.socialUrl);
                          return (
                            <article
                              key={member.id}
                              className="godlike-card group w-[calc(50%-0.5rem)] sm:w-[230px] md:w-[250px] rounded-md overflow-hidden flex flex-col"
                            >
                              <div
                                onClick={() =>
                                  setLightboxItem({
                                    url: member.photo || navbarLogo,
                                    items: [member.photo || navbarLogo],
                                    initialIndex: 0,
                                    title: member.name,
                                    caption: `${member.role} — ${division.name}${
                                      member.bio ? ` · ${member.bio}` : ""
                                    }`,
                                  })
                                }
                                title="Klik untuk lihat foto penuh"
                                className="relative aspect-[4/4.4] bg-zinc-900 overflow-hidden cursor-zoom-in"
                              >
                                <SmartMedia
                                  src={member.photo || navbarLogo}
                                  alt={member.name}
                                  fit="contain-ambient"
                                  className="w-full h-full"
                                  imgClassName="group-hover:scale-105 transition duration-500"
                                />
                              </div>

                              <div className="p-3 sm:p-4 border-t border-white/8 flex-1 flex flex-col justify-between gap-2">
                                <div>
                                  <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#E11D2E] leading-snug break-words">
                                    {member.role}
                                  </span>
                                  <h3 className="font-display text-base sm:text-xl font-bold uppercase text-white leading-snug break-words mt-0.5">
                                    {member.name}
                                  </h3>
                                  {member.bio && (
                                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed break-words">
                                      {member.bio}
                                    </p>
                                  )}
                                </div>

                                {href && (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 pt-2 border-t border-white/8 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-[#E11D2E] transition"
                                  >
                                    Sosial Media
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </main>

        <MediaLightbox
          item={lightboxItem}
          onClose={() => setLightboxItem(null)}
        />
      </div>
    </SmoothScrollProvider>
  );
}
