import fs from "fs/promises";
import path from "path";
import { DEFAULT_SITE_DATA } from "./default-data";
import { SiteData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "site-data.json");

export function normalizeSiteData(raw: Partial<SiteData>): SiteData {
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
    homeSections: {
      ...DEFAULT_SITE_DATA.homeSections,
      ...(raw.homeSections || {}),
    },
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
