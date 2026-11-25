"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OpeningConfig } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";

interface KprPreloaderProps {
  opening: OpeningConfig;
  teamName: string;
  estYear: string;
  tagline: string;
  fallbackLogo: string;
}

type Stage = "loading" | "godlike" | "shutter" | "done";

export function KprPreloader({
  opening,
  teamName,
  estYear,
  tagline,
  fallbackLogo,
}: KprPreloaderProps) {
  const [stage, setStage] = useState<Stage>(
    opening.enabled === false ? "done" : "loading"
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (opening.enabled === false) {
      setStage("done");
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const start = performance.now();
    const duration = 1200;
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setProgress(Math.round(eased * 100));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    const toGodlike = setTimeout(() => {
      setStage("godlike");
    }, 1300);

    const toShutter = setTimeout(() => {
      setStage("shutter");
    }, 3150);

    const toDone = setTimeout(() => {
      setStage("done");
      document.body.style.overflow = "";
    }, 4000);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(toGodlike);
      clearTimeout(toShutter);
      clearTimeout(toDone);
      document.body.style.overflow = "";
    };
  }, [opening.enabled]);

  const handleSkip = () => {
    setStage("shutter");
    setTimeout(() => {
      setStage("done");
      document.body.style.overflow = "";
    }, 750);
  };

  if (opening.enabled === false || stage === "done") return null;

  const heroWord =
    (opening.heroWord ?? "").trim() ||
    teamName.split(/\s+/)[0] ||
    "GODLIKE";
  const subWord =
    (opening.subWord ?? "").trim() ||
    teamName.replace(/^GODLIKE\s*/i, "").trim() ||
    "NOVUS";
  const loadingLogo = opening.loadingLogo || fallbackLogo;
  const revealLogo = opening.revealLogo || fallbackLogo;
  const topRight = opening.topRightText || estYear;
  const badgeLabel = opening.badgeText || `${subWord} • ${estYear}`;
  const quoteLabel = opening.quoteText || tagline;
  const loadPrefix = opening.bottomLeftLoadingPrefix || "LOAD";

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto select-none overflow-hidden">
      {/* 5 Architectural Vertical Columns (KPR-style staggered shutter exit into Home) */}
      <div className="absolute inset-0 grid grid-cols-5 pointer-events-none">
        {[0, 1, 2, 3, 4].map((col) => (
          <motion.div
            key={col}
            initial={{ y: "0%" }}
            animate={
              stage === "shutter"
                ? {
                    y: "-102%",
                    transition: {
                      duration: 0.72,
                      delay: col * 0.055,
                      ease: [0.76, 0, 0.24, 1],
                    },
                  }
                : { y: "0%" }
            }
            className="h-full w-full bg-[#060608] border-r border-white/[0.06] last:border-r-0"
          />
        ))}
      </div>

      {/* Optional Custom Background Image during Opening */}
      {opening.backgroundImage && stage !== "shutter" && (
        <div className="pointer-events-none absolute inset-0 z-[5]">
          <img
            src={assetUrl(opening.backgroundImage)}
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060608]/80 via-[#060608]/60 to-[#060608]/90" />
        </div>
      )}

      {/* Crimson Flash Wipe right between Loading -> Giant Hero Word */}
      <AnimatePresence>
        {stage === "godlike" && (
          <motion.div
            key="crimson-wipe"
            initial={{ scaleY: 1, opacity: 0.9 }}
            animate={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top" }}
            className="pointer-events-none absolute inset-0 bg-[#E11D2E] z-20"
          />
        )}
      </AnimatePresence>

      {/* HUD Outer Frame & Content Layer */}
      <motion.div
        animate={
          stage === "shutter"
            ? {
                opacity: 0,
                scale: 1.08,
                transition: { duration: 0.42, ease: [0.76, 0, 0.24, 1] },
              }
            : { opacity: 1, scale: 1 }
        }
        className="relative z-10 h-full w-full p-3 sm:p-5 flex flex-col justify-between text-white"
      >
        <div className="relative flex-1 border border-white/15 flex flex-col justify-between p-4 sm:p-7 overflow-hidden">
          {/* Corner Crosshair Ticks */}
          <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#E11D2E]" />
          <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#E11D2E]" />
          <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#E11D2E]" />
          <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#E11D2E]" />

          {/* Top HUD Bar */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#E11D2E] animate-pulse" />
              <span>
                {stage === "loading"
                  ? opening.topLeftLoadingText || "INITIALIZING // SYS"
                  : opening.topLeftReadyText || "ACCESS GRANTED"}
              </span>
            </div>
            <span className="hidden sm:inline text-zinc-500">
              {opening.topCenterText}
            </span>
            <span>{topRight}</span>
          </div>

          {/* CENTER STAGE */}
          <div className="relative my-auto flex flex-col items-center justify-center py-6">
            <AnimatePresence mode="wait">
              {stage === "loading" && (
                <motion.div
                  key="stage-loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    filter: "blur(6px)",
                    transition: { duration: 0.22, ease: "easeIn" },
                  }}
                  className="w-full max-w-md flex flex-col items-center text-center"
                >
                  {loadingLogo && (
                    <img
                      src={assetUrl(loadingLogo)}
                      alt={teamName}
                      className="h-12 sm:h-16 w-auto object-contain mb-5 opacity-90"
                    />
                  )}

                  <div className="font-mono text-3xl sm:text-5xl font-bold tracking-[0.15em] text-white tabular-nums">
                    {String(progress).padStart(3, "0")}
                    <span className="text-[#E11D2E] text-xl sm:text-2xl">%</span>
                  </div>

                  {/* Expanding Center Horizon Line */}
                  <div className="mt-4 w-56 sm:w-80 h-[2px] bg-zinc-800 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#E11D2E] transition-all duration-75"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {opening.loadingStatusText && (
                    <span className="mt-3 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                      {opening.loadingStatusText}
                    </span>
                  )}
                </motion.div>
              )}

              {(stage === "godlike" || stage === "shutter") && (
                <motion.div
                  key="stage-godlike"
                  initial={{ opacity: 1 }}
                  animate={
                    stage === "shutter"
                      ? {
                          scale: 1.85,
                          opacity: 0,
                          transition: { duration: 0.55, ease: [0.76, 0, 0.24, 1] },
                        }
                      : { scale: 1, opacity: 1 }
                  }
                  className="relative w-full flex flex-col items-center justify-center text-center"
                >
                  {/* Outlined Background Echo Word */}
                  {subWord && (
                    <motion.div
                      initial={{ opacity: 0, scale: 1.12 }}
                      animate={{ opacity: 0.14, scale: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      aria-hidden="true"
                      className="pointer-events-none select-none absolute font-display font-bold uppercase tracking-[0.12em] text-transparent whitespace-nowrap"
                      style={{
                        fontSize: "clamp(4.5rem, 24vw, 19rem)",
                        WebkitTextStroke: "1.5px #E11D2E",
                      }}
                    >
                      {subWord}
                    </motion.div>
                  )}

                  {/* Crest Stamp Above */}
                  {revealLogo && (
                    <motion.img
                      src={assetUrl(revealLogo)}
                      alt={teamName}
                      initial={{ y: -18, opacity: 0, scale: 0.85 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ duration: 0.38, delay: 0.08, ease: "easeOut" }}
                      className="h-12 sm:h-16 w-auto object-contain mb-2 drop-shadow-[0_0_25px_rgba(225,29,46,0.55)]"
                    />
                  )}

                  {/* Optional Custom Hero Graphic or Massive Staggered Hero Word */}
                  {opening.heroImage ? (
                    <motion.img
                      src={assetUrl(opening.heroImage)}
                      alt={heroWord}
                      initial={{ y: 30, opacity: 0, scale: 0.92 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="max-h-40 sm:max-h-60 w-auto object-contain my-2 drop-shadow-[0_8px_32px_rgba(225,29,46,0.35)]"
                    />
                  ) : (
                    <div className="flex flex-wrap items-center justify-center overflow-hidden leading-[0.86] py-1 px-2">
                      {heroWord.split("").map((char, i) => (
                        <motion.span
                          key={i}
                          initial={{ y: "115%", rotateX: -40 }}
                          animate={{ y: "0%", rotateX: 0 }}
                          transition={{
                            duration: 0.52,
                            delay: 0.04 + i * 0.045,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="inline-block font-display font-bold uppercase tracking-tight text-white drop-shadow-[0_8px_32px_rgba(225,29,46,0.35)]"
                          style={{
                            fontSize:
                              heroWord.length > 10
                                ? "clamp(2.4rem, 11vw, 9.5rem)"
                                : "clamp(3.4rem, 17.5vw, 14rem)",
                          }}
                        >
                          {char === " " ? "\u00A0" : char}
                        </motion.span>
                      ))}
                    </div>
                  )}

                  {/* Crimson Sub-bar + Quote */}
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.38 }}
                    className="mt-2 flex flex-col items-center gap-1.5"
                  >
                    {badgeLabel && (
                      <span className="px-3 py-0.5 bg-[#E11D2E] font-display text-xs sm:text-base font-bold uppercase tracking-[0.35em] text-white">
                        {badgeLabel}
                      </span>
                    )}
                    {quoteLabel && (
                      <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-zinc-400 max-w-xs sm:max-w-lg truncate">
                        &ldquo;{quoteLabel}&rdquo;
                      </span>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom HUD Bar */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
            <span>
              {stage === "loading"
                ? `[${loadPrefix} ${String(progress).padStart(3, "0")}%]`
                : opening.bottomLeftReadyText || "[READY // ENTERING ARENA]"}
            </span>
            <button
              type="button"
              onClick={handleSkip}
              className="text-zinc-300 hover:text-[#E11D2E] transition cursor-pointer uppercase tracking-[0.2em]"
            >
              {opening.skipButtonText || "SKIP [→]"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
