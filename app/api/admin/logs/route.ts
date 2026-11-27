import { NextResponse } from "next/server";
import {
  clearActivityLogs,
  getActivityLogs,
} from "@/lib/activity-log";
import {
  issueSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  verifyAdminRequest,
} from "@/lib/auth";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const logs = await getActivityLogs(300);
  const freshToken = await issueSessionToken(admin);
  const res = NextResponse.json({ logs });
  res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

export async function DELETE(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (admin.role !== "full") {
    return NextResponse.json(
      { error: "Hanya admin Full Access yang dapat membersihkan log." },
      { status: 403 }
    );
  }
  await clearActivityLogs();
  const freshToken = await issueSessionToken(admin);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
