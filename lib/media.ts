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
