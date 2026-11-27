import { NextResponse } from "next/server";
import {
  ActivityLogConfig,
  clearActivityLogs,
  getActivityLogs,
  saveActivityLogConfig,
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
  const { logs, config } = await getActivityLogs();
  const freshToken = await issueSessionToken(admin);
  const res = NextResponse.json({ logs, config });
  res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

export async function PUT(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (admin.role !== "full") {
    return NextResponse.json(
      { error: "Hanya admin Full Access yang dapat mengubah pengaturan log." },
      { status: 403 }
    );
  }
  try {
    const body = (await request.json()) as Partial<ActivityLogConfig>;
    const config = await saveActivityLogConfig(body);
    const { logs } = await getActivityLogs();
    const freshToken = await issueSessionToken(admin);
    const res = NextResponse.json({ config, logs });
    res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan log." },
      { status: 400 }
    );
  }
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
