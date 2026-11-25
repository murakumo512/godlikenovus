"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Lenis from "lenis";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

const LenisLockContext = createContext<{
  acquireLock: () => () => void;
}>({
  acquireLock: () => () => {},
});

export function useLockBodyAndLenis(active: boolean) {
  const { acquireLock } = useContext(LenisLockContext);
  useEffect(() => {
    if (!active) return;
    const release = acquireLock();
    return () => release();
  }, [active, acquireLock]);
}

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const lockCountRef = useRef(0);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      prevent: (node: HTMLElement) =>
        Boolean(node?.closest?.("[data-lenis-prevent], [role='dialog']")),
    });
    lenisRef.current = lenis;

    if (lockCountRef.current > 0) {
      lenis.stop();
    }

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const handleAnchorClick = (e: MouseEvent) => {
      if (lockCountRef.current > 0) return;
      const target = (e.target as HTMLElement | null)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || !href.startsWith("#") || href.length < 2) return;
      const el = document.querySelector<HTMLElement>(href);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, {
        offset: -56,
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("click", handleAnchorClick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const acquireLock = useRef(() => {
    lockCountRef.current += 1;
    if (lockCountRef.current === 1) {
      lenisRef.current?.stop();
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }
    return () => {
      lockCountRef.current = Math.max(0, lockCountRef.current - 1);
      if (lockCountRef.current === 0) {
        lenisRef.current?.start();
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      }
    };
  }).current;

  return (
    <LenisLockContext.Provider value={{ acquireLock }}>
      {children}
    </LenisLockContext.Provider>
  );
}

interface ScrollSectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  showDivider?: boolean;
}

export function ScrollSection({
  id,
  className = "",
  children,
  showDivider = true,
}: ScrollSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 94%", "start 32%"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.35,
  });

  const y = useTransform(smooth, [0, 1], [38, 0]);
  const opacity = useTransform(smooth, [0, 1], [0.22, 1]);
  const scale = useTransform(smooth, [0, 1], [0.972, 1]);
  const lineScale = useTransform(smooth, [0, 1], [0, 1]);

  return (
    <section id={id} ref={ref} className={`relative ${className}`}>
      {showDivider && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-none">
          <div className="h-px w-full bg-white/[0.06] overflow-hidden">
            <motion.div
              style={{ scaleX: lineScale, transformOrigin: "left" }}
              className="h-full w-full bg-gradient-to-r from-[#E11D2E] via-red-500/60 to-transparent"
            />
          </div>
        </div>
      )}
      <motion.div style={{ y, opacity, scale }}>{children}</motion.div>
    </section>
  );
}

export interface HudRailSectionItem {
  id: string;
  code: string;
  name: string;
}

const DEFAULT_SECTIONS: HudRailSectionItem[] = [
  { id: "top", code: "01", name: "HERO" },
  { id: "roster", code: "02", name: "ROSTER" },
  { id: "about", code: "03", name: "ABOUT" },
  { id: "gallery", code: "04", name: "GALLERY" },
  { id: "store", code: "05", name: "STORE" },
  { id: "sponsors", code: "06", name: "SPONSORS" },
  { id: "contact", code: "07", name: "CONTACT" },
];

export function ScrollHudRail({
  sections = DEFAULT_SECTIONS,
}: {
  sections?: HudRailSectionItem[];
}) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 28,
    mass: 0.25,
  });

  const [activeId, setActiveId] = useState("top");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(sec.id);
            }
          });
        },
        { rootMargin: "-35% 0px -50% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  return (
    <>
      <motion.div
        style={{ scaleX, transformOrigin: "left" }}
        className="fixed top-14 sm:top-16 left-0 right-0 h-[2px] bg-[#E11D2E] z-40 pointer-events-none"
      />

      <div className="hidden xl:flex fixed right-4 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-2">
        {sections.map((sec) => {
          const active = activeId === sec.id;
          return (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="group flex items-center gap-2 py-0.5"
              title={sec.name}
            >
              <span
                className={`text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${
                  active
                    ? "text-[#E11D2E] opacity-100 translate-x-0"
                    : "text-zinc-500 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                }`}
              >
                {sec.code} // {sec.name}
              </span>
              <span
                className={`block h-[2px] transition-all duration-300 ${
                  active
                    ? "w-6 bg-[#E11D2E]"
                    : "w-2.5 bg-zinc-700 group-hover:w-4 group-hover:bg-zinc-400"
                }`}
              />
            </a>
          );
        })}
      </div>
    </>
  );
}
