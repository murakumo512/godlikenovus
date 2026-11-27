const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?.*)?$/i;

export function isVideoFileUrl(url?: string | null): boolean {
  if (!url) return false;
  return VIDEO_EXT_RE.test(url.trim());
}

export function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const ytMatch =
    trimmed.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    ) || null;
  if (!ytMatch) return null;
  return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&playsinline=1`;
}

export function isAnyVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return isVideoFileUrl(url) || Boolean(getYouTubeEmbedUrl(url));
}

export function collectMediaList(
  ...sources: Array<string | string[] | undefined | null>
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const src of sources) {
    if (!src) continue;
    const list = Array.isArray(src) ? src : [src];
    for (const item of list) {
      const trimmed = typeof item === "string" ? item.trim() : "";
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        result.push(trimmed);
      }
    }
  }
  return result;
}

export function collectVisibleMediaList(
  hiddenImages: string[] | undefined,
  ...sources: Array<string | string[] | undefined | null>
): string[] {
  const hiddenSet = new Set(
    (hiddenImages || []).map((u) => u.trim()).filter(Boolean)
  );
  return collectMediaList(...sources).filter((u) => !hiddenSet.has(u));
}
