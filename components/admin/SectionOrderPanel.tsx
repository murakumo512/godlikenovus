"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
} from "lucide-react";
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
  scrim: {
    title: "Scrim Request (Tantang Kami)",
    desc: "Banner ajakan scrim dengan ilustrasi pedang yang bisa diganti & diatur PIC-nya.",
    targetTab: "contact",
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
  management: {
    title: "Our Management",
    desc: "Preview foto bertumpuk di bawah BA yang membuka halaman khusus /management.",
    targetTab: "management",
  },
  creators: {
    title: "Content Creator Hub",
    desc: "Daftar streamer & kreator konten resmi dengan modal profil & link channel.",
    targetTab: "creators",
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

function ModularSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer shrink-0 ${
        enabled
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-zinc-300 bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
      }`}
    >
      {enabled ? (
        <>
          <Eye className="w-3.5 h-3.5" /> ON
        </>
      ) : (
        <>
          <EyeOff className="w-3.5 h-3.5" /> OFF
        </>
      )}
    </button>
  );
}

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
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const isLoadingOn =
    data.opening.enabled !== false && data.opening.loadingEnabled !== false;
  const isRevealOn =
    data.opening.enabled !== false && data.opening.revealEnabled !== false;

  const setOpeningFlags = (nextLoading: boolean, nextReveal: boolean) => {
    setData((prev) => ({
      ...prev,
      opening: {
        ...prev.opening,
        enabled: nextLoading || nextReveal,
        loadingEnabled: nextLoading,
        revealEnabled: nextReveal,
      },
    }));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= order.length) return;
    const next = [...order];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setData((prev) => ({ ...prev, sectionOrder: next }));
  };

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const next = [...order];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    setData((prev) => ({ ...prev, sectionOrder: next }));
    setDragIdx(null);
    setOverIdx(null);
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
      {/* 1. Toggle Terpisah: Loading (0-100%) vs Opening Reveal */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Enable / Disable Loading &amp; Opening (Terpisah)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Aktifkan atau matikan animasi <strong>Loading (0–100%)</strong> dan{" "}
              <strong>Opening Reveal (Tulisan Besar)</strong> secara terpisah.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onJumpTab("opening")}
            className="rounded border border-zinc-300 bg-white hover:border-red-600 hover:text-red-600 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition cursor-pointer"
          >
            Edit Teks &amp; Logo
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-3.5 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-zinc-900">
                1. Layar Loading (0–100%)
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {isLoadingOn ? "Tampil di awal buka web" : "Dilewati"}
              </p>
            </div>
            <ModularSwitch
              enabled={isLoadingOn}
              onToggle={() => setOpeningFlags(!isLoadingOn, isRevealOn)}
            />
          </div>

          <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-3.5 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-zinc-900">
                2. Opening Reveal (Tulisan Besar)
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {isRevealOn ? "Tampil sebelum masuk Home" : "Dilewati"}
              </p>
            </div>
            <ModularSwitch
              enabled={isRevealOn}
              onToggle={() => setOpeningFlags(isLoadingOn, !isRevealOn)}
            />
          </div>
        </div>
      </section>

      {/* 2. Urutan & Enable/Disable Semua Section */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Urutan &amp; Enable/Disable Section (1 per 1)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Drag &amp; drop atau pakai panah untuk atur urutan, lalu klik tombol{" "}
              <strong>ON / OFF</strong> untuk mengaktifkan atau menonaktifkan section.
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
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overIdx !== idx) setOverIdx(idx);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(idx);
                }}
                onDragEnd={() => {
                  setDragIdx(null);
                  setOverIdx(null);
                }}
                className={`p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition cursor-grab active:cursor-grabbing ${
                  overIdx === idx && dragIdx !== idx
                    ? "bg-red-50/70 ring-2 ring-inset ring-red-400"
                    : isHidden
                      ? "bg-zinc-100/80 opacity-65"
                      : "bg-white"
                } ${dragIdx === idx ? "opacity-45" : ""}`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="w-7 h-7 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900 truncate">
                        {info.title}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      {info.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                  <ModularSwitch
                    enabled={!isHidden}
                    onToggle={() => toggleVisibility(key)}
                  />

                  <button
                    type="button"
                    onClick={() => onJumpTab(info.targetTab)}
                    className="px-2.5 py-1 rounded border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 cursor-pointer"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    title="Geser naik"
                    className="p-1.5 rounded border border-zinc-300 bg-white text-zinc-700 hover:border-red-600 hover:text-red-600 disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === order.length - 1}
                    title="Geser turun"
                    className="p-1.5 rounded border border-zinc-300 bg-white text-zinc-700 hover:border-red-600 hover:text-red-600 disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Kontrol Modular 1-per-1 Semua Item & Konten */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="border-b border-zinc-100 pb-3">
          <h2 className="text-base font-semibold text-zinc-900">
            Kontrol Modular Item &amp; Konten (1 per 1)
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Aktifkan atau nonaktifkan setiap divisi game, tim, player, foto About, event Gallery, Brand Ambassador, produk Store, dan Sponsor satu per satu dari sini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Games & Sub-Teams */}
          <div className="rounded-md border border-zinc-200 p-3.5 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Divisi Game &amp; Sub-Tim ({data.games.length})
            </div>
            <div className="divide-y divide-zinc-100">
              {data.games.map((g) => (
                <div key={g.id} className="py-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-900 truncate">
                      {g.name} ({g.shortName})
                    </span>
                    <ModularSwitch
                      enabled={g.enabled !== false}
                      onToggle={() =>
                        setData((prev) => ({
                          ...prev,
                          games: prev.games.map((item) =>
                            item.id === g.id
                              ? { ...item, enabled: item.enabled === false }
                              : item
                          ),
                        }))
                      }
                    />
                  </div>
                  {(g.subTeams || []).map((st) => (
                    <div
                      key={st.id}
                      className="pl-4 flex items-center justify-between gap-2"
                    >
                      <span className="text-[11px] text-zinc-600 truncate">
                        ↳ {st.name}
                      </span>
                      <ModularSwitch
                        enabled={st.enabled !== false}
                        onToggle={() =>
                          setData((prev) => ({
                            ...prev,
                            games: prev.games.map((item) =>
                              item.id === g.id
                                ? {
                                    ...item,
                                    subTeams: (item.subTeams || []).map((s) =>
                                      s.id === st.id
                                        ? { ...s, enabled: s.enabled === false }
                                        : s
                                    ),
                                  }
                                : item
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Brand Ambassadors */}
          <div className="rounded-md border border-zinc-200 p-3.5 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Brand Ambassador ({data.ambassadors.length})
            </div>
            <div className="divide-y divide-zinc-100">
              {data.ambassadors.map((ba) => (
                <div
                  key={ba.id}
                  className="py-2 flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-medium text-zinc-800 truncate">
                    {ba.name} ({ba.nickname})
                  </span>
                  <ModularSwitch
                    enabled={ba.enabled !== false}
                    onToggle={() =>
                      setData((prev) => ({
                        ...prev,
                        ambassadors: prev.ambassadors.map((item) =>
                          item.id === ba.id
                            ? { ...item, enabled: item.enabled === false }
                            : item
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Events */}
          <div className="rounded-md border border-zinc-200 p-3.5 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Gallery Event ({data.gallery.length})
            </div>
            <div className="divide-y divide-zinc-100">
              {data.gallery.map((evt) => (
                <div
                  key={evt.id}
                  className="py-2 flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-medium text-zinc-800 truncate">
                    {evt.title}
                  </span>
                  <ModularSwitch
                    enabled={evt.enabled !== false}
                    onToggle={() =>
                      setData((prev) => ({
                        ...prev,
                        gallery: prev.gallery.map((item) =>
                          item.id === evt.id
                            ? { ...item, enabled: item.enabled === false }
                            : item
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Store Products */}
          <div className="rounded-md border border-zinc-200 p-3.5 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Official Store ({data.store.length})
            </div>
            <div className="divide-y divide-zinc-100">
              {data.store.map((prod) => (
                <div
                  key={prod.id}
                  className="py-2 flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-medium text-zinc-800 truncate">
                    {prod.name}
                  </span>
                  <ModularSwitch
                    enabled={prod.enabled !== false}
                    onToggle={() =>
                      setData((prev) => ({
                        ...prev,
                        store: prev.store.map((item) =>
                          item.id === prod.id
                            ? { ...item, enabled: item.enabled === false }
                            : item
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* About Photos */}
          <div className="rounded-md border border-zinc-200 p-3.5 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              About Us Media ({data.about.photos.length})
            </div>
            <div className="divide-y divide-zinc-100">
              {data.about.photos.map((ph, idx) => (
                <div
                  key={ph.id}
                  className="py-2 flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-medium text-zinc-800 truncate">
                    {ph.caption || `Foto About #${idx + 1}`}
                  </span>
                  <ModularSwitch
                    enabled={ph.enabled !== false}
                    onToggle={() =>
                      setData((prev) => ({
                        ...prev,
                        about: {
                          ...prev.about,
                          photos: prev.about.photos.map((item) =>
                            item.id === ph.id
                              ? { ...item, enabled: item.enabled === false }
                              : item
                          ),
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sponsors */}
          <div className="rounded-md border border-zinc-200 p-3.5 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Sponsors / Partners ({data.sponsors.length})
            </div>
            <div className="divide-y divide-zinc-100">
              {data.sponsors.map((sp) => (
                <div
                  key={sp.id}
                  className="py-2 flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-medium text-zinc-800 truncate">
                    {sp.name}
                  </span>
                  <ModularSwitch
                    enabled={sp.enabled !== false}
                    onToggle={() =>
                      setData((prev) => ({
                        ...prev,
                        sponsors: prev.sponsors.map((item) =>
                          item.id === sp.id
                            ? { ...item, enabled: item.enabled === false }
                            : item
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
