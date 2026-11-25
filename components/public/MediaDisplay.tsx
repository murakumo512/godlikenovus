"use client";

import { useEffect, useState } from "react";
import { X, Play } from "lucide-react";
import { assetUrl } from "@/lib/base-path";
import { getYouTubeEmbedUrl, isVideoFileUrl } from "@/lib/media";
import { useLockBodyAndLenis } from "./SmoothScroll";

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
          loading="lazy"
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
        loading="lazy"
        className={`w-full h-full ${
          fit === "cover" ? "object-cover" : "object-contain"
        } ${imgClassName}`}
      />
    </div>
  );
}

export interface LightboxMediaItem {
  url: string;
  title?: string;
  caption?: string;
}

/**
 * Clean Instagram-style Fullscreen Photo / Video Viewer:
 * - Zero cluttered buttons covering the image
 * - Click/tap photo directly to toggle 1:1 native original resolution zoom
 * - Smooth native scrolling & panning when zoomed in
 */
export function MediaLightbox({
  item,
  onClose,
}: {
  item: LightboxMediaItem | null;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);

  useLockBodyAndLenis(Boolean(item));

  useEffect(() => {
    setZoomed(false);
  }, [item?.url]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  const ytEmbed = getYouTubeEmbedUrl(item.url);
  const isVideo = isVideoFileUrl(item.url);
  const resolved = assetUrl(item.url);

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-lenis-prevent
      className="fixed inset-0 z-[95] bg-black/95 backdrop-blur-md flex flex-col"
      onClick={onClose}
    >
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
              onClick={(e) => {
                e.stopPropagation();
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
