import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifyAdminRequest } from "@/lib/auth";
import { appendActivityLog, getClientIp } from "@/lib/activity-log";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const admin = await verifyAdminRequest(request);
  let reason = "manual";
  try {
    const body = (await request.json()) as { reason?: string };
    if (body?.reason) reason = body.reason;
  } catch {
    // empty body is fine
  }

  if (admin) {
    await appendActivityLog({
      action: reason === "timeout" ? "session_timeout" : "logout",
      username: admin.username,
      displayName: admin.displayName,
      detail:
        reason === "timeout"
          ? "Sesi berakhir otomatis (idle 10 menit)"
          : "Keluar dari panel admin",
      ip,
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
