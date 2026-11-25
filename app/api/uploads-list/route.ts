import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";

const MEDIA_EXT = /\.(png|jpe?g|webp|gif|svg|avif|ico|mp4|webm|mov|m4v|ogg)$/i;

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const entries = await fs.readdir(uploadDir);

    const filesWithStats = await Promise.all(
      entries
        .filter((name) => !name.startsWith(".") && MEDIA_EXT.test(name))
        .map(async (name) => {
          try {
            const st = await fs.stat(path.join(uploadDir, name));
            return {
              name,
              label: name.replace(/^\d+-/, ""),
              url: `/api/uploads/${name}`,
              size: st.size,
              mtime: st.mtimeMs,
            };
          } catch {
            return null;
          }
        })
    );

    const sorted = filesWithStats
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => b.mtime - a.mtime);

    return NextResponse.json({ files: sorted });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
