"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, X } from "lucide-react";
import { GameDivision, HomeSectionsConfig, RosterMember } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";
import { ScrollSection } from "./SmoothScroll";

export function RosterSection({
  games,
  homeSections,
}: {
  games: GameDivision[];
  homeSections: HomeSectionsConfig;
}) {
  const [activeGameId, setActiveGameId] = useState(games[0]?.id || "");
  const [selectedMember, setSelectedMember] = useState<RosterMember | null>(
    null
  );

  const activeGame =
    games.find((g) => g.id === activeGameId) || games[0] || null;

  if (!activeGame) return null;

  const coaches = activeGame.roster.filter((m) => m.isCoach);
  const players = activeGame.roster.filter((m) => !m.isCoach);

  return (
    <ScrollSection id="roster">
      <div className="relative py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header + Game Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#E11D2E] mb-1.5">
              <span>{homeSections.rosterBadge || "[02] // ACTIVE DIVISIONS"}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase tracking-tight text-white leading-none">
              {homeSections.rosterTitleWhite || "PLAYERS &"}{" "}
              <span className="text-[#E11D2E]">
                {homeSections.rosterTitleAccent || "COACHES"}
              </span>
            </h2>
          </div>

          {/* Compact Horizontal Scrollable Game Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {games.map((game) => {
              const isActive = game.id === activeGame.id;
              return (
                <button
                  key={game.id}
                  onClick={() => setActiveGameId(game.id)}
                  className={`shrink-0 px-4 py-2 rounded font-display text-sm sm:text-base font-bold uppercase tracking-wider transition cursor-pointer border ${
                    isActive
                      ? "bg-[#E11D2E] border-[#E11D2E] text-white"
                      : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
                  }`}
                >
                  {game.shortName}
                  <span className="ml-1.5 text-[11px] opacity-75 font-sans">
                    ({game.roster.length})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeGame.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Compact Division Banner */}
            <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 mb-6 md:mb-8">
              <img
                src={assetUrl(activeGame.bannerImage)}
                alt={activeGame.name}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <div className="relative bg-gradient-to-r from-black/90 via-black/75 to-black/40 p-4 sm:p-7">
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#E11D2E]">
                  {activeGame.shortName}{" "}
                  {homeSections.rosterDivisionSuffix || "DIVISION"}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-white leading-tight mt-0.5">
                  {activeGame.name}
                </h3>
                <p className="text-zinc-300 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
                  {activeGame.description}
                </p>
              </div>
            </div>

            {/* Coaching Staff */}
            {coaches.length > 0 && (
              <div className="mb-6">
                <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-2.5">
                  {homeSections.rosterCoachesHeading || "Coaching Staff"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {coaches.map((coach) => (
                    <div
                      key={coach.id}
                      onClick={() => setSelectedMember(coach)}
                      className="group cursor-pointer flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 hover:border-[#E11D2E] transition"
                    >
                      <img
                        src={assetUrl(coach.photo)}
                        alt={coach.ign}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded object-cover border border-zinc-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="inline-block text-[#E11D2E] text-[10px] font-bold uppercase tracking-wider">
                          {coach.role}
                        </span>
                        <h4 className="font-display text-lg sm:text-xl font-bold text-white uppercase leading-tight truncate">
                          {coach.ign}
                        </h4>
                        <p className="text-xs text-zinc-400 truncate">
                          {coach.realName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Players */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-2.5">
                {homeSections.rosterPlayersHeading || "Active Roster"} (
                {players.length})
                {homeSections.rosterTapBioHint
                  ? ` — ${homeSections.rosterTapBioHint}`
                  : ""}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                {players.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => setSelectedMember(player)}
                    className="group cursor-pointer relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 hover:border-[#E11D2E] transition"
                  >
                    <div className="aspect-[3/3.4] sm:aspect-[4/4.8] overflow-hidden bg-zinc-900">
                      <img
                        src={assetUrl(player.photo)}
                        alt={player.ign}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-2.5 sm:p-3.5 pt-8">
                      <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#E11D2E] truncate">
                        {player.role}
                      </span>
                      <h4 className="font-display text-base sm:text-xl font-bold text-white uppercase leading-tight truncate">
                        {player.ign}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {player.realName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Player / Coach Detail Modal */}
        {selectedMember && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedMember(null)}
          >
            <div
              className="relative w-full max-w-sm rounded-lg border border-zinc-700 bg-[#0d0d11] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute right-3 top-3 z-10 rounded bg-black/70 p-1.5 text-zinc-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="h-44 sm:h-52 bg-zinc-900">
                <img
                  src={assetUrl(selectedMember.photo)}
                  alt={selectedMember.ign}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 sm:p-5">
                <span className="inline-block px-2 py-0.5 rounded bg-[#E11D2E] text-white text-[10px] font-bold uppercase tracking-wider">
                  {selectedMember.role}
                </span>
                <h3 className="font-display text-2xl font-bold text-white uppercase mt-1.5">
                  {selectedMember.ign}
                </h3>
                <p className="text-xs text-zinc-400 mb-3">
                  {selectedMember.realName}
                </p>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-3">
                  {selectedMember.bio}
                </p>
                {selectedMember.achievements && (
                  <div className="flex items-center gap-2 rounded bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200">
                    <Award className="w-4 h-4 text-[#E11D2E] shrink-0" />
                    <span>{selectedMember.achievements}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollSection>
  );
}
