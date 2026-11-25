import fs from "fs/promises";
import path from "path";
import { DEFAULT_SITE_DATA } from "./default-data";
import { SiteData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "site-data.json");

function stripRoboticPrefix(val: string | undefined, fallback: string): string {
  if (val === undefined) return fallback;
  // Clean old default "[02] // ..." robotic AI prefixes automatically while preserving real user text
  const cleaned = val.replace(/^\[\d+\]\s*\/\/\s*/i, "").trim();
  if (val.startsWith("[0") && val.includes("//") && !cleaned) {
    return fallback;
  }
  return cleaned || val;
}

export function normalizeSiteData(raw: Partial<SiteData>): SiteData {
  const mergedHome = {
    ...DEFAULT_SITE_DATA.homeSections,
    ...(raw.homeSections || {}),
  };

  mergedHome.rosterBadge = stripRoboticPrefix(
    raw.homeSections?.rosterBadge,
    DEFAULT_SITE_DATA.homeSections.rosterBadge
  );
  mergedHome.galleryBadge = stripRoboticPrefix(
    raw.homeSections?.galleryBadge,
    DEFAULT_SITE_DATA.homeSections.galleryBadge
  );
  mergedHome.storeBadge = stripRoboticPrefix(
    raw.homeSections?.storeBadge,
    DEFAULT_SITE_DATA.homeSections.storeBadge
  );
  mergedHome.sponsorsBadge = stripRoboticPrefix(
    raw.homeSections?.sponsorsBadge,
    DEFAULT_SITE_DATA.homeSections.sponsorsBadge
  );
  mergedHome.contactBadge = stripRoboticPrefix(
    raw.homeSections?.contactBadge,
    DEFAULT_SITE_DATA.homeSections.contactBadge
  );
  if (raw.homeSections?.aboutBadgePrefix === "[03] //") {
    mergedHome.aboutBadgePrefix = "";
  }

  return {
    ...DEFAULT_SITE_DATA,
    ...raw,
    branding: {
      ...DEFAULT_SITE_DATA.branding,
      ...(raw.branding || {}),
      navLabels: {
        ...DEFAULT_SITE_DATA.branding.navLabels!,
        ...(raw.branding?.navLabels || {}),
      },
    },
    opening: {
      ...DEFAULT_SITE_DATA.opening,
      ...(raw.opening || {}),
    },
    templates: {
      ...DEFAULT_SITE_DATA.templates,
      ...(raw.templates || {}),
    },
    homeSections: mergedHome,
    about: {
      ...DEFAULT_SITE_DATA.about,
      ...(raw.about || {}),
      stats: Array.isArray(raw.about?.stats)
        ? raw.about.stats
        : DEFAULT_SITE_DATA.about.stats,
      photos: Array.isArray(raw.about?.photos)
        ? raw.about.photos
        : DEFAULT_SITE_DATA.about.photos,
    },
    contact: {
      ...DEFAULT_SITE_DATA.contact,
      ...(raw.contact || {}),
    },
    games: Array.isArray(raw.games)
      ? raw.games.map((g) => ({
          ...g,
          roster: Array.isArray(g.roster) ? g.roster : [],
          subTeams: Array.isArray(g.subTeams)
            ? g.subTeams.map((st) => ({
                ...st,
                roster: Array.isArray(st.roster) ? st.roster : [],
              }))
            : [],
        }))
      : DEFAULT_SITE_DATA.games,
    gallery: Array.isArray(raw.gallery)
      ? raw.gallery
      : DEFAULT_SITE_DATA.gallery,
    ambassadors: Array.isArray(raw.ambassadors)
      ? raw.ambassadors.map((ba) => ({
          ...ba,
          games: Array.isArray(ba.games) ? ba.games : [],
          socials: Array.isArray(ba.socials) ? ba.socials : [],
        }))
      : DEFAULT_SITE_DATA.ambassadors,
    store: Array.isArray(raw.store) ? raw.store : DEFAULT_SITE_DATA.store,
    sponsors: Array.isArray(raw.sponsors)
      ? raw.sponsors
      : DEFAULT_SITE_DATA.sponsors,
    socials: Array.isArray(raw.socials)
      ? raw.socials
      : DEFAULT_SITE_DATA.socials,
  };
}

export async function getSiteData(): Promise<SiteData> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<SiteData>;
    return normalizeSiteData(parsed);
  } catch {
    await saveSiteData(DEFAULT_SITE_DATA);
    return DEFAULT_SITE_DATA;
  }
}

export async function saveSiteData(data: SiteData): Promise<SiteData> {
  const normalized = normalizeSiteData(data);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(normalized, null, 2), "utf-8");
  return normalized;
}
