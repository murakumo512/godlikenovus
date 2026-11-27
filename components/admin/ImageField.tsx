"use client";

import { createContext, useContext, useRef, useState } from "react";
import {
  Upload,
  Loader2,
  X,
  Film,
  PlaySquare,
  FolderOpen,
  Search,
  Check,
} from "lucide-react";
import { assetUrl, BASE_PATH } from "@/lib/base-path";
import { getYouTubeEmbedUrl, isVideoFileUrl } from "@/lib/media";
import { compressImageForUpload } from "@/lib/image-compress";

export const AdminAutoSaveContext = createContext<{
  scheduleAutoSave: () => void;
}>({
  scheduleAutoSave: () => {},
});

interface UploadedServerFile {
  name: string;
  label: string;
  url: string;
  size: number;
  mtime: number;
}

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  acceptMedia?: "image" | "media" | "video";
}

export function ImageField({
  label,
  value,
  onChange,
  placeholder = "/images/... atau upload / pilih dari galeri",
  allowClear = false,
  acceptMedia = "media",
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { scheduleAutoSave } = useContext(AdminAutoSaveContext);

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<UploadedServerFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const acceptAttr =
    acceptMedia === "image"
      ? "image/*"
      : acceptMedia === "video"
        ? "video/mp4,video/webm,video/quicktime,video/*"
        : "image/*,video/mp4,video/webm,video/quicktime";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      const optimizedFile = await compressImageForUpload(file);
      const formData = new FormData();
      formData.append("file", optimizedFile);
      const res = await fetch(`${BASE_PATH}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as { url: string };
      onChange(json.url);
      scheduleAutoSave();
    } catch {
      setErrorMsg("Gagal upload file. Pastikan Anda masih login dan ukuran didukung.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openServerGallery = async () => {
    setGalleryOpen(true);
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

  const filteredGallery = galleryFiles.filter((f) => {
    if (acceptMedia === "image" && isVideoFileUrl(f.url)) return false;
    if (acceptMedia === "video" && !isVideoFileUrl(f.url)) return false;
    if (!searchQuery.trim()) return true;
    return f.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const isVideoFile = isVideoFileUrl(value);
  const isYt = Boolean(getYouTubeEmbedUrl(value));

  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-zinc-700 mb-1">
        {label}
      </label>
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 min-w-0">
        {value && (
          <div className="w-10 h-10 rounded border border-zinc-200 bg-zinc-900 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
            {isYt ? (
              <PlaySquare className="w-5 h-5 text-red-500" />
            ) : isVideoFile ? (
              <video
                src={assetUrl(value)}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover rounded-xs"
              />
            ) : (
              <img
                src={assetUrl(value)}
                alt={label}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-600 focus:outline-none"
        />
        {allowClear && value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              scheduleAutoSave();
            }}
            title="Kosongkan media"
            className="inline-flex items-center justify-center rounded border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-500 hover:text-red-600 p-1.5 transition cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={openServerGallery}
          title="Pilih dari file yang sudah pernah diupload di server"
          className="inline-flex items-center gap-1 rounded border border-zinc-300 bg-white hover:border-red-600 hover:text-red-600 text-zinc-700 px-2.5 py-1.5 text-xs font-medium transition cursor-pointer shrink-0"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Galeri</span>
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded border border-red-600 bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 text-xs font-medium transition cursor-pointer shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : acceptMedia === "video" ? (
            <Film className="w-3.5 h-3.5" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span>{uploading ? "..." : "Upload"}</span>
        </button>
      </div>
      {errorMsg && (
        <p className="text-[11px] text-red-600 mt-1">{errorMsg}</p>
      )}

      {/* Server Media Library Picker Modal */}
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
                  Galeri File Server ({filteredGallery.length} file tersimpan)
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Klik salah satu foto/video yang pernah Anda upload untuk langsung dipakai.
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
                placeholder="Cari nama file (contoh: GL_Est_Red, jersey, logo)..."
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
                    const selected = value === file.url;
                    const isVid = isVideoFileUrl(file.url);
                    return (
                      <button
                        key={file.name}
                        type="button"
                        onClick={() => {
                          onChange(file.url);
                          scheduleAutoSave();
                          setGalleryOpen(false);
                        }}
                        className={`group relative text-left rounded-lg border overflow-hidden transition cursor-pointer flex flex-col ${
                          selected
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
                          {selected && (
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
          </div>
        </div>
      )}
    </div>
  );
}
