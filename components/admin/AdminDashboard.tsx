"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Save,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  GameDivision,
  RosterMember,
  SiteData,
  SocialLink,
} from "@/lib/types";
import { ImageField } from "./ImageField";
import { assetUrl, BASE_PATH } from "@/lib/base-path";

type TabId =
  | "branding"
  | "games"
  | "about"
  | "gallery"
  | "store"
  | "sponsors"
  | "contact";

export function AdminDashboard({ initialData }: { initialData: SiteData }) {
  const [data, setData] = useState<SiteData>(initialData);
  const [activeTab, setActiveTab] = useState<TabId>("branding");
  const [selectedGameId, setSelectedGameId] = useState<string>(
    initialData.games[0]?.id || ""
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/site-data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = (await res.json()) as SiteData;
      setData(saved);
      showToast("success", "Perubahan tersimpan.");
    } catch {
      showToast("error", "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset semua konten ke default awal?")) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/site-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (!res.ok) throw new Error("Reset failed");
      const resetData = (await res.json()) as SiteData;
      setData(resetData);
      setSelectedGameId(resetData.games[0]?.id || "");
      showToast("success", "Konten di-reset ke default.");
    } catch {
      showToast("error", "Gagal melakukan reset.");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "branding", label: "Branding & Navbar" },
    { id: "games", label: "Games & Roster" },
    { id: "about", label: "About Us" },
    { id: "gallery", label: "Gallery" },
    { id: "store", label: "Store" },
    { id: "sponsors", label: "Sponsors" },
    { id: "contact", label: "Contact & Sosmed" },
  ];

  const activeGame =
    data.games.find((g) => g.id === selectedGameId) || data.games[0] || null;

  const updateGame = (
    gameId: string,
    updater: (g: GameDivision) => GameDivision
  ) => {
    setData((prev) => ({
      ...prev,
      games: prev.games.map((g) => (g.id === gameId ? updater(g) : g)),
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 overflow-x-hidden">
      {/* Clean Responsive Top Bar (Zero mobile overflow) */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={assetUrl(data.branding.logoRed || "/images/logo-red.png")}
              alt="Godlike"
              className="h-7 w-auto object-contain shrink-0"
            />
            <div className="min-w-0 flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base text-zinc-900 truncate">
                Godlike Admin
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 rounded border border-red-200">
                CMS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded border border-zinc-300 bg-white hover:bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lihat Web</span>
            </Link>
            <button
              onClick={handleReset}
              disabled={saving}
              title="Reset ke Default"
              className="inline-flex items-center gap-1 rounded border border-zinc-300 bg-white hover:bg-zinc-50 px-2 py-1.5 text-xs font-medium text-zinc-600 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-60 px-3 py-1.5 text-xs font-medium text-white transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Menyimpan..." : "Simpan"}</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Tab Strip */}
        <div className="lg:hidden border-t border-zinc-200 bg-white px-3 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 py-2.5 px-3 text-xs font-medium border-b-2 transition cursor-pointer ${
                  active
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium shadow-lg text-zinc-800">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <nav className="sticky top-20 space-y-0.5">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition cursor-pointer ${
                    active
                      ? "bg-red-600 text-white"
                      : "text-zinc-700 hover:bg-zinc-200/60"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Form Panels */}
        <main className="lg:col-span-9 min-w-0 space-y-5">
          {/* 1. BRANDING & NAVBAR */}
          {activeTab === "branding" && (
            <div className="space-y-5">
              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Identitas &amp; Hero Utama
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Atur nama tim, tagline, deskripsi hero, dan nomor WhatsApp utama.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <InputField
                    label="Nama Tim"
                    value={data.branding.teamName}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, teamName: v },
                      })
                    }
                  />
                  <InputField
                    label="Tahun Berdiri (Badge)"
                    value={data.branding.estYear}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, estYear: v },
                      })
                    }
                  />
                  <InputField
                    label="Tagline Utama"
                    value={data.branding.tagline}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, tagline: v },
                      })
                    }
                  />
                  <InputField
                    label="Nomor WhatsApp (Format 628xxx)"
                    value={data.branding.whatsappNumber}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, whatsappNumber: v },
                      })
                    }
                  />
                  <InputField
                    label="Teks Tombol Utama"
                    value={data.branding.heroCtaPrimary}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, heroCtaPrimary: v },
                      })
                    }
                  />
                  <InputField
                    label="Teks Tombol Kedua"
                    value={data.branding.heroCtaSecondary}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, heroCtaSecondary: v },
                      })
                    }
                  />
                </div>

                <TextareaField
                  label="Deskripsi Singkat Hero"
                  value={data.branding.heroSubtitle}
                  onChange={(v) =>
                    setData({
                      ...data,
                      branding: { ...data.branding, heroSubtitle: v },
                    })
                  }
                />
              </section>

              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Logo &amp; Aset Gambar
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Masukkan path gambar atau upload langsung dari HP/laptop.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <ImageField
                    label="Logo Bar Atas (Navbar)"
                    value={data.branding.navbarLogo || data.branding.logoWhite}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, navbarLogo: v },
                      })
                    }
                  />
                  <ImageField
                    label="Favicon (Icon Tab Browser)"
                    value={data.branding.favicon || data.branding.logoRed}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, favicon: v },
                      })
                    }
                  />
                  <ImageField
                    label="Logo Putih (Footer)"
                    value={data.branding.logoWhite}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, logoWhite: v },
                      })
                    }
                  />
                  <ImageField
                    label="Logo Merah (Mobile Hero & Admin)"
                    value={data.branding.logoRed}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, logoRed: v },
                      })
                    }
                  />
                  <ImageField
                    label="Gambar Tagline Hero (Desktop)"
                    value={data.branding.logoTagline}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, logoTagline: v },
                      })
                    }
                  />
                </div>
              </section>

              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Tulisan Navbar &amp; Tab Browser
                  </h2>
                </div>

                <InputField
                  label="Judul Tab Browser"
                  value={
                    data.branding.siteTitle ||
                    `${data.branding.teamName} — Esports Organization | ${data.branding.estYear}`
                  }
                  onChange={(v) =>
                    setData({
                      ...data,
                      branding: { ...data.branding, siteTitle: v },
                    })
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <InputField
                    label="Teks Utama Navbar"
                    value={data.branding.navbarTitle || data.branding.teamName}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, navbarTitle: v },
                      })
                    }
                  />
                  <InputField
                    label="Subteks Navbar"
                    value={
                      data.branding.navbarSubtitle || data.branding.estYear
                    }
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, navbarSubtitle: v },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(
                    [
                      ["roster", "Label Menu 1", "Roster"],
                      ["about", "Label Menu 2", "About"],
                      ["gallery", "Label Menu 3", "Gallery"],
                      ["store", "Label Menu 4", "Store"],
                      ["sponsors", "Label Menu 5", "Sponsors"],
                      ["contact", "Label Menu 6", "Contact"],
                    ] as const
                  ).map(([key, label, fallback]) => (
                    <InputField
                      key={key}
                      label={label}
                      value={data.branding.navLabels?.[key] || fallback}
                      onChange={(v) =>
                        setData({
                          ...data,
                          branding: {
                            ...data.branding,
                            navLabels: {
                              roster:
                                data.branding.navLabels?.roster || "Roster",
                              about: data.branding.navLabels?.about || "About",
                              gallery:
                                data.branding.navLabels?.gallery || "Gallery",
                              store: data.branding.navLabels?.store || "Store",
                              sponsors:
                                data.branding.navLabels?.sponsors || "Sponsors",
                              contact:
                                data.branding.navLabels?.contact || "Contact",
                              [key]: v,
                            },
                          },
                        })
                      }
                    />
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* 2. GAMES & ROSTER */}
          {activeTab === "games" && (
            <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">
                    Divisi Game &amp; Roster
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Kelola divisi game serta daftar player &amp; coach.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `game-${Date.now()}`;
                    const newGame: GameDivision = {
                      id: newId,
                      slug: `game-${data.games.length + 1}`,
                      name: "Divisi Baru",
                      shortName: "NEW",
                      description: "Deskripsi divisi game baru.",
                      bannerImage: "/images/seed/banner-hok.svg",
                      roster: [],
                    };
                    setData((prev) => ({
                      ...prev,
                      games: [...prev.games, newGame],
                    }));
                    setSelectedGameId(newId);
                  }}
                  className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Divisi
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {data.games.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGameId(g.id)}
                    className={`shrink-0 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer border ${
                      activeGame?.id === g.id
                        ? "bg-red-600 border-red-600 text-white"
                        : "bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {g.shortName} — {g.name}
                  </button>
                ))}
              </div>

              {activeGame && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-800">
                      Detail Divisi: {activeGame.name}
                    </h3>
                    {data.games.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const remaining = data.games.filter(
                            (g) => g.id !== activeGame.id
                          );
                          setData((prev) => ({ ...prev, games: remaining }));
                          setSelectedGameId(remaining[0]?.id || "");
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Divisi
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <InputField
                      label="Nama Game"
                      value={activeGame.name}
                      onChange={(v) =>
                        updateGame(activeGame.id, (g) => ({ ...g, name: v }))
                      }
                    />
                    <InputField
                      label="Kode Singkat (Tab)"
                      value={activeGame.shortName}
                      onChange={(v) =>
                        updateGame(activeGame.id, (g) => ({
                          ...g,
                          shortName: v,
                        }))
                      }
                    />
                  </div>

                  <TextareaField
                    label="Deskripsi Divisi"
                    value={activeGame.description}
                    onChange={(v) =>
                      updateGame(activeGame.id, (g) => ({
                        ...g,
                        description: v,
                      }))
                    }
                  />

                  <ImageField
                    label="Banner Divisi"
                    value={activeGame.bannerImage}
                    onChange={(v) =>
                      updateGame(activeGame.id, (g) => ({
                        ...g,
                        bannerImage: v,
                      }))
                    }
                  />

                  {/* Roster List */}
                  <div className="pt-4 border-t border-zinc-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-zinc-900">
                        Anggota Roster ({activeGame.roster.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newMember: RosterMember = {
                            id: `mem-${Date.now()}`,
                            ign: "GL.PLAYER",
                            realName: "Nama Lengkap",
                            role: "Player",
                            isCoach: false,
                            photo: "/images/seed/player-1.svg",
                            bio: "Bio singkat.",
                            achievements: "",
                          };
                          updateGame(activeGame.id, (g) => ({
                            ...g,
                            roster: [...g.roster, newMember],
                          }));
                        }}
                        className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-700 px-2.5 py-1.5 text-xs font-medium text-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Anggota
                      </button>
                    </div>

                    <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md">
                      {activeGame.roster.map((member) => (
                        <div key={member.id} className="p-3.5 sm:p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={member.isCoach}
                                onChange={(e) =>
                                  updateGame(activeGame.id, (g) => ({
                                    ...g,
                                    roster: g.roster.map((m) =>
                                      m.id === member.id
                                        ? { ...m, isCoach: e.target.checked }
                                        : m
                                    ),
                                  }))
                                }
                                className="accent-red-600 w-3.5 h-3.5"
                              />
                              Coach / Pelatih
                            </label>

                            <button
                              type="button"
                              onClick={() =>
                                updateGame(activeGame.id, (g) => ({
                                  ...g,
                                  roster: g.roster.filter(
                                    (m) => m.id !== member.id
                                  ),
                                }))
                              }
                              className="text-xs font-medium text-red-600 hover:text-red-800 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <InputField
                              label="IGN / Nickname"
                              value={member.ign}
                              onChange={(v) =>
                                updateGame(activeGame.id, (g) => ({
                                  ...g,
                                  roster: g.roster.map((m) =>
                                    m.id === member.id ? { ...m, ign: v } : m
                                  ),
                                }))
                              }
                            />
                            <InputField
                              label="Nama Lengkap"
                              value={member.realName}
                              onChange={(v) =>
                                updateGame(activeGame.id, (g) => ({
                                  ...g,
                                  roster: g.roster.map((m) =>
                                    m.id === member.id
                                      ? { ...m, realName: v }
                                      : m
                                  ),
                                }))
                              }
                            />
                            <InputField
                              label="Role / Posisi"
                              value={member.role}
                              onChange={(v) =>
                                updateGame(activeGame.id, (g) => ({
                                  ...g,
                                  roster: g.roster.map((m) =>
                                    m.id === member.id ? { ...m, role: v } : m
                                  ),
                                }))
                              }
                            />
                          </div>

                          <ImageField
                            label="Foto"
                            value={member.photo}
                            onChange={(v) =>
                              updateGame(activeGame.id, (g) => ({
                                ...g,
                                roster: g.roster.map((m) =>
                                  m.id === member.id ? { ...m, photo: v } : m
                                ),
                              }))
                            }
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InputField
                              label="Bio Singkat"
                              value={member.bio}
                              onChange={(v) =>
                                updateGame(activeGame.id, (g) => ({
                                  ...g,
                                  roster: g.roster.map((m) =>
                                    m.id === member.id ? { ...m, bio: v } : m
                                  ),
                                }))
                              }
                            />
                            <InputField
                              label="Prestasi"
                              value={member.achievements}
                              onChange={(v) =>
                                updateGame(activeGame.id, (g) => ({
                                  ...g,
                                  roster: g.roster.map((m) =>
                                    m.id === member.id
                                      ? { ...m, achievements: v }
                                      : m
                                  ),
                                }))
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. ABOUT US */}
          {activeTab === "about" && (
            <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-5">
              <div className="border-b border-zinc-100 pb-3">
                <h2 className="text-base font-semibold text-zinc-900">
                  About Us &amp; Dokumentasi Foto
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <InputField
                  label="Label Seksi"
                  value={data.about.title}
                  onChange={(v) =>
                    setData({ ...data, about: { ...data.about, title: v } })
                  }
                />
                <InputField
                  label="Judul Utama"
                  value={data.about.headline}
                  onChange={(v) =>
                    setData({ ...data, about: { ...data.about, headline: v } })
                  }
                />
              </div>

              <TextareaField
                label="Deskripsi Organisasi"
                value={data.about.description}
                onChange={(v) =>
                  setData({
                    ...data,
                    about: { ...data.about, description: v },
                  })
                }
              />

              {/* Stats */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-800">
                    Angka Statistik
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        about: {
                          ...data.about,
                          stats: [
                            ...data.about.stats,
                            { label: "STAT", value: "10+" },
                          ],
                        },
                      })
                    }
                    className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
                  >
                    + Tambah Stat
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {data.about.stats.map((st, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 min-w-0 rounded border border-zinc-200 p-2"
                    >
                      <input
                        type="text"
                        value={st.value}
                        onChange={(e) => {
                          const next = [...data.about.stats];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setData({
                            ...data,
                            about: { ...data.about, stats: next },
                          });
                        }}
                        className="w-20 min-w-0 rounded border border-zinc-300 px-2 py-1 text-sm font-semibold text-red-600"
                      />
                      <input
                        type="text"
                        value={st.label}
                        onChange={(e) => {
                          const next = [...data.about.stats];
                          next[idx] = { ...next[idx], label: e.target.value };
                          setData({
                            ...data,
                            about: { ...data.about, stats: next },
                          });
                        }}
                        className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setData({
                            ...data,
                            about: {
                              ...data.about,
                              stats: data.about.stats.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          })
                        }
                        className="text-zinc-400 hover:text-red-600 p-1 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* About Photos */}
              <div className="pt-3 border-t border-zinc-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-800">
                    Foto Showcase
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        about: {
                          ...data.about,
                          photos: [
                            ...data.about.photos,
                            {
                              id: `ab-${Date.now()}`,
                              url: "/images/seed/about-1.svg",
                              caption: "Dokumentasi Kegiatan",
                            },
                          ],
                        },
                      })
                    }
                    className="inline-flex items-center gap-1 rounded bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Foto
                  </button>
                </div>

                <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md">
                  {data.about.photos.map((ph) => (
                    <div key={ph.id} className="p-3.5 space-y-2.5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setData({
                              ...data,
                              about: {
                                ...data.about,
                                photos: data.about.photos.filter(
                                  (p) => p.id !== ph.id
                                ),
                              },
                            })
                          }
                          className="text-xs font-medium text-red-600 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                      <ImageField
                        label="File / URL Foto"
                        value={ph.url}
                        onChange={(v) =>
                          setData({
                            ...data,
                            about: {
                              ...data.about,
                              photos: data.about.photos.map((p) =>
                                p.id === ph.id ? { ...p, url: v } : p
                              ),
                            },
                          })
                        }
                      />
                      <InputField
                        label="Keterangan Foto"
                        value={ph.caption}
                        onChange={(v) =>
                          setData({
                            ...data,
                            about: {
                              ...data.about,
                              photos: data.about.photos.map((p) =>
                                p.id === ph.id ? { ...p, caption: v } : p
                              ),
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. GALLERY EVENTS */}
          {activeTab === "gallery" && (
            <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h2 className="text-base font-semibold text-zinc-900">
                  Gallery Event
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setData({
                      ...data,
                      gallery: [
                        ...data.gallery,
                        {
                          id: `evt-${Date.now()}`,
                          title: "Nama Event Baru",
                          date: "2026",
                          location: "Indonesia",
                          category: "Tournament",
                          image: "/images/seed/event-1.svg",
                          description: "Deskripsi singkat event.",
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Event
                </button>
              </div>

              <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md">
                {data.gallery.map((evt) => (
                  <div key={evt.id} className="p-3.5 sm:p-4 space-y-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setData({
                            ...data,
                            gallery: data.gallery.filter(
                              (g) => g.id !== evt.id
                            ),
                          })
                        }
                        className="text-xs font-medium text-red-600 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputField
                        label="Judul Event"
                        value={evt.title}
                        onChange={(v) =>
                          setData({
                            ...data,
                            gallery: data.gallery.map((g) =>
                              g.id === evt.id ? { ...g, title: v } : g
                            ),
                          })
                        }
                      />
                      <InputField
                        label="Kategori"
                        value={evt.category}
                        onChange={(v) =>
                          setData({
                            ...data,
                            gallery: data.gallery.map((g) =>
                              g.id === evt.id ? { ...g, category: v } : g
                            ),
                          })
                        }
                      />
                      <InputField
                        label="Tanggal"
                        value={evt.date}
                        onChange={(v) =>
                          setData({
                            ...data,
                            gallery: data.gallery.map((g) =>
                              g.id === evt.id ? { ...g, date: v } : g
                            ),
                          })
                        }
                      />
                      <InputField
                        label="Lokasi"
                        value={evt.location}
                        onChange={(v) =>
                          setData({
                            ...data,
                            gallery: data.gallery.map((g) =>
                              g.id === evt.id ? { ...g, location: v } : g
                            ),
                          })
                        }
                      />
                    </div>
                    <ImageField
                      label="Foto Event"
                      value={evt.image}
                      onChange={(v) =>
                        setData({
                          ...data,
                          gallery: data.gallery.map((g) =>
                            g.id === evt.id ? { ...g, image: v } : g
                          ),
                        })
                      }
                    />
                    <TextareaField
                      label="Deskripsi"
                      value={evt.description}
                      onChange={(v) =>
                        setData({
                          ...data,
                          gallery: data.gallery.map((g) =>
                            g.id === evt.id ? { ...g, description: v } : g
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. OFFICIAL STORE */}
          {activeTab === "store" && (
            <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">
                    Produk Store
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Order dari pengunjung otomatis diteruskan ke WhatsApp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setData({
                      ...data,
                      store: [
                        ...data.store,
                        {
                          id: `prod-${Date.now()}`,
                          name: "Produk Baru",
                          price: 199000,
                          category: "Merchandise",
                          badge: "NEW",
                          image: "/images/seed/jersey-1.svg",
                          description: "Deskripsi singkat produk.",
                          sizes: ["S", "M", "L", "XL"],
                          inStock: true,
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-medium text-white cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              </div>

              <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md">
                {data.store.map((prod) => (
                  <div key={prod.id} className="p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prod.inStock}
                          onChange={(e) =>
                            setData({
                              ...data,
                              store: data.store.map((p) =>
                                p.id === prod.id
                                  ? { ...p, inStock: e.target.checked }
                                  : p
                              ),
                            })
                          }
                          className="accent-red-600 w-3.5 h-3.5"
                        />
                        Stok Tersedia
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setData({
                            ...data,
                            store: data.store.filter((p) => p.id !== prod.id),
                          })
                        }
                        className="text-xs font-medium text-red-600 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputField
                        label="Nama Produk"
                        value={prod.name}
                        onChange={(v) =>
                          setData({
                            ...data,
                            store: data.store.map((p) =>
                              p.id === prod.id ? { ...p, name: v } : p
                            ),
                          })
                        }
                      />
                      <div className="min-w-0">
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          Harga (IDR)
                        </label>
                        <input
                          type="number"
                          value={prod.price}
                          onChange={(e) =>
                            setData({
                              ...data,
                              store: data.store.map((p) =>
                                p.id === prod.id
                                  ? { ...p, price: Number(e.target.value) || 0 }
                                  : p
                              ),
                            })
                          }
                          className="w-full min-w-0 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
                        />
                      </div>
                      <InputField
                        label="Kategori"
                        value={prod.category}
                        onChange={(v) =>
                          setData({
                            ...data,
                            store: data.store.map((p) =>
                              p.id === prod.id ? { ...p, category: v } : p
                            ),
                          })
                        }
                      />
                      <InputField
                        label="Label Badge (opsional)"
                        value={prod.badge}
                        onChange={(v) =>
                          setData({
                            ...data,
                            store: data.store.map((p) =>
                              p.id === prod.id ? { ...p, badge: v } : p
                            ),
                          })
                        }
                      />
                    </div>

                    <InputField
                      label="Ukuran (pisahkan dengan koma)"
                      value={prod.sizes.join(", ")}
                      onChange={(v) =>
                        setData({
                          ...data,
                          store: data.store.map((p) =>
                            p.id === prod.id
                              ? {
                                  ...p,
                                  sizes: v
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                }
                              : p
                          ),
                        })
                      }
                    />

                    <ImageField
                      label="Foto Produk"
                      value={prod.image}
                      onChange={(v) =>
                        setData({
                          ...data,
                          store: data.store.map((p) =>
                            p.id === prod.id ? { ...p, image: v } : p
                          ),
                        })
                      }
                    />

                    <TextareaField
                      label="Deskripsi Produk"
                      value={prod.description}
                      onChange={(v) =>
                        setData({
                          ...data,
                          store: data.store.map((p) =>
                            p.id === prod.id ? { ...p, description: v } : p
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. SPONSORS */}
          {activeTab === "sponsors" && (
            <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h2 className="text-base font-semibold text-zinc-900">
                  Sponsors &amp; Partners
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setData({
                      ...data,
                      sponsors: [
                        ...data.sponsors,
                        {
                          id: `sp-${Date.now()}`,
                          name: "Sponsor Baru",
                          tier: "Official Partner",
                          logo: "/images/seed/sponsor-1.svg",
                          website: "https://example.com",
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Sponsor
                </button>
              </div>

              <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md">
                {data.sponsors.map((sp) => (
                  <div key={sp.id} className="p-3.5 sm:p-4 space-y-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setData({
                            ...data,
                            sponsors: data.sponsors.filter(
                              (s) => s.id !== sp.id
                            ),
                          })
                        }
                        className="text-xs font-medium text-red-600 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <InputField
                        label="Nama Sponsor"
                        value={sp.name}
                        onChange={(v) =>
                          setData({
                            ...data,
                            sponsors: data.sponsors.map((s) =>
                              s.id === sp.id ? { ...s, name: v } : s
                            ),
                          })
                        }
                      />
                      <InputField
                        label="Tier"
                        value={sp.tier}
                        onChange={(v) =>
                          setData({
                            ...data,
                            sponsors: data.sponsors.map((s) =>
                              s.id === sp.id ? { ...s, tier: v } : s
                            ),
                          })
                        }
                      />
                      <InputField
                        label="Link Website"
                        value={sp.website}
                        onChange={(v) =>
                          setData({
                            ...data,
                            sponsors: data.sponsors.map((s) =>
                              s.id === sp.id ? { ...s, website: v } : s
                            ),
                          })
                        }
                      />
                    </div>
                    <ImageField
                      label="Logo Sponsor"
                      value={sp.logo}
                      onChange={(v) =>
                        setData({
                          ...data,
                          sponsors: data.sponsors.map((s) =>
                            s.id === sp.id ? { ...s, logo: v } : s
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. CONTACT & SOCIAL MEDIA */}
          {activeTab === "contact" && (
            <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-5">
              <div className="border-b border-zinc-100 pb-3">
                <h2 className="text-base font-semibold text-zinc-900">
                  Kontak &amp; Sosial Media
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <InputField
                  label="Judul Seksi Kontak"
                  value={data.contact.title}
                  onChange={(v) =>
                    setData({
                      ...data,
                      contact: { ...data.contact, title: v },
                    })
                  }
                />
                <InputField
                  label="Nomor WhatsApp Kontak (628xxx)"
                  value={data.contact.whatsappNumber}
                  onChange={(v) =>
                    setData({
                      ...data,
                      contact: { ...data.contact, whatsappNumber: v },
                    })
                  }
                />
                <InputField
                  label="Email"
                  value={data.contact.email}
                  onChange={(v) =>
                    setData({
                      ...data,
                      contact: { ...data.contact, email: v },
                    })
                  }
                />
                <InputField
                  label="Lokasi"
                  value={data.contact.location}
                  onChange={(v) =>
                    setData({
                      ...data,
                      contact: { ...data.contact, location: v },
                    })
                  }
                />
              </div>

              <TextareaField
                label="Deskripsi Kontak"
                value={data.contact.subtitle}
                onChange={(v) =>
                  setData({
                    ...data,
                    contact: { ...data.contact, subtitle: v },
                  })
                }
              />

              <div className="pt-4 border-t border-zinc-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-800">
                    Sosial Media (Footer)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        socials: [
                          ...data.socials,
                          {
                            id: `soc-${Date.now()}`,
                            platform: "instagram",
                            label: "Instagram",
                            url: "https://instagram.com/",
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1 rounded bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Sosmed
                  </button>
                </div>

                <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md">
                  {data.socials.map((soc) => (
                    <div
                      key={soc.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end p-3"
                    >
                      <div className="sm:col-span-3 min-w-0">
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          Platform
                        </label>
                        <select
                          value={soc.platform}
                          onChange={(e) =>
                            setData({
                              ...data,
                              socials: data.socials.map((s) =>
                                s.id === soc.id
                                  ? {
                                      ...s,
                                      platform: e.target
                                        .value as SocialLink["platform"],
                                    }
                                  : s
                              ),
                            })
                          }
                          className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                        >
                          <option value="instagram">Instagram</option>
                          <option value="tiktok">TikTok</option>
                          <option value="youtube">YouTube</option>
                          <option value="discord">Discord</option>
                          <option value="twitter">Twitter / X</option>
                          <option value="facebook">Facebook</option>
                        </select>
                      </div>
                      <div className="sm:col-span-3 min-w-0">
                        <InputField
                          label="Label"
                          value={soc.label}
                          onChange={(v) =>
                            setData({
                              ...data,
                              socials: data.socials.map((s) =>
                                s.id === soc.id ? { ...s, label: v } : s
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="sm:col-span-5 min-w-0">
                        <InputField
                          label="URL"
                          value={soc.url}
                          onChange={(v) =>
                            setData({
                              ...data,
                              socials: data.socials.map((s) =>
                                s.id === soc.id ? { ...s, url: v } : s
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setData({
                              ...data,
                              socials: data.socials.filter(
                                (s) => s.id !== soc.id
                              ),
                            })
                          }
                          className="p-1.5 text-zinc-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-zinc-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-zinc-700 mb-1">
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
      />
    </div>
  );
}
