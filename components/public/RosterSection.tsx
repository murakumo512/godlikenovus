"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Award, Images, X } from "lucide-react";
import { GameDivision, HomeSectionsConfig, RosterMember } from "@/lib/types";
import { collectMediaList } from "@/lib/media";
import { ScrollSection, useLockBodyAndLenis } from "./SmoothScroll";
import {
  LightboxMediaItem,
  LinkifiedText,
  MediaCarousel,
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
  const currentBannerList = collectMediaList(
    currentBanner,
    activeSubTeam ? activeSubTeam.bannerImages : activeGame.bannerImages
  );

  const coaches = currentRoster.filter((m) => m.isCoach);
  const players = currentRoster.filter((m) => !m.isCoach);

  const handleSelectGame = (gameId: string) => {
    setActiveGameId(gameId);
    setSelectedSubTeamId(null);
  };

  return (
    <ScrollSection id="roster" showDivider={true}>
      <div className="relative py-10 sm:py-16 md:py-20 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Clean Editorial Header + Game Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-6 md:mb-10">
          <div>
            {homeSections.rosterBadge && (
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#E11D2E] block mb-1 sm:mb-2">
                {homeSections.rosterBadge}
              </span>
            )}
            <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-[0.94]">
              {homeSections.rosterTitleWhite || "TIM &"}{" "}
              <span className="text-[#E11D2E]">
                {homeSections.rosterTitleAccent || "ROSTER"}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-6 border-b border-white/10 sm:border-b-0 overflow-x-auto no-scrollbar">
            {games.map((game) => {
              const isActive = game.id === activeGame.id;
              return (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className={`shrink-0 pb-2.5 sm:pb-2 font-display text-lg sm:text-2xl font-bold uppercase tracking-wide transition cursor-pointer border-b-2 ${
                    isActive
                      ? "border-[#E11D2E] text-white"
                      : "border-transparent text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  {game.name}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showTeamDirectory ? (
            /* STEP 1: Sub-Division Team List (Editorial Lookbook Cards, Zero AI Boxes) */
            <motion.div
              key={`${activeGame.id}-directory`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mb-8 leading-relaxed">
                {activeGame.description}
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
                {subTeams.map((team) => {
                  const cardMedia =
                    team.logo || team.bannerImage || activeGame.bannerImage;
                  const teamPlayers = team.roster.filter(
                    (m) => !m.isCoach
                  ).length;
                  const teamCoaches = team.roster.filter(
                    (m) => m.isCoach
                  ).length;

                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedSubTeamId(team.id)}
                      className="group text-left rounded-md overflow-hidden border border-white/10 bg-zinc-950/70 hover:border-white/25 transition flex flex-col cursor-pointer"
                    >
                      <div className="relative aspect-square sm:aspect-[16/10] w-full bg-zinc-900 overflow-hidden">
                        <SmartMedia
                          src={cardMedia}
                          alt={team.name}
                          fit="contain-ambient"
                          className="w-full h-full"
                          imgClassName="group-hover:scale-105 transition duration-500"
                          mutedLoop
                        />
                      </div>

                      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
                        <div>
                          {team.shortName && (
                            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#E11D2E] block truncate">
                              {team.shortName}
                            </span>
                          )}
                          <h3 className="font-display text-base sm:text-2xl font-bold uppercase text-white group-hover:text-[#E11D2E] transition leading-tight mt-0.5 truncate">
                            {team.name}
                          </h3>
                          {team.description && (
                            <p className="hidden sm:line-clamp-2 text-xs text-zinc-400 mt-1 leading-relaxed">
                              {team.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-2 sm:mt-3 pt-2 border-t border-white/8 flex items-center justify-between text-[10px] sm:text-xs text-zinc-400">
                          <span>
                            {teamPlayers}P
                            {teamCoaches > 0 ? ` · ${teamCoaches}C` : ""}
                          </span>
                          <span className="inline-flex items-center gap-0.5 font-medium text-zinc-200 group-hover:text-[#E11D2E] transition">
                            Roster
                            <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* STEP 2: Selected Team Roster OR Direct Game Roster */
            <motion.div
              key={`${activeGame.id}-${activeSubTeam?.id || "direct"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              {activeSubTeam && (
                <div className="mb-8 pb-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSubTeamId(null)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#E11D2E]" />
                    Semua Tim {activeGame.shortName}
                  </button>

                  <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                    {subTeams.map((st) => {
                      const isSubActive = st.id === activeSubTeam.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSelectedSubTeamId(st.id)}
                          className={`shrink-0 text-xs sm:text-sm font-semibold uppercase tracking-wider transition cursor-pointer ${
                            isSubActive
                              ? "text-[#E11D2E]"
                              : "text-zinc-500 hover:text-zinc-200"
                          }`}
                        >
                          {st.shortName || st.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Natural Editorial Division Intro */}
              <div className="mb-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                <div className="lg:col-span-7">
                  <h3 className="font-display text-3xl sm:text-4xl font-bold uppercase text-white leading-none">
                    {currentTitle}
                  </h3>
                  <p className="text-zinc-400 text-sm sm:text-base mt-2.5 max-w-2xl leading-relaxed">
                    {currentDescription}
                  </p>
                </div>
                {currentBannerList.length > 0 && (
                  <MediaCarousel
                    items={currentBannerList}
                    alt={currentTitle}
                    fit="cover"
                    showThumbnails={false}
                    className="lg:col-span-5 bg-zinc-900"
                    stageClassName="aspect-[21/9]"
                    onInspect={(url, idx) =>
                      onInspectMedia({
                        url,
                        items: currentBannerList,
                        initialIndex: idx,
                        title: currentTitle,
                        caption: currentDescription,
                      })
                    }
                  />
                )}
              </div>

              {/* Coaching Staff (Clean borderless horizontal portraits) */}
              {coaches.length > 0 && (
                <div className="mb-10">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 mb-4">
                    {homeSections.rosterCoachesHeading || "Pelatih / Coach"}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coaches.map((coach) => (
                      <div
                        key={coach.id}
                        onClick={() => setSelectedMember(coach)}
                        className="group cursor-pointer flex items-center gap-4 pb-4 border-b border-white/10 hover:border-[#E11D2E] transition"
                      >
                        <SmartMedia
                          src={coach.photo}
                          alt={coach.ign}
                          fit="contain-ambient"
                          className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 shrink-0"
                          showVideoBadge
                        />
                        <div className="min-w-0">
                          <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#E11D2E]">
                            {coach.role}
                          </span>
                          <h4 className="font-display text-2xl font-bold text-white uppercase leading-tight truncate mt-0.5">
                            {coach.ign}
                          </h4>
                          <p className="text-xs sm:text-sm text-zinc-400 truncate">
                            {coach.realName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Players (Compact IG-style Grid on Mobile, 5-Col on Laptop) */}
              <div>
                <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 mb-3 sm:mb-4">
                  {homeSections.rosterPlayersHeading || "Daftar Roster"} (
                  {players.length})
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-5">
                  {players.map((player) => {
                    const playerMediaCount = collectMediaList(
                      player.photo,
                      player.images
                    ).length;
                    return (
                    <div
                      key={player.id}
                      onClick={() => setSelectedMember(player)}
                      className="group cursor-pointer overflow-hidden rounded-md border border-white/10 bg-zinc-950/70 hover:border-white/25 transition flex flex-col"
                    >
                      <div className="relative aspect-square sm:aspect-[3/3.6] w-full bg-zinc-900 overflow-hidden">
                        <SmartMedia
                          src={player.photo}
                          alt={player.ign}
                          fit="contain-ambient"
                          className="w-full h-full"
                          imgClassName="group-hover:scale-[1.04] transition duration-500"
                          showVideoBadge
                        />
                        {playerMediaCount > 1 && (
                          <span className="absolute top-1.5 right-1.5 z-10 inline-flex items-center gap-0.5 rounded-full bg-black/75 border border-white/20 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-white">
                            <Images className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {playerMediaCount}
                          </span>
                        )}
                      </div>
                      <div className="p-2 sm:p-3 border-t border-white/8">
                        <span className="block text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#E11D2E] truncate">
                          {player.role}
                        </span>
                        <h4 className="font-display text-sm sm:text-xl font-bold text-white uppercase leading-tight truncate mt-0.5">
                          {player.ign}
                        </h4>
                        <p className="hidden sm:block text-xs text-zinc-400 truncate">
                          {player.realName}
                        </p>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player / Coach Detail Modal */}
        {selectedMember && (
          <div
            role="dialog"
            aria-modal="true"
            data-lenis-prevent
            className="fixed inset-0 z-50 bg-black/88 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
            onClick={() => setSelectedMember(null)}
          >
            <div
              data-lenis-prevent
              className="relative w-full max-w-md max-h-[88vh] flex flex-col border border-white/10 bg-[#0e0e11] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0e0e11] shrink-0">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#E11D2E]">
                  {selectedMember.role}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                data-lenis-prevent
                className="flex-1 overflow-y-auto overscroll-contain"
              >
                <MediaCarousel
                  items={collectMediaList(
                    selectedMember.photo,
                    selectedMember.images
                  )}
                  alt={selectedMember.ign}
                  fit="contain"
                  stageClassName="min-h-[220px] max-h-[55vh]"
                  onInspect={(url, idx) =>
                    onInspectMedia({
                      url,
                      items: collectMediaList(
                        selectedMember.photo,
                        selectedMember.images
                      ),
                      initialIndex: idx,
                      title: `${selectedMember.ign} — ${selectedMember.realName}`,
                      caption: selectedMember.role,
                    })
                  }
                />

                <div className="p-5 space-y-3 border-t border-white/10">
                  <div>
                    <h3 className="font-display text-3xl font-bold text-white uppercase leading-none">
                      {selectedMember.ign}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      {selectedMember.realName}
                    </p>
                  </div>
                  <LinkifiedText
                    text={selectedMember.bio}
                    className="text-sm text-zinc-300 leading-relaxed"
                  />
                  {selectedMember.achievements && (
                    <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-xs sm:text-sm text-zinc-200">
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
