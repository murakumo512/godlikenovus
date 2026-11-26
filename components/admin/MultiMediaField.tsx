"use client";

import { useContext, useRef, useState } from "react";
import {
  Upload,
  Loader2,
  X,
  FolderOpen,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  Images,
} from "lucide-react";
import { assetUrl, BASE_PATH } from "@/lib/base-path";
import { isVideoFileUrl } from "@/lib/media";
import { AdminAutoSaveContext } from "./ImageField";

interface UploadedServerFile {
  name: string;
  label: string;
  url: string;
  size: number;
  mtime: number;
}

interface MultiMediaFieldProps {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  onPromoteToCover?: (url: string, index: number) => void;
}

export function MultiMediaField({
  label,
  values,
  onChange,
  onPromoteToCover,
}: MultiMediaFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { scheduleAutoSave } = useContext(AdminAutoSaveContext);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Server gallery multi-select modal
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<UploadedServerFile[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleDropItem = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const next = [...values];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
    scheduleAutoSave();
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleBulkFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;

    setUploading(true);
    setErrorMsg(null);
    setUploadProgress({ done: 0, total: fileList.length });

    const uploadedUrls: string[] = [];
    let failedCount = 0;

    try {
      // Upload in batches of 3 so mobile/slow connections stay reliable
      for (let i = 0; i < fileList.length; i += 3) {
        const batch = fileList.slice(i, i + 3);
        const results = await Promise.all(
          batch.map(async (file) => {
            try {
              const formData = new FormData();
              formData.append("file", file);
              const res = await fetch(`${BASE_PATH}/api/upload`, {
                method: "POST",
                body: formData,
              });
              if (!res.ok) return null;
              const json = (await res.json()) as { url: string };
              return json.url;
            } catch {
              return null;
            }
          })
        );

        for (const u of results) {
          if (u) uploadedUrls.push(u);
          else failedCount += 1;
        }
        setUploadProgress({
          done: Math.min(i + batch.length, fileList.length),
          total: fileList.length,
        });
      }

      if (uploadedUrls.length > 0) {
        onChange([...values, ...uploadedUrls]);
        scheduleAutoSave();
      }
      if (failedCount > 0) {
        setErrorMsg(`${failedCount} file gagal diupload.`);
      }
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openServerGallery = async () => {
    setGalleryOpen(true);
    setSelectedUrls([]);
    setGalleryLoading(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/uploads-list`);
      if (res.ok) {
        const json = (await res.json()) as { files: UploadedServerFile[] };
        setGalleryFiles(json.files || []);
      }
    } finally {
      setGalleryLoading(false);
    }
  };

  const toggleGallerySelect = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const applySelectedFromGallery = () => {
    if (selectedUrls.length > 0) {
      onChange([...values, ...selectedUrls]);
      scheduleAutoSave();
    }
    setGalleryOpen(false);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    onChange(next);
  };

  const removeItem = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
    scheduleAutoSave();
  };

  const filteredGallery = galleryFiles.filter((f) => {
    if (!searchQuery.trim()) return true;
    return f.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
            <Images className="w-3.5 h-3.5 text-red-600" />
            {label} ({values.length} foto/video)
          </label>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Bisa pilih banyak foto aktivitas sekaligus dari HP/laptop atau dari Galeri Server.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm,video/quicktime"
            onChange={handleBulkFiles}
            className="hidden"
          />
          <button
            type="button"
            onClick={openServerGallery}
            className="inline-flex items-center gap-1 rounded border border-zinc-300 bg-white hover:border-red-600 hover:text-red-600 text-zinc-700 px-2.5 py-1.5 text-xs font-medium transition cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Pilih Galeri</span>
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded border border-red-600 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-2.5 py-1.5 text-xs font-medium transition cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>
              {uploadProgress
                ? `Upload ${uploadProgress.done}/${uploadProgress.total}...`
                : "Upload Banyak Foto"}
            </span>
          </button>
        </div>
      </div>

      {errorMsg && <p className="text-[11px] text-red-600">{errorMsg}</p>}

      {values.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {values.map((url, idx) => {
            const isVid = isVideoFileUrl(url);
            return (
              <div
                key={`${url}-${idx}`}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overIdx !== idx) setOverIdx(idx);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropItem(idx);
                }}
                onDragEnd={() => {
                  setDragIdx(null);
                  setOverIdx(null);
                }}
                className={`group relative rounded border bg-white overflow-hidden flex flex-col cursor-grab active:cursor-grabbing transition ${
                  overIdx === idx && dragIdx !== idx
                    ? "border-red-500 ring-2 ring-red-400"
                    : "border-zinc-200"
                } ${dragIdx === idx ? "opacity-45" : ""}`}
              >
                <div className="relative aspect-square bg-zinc-900 flex items-center justify-center overflow-hidden">
                  {isVid ? (
                    <video
                      src={assetUrl(url)}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={assetUrl(url)}
                      alt={`Foto ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span className="absolute top-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    title="Hapus foto ini"
                    className="absolute top-1 right-1 rounded-full bg-black/75 hover:bg-red-600 p-1 text-white transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="px-1 py-1 bg-white border-t border-zinc-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveItem(idx, -1)}
                      title="Geser kiri"
                      className="p-0.5 rounded text-zinc-500 hover:text-zinc-900 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === values.length - 1}
                      onClick={() => moveItem(idx, 1)}
                      title="Geser kanan"
                      className="p-0.5 rounded text-zinc-500 hover:text-zinc-900 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {onPromoteToCover && (
                    <button
                      type="button"
                      onClick={() => onPromoteToCover(url, idx)}
                      title="Jadikan Foto Cover Utama"
                      className="inline-flex items-center gap-0.5 text-[10px] font-medium text-zinc-500 hover:text-red-600 cursor-pointer"
                    >
                      <Star className="w-3 h-3" />
                      <span>Cover</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-Select Server Gallery Modal */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs p-3 sm:p-6 flex items-center justify-center"
          onClick={() => setGalleryOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[86vh] rounded-xl bg-white border border-zinc-200 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Pilih Banyak Foto dari Galeri Server
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Klik beberapa foto yang ingin ditambahkan ke dokumentasi event ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama file..."
                className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {galleryLoading ? (
                <div className="py-12 flex items-center justify-center text-xs text-zinc-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                  Memuat daftar file dari server...
                </div>
              ) : filteredGallery.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500">
                  Tidak ada file yang cocok.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {filteredGallery.map((file) => {
                    const isPicked = selectedUrls.includes(file.url);
                    const isVid = isVideoFileUrl(file.url);
                    return (
                      <button
                        key={file.name}
                        type="button"
                        onClick={() => toggleGallerySelect(file.url)}
                        className={`group relative text-left rounded-lg border overflow-hidden transition cursor-pointer flex flex-col ${
                          isPicked
                            ? "border-red-600 ring-2 ring-red-600/30"
                            : "border-zinc-200 hover:border-red-500"
                        }`}
                      >
                        <div className="aspect-square bg-zinc-900 flex items-center justify-center p-1.5 overflow-hidden relative">
                          {isVid ? (
                            <video
                              src={assetUrl(file.url)}
                              muted
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={assetUrl(file.url)}
                              alt={file.label}
                              loading="lazy"
                              className="max-w-full max-h-full object-contain group-hover:scale-105 transition"
                            />
                          )}
                          {isPicked && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="p-1.5 bg-white border-t border-zinc-100">
                          <span className="block text-[10px] font-medium text-zinc-700 truncate">
                            {file.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-600">
                {selectedUrls.length} file dipilih
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGalleryOpen(false)}
                  className="px-3 py-1.5 rounded border border-zinc-300 bg-white text-xs font-medium text-zinc-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={selectedUrls.length === 0}
                  onClick={applySelectedFromGallery}
                  className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 text-xs font-semibold text-white cursor-pointer"
                >
                  Tambahkan ({selectedUrls.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
