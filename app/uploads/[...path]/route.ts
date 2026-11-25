import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await context.params;
    const safeSegments = segments.map((s) => path.basename(s));
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      ...safeSegments
    );

    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
