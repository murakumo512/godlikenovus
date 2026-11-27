export async function compressImageForUpload(
  file: File,
  maxDimension = 1600,
  quality = 0.86
): Promise<File> {
  if (typeof window === "undefined") return file;
  const type = file.type || "";
  // Skip non-images, SVGs, and GIFs (keep animations/vectors intact)
  if (!type.startsWith("image/") || type === "image/svg+xml" || type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const { naturalWidth: w, naturalHeight: h } = img;
        if (w <= maxDimension && h <= maxDimension && file.size <= 700 * 1024) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }
        const scale = Math.min(1, maxDimension / Math.max(w, h));
        const targetW = Math.max(1, Math.round(w * scale));
        const targetH = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const outType = type === "image/png" ? "image/png" : "image/jpeg";
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob || blob.size >= file.size) {
              resolve(file);
              return;
            }
            resolve(new File([blob], file.name, { type: outType }));
          },
          outType,
          quality
        );
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}
