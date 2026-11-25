"use client";

import { useEffect, useState } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  ExternalLink,
  Play,
  Maximize2,
} from "lucide-react";
import { assetUrl } from "@/lib/base-path";
import { getYouTubeEmbedUrl, isVideoFileUrl } from "@/lib/media";

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
          <span className="pointer-events-none absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded bg-black/80 border border-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <Play className="w-3 h-3 text-[#E11D2E] fill-[#E11D2E]" /> Video
          </span>
        )}
      </div>
    );
  }

  if (fit === "contain-ambient") {
    return (
      <div className={`relative bg-zinc-950 overflow-hidden ${className}`}>
        {/* Subtle blurred ambient fill so portrait/landscape images never get cropped and never leave stark gaps */}
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

export function MediaLightbox({
  item,
  onClose,
}: {
  item: LightboxMediaItem | null;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(
    null
  );

  useEffect(() => {
    setZoomed(false);
    setDimensions(null);
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
      className="fixed inset-0 z-[90] flex flex-col bg-black/95 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Top Action Bar */}
      <div
        className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 border-b border-white/10 bg-black/80 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          {item.title && (
            <div className="font-display text-sm sm:text-base font-bold uppercase text-white truncate">
              {item.title}
            </div>
          )}
          <div className="text-[10px] sm:text-xs font-mono text-zinc-400 flex items-center gap-2">
            {dimensions ? (
              <span className="text-[#E11D2E]">
                {dimensions.w} × {dimensions.h} px (Original)
              </span>
            ) : (
              <span>ORIGINAL QUALITY</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!ytEmbed && !isVideo && (
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 hover:border-white px-2.5 py-1.5 text-xs font-medium text-white transition cursor-pointer"
            >
              {zoomed ? (
                <>
                  <ZoomOut className="w-3.5 h-3.5 text-[#E11D2E]" />
                  <span className="hidden sm:inline">Fit Layar</span>
                </>
              ) : (
                <>
                  <ZoomIn className="w-3.5 h-3.5 text-[#E11D2E]" />
                  <span className="hidden sm:inline">Ukuran Asli 1:1</span>
                </>
              )}
            </button>
          )}

          {!ytEmbed && (
            <a
              href={resolved}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 hover:border-white px-2.5 py-1.5 text-xs font-medium text-white transition"
              title="Buka / Download Resolusi Asli"
            >
              <Download className="w-3.5 h-3.5 text-[#E11D2E]" />
              <span className="hidden sm:inline">Original</span>
              <ExternalLink className="w-3 h-3 opacity-60 sm:hidden" />
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded bg-[#E11D2E] hover:bg-red-500 p-1.5 text-white transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        className={`flex-1 overflow-auto flex ${
          zoomed ? "items-start justify-start p-2 sm:p-6" : "items-center justify-center p-2 sm:p-6"
        }`}
        onClick={onClose}
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
            className="max-w-full max-h-[82vh] w-auto h-auto rounded-lg bg-black shadow-2xl"
          />
        ) : (
          <img
            src={resolved}
            alt={item.title || item.caption || "Preview"}
            onLoad={(e) =>
              setDimensions({
                w: e.currentTarget.naturalWidth,
                h: e.currentTarget.naturalHeight,
              })
            }
            onClick={(e) => {
              e.stopPropagation();
              setZoomed((z) => !z);
            }}
            className={
              zoomed
                ? "max-w-none w-auto h-auto cursor-zoom-out mx-auto"
                : "max-w-full max-h-[82vh] w-auto h-auto object-contain cursor-zoom-in select-none shadow-2xl"
            }
          />
        )}
      </div>

      {item.caption && (
        <div
          className="px-4 py-2.5 border-t border-white/10 bg-black/85 text-center text-xs sm:text-sm text-zinc-300 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {item.caption}
        </div>
      )}
    </div>
  );
}

export function ExpandMediaBadge({ label = "Ukuran Asli" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-black/75 border border-white/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white group-hover:bg-[#E11D2E] group-hover:border-[#E11D2E] transition">
      <Maximize2 className="w-3 h-3" />
      {label}
    </span>
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
