"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Award, Users, X } from "lucide-react";
import { GameDivision, HomeSectionsConfig, RosterMember } from "@/lib/types";
import { ScrollSection, useLockBodyAndLenis } from "./SmoothScroll";
import {
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
  // null = viewing list of Sub-Division Teams (when game has subTeams!)
  const [selectedSubTeamId, setSelectedSubTeamId] = useState<string | null>(
    null
  );
  const [selectedMember, setSelectedMember] = useState<RosterMember | null>(
    null
  );

  useLockBodyAndLenis(Boolean(selectedMember));

  const activeGame =
    games.find((g) => g.id === activeGameId) || games[0] || null;

  if (!activeGame) return null;

  const subTeams = activeGame.subTeams || [];
  const hasSubTeams = subTeams.length > 0;

  const activeSubTeam =
    hasSubTeams && selectedSubTeamId
      ? subTeams.find((st) => st.id === selectedSubTeamId) || null
      : null;

  // Should we show the Team Cards Directory first?
  // YES whenever this Game has Sub-Divisions AND the user hasn't clicked a specific team yet!
  const showTeamDirectory = hasSubTeams && !activeSubTeam;

  const currentRoster = activeSubTeam
    ? activeSubTeam.roster
    : activeGame.roster;
  const currentBanner =
    activeSubTeam?.bannerImage ||
    activeSubTeam?.logo ||
    activeGame.bannerImage;
  const currentTitle = activeSubTeam ? activeSubTeam.name : activeGame.name;
  const currentDescription =
    activeSubTeam?.description || activeGame.description;

  const coaches = currentRoster.filter((m) => m.isCoach);
  const players = currentRoster.filter((m) => !m.isCoach);

  const handleSelectGame = (gameId: string) => {
    setActiveGameId(gameId);
    setSelectedSubTeamId(null);
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
              const subCount = game.subTeams?.length || 0;
              return (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className={`shrink-0 px-4 py-2 rounded font-display text-sm sm:text-base font-bold uppercase tracking-wider transition cursor-pointer border ${
                    isActive
                      ? "bg-[#E11D2E] border-[#E11D2E] text-white"
                      : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
                  }`}
                >
                  {game.shortName}
                  <span className="ml-1.5 text-[11px] opacity-80 font-sans">
                    {subCount > 0
                      ? `(${subCount} Tim)`
                      : `(${game.roster.length})`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showTeamDirectory ? (
            /* STEP 1 FOR GAMES WITH SUB-DIVISIONS (e.g. HoK): SHOW LIST OF TEAMS FIRST! */
            <motion.div
              key={`${activeGame.id}-directory`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              {/* Game Division Overview Header */}
              <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 mb-6">
                {activeGame.bannerImage && (
                  <div className="absolute inset-0 opacity-45 pointer-events-none">
                    <SmartMedia
                      src={activeGame.bannerImage}
                      alt={activeGame.name}
                      fit="cover"
                      className="w-full h-full"
                      mutedLoop
                    />
                  </div>
                )}
                <div className="relative z-10 bg-gradient-to-r from-black/90 via-black/75 to-black/40 p-4 sm:p-7">
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#E11D2E]">
                    {activeGame.shortName}{" "}
                    {homeSections.rosterDivisionSuffix || "DIVISION"} •{" "}
                    {subTeams.length} SUB-DIVISI
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-white leading-tight mt-0.5">
                    {activeGame.name}
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
                    {activeGame.description}
                  </p>
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2 text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
                <Users className="w-3.5 h-3.5 text-[#E11D2E]" />
                <span>
                  Pilih Tim {activeGame.name} untuk Melihat Roster ({subTeams.length} Tim)
                </span>
              </div>

              {/* Grid of Sub-Division Team Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subTeams.map((team, idx) => {
                  const cardMedia =
                    team.logo || team.bannerImage || activeGame.bannerImage;
                  const teamPlayers = team.roster.filter((m) => !m.isCoach).length;
                  const teamCoaches = team.roster.filter((m) => m.isCoach).length;

                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedSubTeamId(team.id)}
                      className="group text-left overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 hover:border-[#E11D2E] transition flex flex-col cursor-pointer"
                    >
                      <div className="relative aspect-[16/9] w-full bg-zinc-900 overflow-hidden">
                        <SmartMedia
                          src={cardMedia}
                          alt={team.name}
                          fit="contain-ambient"
                          className="w-full h-full"
                          imgClassName="group-hover:scale-105 transition duration-500"
                          mutedLoop
                        />
                        <span className="absolute top-2.5 left-2.5 z-10 rounded bg-black/80 border border-white/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#E11D2E]">
                          {team.shortName || `SQUAD 0${idx + 1}`}
                        </span>
                      </div>

                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between border-t border-zinc-800/80">
                        <div>
                          <h4 className="font-display text-xl sm:text-2xl font-bold uppercase text-white group-hover:text-[#E11D2E] transition leading-tight">
                            {team.name}
                          </h4>
                          {team.description && (
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {team.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs">
                          <span className="text-zinc-400 font-mono text-[11px]">
                            {teamPlayers} Player
                            {teamCoaches > 0 ? ` • ${teamCoaches} Coach` : ""}
                          </span>
                          <span className="inline-flex items-center gap-1 font-display font-bold uppercase tracking-wider text-[#E11D2E] group-hover:translate-x-1 transition-transform">
                            Lihat Roster <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* STEP 2 (Clicked a Sub-Team) OR DIRECT VIEW (Game without Sub-Divisions like RF Online!) */
            <motion.div
              key={`${activeGame.id}-${activeSubTeam?.id || "direct"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              {/* Back to Team List Bar (Only when viewing a Sub-Team!) */}
              {activeSubTeam && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSubTeamId(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-zinc-200 hover:text-[#E11D2E] transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#E11D2E]" />
                    Kembali ke Daftar Tim {activeGame.shortName}
                  </button>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {subTeams.map((st) => {
                      const isSubActive = st.id === activeSubTeam.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSelectedSubTeamId(st.id)}
                          className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-display font-bold uppercase tracking-wider transition cursor-pointer border ${
                            isSubActive
                              ? "bg-[#E11D2E] border-[#E11D2E] text-white"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {st.shortName || st.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Division / Team Banner (Click directly to view banner full-screen like IG!) */}
              <div
                onClick={() => {
                  if (currentBanner) {
                    onInspectMedia({
                      url: currentBanner,
                      title: currentTitle,
                      caption: currentDescription,
                    });
                  }
                }}
                className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 mb-6 md:mb-8 cursor-pointer"
              >
                {currentBanner && (
                  <div className="absolute inset-0 opacity-50 pointer-events-none">
                    <SmartMedia
                      src={currentBanner}
                      alt={currentTitle}
                      fit="cover"
                      className="w-full h-full"
                      mutedLoop
                    />
                  </div>
                )}
                <div className="relative z-10 bg-gradient-to-r from-black/90 via-black/75 to-black/40 p-4 sm:p-7">
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#E11D2E]">
                    {activeSubTeam
                      ? `${activeGame.name} // ${activeSubTeam.shortName || activeSubTeam.name}`
                      : `${activeGame.shortName} ${homeSections.rosterDivisionSuffix || "DIVISION"}`}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-white leading-tight mt-0.5">
                    {currentTitle}
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
                    {currentDescription}
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
          )}
        </AnimatePresence>

        {/* Player / Coach Detail Modal (IG Style: Smooth Internal Scroll + Click Photo Directly for Full Original!) */}
        {selectedMember && (
          <div
            role="dialog"
            aria-modal="true"
            data-lenis-prevent
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
            onClick={() => setSelectedMember(null)}
          >
            <div
              data-lenis-prevent
              className="relative w-full max-w-md max-h-[88vh] flex flex-col rounded-xl border border-zinc-700 bg-[#0d0d11] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Top Bar so X never disappears */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-[#0d0d11] shrink-0">
                <span className="px-2 py-0.5 rounded bg-[#E11D2E] text-white text-[10px] font-bold uppercase tracking-wider">
                  {selectedMember.role}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="rounded-full p-1 text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div
                data-lenis-prevent
                className="flex-1 overflow-y-auto overscroll-contain"
              >
                <div
                  onClick={() =>
                    onInspectMedia({
                      url: selectedMember.photo,
                      title: `${selectedMember.ign} — ${selectedMember.realName}`,
                      caption: selectedMember.role,
                    })
                  }
                  className="bg-black cursor-zoom-in flex items-center justify-center"
                >
                  <SmartMedia
                    src={selectedMember.photo}
                    alt={selectedMember.ign}
                    fit="contain"
                    className="w-full max-h-[55vh]"
                    imgClassName="max-h-[55vh] w-auto mx-auto"
                    controls
                  />
                </div>

                <div className="p-4 sm:p-5 border-t border-zinc-800">
                  <h3 className="font-display text-2xl font-bold text-white uppercase leading-tight">
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
          </div>
        )}
      </div>
    </ScrollSection>
  );
}
