export const BASE_PATH = "";

export function assetUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("/uploads/")) {
    return `/api${url}`;
  }
  return url;
}
