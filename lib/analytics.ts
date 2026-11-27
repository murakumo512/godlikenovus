import fs from "fs/promises";
import path from "path";

export interface MediaClickStat {
  key: string;
  label: string;
  category: string;
  url: string;
  count: number;
  lastClickedAt: string;
}

export interface RecentVisitEntry {
  id: string;
  timestamp: string;
  ip: string;
  device: "Mobile" | "Desktop";
  browser: string;
  event: "pageview" | "section" | "media";
  target: string;
}

export interface SiteAnalyticsStore {
  totalPageViews: number;
  uniqueVisitorIds: string[];
  deviceCounts: { mobile: number; desktop: number };
  sectionCounts: Record<string, number>;
  mediaClicks: Record<string, MediaClickStat>;
  recentVisits: RecentVisitEntry[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const ANALYTICS_FILE = path.join(DATA_DIR, "site-analytics.json");
const MAX_UNIQUE_IDS = 5000;
const MAX_RECENT_VISITS = 200;

const EMPTY_ANALYTICS: SiteAnalyticsStore = {
  totalPageViews: 0,
  uniqueVisitorIds: [],
  deviceCounts: { mobile: 0, desktop: 0 },
  sectionCounts: {},
  mediaClicks: {},
  recentVisits: [],
};

export function parseUserAgent(ua: string): {
  device: "Mobile" | "Desktop";
  browser: string;
} {
  const lower = ua.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
    lower
  );
  let browser = "Browser";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("opr/") || lower.includes("opera")) browser = "Opera";
  else if (lower.includes("chrome/") && !lower.includes("edg/")) browser = "Chrome";
  else if (lower.includes("safari/") && !lower.includes("chrome/")) browser = "Safari";
  else if (lower.includes("firefox/")) browser = "Firefox";
  return {
    device: isMobile ? "Mobile" : "Desktop",
    browser,
  };
}

async function readAnalyticsRaw(): Promise<SiteAnalyticsStore> {
  try {
    const raw = await fs.readFile(ANALYTICS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<SiteAnalyticsStore>;
    return {
      totalPageViews: parsed.totalPageViews || 0,
      uniqueVisitorIds: Array.isArray(parsed.uniqueVisitorIds)
        ? parsed.uniqueVisitorIds
        : [],
      deviceCounts: {
        mobile: parsed.deviceCounts?.mobile || 0,
        desktop: parsed.deviceCounts?.desktop || 0,
      },
      sectionCounts: parsed.sectionCounts || {},
      mediaClicks: parsed.mediaClicks || {},
      recentVisits: Array.isArray(parsed.recentVisits) ? parsed.recentVisits : [],
    };
  } catch {
    return {
      ...EMPTY_ANALYTICS,
      uniqueVisitorIds: [],
      deviceCounts: { mobile: 0, desktop: 0 },
      sectionCounts: {},
      mediaClicks: {},
      recentVisits: [],
    };
  }
}

async function writeAnalytics(store: SiteAnalyticsStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ANALYTICS_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export async function recordAnalyticsEvent(input: {
  type: "pageview" | "section" | "media";
  visitorId: string;
  ip: string;
  userAgent: string;
  section?: string;
  mediaKey?: string;
  mediaLabel?: string;
  mediaCategory?: string;
  mediaUrl?: string;
}): Promise<void> {
  const store = await readAnalyticsRaw();
  const { device, browser } = parseUserAgent(input.userAgent);
  const now = new Date().toISOString();

  if (input.type === "pageview") {
    store.totalPageViews += 1;
    if (device === "Mobile") store.deviceCounts.mobile += 1;
    else store.deviceCounts.desktop += 1;

    const vid = input.visitorId || input.ip;
    if (vid && !store.uniqueVisitorIds.includes(vid)) {
      store.uniqueVisitorIds.push(vid);
      if (store.uniqueVisitorIds.length > MAX_UNIQUE_IDS) {
        store.uniqueVisitorIds = store.uniqueVisitorIds.slice(-MAX_UNIQUE_IDS);
      }
    }

    store.recentVisits = [
      {
        id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now,
        ip: input.ip,
        device,
        browser,
        event: "pageview" as const,
        target: "Home",
      },
      ...store.recentVisits,
    ].slice(0, MAX_RECENT_VISITS);
  } else if (input.type === "section" && input.section) {
    const sec = input.section.trim();
    store.sectionCounts[sec] = (store.sectionCounts[sec] || 0) + 1;
    store.recentVisits = [
      {
        id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now,
        ip: input.ip,
        device,
        browser,
        event: "section" as const,
        target: sec,
      },
      ...store.recentVisits,
    ].slice(0, MAX_RECENT_VISITS);
  } else if (input.type === "media" && input.mediaKey) {
    const key = input.mediaKey.trim();
    const existing = store.mediaClicks[key];
    store.mediaClicks[key] = {
      key,
      label: input.mediaLabel || existing?.label || key,
      category: input.mediaCategory || existing?.category || "Media",
      url: input.mediaUrl || existing?.url || "",
      count: (existing?.count || 0) + 1,
      lastClickedAt: now,
    };
    store.recentVisits = [
      {
        id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now,
        ip: input.ip,
        device,
        browser,
        event: "media" as const,
        target: input.mediaLabel || key,
      },
      ...store.recentVisits,
    ].slice(0, MAX_RECENT_VISITS);
  }

  await writeAnalytics(store);
}

export async function getAnalyticsSummary() {
  const store = await readAnalyticsRaw();
  const topSections = Object.entries(store.sectionCounts)
    .map(([section, count]) => ({ section, count }))
    .sort((a, b) => b.count - a.count);

  const topMedia = Object.values(store.mediaClicks).sort(
    (a, b) => b.count - a.count
  );

  const totalSectionClicks = topSections.reduce((sum, s) => sum + s.count, 0);
  const totalMediaClicks = topMedia.reduce((sum, m) => sum + m.count, 0);

  return {
    totalPageViews: store.totalPageViews,
    uniqueVisitors: store.uniqueVisitorIds.length,
    totalSectionClicks,
    totalMediaClicks,
    deviceCounts: store.deviceCounts,
    topSections,
    topMedia,
    recentVisits: store.recentVisits,
  };
}

export async function resetAnalytics(): Promise<void> {
  await writeAnalytics({
    ...EMPTY_ANALYTICS,
    uniqueVisitorIds: [],
    deviceCounts: { mobile: 0, desktop: 0 },
    sectionCounts: {},
    mediaClicks: {},
    recentVisits: [],
  });
}
