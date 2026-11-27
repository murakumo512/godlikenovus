import { NextResponse } from "next/server";
import {
  issueSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  verifyAdminRequest,
} from "@/lib/auth";
import {
  createScrimRequest,
  deleteScrimRequest,
  listScrimRequests,
  lookupScrimRequests,
  updateScrimRequestStatus,
} from "@/lib/orders-scrim";
import { appendActivityLog, getClientIp } from "@/lib/activity-log";
import type { ScrimStatus } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isAdminList = searchParams.get("admin") === "1";

  if (isAdminList) {
    const admin = await verifyAdminRequest(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scrims = await listScrimRequests();
    const freshToken = await issueSessionToken(admin);
    const res = NextResponse.json({ scrims });
    res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  }

  const q = searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ scrims: [] });
  }
  const matched = await lookupScrimRequests(q);
  return NextResponse.json({
    scrims: matched.map((s) => ({
      id: s.id,
      scrimCode: s.scrimCode,
      teamName: s.teamName,
      gameName: s.gameName,
      preferredDate: s.preferredDate,
      preferredTime: s.preferredTime,
      format: s.format,
      status: s.status,
      adminNote: s.adminNote || "",
      createdAt: s.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      teamName?: string;
      contactName?: string;
      contactPhone?: string;
      gameName?: string;
      preferredDate?: string;
      preferredTime?: string;
      format?: string;
      notes?: string;
    };
    if (!body.teamName || !body.contactName || !body.contactPhone || !body.gameName) {
      return NextResponse.json(
        { error: "Nama tim, kontak, WhatsApp, dan game wajib diisi." },
        { status: 400 }
      );
    }
    const scrim = await createScrimRequest({
      teamName: body.teamName,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      gameName: body.gameName,
      preferredDate: body.preferredDate || "-",
      preferredTime: body.preferredTime || "-",
      format: body.format || "BO3",
      notes: body.notes || "-",
    });
    return NextResponse.json({ scrim });
  } catch {
    return NextResponse.json(
      { error: "Gagal mengirim scrim request." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (admin.role === "read") {
    return NextResponse.json(
      { error: "Mode Read-Only tidak diizinkan mengubah status scrim." },
      { status: 403 }
    );
  }
  try {
    const body = (await request.json()) as {
      id?: string;
      status?: ScrimStatus;
      adminNote?: string;
    };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "ID & status wajib diisi." }, { status: 400 });
    }
    const updated = await updateScrimRequestStatus(
      body.id,
      body.status,
      body.adminNote
    );
    if (!updated) {
      return NextResponse.json({ error: "Scrim request tidak ditemukan." }, { status: 404 });
    }
    await appendActivityLog({
      action: "edit",
      username: admin.username,
      displayName: admin.displayName,
      detail: `Update status scrim ${updated.scrimCode} (${updated.teamName}) -> ${updated.status}`,
      ip: getClientIp(request),
    });
    const freshToken = await issueSessionToken(admin);
    const res = NextResponse.json({ scrim: updated });
    res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Gagal mengupdate scrim request." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (admin.role === "read") {
    return NextResponse.json(
      { error: "Mode Read-Only tidak diizinkan menghapus scrim." },
      { status: 403 }
    );
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
  }
  await deleteScrimRequest(id);
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
