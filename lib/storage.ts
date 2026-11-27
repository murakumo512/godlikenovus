import fs from "fs/promises";
import path from "path";
import { DEFAULT_SECTION_ORDER, DEFAULT_SITE_DATA } from "./default-data";
import { SectionKey, SiteData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "site-data.json");

function stripRoboticPrefix(val: string | undefined, fallback: string): string {
  if (val === undefined) return fallback;
  const cleaned = val.replace(/^\[\d+\]\s*\/\/\s*/i, "").trim();
  if (val.startsWith("[0") && val.includes("//") && !cleaned) {
    return fallback;
  }
  return cleaned || val;
}

export function normalizeSectionOrder(rawOrder?: SectionKey[]): SectionKey[] {
  const validSet = new Set<SectionKey>(DEFAULT_SECTION_ORDER);
  const result: SectionKey[] = [];
  if (Array.isArray(rawOrder)) {
    for (const item of rawOrder) {
      if (validSet.has(item) && !result.includes(item)) {
        result.push(item);
      }
    }
  }
  for (const def of DEFAULT_SECTION_ORDER) {
    if (!result.includes(def)) {
      if (def === "scrim") {
        const heroIdx = result.indexOf("hero");
        if (heroIdx !== -1) {
          result.splice(heroIdx + 1, 0, "scrim");
        } else {
          result.unshift("scrim");
        }
      } else {
        result.push(def);
      }
    }
  }
  return result;
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
    sectionOrder: normalizeSectionOrder(raw.sectionOrder),
    hiddenSections: Array.isArray(raw.hiddenSections) ? raw.hiddenSections : [],
    adminTabOrder: Array.isArray(raw.adminTabOrder) ? raw.adminTabOrder : undefined,
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
        ? raw.about.photos.map((p) => ({
            ...p,
            images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
          }))
        : DEFAULT_SITE_DATA.about.photos,
    },
    contact: {
      ...DEFAULT_SITE_DATA.contact,
      ...(raw.contact || {}),
    },
    games: Array.isArray(raw.games)
      ? raw.games.map((g) => ({
          ...g,
          bannerImages: Array.isArray(g.bannerImages)
            ? g.bannerImages.filter(Boolean)
            : [],
          roster: Array.isArray(g.roster)
            ? g.roster.map((m) => ({
                ...m,
                images: Array.isArray(m.images) ? m.images.filter(Boolean) : [],
              }))
            : [],
          subTeams: Array.isArray(g.subTeams)
            ? g.subTeams.map((st) => ({
                ...st,
                bannerImages: Array.isArray(st.bannerImages)
                  ? st.bannerImages.filter(Boolean)
                  : [],
                roster: Array.isArray(st.roster)
                  ? st.roster.map((m) => ({
                      ...m,
                      images: Array.isArray(m.images)
                        ? m.images.filter(Boolean)
                        : [],
                    }))
                  : [],
              }))
            : [],
        }))
      : DEFAULT_SITE_DATA.games,
    gallery: Array.isArray(raw.gallery)
      ? raw.gallery.map((evt) => ({
          ...evt,
          images: Array.isArray(evt.images) ? evt.images.filter(Boolean) : [],
        }))
      : DEFAULT_SITE_DATA.gallery,
    ambassadors: Array.isArray(raw.ambassadors)
      ? raw.ambassadors.map((ba) => ({
          ...ba,
          images: Array.isArray(ba.images) ? ba.images.filter(Boolean) : [],
          games: Array.isArray(ba.games) ? ba.games : [],
          socials: Array.isArray(ba.socials) ? ba.socials : [],
        }))
      : DEFAULT_SITE_DATA.ambassadors,
    store: Array.isArray(raw.store)
      ? raw.store.map((p) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
        }))
      : DEFAULT_SITE_DATA.store,
    sponsors: Array.isArray(raw.sponsors)
      ? raw.sponsors
      : DEFAULT_SITE_DATA.sponsors,
    socials: Array.isArray(raw.socials)
      ? raw.socials
      : DEFAULT_SITE_DATA.socials,
    scrimContacts: Array.isArray(raw.scrimContacts) ? raw.scrimContacts : [],
    heroHighlights: Array.isArray(raw.heroHighlights) ? raw.heroHighlights : [],
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
