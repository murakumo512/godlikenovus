import { NextResponse } from "next/server";
import {
  issueSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  verifyAdminRequest,
} from "@/lib/auth";

export async function POST(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const freshToken = await issueSessionToken(admin);
  const res = NextResponse.json({
    ok: true,
    user: admin,
    ttlSeconds: SESSION_TTL_SECONDS,
  });
  res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
