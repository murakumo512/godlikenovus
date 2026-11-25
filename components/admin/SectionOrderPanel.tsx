"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, RotateCcw } from "lucide-react";
import { DEFAULT_SECTION_ORDER } from "@/lib/default-data";
import { SectionKey, SiteData } from "@/lib/types";

const SECTION_LABELS: Record<
  SectionKey,
  { title: string; desc: string; targetTab: string }
> = {
  hero: {
    title: "Hero Utama (Banner Atas)",
    desc: "Judul besar, tagline, tombol utama, dan teks berjalan.",
    targetTab: "branding",
  },
  roster: {
    title: "Divisi Game & Roster",
    desc: "Daftar game (HoK, RF), sub-divisi tim, coach, dan player.",
    targetTab: "games",
  },
  about: {
    title: "About Us",
    desc: "Profil organisasi, statistik, dan dokumentasi foto/video.",
    targetTab: "about",
  },
  gallery: {
    title: "Gallery Event & Turnamen",
    desc: "Poster turnamen, kegiatan komunitas, dan video highlight.",
    targetTab: "gallery",
  },
  ambassadors: {
    title: "Brand Ambassador",
    desc: "Banner landscape BA (foto kiri + aksen kanan) dan profil sosmed.",
    targetTab: "ambassadors",
  },
  store: {
    title: "Official Store",
    desc: "Katalog jersey & merchandise terhubung ke order WhatsApp.",
    targetTab: "store",
  },
  sponsors: {
    title: "Official Partners / Sponsors",
    desc: "Logo sponsor dan partner resmi.",
    targetTab: "sponsors",
  },
  contact: {
    title: "Contact Us",
    desc: "Informasi kontak dan form kirim pesan ke WhatsApp.",
    targetTab: "contact",
  },
};

export function SectionOrderPanel({
  data,
  setData,
  onJumpTab,
}: {
  data: SiteData;
  setData: React.Dispatch<React.SetStateAction<SiteData>>;
  onJumpTab: (tab: string) => void;
}) {
  const order =
    Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0
      ? data.sectionOrder
      : DEFAULT_SECTION_ORDER;
  const hidden = new Set<SectionKey>(data.hiddenSections || []);

  const moveItem = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= order.length) return;
    const next = [...order];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setData((prev) => ({ ...prev, sectionOrder: next }));
  };

  const toggleVisibility = (key: SectionKey) => {
    const nextHidden = new Set(hidden);
    if (nextHidden.has(key)) {
      nextHidden.delete(key);
    } else {
      nextHidden.add(key);
    }
    setData((prev) => ({
      ...prev,
      hiddenSections: Array.from(nextHidden),
    }));
  };

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Urutan Section Website (Maju / Mundur)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Geser urutan tampil dari atas ke bawah menggunakan tombol panah. Urutan menu di bar atas (Navbar) juga otomatis menyesuaikan!
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setData((prev) => ({
                ...prev,
                sectionOrder: [...DEFAULT_SECTION_ORDER],
                hiddenSections: [],
              }))
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Urutan Default
          </button>
        </div>

        <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md overflow-hidden">
          {order.map((key, idx) => {
            const info = SECTION_LABELS[key];
            if (!info) return null;
            const isHidden = hidden.has(key);

            return (
              <div
                key={key}
                className={`p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition ${
                  isHidden ? "bg-zinc-100/80 opacity-65" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900 truncate">
                        {info.title}
                      </span>
                      {isHidden && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-300 text-[10px] font-semibold uppercase text-zinc-700">
                          Disembunyikan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      {info.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                  <button
                    type="button"
                    onClick={() => onJumpTab(info.targetTab)}
                    className="px-2.5 py-1.5 rounded border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 cursor-pointer"
                  >
                    Edit Isi
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleVisibility(key)}
                    title={isHidden ? "Tampilkan kembali" : "Sembunyikan section"}
                    className={`p-1.5 rounded border transition cursor-pointer ${
                      isHidden
                        ? "border-zinc-300 bg-white text-zinc-500 hover:text-zinc-900"
                        : "border-zinc-300 bg-white text-zinc-700 hover:text-red-600"
                    }`}
                  >
                    {isHidden ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, -1)}
                    title="Geser Naik (Maju)"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-zinc-300 bg-white hover:border-red-600 hover:text-red-600 disabled:opacity-35 disabled:pointer-events-none text-xs font-medium text-zinc-800 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Naik</span>
                  </button>

                  <button
                    type="button"
                    disabled={idx === order.length - 1}
                    onClick={() => moveItem(idx, 1)}
                    title="Geser Turun (Mundur)"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-zinc-300 bg-white hover:border-red-600 hover:text-red-600 disabled:opacity-35 disabled:pointer-events-none text-xs font-medium text-zinc-800 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Turun</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
