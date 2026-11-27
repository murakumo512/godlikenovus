"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { assetUrl } from "@/lib/base-path";
import {
  getYouTubeEmbedUrl,
  isAnyVideoUrl,
  isVideoFileUrl,
} from "@/lib/media";
import { useLockBodyAndLenis } from "./SmoothScroll";

/**
 * Renders modals directly into document.body so parent CSS transforms /
 * perspective (e.g. ScrollSection 3D transitions) never trap `position: fixed`.
 */
export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

interface SmartMediaProps {
  src: string;
  alt: string;
  fit?: "contain-ambient" | "contain" | "cover";
  className?: string;
  imgClassName?: string;
  controls?: boolean;
  mutedLoop?: boolean;
  showVideoBadge?: boolean;
}

export function SmartMedia({
  src,
  alt,
  fit = "contain-ambient",
  className = "",
  imgClassName = "",
  controls = false,
  mutedLoop = true,
  showVideoBadge = false,
}: SmartMediaProps) {
  if (!src) return null;

  const ytEmbed = getYouTubeEmbedUrl(src);
  if (ytEmbed) {
    return (
      <div className={`relative bg-black overflow-hidden ${className}`}>
        <iframe
          src={ytEmbed}
          title={alt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  const resolved = assetUrl(src);

  if (isVideoFileUrl(src)) {
    return (
      <div className={`relative bg-black overflow-hidden ${className}`}>
        <video
          src={resolved}
          controls={controls}
          autoPlay={mutedLoop && !controls}
          muted={mutedLoop && !controls}
          loop={mutedLoop && !controls}
          playsInline
          preload="metadata"
          className={`w-full h-full ${
            fit === "cover" ? "object-cover" : "object-contain"
          } ${imgClassName}`}
        />
        {showVideoBadge && !controls && (
          <span className="pointer-events-none absolute top-2.5 right-2.5 z-10 inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/75 border border-white/20 text-white">
            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
          </span>
        )}
      </div>
    );
  }

  if (fit === "contain-ambient") {
    return (
      <div className={`relative bg-zinc-950 overflow-hidden ${className}`}>
        <img
          src={resolved}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-35"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/25" />
        <img
          src={resolved}
          alt={alt}
          decoding="async"
          className={`relative z-[1] w-full h-full object-contain ${imgClassName}`}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={resolved}
        alt={alt}
        decoding="async"
        className={`w-full h-full ${
          fit === "cover" ? "object-cover" : "object-contain"
        } ${imgClassName}`}
      />
    </div>
  );
}

export interface LightboxMediaItem {
  url: string;
  items?: string[];
  initialIndex?: number;
  title?: string;
  caption?: string;
}

/**
 * Clean Instagram-style Fullscreen Photo / Video Viewer:
 * - Zero cluttered buttons covering the image
 * - Click/tap photo directly to toggle 1:1 native original resolution zoom
 * - Supports Next/Prev navigation when viewing multi-photo event albums
 */
export function MediaLightbox({
  item,
  onClose,
}: {
  item: LightboxMediaItem | null;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [idx, setIdx] = useState(0);
  const swipeStartRef = useRef<number | null>(null);
  const swipedRef = useRef(false);

  useLockBodyAndLenis(Boolean(item));

  const mediaList =
    item?.items && item.items.length > 0
      ? item.items
      : item?.url
        ? [item.url]
        : [];
  const total = mediaList.length;

  useEffect(() => {
    setZoomed(false);
    setIdx(item?.initialIndex ?? 0);
  }, [item?.url, item?.initialIndex]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (total > 1 && e.key === "ArrowRight") {
        setZoomed(false);
        setIdx((i) => (i + 1) % total);
      }
      if (total > 1 && e.key === "ArrowLeft") {
        setZoomed(false);
        setIdx((i) => (i - 1 + total) % total);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, total, onClose]);

  if (!item || total === 0) return null;

  const currentUrl = mediaList[idx] || mediaList[0];
  const ytEmbed = getYouTubeEmbedUrl(currentUrl);
  const isVideo = isVideoFileUrl(currentUrl);
  const resolved = assetUrl(currentUrl);

  const handleSwipeStart = (clientX: number) => {
    swipeStartRef.current = clientX;
    swipedRef.current = false;
  };

  const handleSwipeEnd = (clientX: number) => {
    if (swipeStartRef.current === null || total <= 1 || zoomed) {
      swipeStartRef.current = null;
      return;
    }
    const dx = clientX - swipeStartRef.current;
    swipeStartRef.current = null;
    if (Math.abs(dx) > 40) {
      swipedRef.current = true;
      setZoomed(false);
      if (dx < 0) setIdx((i) => (i + 1) % total);
      else setIdx((i) => (i - 1 + total) % total);
    }
  };

  return (
    <ModalPortal>
    <AnimatePresence>
    <motion.div
      role="dialog"
      aria-modal="true"
      data-lenis-prevent
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[95] bg-black/95 flex flex-col"
      onClick={() => {
        if (swipedRef.current) {
          swipedRef.current = false;
          return;
        }
        onClose();
      }}
      onTouchStart={(e) => handleSwipeStart(e.touches[0]?.clientX ?? 0)}
      onTouchEnd={(e) => handleSwipeEnd(e.changedTouches[0]?.clientX ?? 0)}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") handleSwipeStart(e.clientX);
      }}
      onPointerUp={(e) => {
        if (e.pointerType === "mouse") handleSwipeEnd(e.clientX);
      }}
    >
      {/* Top Counter when multi-photo */}
      {total > 1 && (
        <div className="fixed top-4 left-4 z-[100] rounded-full bg-zinc-900/85 border border-white/15 px-3 py-1 text-xs font-medium text-white">
          {idx + 1} / {total}
        </div>
      )}

      {/* Minimal Close Button (IG Style) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed top-4 right-4 z-[100] rounded-full bg-zinc-900/85 hover:bg-[#E11D2E] border border-white/15 p-2 text-white transition cursor-pointer shadow-lg"
        aria-label="Tutup"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev / Next Arrows when multi-photo */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomed(false);
              setIdx((i) => (i - 1 + total) % total);
            }}
            className="fixed left-3 sm:left-5 top-1/2 -translate-y-1/2 z-[100] rounded-full bg-zinc-900/85 hover:bg-[#E11D2E] border border-white/15 p-2 text-white transition cursor-pointer shadow-lg"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomed(false);
              setIdx((i) => (i + 1) % total);
            }}
            className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-[100] rounded-full bg-zinc-900/85 hover:bg-[#E11D2E] border border-white/15 p-2 text-white transition cursor-pointer shadow-lg"
            aria-label="Berikutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Scrollable / Zoomable Original Media Stage */}
      <div
        data-lenis-prevent
        className="flex-1 w-full h-full overflow-auto overscroll-contain"
        onClick={onClose}
      >
        <div
          className={`min-h-full min-w-full flex p-3 sm:p-8 ${
            zoomed
              ? "items-start justify-start sm:justify-center"
              : "items-center justify-center"
          }`}
        >
          {ytEmbed ? (
            <div
              className="w-full max-w-4xl aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={`${ytEmbed}&autoplay=1`}
                title={item.title || "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : isVideo ? (
            <video
              src={resolved}
              controls
              autoPlay
              playsInline
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[88vh] w-auto h-auto rounded-lg bg-black shadow-2xl"
            />
          ) : (
            <img
              src={resolved}
              alt={item.title || item.caption || "Preview"}
              draggable={false}
              onClick={(e) => {
                e.stopPropagation();
                if (swipedRef.current) {
                  swipedRef.current = false;
                  return;
                }
                setZoomed((z) => !z);
              }}
              className={
                zoomed
                  ? "max-w-none w-auto h-auto cursor-zoom-out select-none shadow-2xl"
                  : "max-w-full max-h-[88vh] w-auto h-auto object-contain cursor-zoom-in select-none shadow-2xl"
              }
            />
          )}
        </div>
      </div>

      {item.caption && !zoomed && (
        <div
          className="px-4 py-3 text-center text-xs sm:text-sm text-zinc-300 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none"
        >
          {item.caption}
        </div>
      )}
    </motion.div>
    </AnimatePresence>
    </ModalPortal>
  );
}

/**
 * Instagram-style Swipeable Multi-Media Carousel:
 * - Touch swipe on mobile & pointer drag swipe on desktop
 * - Dot indicators + optional thumbnail strip + Prev/Next arrows
 * - Tap photo to open Lightbox zoom
 */
export function MediaCarousel({
  items,
  alt,
  className = "",
  stageClassName = "min-h-[240px]",
  fit = "contain",
  showThumbnails = true,
  showDots = true,
  onInspect,
}: {
  items: string[];
  alt: string;
  className?: string;
  stageClassName?: string;
  fit?: "contain-ambient" | "contain" | "cover";
  showThumbnails?: boolean;
  showDots?: boolean;
  onInspect?: (url: string, index: number) => void;
}) {
  const [slide, setSlide] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const axisLockRef = useRef<"x" | "y" | null>(null);
  const swipedRef = useRef(false);

  const total = items.length;
  const safeIdx = total > 0 ? Math.min(slide, total - 1) : 0;
  const current = items[safeIdx] || "";
  const isVid = isAnyVideoUrl(current);

  useEffect(() => {
    setSlide(0);
    setDragX(0);
    setDragging(false);
  }, [items.join("|")]);

  if (total === 0) return null;

  const finishSwipe = (dx: number) => {
    if (total > 1 && Math.abs(dx) > 40) {
      swipedRef.current = true;
      if (dx < 0) setSlide((s) => (s + 1) % total);
      else setSlide((s) => (s - 1 + total) % total);
    }
    setDragging(false);
    setDragX(0);
    pointerIdRef.current = null;
    axisLockRef.current = null;
  };

  return (
    <div className={`flex flex-col bg-black overflow-hidden ${className}`}>
      <div
        onPointerDown={(e) => {
          if (total <= 1) return;
          if (e.pointerType === "mouse" && e.button !== 0) return;
          const target = e.target as HTMLElement | null;
          if (target?.closest("button, a, video, iframe")) return;
          pointerIdRef.current = e.pointerId;
          startXRef.current = e.clientX;
          startYRef.current = e.clientY;
          axisLockRef.current = null;
          swipedRef.current = false;
          setDragX(0);
        }}
        onPointerMove={(e) => {
          if (pointerIdRef.current !== e.pointerId) return;
          const dx = e.clientX - startXRef.current;
          const dy = e.clientY - startYRef.current;
          if (!axisLockRef.current) {
            if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
              axisLockRef.current = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
              if (axisLockRef.current === "x") {
                setDragging(true);
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              }
            }
          }
          if (axisLockRef.current === "y") {
            setDragging(false);
            setDragX(0);
            pointerIdRef.current = null;
            return;
          }
          if (axisLockRef.current === "x") {
            if (Math.abs(dx) > 8) swipedRef.current = true;
            setDragX(dx);
          }
        }}
        onPointerUp={(e) => {
          if (pointerIdRef.current !== e.pointerId) return;
          const dx = e.clientX - startXRef.current;
          try {
            (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
          } catch {
            // ignore
          }
          finishSwipe(axisLockRef.current === "x" ? dx : 0);
        }}
        onPointerCancel={() => finishSwipe(0)}
        onClick={() => {
          if (swipedRef.current) {
            swipedRef.current = false;
            return;
          }
          if (!isVid && onInspect) {
            onInspect(current, safeIdx);
          }
        }}
        style={{ touchAction: total > 1 ? "pan-y" : undefined }}
        className={`relative flex-1 bg-black overflow-hidden select-none ${stageClassName} ${
          total > 1
            ? "cursor-grab active:cursor-grabbing"
            : !isVid && onInspect
              ? "cursor-zoom-in"
              : ""
        }`}
      >
        <div
          className="flex w-full h-full"
          style={{
            transform: `translate3d(calc(-${safeIdx * 100}% + ${dragX}px), 0, 0)`,
            transition: dragging
              ? "none"
              : "transform 340ms cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "transform",
          }}
        >
          {items.map((itemUrl, itemIdx) => {
            const itemIsVid = isAnyVideoUrl(itemUrl);
            return (
              <div
                key={`${itemUrl}-${itemIdx}`}
                className="w-full h-full shrink-0 flex items-center justify-center"
              >
                {itemIsVid ? (
                  <SmartMedia
                    src={itemUrl}
                    alt={alt}
                    fit="contain"
                    className="w-full h-full aspect-video"
                    controls
                    mutedLoop={false}
                  />
                ) : fit === "contain-ambient" ? (
                  <SmartMedia
                    src={itemUrl}
                    alt={`${alt} (${itemIdx + 1})`}
                    fit="contain-ambient"
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={assetUrl(itemUrl)}
                    alt={`${alt} (${itemIdx + 1})`}
                    draggable={false}
                    className={`w-full max-h-[55vh] md:max-h-full h-auto md:h-full select-none ${
                      fit === "cover" ? "object-cover" : "object-contain"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {total > 1 && (
          <>
            <span className="pointer-events-none absolute top-3 left-3 z-10 rounded-full bg-black/75 border border-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white">
              {safeIdx + 1} / {total}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSlide((s) => (s - 1 + total) % total);
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/70 hover:bg-[#E11D2E] border border-white/15 p-1.5 text-white transition cursor-pointer"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSlide((s) => (s + 1) % total);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/70 hover:bg-[#E11D2E] border border-white/15 p-1.5 text-white transition cursor-pointer"
              aria-label="Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {showDots && (
              <div className="pointer-events-none absolute bottom-2.5 inset-x-0 z-10 flex items-center justify-center gap-1.5">
                {items.map((_, dotIdx) => (
                  <span
                    key={dotIdx}
                    className={`h-1.5 rounded-full transition-all ${
                      dotIdx === safeIdx
                        ? "w-4 bg-[#E11D2E]"
                        : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showThumbnails && total > 1 && (
        <div
          data-lenis-prevent
          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 border-t border-white/10 overflow-x-auto no-scrollbar shrink-0"
        >
          {items.map((mUrl, mIdx) => {
            const selected = mIdx === safeIdx;
            const thumbIsVid = isAnyVideoUrl(mUrl);
            return (
              <button
                key={`${mUrl}-${mIdx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSlide(mIdx);
                }}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded overflow-hidden shrink-0 border-2 transition cursor-pointer bg-zinc-900 ${
                  selected
                    ? "border-[#E11D2E]"
                    : "border-transparent opacity-55 hover:opacity-100"
                }`}
              >
                {thumbIsVid ? (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white">
                    <Play className="w-4 h-4 fill-white" />
                  </div>
                ) : (
                  <img
                    src={assetUrl(mUrl)}
                    alt={`Thumbnail ${mIdx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const URL_SPLIT_RE = /(https?:\/\/[^\s]+)/g;

export function LinkifiedText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const parts = text.split(URL_SPLIT_RE);
  return (
    <p className={`whitespace-pre-line break-words ${className}`}>
      {parts.map((part, idx) => {
        if (/^https?:\/\//i.test(part)) {
          return (
            <a
              key={idx}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[#E11D2E] hover:underline font-medium break-all"
            >
              {part}
            </a>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </p>
  );
}
