import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

    return NextResponse.json({ url: `/api/uploads/${fileName}` });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
