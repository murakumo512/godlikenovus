import fs from "fs/promises";
import path from "path";
import { DEFAULT_SITE_DATA } from "./default-data";
import { SiteData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "site-data.json");

export async function getSiteData(): Promise<SiteData> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as SiteData;
  } catch {
    await saveSiteData(DEFAULT_SITE_DATA);
    return DEFAULT_SITE_DATA;
  }
}

export async function saveSiteData(data: SiteData): Promise<SiteData> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  return data;
}
