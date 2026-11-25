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
  ".heic": "image/heic",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".ogg": "video/ogg",
  ".ogv": "video/ogg",
};

export async function serveUploadedFile(
  request: Request,
  segments: string[]
): Promise<NextResponse> {
  try {
    const safeSegments = segments.map((s) => path.basename(s));
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      ...safeSegments
    );

    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const totalSize = stat.size;
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2]
          ? Math.min(parseInt(match[2], 10), totalSize - 1)
          : Math.min(start + 4 * 1024 * 1024 - 1, totalSize - 1);

        if (start >= totalSize || start > end) {
          return new NextResponse(null, {
            status: 416,
            headers: {
              "Content-Range": `bytes */${totalSize}`,
            },
          });
        }

        const chunkLength = end - start + 1;
        const handle = await fs.open(filePath, "r");
        try {
          const chunk = Buffer.alloc(chunkLength);
          await handle.read(chunk, 0, chunkLength, start);
          return new NextResponse(chunk, {
            status: 206,
            headers: {
              "Content-Type": contentType,
              "Content-Length": String(chunkLength),
              "Content-Range": `bytes ${start}-${end}/${totalSize}`,
              "Accept-Ranges": "bytes",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        } finally {
          await handle.close();
        }
      }
    }

    const buffer = await fs.readFile(filePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(totalSize),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
