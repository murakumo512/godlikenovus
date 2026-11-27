import { NextResponse } from "next/server";
import {
  authenticateAdmin,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "@/lib/auth";
import { appendActivityLog, getClientIp } from "@/lib/activity-log";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const result = await authenticateAdmin(body.username, body.password);
    if (!result) {
      await appendActivityLog({
        action: "login_failed",
        username: body.username.trim(),
        displayName: body.username.trim(),
        detail: "Percobaan login gagal (username atau password salah)",
        ip,
      });
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    await appendActivityLog({
      action: "login",
      username: result.user.username,
      displayName: result.user.displayName,
      detail: "Berhasil login ke panel admin",
      ip,
    });

    const res = NextResponse.json({ user: result.user });
    res.cookies.set(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Gagal memproses login." },
      { status: 500 }
    );
  }
}
