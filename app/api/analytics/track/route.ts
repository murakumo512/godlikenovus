import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/activity-log";
import { recordAnalyticsEvent } from "@/lib/analytics";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: "pageview" | "section" | "media";
      visitorId?: string;
      section?: string;
      mediaKey?: string;
      mediaLabel?: string;
      mediaCategory?: string;
      mediaUrl?: string;
    };

    if (!body?.type || !["pageview", "section", "media"].includes(body.type)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await recordAnalyticsEvent({
      type: body.type,
      visitorId: body.visitorId || "",
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "",
      section: body.section,
      mediaKey: body.mediaKey,
      mediaLabel: body.mediaLabel,
      mediaCategory: body.mediaCategory,
      mediaUrl: body.mediaUrl,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
