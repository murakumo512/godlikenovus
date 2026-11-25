"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Users, X } from "lucide-react";
import { GameDivision, HomeSectionsConfig, RosterMember } from "@/lib/types";
import { ScrollSection } from "./SmoothScroll";
import {
  ExpandMediaBadge,
  LightboxMediaItem,
  LinkifiedText,
  SmartMedia,
} from "./MediaDisplay";

export function RosterSection({
  games,
  homeSections,
  onInspectMedia,
}: {
  games: GameDivision[];
  homeSections: HomeSectionsConfig;
  onInspectMedia: (item: LightboxMediaItem) => void;
}) {
  const [activeGameId, setActiveGameId] = useState(games[0]?.id || "");
  const [activeSubTeamId, setActiveSubTeamId] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<RosterMember | null>(
    null
  );

  const activeGame =
    games.find((g) => g.id === activeGameId) || games[0] || null;

  const subTeams = activeGame?.subTeams || [];
  const hasSubTeams = subTeams.length > 0;

  useEffect(() => {
    if (hasSubTeams) {
      const exists = subTeams.some((st) => st.id === activeSubTeamId);
      if (!exists) {
        setActiveSubTeamId(subTeams[0]?.id || "");
      }
    } else {
      setActiveSubTeamId("");
    }
  }, [activeGame?.id, hasSubTeams, subTeams, activeSubTeamId]);

  if (!activeGame) return null;

  const activeSubTeam = hasSubTeams
    ? subTeams.find((st) => st.id === activeSubTeamId) || subTeams[0]
    : null;

  const currentRoster = activeSubTeam
    ? activeSubTeam.roster
    : activeGame.roster;
  const currentBanner =
    activeSubTeam?.bannerImage || activeGame.bannerImage;
  const currentTitle = activeSubTeam
    ? `${activeGame.name} — ${activeSubTeam.name}`
    : activeGame.name;
  const currentDescription =
    activeSubTeam?.description || activeGame.description;

  const coaches = currentRoster.filter((m) => m.isCoach);
  const players = currentRoster.filter((m) => !m.isCoach);

  const getTotalRosterCount = (game: GameDivision) => {
    if (game.subTeams && game.subTeams.length > 0) {
      return game.subTeams.reduce((acc, st) => acc + st.roster.length, 0);
    }
    return game.roster.length;
  };

  return (
    <ScrollSection id="roster">
      <div className="relative py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header + Game Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#E11D2E] mb-1.5">
              <span>
                {homeSections.rosterBadge || "[02] // ACTIVE DIVISIONS"}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase tracking-tight text-white leading-none">
              {homeSections.rosterTitleWhite || "PLAYERS &"}{" "}
              <span className="text-[#E11D2E]">
                {homeSections.rosterTitleAccent || "COACHES"}
              </span>
            </h2>
          </div>

          {/* Game Division Tabs */}
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
                    ({getTotalRosterCount(game)})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Sub-Team / Squad Switcher (Only appears if this Game has subTeams!) */}
        {hasSubTeams && (
          <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/90 p-2.5 sm:px-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-zinc-400 mr-1">
              <Users className="w-3.5 h-3.5 text-[#E11D2E]" />
              TIM {activeGame.shortName}:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {subTeams.map((st) => {
                const isSubActive = st.id === activeSubTeam?.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setActiveSubTeamId(st.id)}
                    className={`shrink-0 px-3 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wider transition cursor-pointer border ${
                      isSubActive
                        ? "bg-[#E11D2E] border-[#E11D2E] text-white"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    {st.shortName || st.name}
                    <span className="ml-1 text-[10px] opacity-75 font-sans">
                      ({st.roster.length})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeGame.id}-${activeSubTeam?.id || "main"}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Division / Sub-Team Banner (Supports Photo or Video!) */}
            <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 mb-6 md:mb-8">
              {currentBanner && (
                <div className="absolute inset-0 opacity-50">
                  <SmartMedia
                    src={currentBanner}
                    alt={currentTitle}
                    fit="cover"
                    className="w-full h-full"
                    mutedLoop
                  />
                </div>
              )}
              <div className="relative z-10 bg-gradient-to-r from-black/90 via-black/75 to-black/40 p-4 sm:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#E11D2E]">
                    {activeSubTeam
                      ? `${activeGame.shortName} // ${activeSubTeam.shortName || activeSubTeam.name}`
                      : `${activeGame.shortName} ${homeSections.rosterDivisionSuffix || "DIVISION"}`}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-white leading-tight mt-0.5">
                    {currentTitle}
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
                    {currentDescription}
                  </p>
                </div>

                {currentBanner && (
                  <button
                    type="button"
                    onClick={() =>
                      onInspectMedia({
                        url: currentBanner,
                        title: currentTitle,
                        caption: currentDescription,
                      })
                    }
                    className="self-start sm:self-end shrink-0 cursor-pointer group"
                  >
                    <ExpandMediaBadge label="Lihat Banner" />
                  </button>
                )}
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
                      <SmartMedia
                        src={coach.photo}
                        alt={coach.ign}
                        fit="contain-ambient"
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded border border-zinc-800 shrink-0"
                        showVideoBadge
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

            {/* Active Players (Uncropped portrait frame!) */}
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
                    className="group cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 hover:border-[#E11D2E] transition flex flex-col"
                  >
                    <SmartMedia
                      src={player.photo}
                      alt={player.ign}
                      fit="contain-ambient"
                      className="aspect-[3/3.6] sm:aspect-[4/4.8] w-full"
                      imgClassName="group-hover:scale-105 transition duration-500"
                      showVideoBadge
                    />
                    <div className="border-t border-zinc-800/80 bg-zinc-950 p-2.5 sm:p-3.5">
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

        {/* Player / Coach Detail Modal (Uncropped Photo + Click for 100% Original Resolution) */}
        {selectedMember && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
            onClick={() => setSelectedMember(null)}
          >
            <div
              className="relative w-full max-w-md rounded-lg border border-zinc-700 bg-[#0d0d11] overflow-hidden shadow-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute right-3 top-3 z-20 rounded bg-black/75 p-1.5 text-zinc-200 hover:bg-[#E11D2E] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div
                onClick={() =>
                  onInspectMedia({
                    url: selectedMember.photo,
                    title: `${selectedMember.ign} — ${selectedMember.realName}`,
                    caption: selectedMember.role,
                  })
                }
                className="group relative bg-black cursor-zoom-in flex items-center justify-center max-h-[62vh] overflow-hidden"
              >
                <SmartMedia
                  src={selectedMember.photo}
                  alt={selectedMember.ign}
                  fit="contain"
                  className="w-full max-h-[62vh]"
                  imgClassName="max-h-[62vh] w-auto mx-auto"
                  controls
                />
                <div className="absolute bottom-2.5 right-2.5 z-10">
                  <ExpandMediaBadge label="Ukuran Asli" />
                </div>
              </div>

              <div className="p-4 sm:p-5 border-t border-zinc-800">
                <span className="inline-block px-2 py-0.5 rounded bg-[#E11D2E] text-white text-[10px] font-bold uppercase tracking-wider">
                  {selectedMember.role}
                </span>
                <h3 className="font-display text-2xl font-bold text-white uppercase mt-1.5">
                  {selectedMember.ign}
                </h3>
                <p className="text-xs text-zinc-400 mb-3">
                  {selectedMember.realName}
                </p>
                <LinkifiedText
                  text={selectedMember.bio}
                  className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-3"
                />
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
