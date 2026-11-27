import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import {
  issueSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  verifyAdminRequest,
} from "@/lib/auth";
import { appendActivityLog, getClientIp } from "@/lib/activity-log";

export async function POST(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (admin.role === "read") {
    return NextResponse.json(
      { error: "Mode Read-Only tidak diizinkan mengupload file." },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, fileName), buffer);

    const sizeKb = Math.max(1, Math.round(buffer.length / 1024));
    await appendActivityLog({
      action: "upload",
      username: admin.username,
      displayName: admin.displayName,
      detail: `Upload media: ${file.name} (${sizeKb} KB)`,
      ip: getClientIp(request),
    });

    const freshToken = await issueSessionToken(admin);
    const res = NextResponse.json({ url: `/api/uploads/${fileName}` });
    res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
