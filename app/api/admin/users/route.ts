import { NextResponse } from "next/server";
import {
  changeAdminPassword,
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  verifyAdminRequest,
} from "@/lib/auth";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await listAdminUsers();
  return NextResponse.json({ users, currentUser: admin });
}

export async function POST(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      action?: "create" | "change-password" | "delete";
      username?: string;
      displayName?: string;
      password?: string;
      userId?: string;
      newPassword?: string;
    };

    if (body.action === "create") {
      await createAdminUser(
        body.username || "",
        body.displayName || "",
        body.password || ""
      );
      const users = await listAdminUsers();
      return NextResponse.json({ users });
    }

    if (body.action === "change-password") {
      const targetId = body.userId || admin.id;
      await changeAdminPassword(targetId, body.newPassword || "");
      return NextResponse.json({ ok: true });
    }

    if (body.action === "delete") {
      await deleteAdminUser(body.userId || "", admin.id);
      const users = await listAdminUsers();
      return NextResponse.json({ users });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses aksi.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
