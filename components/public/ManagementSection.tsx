"use client";

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { HomeSectionsConfig, ManagementDivision } from "@/lib/types";
import { ScrollSection } from "./SmoothScroll";
import { SmartMedia } from "./MediaDisplay";

export function ManagementSection({
  divisions: rawDivisions,
  homeSections,
  fallbackLogo,
}: {
  divisions: ManagementDivision[];
  homeSections: HomeSectionsConfig;
  fallbackLogo: string;
}) {
  const activeDivisions = rawDivisions.filter((d) => d.enabled !== false);
  const allMembers = activeDivisions.flatMap((d) =>
    (d.members || [])
      .filter((m) => m.enabled !== false)
      .map((m) => ({ ...m, divisionName: d.name }))
  );

  // Build up to 4 stacked cards front-to-back (Reign 9 style depth stack)
  const stackCards =
    allMembers.length > 0
      ? allMembers.slice(0, 4).map((m) => ({
          id: m.id,
          photo: m.photo || fallbackLogo,
          name: m.name,
          role: m.role || m.divisionName,
        }))
      : activeDivisions.slice(0, 4).map((d) => ({
          id: d.id,
          photo: fallbackLogo,
          name: d.name,
          role: "Godlike Management",
        }));

  return (
    <ScrollSection id="management" showDivider={true}>
      <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="godlike-card rounded-xl p-6 sm:p-10 md:p-12 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left: Heading, Active Divisions, CTA to /management */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#E11D2E] block mb-2">
                  {homeSections.managementBadge || "Struktur Organisasi"}
                </span>
                <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-[0.94]">
                  {homeSections.managementTitleWhite || "OUR"}{" "}
                  <span className="godlike-gradient-text">
                    {homeSections.managementTitleAccent || "MANAGEMENT"}
                  </span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
                {homeSections.managementSubtitle ||
                  "Tim manajemen di balik operasional, divisi kompetitif, media, komunitas, dan kemitraan Godlike Novus."}
              </p>

              {activeDivisions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeDivisions.map((div) => (
                    <span
                      key={div.id}
                      className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border border-white/15 bg-white/5 text-zinc-200 rounded"
                    >
                      {div.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/management"
                  className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#E11D2E] via-rose-600 to-rose-500 hover:brightness-110 px-6 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(225,29,46,0.3)] transition"
                >
                  <Users className="w-4 h-4" />
                  {homeSections.managementButtonText ||
                    "Lihat Struktur Management"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: Stacked Front-to-Back Management Photo Deck -> Click opens /management */}
            <div className="lg:col-span-6 flex items-center justify-center py-4 sm:py-6">
              <Link
                href="/management"
                className="group relative block w-[230px] sm:w-[270px] h-[290px] sm:h-[340px]"
                title="Buka halaman Our Management"
              >
                {stackCards
                  .slice()
                  .reverse()
                  .map((card, revIdx) => {
                    const depth = stackCards.length - 1 - revIdx; // 0 = front, 1,2,3 = back
                    const offsetX = depth * 22;
                    const offsetY = depth * -12;
                    const scale = 1 - depth * 0.065;
                    const rotate = depth === 0 ? 0 : depth % 2 === 1 ? 4 : -4;
                    const opacity = 1 - depth * 0.18;

                    return (
                      <div
                        key={card.id}
                        style={{
                          transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale}) rotate(${rotate}deg)`,
                          zIndex: 10 - depth,
                          opacity,
                        }}
                        className="absolute inset-0 rounded-xl overflow-hidden border border-white/15 bg-zinc-950 shadow-2xl transition-transform duration-300 group-hover:scale-[1.03]"
                      >
                        <div className="relative w-full h-full flex flex-col">
                          <div className="relative flex-1 bg-zinc-950 overflow-hidden flex items-center justify-center">
                            <SmartMedia
                              src={card.photo}
                              alt={card.name}
                              fit="contain-ambient"
                              className="w-full h-full"
                            />
                            <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 p-4">
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#E11D2E]">
                              {card.role}
                            </span>
                            <span className="block font-display text-lg sm:text-xl font-bold uppercase text-white leading-tight mt-0.5">
                              {card.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ScrollSection>
  );
}
