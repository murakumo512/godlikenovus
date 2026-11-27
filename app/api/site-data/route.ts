import { NextResponse } from "next/server";
import { DEFAULT_SITE_DATA } from "@/lib/default-data";
import {
  issueSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  verifyAdminRequest,
} from "@/lib/auth";
import { appendActivityLog, getClientIp } from "@/lib/activity-log";
import { getSiteData, saveSiteData } from "@/lib/storage";
import { SiteData } from "@/lib/types";

const SECTION_LABELS: Record<string, string> = {
  sectionOrder: "Urutan Section",
  hiddenSections: "Visibilitas Section",
  adminTabOrder: "Urutan Menu Admin",
  branding: "Home & Branding",
  opening: "Opening & Loading",
  templates: "Template Pesan",
  homeSections: "Teks Seksi Home",
  games: "Games & Roster",
  about: "About Us",
  gallery: "Gallery",
  ambassadors: "Brand Ambassador",
  store: "Store",
  sponsors: "Sponsors",
  contact: "Contact",
  socials: "Sosial Media",
};

function summarizeSiteDiff(prev: SiteData, next: SiteData): string {
  const changed: string[] = [];
  for (const key of Object.keys(SECTION_LABELS)) {
    const k = key as keyof SiteData;
    if (JSON.stringify(prev[k]) !== JSON.stringify(next[k])) {
      changed.push(SECTION_LABELS[key]);
    }
  }
  if (changed.length === 0) return "Simpan konten website (tanpa perubahan struktur)";
  return `Edit konten: ${changed.join(", ")}`;
}

export async function GET() {
  try {
    const data = await getSiteData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to read site data:", error);
    return NextResponse.json(
      { error: "Failed to load site data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SiteData;
    if (!body || !body.branding || !Array.isArray(body.games)) {
      return NextResponse.json(
        { error: "Invalid site data payload" },
        { status: 400 }
      );
    }
    const prev = await getSiteData();
    const saved = await saveSiteData(body);
    await appendActivityLog({
      action: "edit",
      username: admin.username,
      displayName: admin.displayName,
      detail: summarizeSiteDiff(prev, saved),
      ip: getClientIp(request),
    });

    const freshToken = await issueSessionToken(admin);
    const res = NextResponse.json(saved);
    res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch (error) {
    console.error("Failed to save site data:", error);
    return NextResponse.json(
      { error: "Failed to save site data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { action?: string };
    if (body.action === "reset") {
      const resetData = await saveSiteData(DEFAULT_SITE_DATA);
      await appendActivityLog({
        action: "reset",
        username: admin.username,
        displayName: admin.displayName,
        detail: "Reset seluruh konten website ke default",
        ip: getClientIp(request),
      });
      const freshToken = await issueSessionToken(admin);
      const res = NextResponse.json(resetData);
      res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
      });
      return res;
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to process action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
