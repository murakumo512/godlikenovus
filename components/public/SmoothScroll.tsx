"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Lenis from "lenis";
import { motion } from "framer-motion";

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
      lerp: 0.068,
      smoothWheel: true,
      wheelMultiplier: 0.88,
      touchMultiplier: 1.1,
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
  skipEnter?: boolean;
}

export function ScrollSection({
  id,
  className = "",
  children,
  skipEnter = false,
}: ScrollSectionProps) {
  return (
    <section id={id} className={`relative ${className}`}>
      <motion.div
        initial={skipEnter ? false : { opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.06 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </section>
  );
}

export interface HudRailSectionItem {
  id: string;
  code: string;
  name: string;
}

const DEFAULT_SECTIONS: HudRailSectionItem[] = [
  { id: "top", code: "01", name: "Home" },
  { id: "roster", code: "02", name: "Roster" },
  { id: "about", code: "03", name: "About" },
  { id: "gallery", code: "04", name: "Gallery" },
  { id: "ambassadors", code: "05", name: "Ambassador" },
  { id: "store", code: "06", name: "Store" },
  { id: "sponsors", code: "07", name: "Sponsors" },
  { id: "contact", code: "08", name: "Contact" },
];

export function ScrollHudRail({
  sections = DEFAULT_SECTIONS,
}: {
  sections?: HudRailSectionItem[];
}) {
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
    <div className="hidden xl:flex fixed right-5 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-2.5">
      {sections.map((sec) => {
        const active = activeId === sec.id;
        return (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            className="group flex items-center gap-2.5 py-0.5"
            title={sec.name}
          >
            <span
              className={`text-[11px] font-medium tracking-wide transition-all ${
                active
                  ? "text-white opacity-100"
                  : "text-zinc-500 opacity-0 group-hover:opacity-100"
              }`}
            >
              {sec.name}
            </span>
            <span
              className={`block h-[2px] transition-all duration-300 ${
                active
                  ? "w-5 bg-gradient-to-r from-[#E11D2E] to-white"
                  : "w-2 bg-zinc-700 group-hover:w-3.5 group-hover:bg-zinc-400"
              }`}
            />
          </a>
        );
      })}
    </div>
  );
}
