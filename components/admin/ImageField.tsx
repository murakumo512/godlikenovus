"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { assetUrl, BASE_PATH } from "@/lib/base-path";

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}

export function ImageField({
  label,
  value,
  onChange,
  placeholder = "/images/...",
  allowClear = false,
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${BASE_PATH}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const json = (await res.json()) as { url: string };
        onChange(json.url);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-zinc-700 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2 min-w-0">
        {value && (
          <div className="w-9 h-9 rounded border border-zinc-200 bg-zinc-900 p-1 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={assetUrl(value)}
              alt={label}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
        />
        {allowClear && value && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Kosongkan gambar"
            className="inline-flex items-center justify-center rounded border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-500 hover:text-red-600 p-1.5 transition cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded border border-zinc-300 bg-zinc-50 hover:bg-red-600 hover:border-red-600 hover:text-white text-zinc-700 px-2.5 py-1.5 text-xs font-medium transition cursor-pointer shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Upload</span>
        </button>
      </div>
    </div>
  );
}
