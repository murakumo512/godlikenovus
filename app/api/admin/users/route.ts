import { NextResponse } from "next/server";
import {
  changeAdminPassword,
  createAdminUser,
  deleteAdminUser,
  issueSessionToken,
  listAdminUsers,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  updateAdminUserRole,
  verifyAdminRequest,
} from "@/lib/auth";
import { appendActivityLog, getClientIp } from "@/lib/activity-log";
import type { AdminRole, AdminTabId } from "@/lib/types";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await listAdminUsers();
  const freshToken = await issueSessionToken(admin);
  const res = NextResponse.json({ users, currentUser: admin });
  res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

export async function POST(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);

  try {
    const body = (await request.json()) as {
      action?: "create" | "change-password" | "delete" | "update-role";
      username?: string;
      displayName?: string;
      password?: string;
      role?: AdminRole;
      allowedTabs?: AdminTabId[];
      userId?: string;
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const freshToken = await issueSessionToken(admin);
    const attach = (res: NextResponse) => {
      res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
      });
      return res;
    };

    if (body.action === "create") {
      if (admin.role !== "full") {
        return NextResponse.json(
          { error: "Hanya admin Full Access yang dapat menambah akun." },
          { status: 403 }
        );
      }
      const created = await createAdminUser(
        body.username || "",
        body.displayName || "",
        body.password || "",
        body.role || "full",
        Array.isArray(body.allowedTabs) ? body.allowedTabs : []
      );
      await appendActivityLog({
        action: "user_create",
        username: admin.username,
        displayName: admin.displayName,
        detail: `Tambah akun admin baru: ${created.username} (mode: ${created.role})`,
        ip,
      });
      const users = await listAdminUsers();
      return attach(NextResponse.json({ users }));
    }

    if (body.action === "update-role") {
      if (admin.role !== "full") {
        return NextResponse.json(
          { error: "Hanya admin Full Access yang dapat mengubah role akun." },
          { status: 403 }
        );
      }
      await updateAdminUserRole(
        body.userId || "",
        admin.id,
        body.role || "full",
        Array.isArray(body.allowedTabs) ? body.allowedTabs : []
      );
      await appendActivityLog({
        action: "user_create",
        username: admin.username,
        displayName: admin.displayName,
        detail: `Ubah hak akses akun (${body.userId}) menjadi ${body.role}`,
        ip,
      });
      const users = await listAdminUsers();
      return attach(NextResponse.json({ users }));
    }

    if (body.action === "change-password") {
      if (admin.role === "read") {
        return NextResponse.json(
          { error: "Mode Read-Only tidak diizinkan mengganti password." },
          { status: 403 }
        );
      }
      const targetId = body.userId || admin.id;
      if (admin.role !== "full" && targetId !== admin.id) {
        return NextResponse.json(
          { error: "Anda hanya dapat mengganti password akun sendiri." },
          { status: 403 }
        );
      }
      if (!body.confirmPassword || body.newPassword !== body.confirmPassword) {
        return NextResponse.json(
          { error: "Konfirmasi password baru tidak cocok." },
          { status: 400 }
        );
      }
      await changeAdminPassword(
        targetId,
        body.currentPassword || "",
        body.newPassword || ""
      );
      await appendActivityLog({
        action: "user_password",
        username: admin.username,
        displayName: admin.displayName,
        detail: `Ubah password akun admin (${targetId === admin.id ? "akun sendiri" : targetId})`,
        ip,
      });
      return attach(NextResponse.json({ ok: true }));
    }

    if (body.action === "delete") {
      if (admin.role !== "full") {
        return NextResponse.json(
          { error: "Hanya admin Full Access yang dapat menghapus akun." },
          { status: 403 }
        );
      }
      await deleteAdminUser(body.userId || "", admin.id);
      await appendActivityLog({
        action: "user_delete",
        username: admin.username,
        displayName: admin.displayName,
        detail: `Hapus akun admin (${body.userId})`,
        ip,
      });
      const users = await listAdminUsers();
      return attach(NextResponse.json({ users }));
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses aksi.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
