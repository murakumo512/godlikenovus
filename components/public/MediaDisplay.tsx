"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
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
  const [idx, setIdx] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const panBaseRef = useRef({ x: 0, y: 0 });
  const axisLockRef = useRef<"x" | "y" | null>(null);
  const swipedRef = useRef(false);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchBaseScaleRef = useRef(1);

  useLockBodyAndLenis(Boolean(item));

  const mediaList =
    item?.items && item.items.length > 0
      ? item.items
      : item?.url
        ? [item.url]
        : [];
  const total = mediaList.length;
  const safeIdx = total > 0 ? Math.min(idx, total - 1) : 0;

  const resetZoom = () => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
    setIsPanning(false);
  };

  useEffect(() => {
    setIdx(item?.initialIndex ?? 0);
    setDragX(0);
    setDragging(false);
    resetZoom();
  }, [item?.url, item?.initialIndex]);

  useEffect(() => {
    resetZoom();
  }, [safeIdx]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (total > 1 && e.key === "ArrowRight") {
        setIdx((i) => (i + 1) % total);
      }
      if (total > 1 && e.key === "ArrowLeft") {
        setIdx((i) => (i - 1 + total) % total);
      }
      if (e.key === "+" || e.key === "=") {
        setZoomScale((s) => Math.min(4, +(s + 0.5).toFixed(2)));
      }
      if (e.key === "-") {
        setZoomScale((s) => {
          const next = Math.max(1, +(s - 0.5).toFixed(2));
          if (next === 1) setPan({ x: 0, y: 0 });
          return next;
        });
      }
      if (e.key === "0") {
        resetZoom();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, total, onClose]);

  if (!item || total === 0) return null;

  const currentUrl = mediaList[safeIdx] || mediaList[0];
  const isCurrentVideo = isAnyVideoUrl(currentUrl);
  const isZoomed = zoomScale > 1.02;

  const adjustZoom = (delta: number) => {
    setZoomScale((prev) => {
      const next = Math.max(1, Math.min(4, +(prev + delta).toFixed(2)));
      if (next <= 1.02) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const finishDrag = (dx: number) => {
    if (total > 1 && !isZoomed && Math.abs(dx) > 45) {
      swipedRef.current = true;
      if (dx < 0) setIdx((i) => (i + 1) % total);
      else setIdx((i) => (i - 1 + total) % total);
    }
    setDragging(false);
    setIsPanning(false);
    setDragX(0);
    pointerIdRef.current = null;
    axisLockRef.current = null;
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
      onClick={() => {
        if (swipedRef.current) {
          swipedRef.current = false;
          return;
        }
        onClose();
      }}
      className="fixed inset-0 z-[95] bg-black/92 p-2.5 sm:p-5 flex items-center justify-center overflow-hidden"
    >
      {/* Instagram-Style Post Card with Full PC & Mobile Zoom (1x-4x) + Drag Pan */}
      <motion.div
        data-lenis-prevent
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full rounded-xl border border-white/12 bg-[#0e0e12] shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isZoomed ? "max-w-5xl max-h-[90dvh]" : "max-w-2xl max-h-[84dvh] sm:max-h-[90dvh]"
        }`}
      >
        {/* Top IG Header + PC Zoom Controls */}
        <div className="flex items-center justify-between gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#E11D2E] shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-white truncate">
              {item.title || "Godlike Novus"}
            </span>
            {total > 1 && (
              <span className="text-[11px] font-medium text-zinc-400 shrink-0">
                · {safeIdx + 1}/{total}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isCurrentVideo && (
              <div className="flex items-center gap-0.5 mr-1 rounded-md border border-white/10 bg-zinc-900/90 px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => adjustZoom(-0.5)}
                  disabled={zoomScale <= 1}
                  className="p-1 text-zinc-300 hover:text-white disabled:opacity-35 transition cursor-pointer"
                  title="Perkecil (-)"
                  aria-label="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 text-[10px] font-mono text-zinc-300 min-w-[36px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => adjustZoom(0.5)}
                  disabled={zoomScale >= 4}
                  className="p-1 text-zinc-300 hover:text-white disabled:opacity-35 transition cursor-pointer"
                  title="Perbesar (+)"
                  aria-label="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {isZoomed && (
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="p-1 text-zinc-300 hover:text-[#E11D2E] transition cursor-pointer"
                    title="Reset Zoom (0)"
                    aria-label="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Swipeable (1x) + Pan/Zoomable (1x-4x) Image Stage */}
        <div
          onWheel={(e) => {
            if (isCurrentVideo) return;
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.3 : -0.3;
            adjustZoom(delta);
          }}
          onTouchStart={(e) => {
            if (e.touches.length === 2) {
              pointerIdRef.current = null;
              setDragging(false);
              setIsPanning(false);
              setDragX(0);
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              pinchStartDistRef.current = Math.hypot(dx, dy);
              pinchBaseScaleRef.current = zoomScale;
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 2 && pinchStartDistRef.current) {
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              const dist = Math.hypot(dx, dy);
              const nextScale = Math.max(
                1,
                Math.min(4, (dist / pinchStartDistRef.current) * pinchBaseScaleRef.current)
              );
              setZoomScale(nextScale);
              if (nextScale <= 1.02) setPan({ x: 0, y: 0 });
            }
          }}
          onTouchEnd={(e) => {
            if (e.touches.length < 2) {
              pinchStartDistRef.current = null;
              if (zoomScale < 1.08) resetZoom();
            }
          }}
          onPointerDown={(e) => {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest("button, a, video, iframe")) return;

            pointerIdRef.current = e.pointerId;
            startXRef.current = e.clientX;
            startYRef.current = e.clientY;
            swipedRef.current = false;

            if (isZoomed) {
              panBaseRef.current = { ...pan };
              setIsPanning(true);
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            } else if (total > 1) {
              axisLockRef.current = null;
              setDragX(0);
            }
          }}
          onPointerMove={(e) => {
            if (pointerIdRef.current !== e.pointerId) return;
            const dx = e.clientX - startXRef.current;
            const dy = e.clientY - startYRef.current;

            if (isZoomed) {
              if (Math.abs(dx) > 4 || Math.abs(dy) > 4) swipedRef.current = true;
              setPan({
                x: panBaseRef.current.x + dx,
                y: panBaseRef.current.y + dy,
              });
              return;
            }

            if (total <= 1) return;
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
            if (isZoomed) {
              setIsPanning(false);
              pointerIdRef.current = null;
              return;
            }
            finishDrag(axisLockRef.current === "x" ? dx : 0);
          }}
          onPointerCancel={() => finishDrag(0)}
          style={{ touchAction: isZoomed ? "none" : "pan-y pinch-zoom" }}
          className={`relative w-full bg-black overflow-hidden select-none shrink-0 ${
            isZoomed || total > 1 ? "cursor-grab active:cursor-grabbing" : ""
          }`}
        >
          <div
            className="flex w-full items-center"
            style={{
              transform: `translate3d(calc(-${safeIdx * 100}% + ${dragX}px), 0, 0)`,
              transition: dragging
                ? "none"
                : "transform 340ms cubic-bezier(0.22, 1, 0.36, 1)",
              willChange: "transform",
            }}
          >
            {mediaList.map((url, mIdx) => {
              const mYt = getYouTubeEmbedUrl(url);
              const mVid = isVideoFileUrl(url);
              const mResolved = assetUrl(url);
              const isActive = mIdx === safeIdx;
              return (
                <div
                  key={`${url}-${mIdx}`}
                  className="w-full shrink-0 flex items-center justify-center bg-black overflow-hidden"
                >
                  {mYt ? (
                    <div className="w-full aspect-video bg-black">
                      <iframe
                        src={isActive ? `${mYt}&autoplay=1` : mYt}
                        title={item.title || "Video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : mVid ? (
                    <video
                      src={mResolved}
                      controls
                      autoPlay={isActive}
                      playsInline
                      className="w-full max-h-[68vh] bg-black object-contain"
                    />
                  ) : (
                    <img
                      src={mResolved}
                      alt={item.title || item.caption || "Preview"}
                      draggable={false}
                      style={{
                        transform: isActive
                          ? `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoomScale})`
                          : undefined,
                        transition:
                          isPanning || pinchStartDistRef.current
                            ? "none"
                            : "transform 180ms ease-out",
                      }}
                      onClick={() => {
                        if (swipedRef.current) {
                          swipedRef.current = false;
                          return;
                        }
                        if (isZoomed) {
                          resetZoom();
                        } else {
                          setZoomScale(2.2);
                        }
                      }}
                      className={`max-w-full w-auto h-auto object-contain select-none ${
                        isZoomed
                          ? "max-h-[76dvh] cursor-grab active:cursor-grabbing"
                          : "max-h-[64dvh] cursor-zoom-in"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Prev / Next Arrows (hidden while zoomed in) */}
          {total > 1 && !isZoomed && (
            <>
              <button
                type="button"
                onClick={() => setIdx((i) => (i - 1 + total) % total)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/65 hover:bg-black/90 border border-white/15 p-1.5 text-white transition cursor-pointer"
                aria-label="Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIdx((i) => (i + 1) % total)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/65 hover:bg-black/90 border border-white/15 p-1.5 text-white transition cursor-pointer"
                aria-label="Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* IG Dot Indicators Below Image */}
        {total > 1 && !isZoomed && (
          <div className="flex items-center justify-center gap-1.5 py-2.5 border-b border-white/8 shrink-0">
            {mediaList.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Foto ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all cursor-pointer ${
                  i === safeIdx
                    ? "w-2 h-2 bg-[#E11D2E]"
                    : "w-1.5 h-1.5 bg-zinc-600 hover:bg-zinc-400"
                }`}
              />
            ))}
          </div>
        )}

        {/* Caption Area Below Dots (Instagram Style) */}
        {(item.caption || item.title) && !isZoomed && (
          <div
            data-lenis-prevent
            className="px-4 py-3.5 overflow-y-auto overscroll-contain text-xs sm:text-sm text-zinc-200 leading-relaxed"
          >
            {item.title && (
              <span className="font-semibold text-white mr-2">
                {item.title}
              </span>
            )}
            {item.caption && (
              <span className="text-zinc-300">{item.caption}</span>
            )}
          </div>
        )}
      </motion.div>
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
        style={{ touchAction: "pan-y pinch-zoom" }}
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
                className="w-full h-full shrink-0 flex items-center justify-center overflow-hidden"
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
                    className={
                      fit === "cover"
                        ? "w-full h-full object-cover select-none"
                        : "w-full h-full max-w-full max-h-[55dvh] md:max-h-full object-contain select-none"
                    }
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
                    className="w-full h-full object-contain"
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
