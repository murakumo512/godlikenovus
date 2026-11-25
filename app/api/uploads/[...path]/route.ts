import { serveUploadedFile } from "@/lib/serve-upload";

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  return serveUploadedFile(request, segments);
}
