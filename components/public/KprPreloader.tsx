"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OpeningConfig } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";
import { SmartMedia } from "./MediaDisplay";

interface KprPreloaderProps {
  opening: OpeningConfig;
  teamName: string;
  estYear: string;
  tagline: string;
  fallbackLogo: string;
}

type Stage = "loading" | "godlike" | "shutter" | "done";

const VISITOR_SESSION_KEY = "gl_site_session_ts";
const VISITOR_SESSION_TTL_MS = 5 * 60 * 1000; // 5 menit

function hasActiveVisitorSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(VISITOR_SESSION_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return !Number.isNaN(ts) && Date.now() - ts < VISITOR_SESSION_TTL_MS;
  } catch {
    return false;
  }
}

function touchVisitorSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VISITOR_SESSION_KEY, String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

export function KprPreloader({
  opening,
  teamName,
  estYear,
  tagline,
  fallbackLogo,
}: KprPreloaderProps) {
  const isLoadingOn =
    opening.enabled !== false && opening.loadingEnabled !== false;
  const isRevealOn =
    opening.enabled !== false && opening.revealEnabled !== false;
  const anyEnabled = isLoadingOn || isRevealOn;

  const [stage, setStage] = useState<Stage>(() => {
    if (!anyEnabled || hasActiveVisitorSession()) return "done";
    return isLoadingOn ? "loading" : "godlike";
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!anyEnabled || hasActiveVisitorSession()) {
      touchVisitorSession();
      setStage("done");
      document.body.style.overflow = "";
      return;
    }

    touchVisitorSession();

    document.body.style.overflow = "hidden";

    let rafId = 0;
    let toGodlike: ReturnType<typeof setTimeout> | undefined;
    let toShutter: ReturnType<typeof setTimeout> | undefined;
    let toDone: ReturnType<typeof setTimeout> | undefined;

    if (isLoadingOn) {
      setStage("loading");
      const start = performance.now();
      const duration = 950;
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

      if (isRevealOn) {
        toGodlike = setTimeout(() => setStage("godlike"), 1020);
        toShutter = setTimeout(() => setStage("shutter"), 2350);
        toDone = setTimeout(() => {
          setStage("done");
          document.body.style.overflow = "";
        }, 3050);
      } else {
        toShutter = setTimeout(() => setStage("shutter"), 1050);
        toDone = setTimeout(() => {
          setStage("done");
          document.body.style.overflow = "";
        }, 1720);
      }
    } else {
      // Loading skipped, Opening Reveal only
      setStage("godlike");
      toShutter = setTimeout(() => setStage("shutter"), 1450);
      toDone = setTimeout(() => {
        setStage("done");
        document.body.style.overflow = "";
      }, 2150);
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (toGodlike) clearTimeout(toGodlike);
      if (toShutter) clearTimeout(toShutter);
      if (toDone) clearTimeout(toDone);
      document.body.style.overflow = "";
    };
  }, [anyEnabled, isLoadingOn, isRevealOn]);

  const handleSkip = () => {
    setStage("shutter");
    setTimeout(() => {
      setStage("done");
      document.body.style.overflow = "";
    }, 600);
  };

  if (!anyEnabled || stage === "done") return null;

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
    <motion.div
      initial={{ opacity: 1 }}
      animate={
        stage === "shutter"
          ? {
              opacity: 0,
              scale: 1.03,
              transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
            }
          : { opacity: 1, scale: 1 }
      }
      style={{ willChange: "opacity, transform" }}
      className="fixed inset-0 z-[100] pointer-events-auto select-none overflow-hidden bg-[#07070a]"
    >
      {/* Smooth Godlike Red-to-White Ambient Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgba(225,29,46,0.22) 0%, rgba(255,255,255,0.06) 42%, rgba(7,7,10,0.96) 76%)",
        }}
      />

      {/* Optional Custom Background Image or Video during Opening */}
      {opening.backgroundImage && (
        <div className="pointer-events-none absolute inset-0 z-[2]">
          <SmartMedia
            src={opening.backgroundImage}
            alt=""
            fit="cover"
            className="w-full h-full opacity-25"
            mutedLoop
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07070a]/80 via-[#07070a]/55 to-[#07070a]/90" />
        </div>
      )}

      {/* HUD Outer Frame & Content Layer */}
      <div className="relative z-10 h-full w-full p-3 sm:p-5 flex flex-col justify-between text-white">
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
                    scale: 0.96,
                    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
                  }}
                  className="w-full max-w-md flex flex-col items-center text-center"
                >
                  {loadingLogo && (
                    <img
                      src={assetUrl(loadingLogo)}
                      alt={teamName}
                      className="h-12 sm:h-16 w-auto object-contain mb-5 opacity-95"
                    />
                  )}

                  <div className="font-mono text-3xl sm:text-5xl font-bold tracking-[0.15em] text-white tabular-nums">
                    {String(progress).padStart(3, "0")}
                    <span className="bg-gradient-to-r from-[#E11D2E] to-white bg-clip-text text-transparent text-xl sm:text-2xl">%</span>
                  </div>

                  {/* Expanding Center Horizon Line (Red-to-White Gradient) */}
                  <div className="mt-4 w-56 sm:w-80 h-[2px] bg-zinc-800 relative overflow-hidden rounded-full">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#E11D2E] via-rose-400 to-white transition-all duration-75"
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
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
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
      </div>
    </motion.div>
  );
}
