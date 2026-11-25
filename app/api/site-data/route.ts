import { NextResponse } from "next/server";
import { DEFAULT_SITE_DATA } from "@/lib/default-data";
import { verifyAdminRequest } from "@/lib/auth";
import { getSiteData, saveSiteData } from "@/lib/storage";
import { SiteData } from "@/lib/types";

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
    const saved = await saveSiteData(body);
    return NextResponse.json(saved);
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
      return NextResponse.json(resetData);
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
