"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Save,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  LogOut,
  GripVertical,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AdminTabId,
  BrandAmbassador,
  GameDivision,
  GameSubTeam,
  RosterMember,
  SiteData,
  SocialLink,
} from "@/lib/types";
import {
  DEFAULT_CONTACT_WA_TEMPLATE,
  DEFAULT_STORE_WA_TEMPLATE,
} from "@/lib/default-data";
import { renderWhatsappTemplate } from "@/lib/template-utils";
import { AdminAutoSaveContext, ImageField } from "./ImageField";
import { MultiMediaField } from "./MultiMediaField";
import { AdminLogin } from "./AdminLogin";
import { SectionOrderPanel } from "./SectionOrderPanel";
import { AdminUsersPanel } from "./AdminUsersPanel";
import { AdminLogsPanel } from "./AdminLogsPanel";
import { AdminAnalyticsPanel } from "./AdminAnalyticsPanel";
import type { AdminSessionUser } from "@/lib/auth";
import { assetUrl, BASE_PATH } from "@/lib/base-path";

const IDLE_TIMEOUT_SECONDS = 10 * 60; // 10 menit
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_SECONDS * 1000;

type TabId = AdminTabId;

const STORE_TEMPLATE_VARS = [
  ["{product}", "Nama Produk"],
  ["{category}", "Kategori"],
  ["{price}", "Harga Satuan"],
  ["{size}", "Ukuran"],
  ["{qty}", "Jumlah"],
  ["{total}", "Total Harga"],
  ["{name}", "Nama Pemesan"],
  ["{phone}", "No. WA Pemesan"],
  ["{address}", "Alamat"],
  ["{notes}", "Catatan"],
] as const;

const CONTACT_TEMPLATE_VARS = [
  ["{name}", "Nama Pengirim"],
  ["{email}", "Email Pengirim"],
  ["{message}", "Isi Pesan"],
] as const;

export function AdminDashboard({
  initialData,
  initialUser,
}: {
  initialData: SiteData;
  initialUser: AdminSessionUser | null;
}) {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [data, setData] = useState<SiteData>(initialData);
  const [activeTab, setActiveTab] = useState<TabId>("sections");
  const [selectedGameId, setSelectedGameId] = useState<string>(
    initialData.games[0]?.id || ""
  );
  const [selectedSubTeamId, setSelectedSubTeamId] = useState<string>(
    initialData.games[0]?.subTeams?.[0]?.id || ""
  );
  const [saving, setSaving] = useState(false);
  const [tabDragIdx, setTabDragIdx] = useState<number | null>(null);
  const [tabOverIdx, setTabOverIdx] = useState<number | null>(null);
  const [idleRemainingSec, setIdleRemainingSec] = useState(IDLE_TIMEOUT_SECONDS);
  const lastActivityRef = useRef<number>(Date.now());
  const lastPingRef = useRef<number>(0);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const latestDataRef = useRef<SiteData>(data);
  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const persistData = useCallback(
    async (payload: SiteData, silentMsg?: string) => {
      setSaving(true);
      try {
        const res = await fetch(`${BASE_PATH}/api/site-data`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.status === 401) {
          setCurrentUser(null);
          showToast("error", "Sesi login berakhir. Silakan login kembali.");
          return;
        }
        if (!res.ok) throw new Error("Save failed");
        const saved = (await res.json()) as SiteData;
        setData(saved);
        showToast("success", silentMsg || "Perubahan berhasil disimpan.");
      } catch {
        showToast("error", "Gagal menyimpan perubahan.");
      } finally {
        setSaving(false);
      }
    },
    [showToast]
  );

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      persistData(latestDataRef.current, "Foto/media otomatis tersimpan.");
    }, 200);
  }, [persistData]);

  const handleSave = async () => {
    await persistData(data);
  };

  const handleLogout = useCallback(async (reason: "manual" | "timeout" = "manual") => {
    try {
      await fetch(`${BASE_PATH}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
    } catch {
      // ignore network error on logout
    }
    setCurrentUser(null);
    if (reason === "timeout") {
      showToast("error", "Sesi berakhir setelah 10 menit tidak aktif. Silakan login kembali.");
    }
  }, [showToast]);

  // 10-minute idle timeout; resets automatically on browser refresh (mount) & user activity
  useEffect(() => {
    if (!currentUser) return;

    const pingServer = async () => {
      lastPingRef.current = Date.now();
      try {
        const res = await fetch(`${BASE_PATH}/api/auth/ping`, { method: "POST" });
        if (res.status === 401) {
          setCurrentUser(null);
          showToast("error", "Sesi login berakhir. Silakan login kembali.");
        }
      } catch {
        // ignore transient network errors
      }
    };

    // Reset idle timer immediately on mount / browser refresh and refresh server cookie
    lastActivityRef.current = Date.now();
    setIdleRemainingSec(IDLE_TIMEOUT_SECONDS);
    pingServer();

    const onActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      // Throttle server session ping to once every 2 minutes while actively working
      if (now - lastPingRef.current >= 2 * 60 * 1000) {
        pingServer();
      }
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    const intervalId = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((lastActivityRef.current + IDLE_TIMEOUT_MS - Date.now()) / 1000)
      );
      setIdleRemainingSec(remaining);
      if (remaining <= 0) {
        window.clearInterval(intervalId);
        handleLogout("timeout");
      }
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      window.clearInterval(intervalId);
    };
  }, [currentUser, handleLogout, showToast]);

  const handleReset = async () => {
    const check = prompt(
      'Ketik kata "RESET" untuk mengembalikan semua teks ke default pabrik:'
    );
    if (check !== "RESET") return;
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

  if (!currentUser) {
    return (
      <AdminLogin
        branding={data.branding}
        onSuccess={(u) => setCurrentUser(u)}
      />
    );
  }

  const defaultTabs: { id: TabId; label: string }[] = [
    { id: "sections", label: "Urutan Section" },
    { id: "branding", label: "Home & Branding" },
    { id: "opening", label: "Opening & Loading" },
    { id: "games", label: "Games & Roster" },
    { id: "about", label: "About Us" },
    { id: "gallery", label: "Gallery" },
    { id: "ambassadors", label: "Brand Ambassador" },
    { id: "store", label: "Store" },
    { id: "sponsors", label: "Sponsors" },
    { id: "contact", label: "Contact & Sosmed" },
    { id: "templates", label: "Template Pesan" },
    { id: "analytics", label: "Statistik Web" },
    { id: "users", label: "Akun & Password" },
    { id: "logs", label: "Log Aktivitas" },
  ];

  const isReadOnly = currentUser.role === "read";
  const isCustomRole = currentUser.role === "custom";
  const allowedTabSet = new Set<TabId>([
    ...(currentUser.allowedTabs || []),
    "users",
  ]);

  const orderedTabs: { id: TabId; label: string }[] = (() => {
    const customOrder = data.adminTabOrder;
    if (!Array.isArray(customOrder) || customOrder.length === 0) {
      return defaultTabs;
    }
    const byId = new Map(defaultTabs.map((t) => [t.id, t]));
    const ordered: { id: TabId; label: string }[] = [];
    for (const id of customOrder) {
      const found = byId.get(id);
      if (found && !ordered.some((o) => o.id === id)) ordered.push(found);
    }
    for (const t of defaultTabs) {
      if (!ordered.some((o) => o.id === t.id)) ordered.push(t);
    }
    return ordered;
  })();

  const tabs = isCustomRole
    ? orderedTabs.filter((t) => allowedTabSet.has(t.id))
    : orderedTabs;

  const effectiveActiveTab = tabs.some((t) => t.id === activeTab)
    ? activeTab
    : tabs[0]?.id || "users";

  const handleTabDrop = (targetIdx: number) => {
    if (tabDragIdx === null || tabDragIdx === targetIdx) {
      setTabDragIdx(null);
      setTabOverIdx(null);
      return;
    }
    const nextOrder = tabs.map((t) => t.id);
    const [moved] = nextOrder.splice(tabDragIdx, 1);
    nextOrder.splice(targetIdx, 0, moved);
    setData((prev) => ({ ...prev, adminTabOrder: nextOrder }));
    scheduleAutoSave();
    setTabDragIdx(null);
    setTabOverIdx(null);
  };

  const toggleUrl = (list: string[] | undefined, url: string): string[] => {
    const cur = list || [];
    return cur.includes(url) ? cur.filter((u) => u !== url) : [...cur, url];
  };

  const activeGame =
    data.games.find((g) => g.id === selectedGameId) || data.games[0] || null;

  const activeSubTeams = activeGame?.subTeams || [];
  const hasSubTeams = activeSubTeams.length > 0;
  const activeSubTeam: GameSubTeam | null = hasSubTeams
    ? activeSubTeams.find((st) => st.id === selectedSubTeamId) ||
      activeSubTeams[0]
    : null;

  const updateGame = (
    gameId: string,
    updater: (g: GameDivision) => GameDivision
  ) => {
    setData((prev) => ({
      ...prev,
      games: prev.games.map((g) => (g.id === gameId ? updater(g) : g)),
    }));
  };

  const updateSubTeam = (
    gameId: string,
    subTeamId: string,
    updater: (st: GameSubTeam) => GameSubTeam
  ) => {
    updateGame(gameId, (g) => ({
      ...g,
      subTeams: (g.subTeams || []).map((st) =>
        st.id === subTeamId ? updater(st) : st
      ),
    }));
  };

  const storePreviewMessage = renderWhatsappTemplate(
    data.templates.storeWhatsappTemplate || DEFAULT_STORE_WA_TEMPLATE,
    {
      product: data.store[0]?.name || "GODLIKE PRO JERSEY 2026",
      category: data.store[0]?.category || "Official Jersey",
      price: "Rp 249.000",
      size: "L",
      qty: 2,
      total: "Rp 498.000",
      name: "Budi Santoso",
      phone: "081234567890",
      address: "Jl. Asia Afrika No. 10, Bandung",
      notes: "Custom nickname: GL.BUDI",
    }
  );

  const contactPreviewMessage = renderWhatsappTemplate(
    data.templates.contactWhatsappTemplate || DEFAULT_CONTACT_WA_TEMPLATE,
    {
      name: "Raka (Team Manager)",
      email: "raka@example.com",
      message: "Halo min, mau ajak scrim divisi HoK Jumat malam jam 20.00 WIB.",
    }
  );

  const adminBarLogo =
    data.branding.adminLogo ||
    data.branding.navbarLogo ||
    data.branding.logoRed ||
    "/images/logo-red.png";
  const adminBarTitle = data.branding.adminTitle || "Godlike Admin";

  return (
    <AdminAutoSaveContext.Provider value={{ scheduleAutoSave }}>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 overflow-x-hidden">
        {/* Dynamic Sleek Dark Admin Top Bar (Supports White & Red Logos Clearly!) */}
        <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950 text-white">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={assetUrl(adminBarLogo)}
                alt={adminBarTitle}
                className="h-8 w-auto max-w-[110px] object-contain shrink-0"
              />
              <div className="min-w-0 flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base text-white truncate">
                  {adminBarTitle}
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-300 rounded">
                  {currentUser.username}
                </span>
                <span
                  className={`hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${
                    currentUser.role === "full"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : currentUser.role === "read"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {currentUser.role === "full"
                    ? "Full"
                    : currentUser.role === "read"
                      ? "Read Only"
                      : "Custom"}
                </span>
                <span
                  title="Batas idle sesi 10 menit (reset otomatis saat aktif atau refresh)"
                  className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded ${
                    idleRemainingSec <= 120
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {String(Math.floor(idleRemainingSec / 60)).padStart(2, "0")}:
                  {String(idleRemainingSec % 60).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lihat Web</span>
              </Link>
              {!isReadOnly && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded bg-red-600 hover:bg-red-500 disabled:opacity-60 px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Menyimpan..." : "Simpan"}</span>
                </button>
              )}
              <button
                onClick={() => handleLogout("manual")}
                title="Logout"
                className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 hover:border-red-500 hover:text-red-400 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Keluar</span>
              </button>
            </div>
          </div>

          {/* Mobile Horizontal Tab Strip */}
          <div className="lg:hidden border-t border-zinc-800 bg-zinc-900 px-3 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const active = effectiveActiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 py-2.5 px-3 text-xs font-medium border-b-2 transition cursor-pointer ${
                    active
                      ? "border-red-500 text-white"
                      : "border-transparent text-zinc-400 hover:text-white"
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
        {/* Desktop Sidebar (Drag & Drop Reorderable) */}
        <aside className="hidden lg:block lg:col-span-3">
          <nav className="sticky top-20 space-y-0.5">
            <div className="px-3 pb-1.5 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Geser menu untuk atur urutan</span>
              {data.adminTabOrder && data.adminTabOrder.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setData((prev) => ({ ...prev, adminTabOrder: undefined }));
                    scheduleAutoSave();
                  }}
                  className="text-red-600 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            {tabs.map((tab, idx) => {
              const active = effectiveActiveTab === tab.id;
              return (
                <div
                  key={tab.id}
                  draggable
                  onDragStart={() => setTabDragIdx(idx)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (tabOverIdx !== idx) setTabOverIdx(idx);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleTabDrop(idx);
                  }}
                  onDragEnd={() => {
                    setTabDragIdx(null);
                    setTabOverIdx(null);
                  }}
                  className={`flex items-center gap-1 rounded transition ${
                    tabOverIdx === idx && tabDragIdx !== idx
                      ? "ring-2 ring-red-400 bg-red-50"
                      : ""
                  } ${tabDragIdx === idx ? "opacity-45" : ""}`}
                >
                  <span
                    title="Geser urutan menu"
                    className="pl-1.5 py-2 text-zinc-400 hover:text-zinc-600 cursor-grab active:cursor-grabbing shrink-0"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </span>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 text-left px-2 py-2 rounded text-sm font-medium transition cursor-pointer ${
                      active
                        ? "bg-red-600 text-white"
                        : "text-zinc-700 hover:bg-zinc-200/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Form Panels */}
        <main className="lg:col-span-9 min-w-0 space-y-5">
          {isReadOnly && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
              Anda login dengan mode <strong>Read Only</strong>. Anda dapat melihat seluruh pengaturan, statistik, dan log, tetapi tidak dapat mengubah atau menyimpan data.
            </div>
          )}

          {/* STATISTIK WEB */}
          {effectiveActiveTab === "analytics" && (
            <AdminAnalyticsPanel
              role={currentUser.role}
              onUnauthorized={() => setCurrentUser(null)}
            />
          )}

          {/* URUTAN SECTION WEBSITE */}
          {effectiveActiveTab === "sections" && (
            <fieldset disabled={isReadOnly} className="space-y-5 disabled:opacity-75">
              <SectionOrderPanel
                data={data}
                setData={setData}
                onJumpTab={(t) => setActiveTab(t as TabId)}
              />
            </fieldset>
          )}

          {/* AKUN & PASSWORD ADMIN */}
          {effectiveActiveTab === "users" && (
            <AdminUsersPanel
              currentUser={currentUser}
              onShowToast={showToast}
              onResetSiteData={handleReset}
            />
          )}

          {/* LOG AKTIVITAS ADMIN */}
          {effectiveActiveTab === "logs" && (
            <AdminLogsPanel onUnauthorized={() => setCurrentUser(null)} />
          )}

          {/* 0. OPENING & LOADING */}
          {effectiveActiveTab === "opening" && (
            <fieldset disabled={isReadOnly} className="space-y-5 disabled:opacity-75">
              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">
                      Layar Opening &amp; Loading (KPR Style)
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Atur semua tulisan, logo, dan gambar pada animasi loading (0–100%) serta transisi sebelum masuk ke Home.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.opening.enabled !== false}
                      onChange={(e) =>
                        setData({
                          ...data,
                          opening: {
                            ...data.opening,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="accent-red-600 w-3.5 h-3.5"
                    />
                    Aktifkan Opening
                  </label>
                </div>

                <div className="space-y-3.5">
                  <ImageField
                    label="Logo saat Loading (0–100%)"
                    value={data.opening.loadingLogo}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, loadingLogo: v },
                      })
                    }
                    allowClear
                  />
                  <ImageField
                    label="Logo di Atas Tulisan Besar (Tahap 2)"
                    value={data.opening.revealLogo}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, revealLogo: v },
                      })
                    }
                    allowClear
                  />
                  <ImageField
                    label="Gambar Background Opening/Loading (Opsional)"
                    value={data.opening.backgroundImage}
                    placeholder="Kosongkan untuk latar gelap bersih"
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, backgroundImage: v },
                      })
                    }
                    allowClear
                  />
                </div>
              </section>

              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Tahap 1: Tulisan saat Loading (0% – 100%)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <InputField
                    label="Teks Kiri Atas (Saat Loading)"
                    value={data.opening.topLeftLoadingText}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, topLeftLoadingText: v },
                      })
                    }
                  />
                  <InputField
                    label="Teks Tengah Atas HUD"
                    value={data.opening.topCenterText}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, topCenterText: v },
                      })
                    }
                  />
                  <InputField
                    label="Teks Kanan Atas HUD (Kosongkan = ikut Tahun Berdiri)"
                    value={data.opening.topRightText}
                    placeholder={data.branding.estYear}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, topRightText: v },
                      })
                    }
                  />
                  <InputField
                    label="Tulisan di Bawah Garis Loading"
                    value={data.opening.loadingStatusText}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, loadingStatusText: v },
                      })
                    }
                  />
                  <InputField
                    label="Prefix Persentase Kiri Bawah (Contoh: LOAD)"
                    value={data.opening.bottomLeftLoadingPrefix}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: {
                          ...data.opening,
                          bottomLeftLoadingPrefix: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Teks Tombol Skip Kanan Bawah"
                    value={data.opening.skipButtonText}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, skipButtonText: v },
                      })
                    }
                  />
                </div>
              </section>

              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Tahap 2: Tulisan Besar Transisi Sebelum Masuk Home
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Muncul setelah loading selesai sebelum tirai terbuka masuk ke halaman utama.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <InputField
                    label="Tulisan Raksasa Utama (Contoh: GODLIKE)"
                    value={data.opening.heroWord}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, heroWord: v },
                      })
                    }
                  />
                  <InputField
                    label="Tulisan Bayangan Belakang / Outline Merah (Contoh: NOVUS)"
                    value={data.opening.subWord}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, subWord: v },
                      })
                    }
                  />
                  <InputField
                    label="Teks Pita Merah (Kosongkan = otomatis)"
                    value={data.opening.badgeText}
                    placeholder={`${data.opening.subWord || "NOVUS"} • ${data.branding.estYear}`}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, badgeText: v },
                      })
                    }
                  />
                  <InputField
                    label="Teks Kutipan Bawah (Kosongkan = ikut Tagline Utama)"
                    value={data.opening.quoteText}
                    placeholder={data.branding.tagline}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, quoteText: v },
                      })
                    }
                  />
                  <InputField
                    label="Teks Kiri Atas saat Selesai Loading"
                    value={data.opening.topLeftReadyText}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, topLeftReadyText: v },
                      })
                    }
                  />
                  <InputField
                    label="Teks Kiri Bawah saat Masuk Home"
                    value={data.opening.bottomLeftReadyText}
                    onChange={(v) =>
                      setData({
                        ...data,
                        opening: { ...data.opening, bottomLeftReadyText: v },
                      })
                    }
                  />
                </div>

                <ImageField
                  label="Gambar Pengganti Tulisan Raksasa (Opsional — isi jika ingin memakai gambar/tipografi custom)"
                  value={data.opening.heroImage}
                  placeholder="Kosongkan jika tetap memakai teks raksasa di atas"
                  onChange={(v) =>
                    setData({
                      ...data,
                      opening: { ...data.opening, heroImage: v },
                    })
                  }
                  allowClear
                />
              </section>
            </fieldset>
          )}

          {/* 1. HOME, BRANDING & NAVBAR */}
          {effectiveActiveTab === "branding" && (
            <div className="space-y-5">
              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Tema Background Website
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Pilih tampilan nuansa warna background website publik yang paling nyaman dibaca.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-2">
                  {(
                    [
                      {
                        id: "dark-crimson",
                        title: "1. Existing (Dark Crimson)",
                        desc: "Gelap elegan dengan aksen merah-putih.",
                        preview: "bg-gradient-to-br from-[#09090b] via-[#1c0a0e] to-zinc-900 text-white border-zinc-700",
                      },
                      {
                        id: "red-white",
                        title: "2. Merah–Putih Editorial",
                        desc: "Terang bersih putih-merah, kontras tinggi.",
                        preview: "bg-gradient-to-br from-white via-rose-50 to-red-100 text-zinc-900 border-red-200",
                      },
                      {
                        id: "gaming-red-white",
                        title: "3. Gaming Merah–Putih",
                        desc: "Grid taktis esports + sorot merah-putih.",
                        preview: "bg-gradient-to-br from-[#19060a] via-[#4a0b16] to-zinc-200 text-white border-red-500/50",
                      },
                    ] as const
                  ).map((opt) => {
                    const active =
                      (data.branding.siteTheme || "dark-crimson") === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setData({
                            ...data,
                            branding: { ...data.branding, siteTheme: opt.id },
                          })
                        }
                        className={`text-left rounded-md border p-3 transition cursor-pointer ${
                          active
                            ? "border-red-600 ring-2 ring-red-500/30 bg-red-50/40"
                            : "border-zinc-200 hover:border-zinc-400 bg-white"
                        }`}
                      >
                        <div
                          className={`h-8 w-full rounded border mb-2 ${opt.preview}`}
                        />
                        <div className="text-xs font-semibold text-zinc-900">
                          {opt.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="border-b border-zinc-100 pb-3 pt-2">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Identitas &amp; Konten Hero Home
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Atur semua teks utama di bagian atas halaman Home serta nomor WhatsApp utama.
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
                    label="Judul Besar Hero / Tagline Utama"
                    value={data.branding.tagline}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, tagline: v },
                      })
                    }
                  />
                  <InputField
                    label="Nomor WhatsApp Utama (Format 628xxx)"
                    value={data.branding.whatsappNumber}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, whatsappNumber: v },
                      })
                    }
                  />
                  <InputField
                    label="Teks Tombol Utama Hero"
                    value={data.branding.heroCtaPrimary}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, heroCtaPrimary: v },
                      })
                    }
                  />
                  <InputField
                    label="Link Tombol Utama Hero"
                    value={data.homeSections.heroCtaPrimaryHref}
                    placeholder="#roster"
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          heroCtaPrimaryHref: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Teks Tombol Kedua Hero"
                    value={data.branding.heroCtaSecondary}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, heroCtaSecondary: v },
                      })
                    }
                  />
                  <InputField
                    label="Link Tombol Kedua Hero"
                    value={data.homeSections.heroCtaSecondaryHref}
                    placeholder="#store"
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          heroCtaSecondaryHref: v,
                        },
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
                    Baris HUD Hero, Teks Berjalan (Ticker) &amp; Footer
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Edit semua detail tulisan dekoratif di bingkai Hero Home dan teks hak cipta di bagian paling bawah.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <InputField
                    label="HUD Kiri Atas Hero (Kosongkan = otomatis)"
                    value={data.homeSections.heroHudLeft}
                    placeholder={`[01 // ${data.branding.teamName}]`}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: { ...data.homeSections, heroHudLeft: v },
                      })
                    }
                  />
                  <InputField
                    label="HUD Tengah Atas Hero"
                    value={data.homeSections.heroHudCenter}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          heroHudCenter: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="HUD Kanan Atas Hero (Kosongkan = ikut Tahun)"
                    value={data.homeSections.heroHudRight}
                    placeholder={data.branding.estYear}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: { ...data.homeSections, heroHudRight: v },
                      })
                    }
                  />
                </div>

                <InputField
                  label="Teks Berjalan / Marquee Bawah Hero (Pisahkan tiap item dengan tanda | — kosongkan untuk otomatis)"
                  value={data.homeSections.heroTickerText}
                  placeholder="★ GODLIKE NOVUS | GAMERS DON'T DIE, THEY RESPAWN | // HONOR OF KINGS | // EST. 2013"
                  onChange={(v) =>
                    setData({
                      ...data,
                      homeSections: { ...data.homeSections, heroTickerText: v },
                    })
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <InputField
                    label="Teks Panah Scroll di Bawah Hero"
                    value={data.homeSections.heroScrollCueText}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          heroScrollCueText: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Label Titik 01 di Navigasi Samping"
                    value={data.homeSections.heroNavLabel}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: { ...data.homeSections, heroNavLabel: v },
                      })
                    }
                  />
                  <InputField
                    label="Teks Copyright Footer (Kosongkan = otomatis)"
                    value={data.homeSections.footerCopyright}
                    placeholder={`© {year} ${data.branding.teamName} • ${data.branding.estYear}`}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          footerCopyright: v,
                        },
                      })
                    }
                  />
                </div>
              </section>

              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Semua Logo &amp; Gambar di Home, Navbar &amp; Footer
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Masukkan path gambar atau klik Upload dari HP/laptop.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <ImageField
                    label="Logo Bar Atas Website (Navbar — otomatis dipakai Bar Admin juga jika Logo Admin kosong)"
                    value={data.branding.navbarLogo || data.branding.logoWhite}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, navbarLogo: v },
                      })
                    }
                  />
                  <ImageField
                    label="Logo Khusus Bar Admin & Login (Opsional — kosongkan untuk ikut Logo Navbar)"
                    value={data.branding.adminLogo || ""}
                    placeholder="Kosongkan agar otomatis mengikuti Logo Navbar"
                    allowClear
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, adminLogo: v },
                      })
                    }
                  />
                  <InputField
                    label="Nama / Judul di Bar Admin"
                    value={data.branding.adminTitle || "Godlike Admin"}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, adminTitle: v },
                      })
                    }
                  />
                  <ImageField
                    label="Favicon (Icon di Tab Browser)"
                    value={data.branding.favicon || data.branding.logoRed}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, favicon: v },
                      })
                    }
                  />
                  <ImageField
                    label="Logo Merah (Tampil di Hero HP & Admin)"
                    value={data.branding.logoRed}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, logoRed: v },
                      })
                    }
                  />
                  <ImageField
                    label="Gambar Utama Kanan Hero (Tampil di Desktop)"
                    value={data.branding.logoTagline}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, logoTagline: v },
                      })
                    }
                    allowClear
                  />
                  <ImageField
                    label="Gambar Background Hero Home (Opsional)"
                    value={data.homeSections.heroBgImage}
                    placeholder="Kosongkan untuk tetap memakai grid esports gelap"
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: { ...data.homeSections, heroBgImage: v },
                      })
                    }
                    allowClear
                  />
                  <ImageField
                    label="Logo Putih (Footer Bawah)"
                    value={data.branding.logoWhite}
                    onChange={(v) =>
                      setData({
                        ...data,
                        branding: { ...data.branding, logoWhite: v },
                      })
                    }
                  />
                </div>
              </section>

              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Tulisan Navbar &amp; Tab Browser (SEO)
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

                <TextareaField
                  label="Deskripsi Website (Meta Description)"
                  value={data.branding.siteDescription || ""}
                  onChange={(v) =>
                    setData({
                      ...data,
                      branding: { ...data.branding, siteDescription: v },
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
                      ["ambassadors", "Label Menu 4", "Ambassador"],
                      ["store", "Label Menu 5", "Store"],
                      ["sponsors", "Label Menu 6", "Sponsors"],
                      ["contact", "Label Menu 7", "Contact"],
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
                              ambassadors:
                                data.branding.navLabels?.ambassadors ||
                                "Ambassador",
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

          {/* 2. TEMPLATE KIRIM PESAN */}
          {effectiveActiveTab === "templates" && (
            <div className="space-y-5">
              {/* Store Order WA Template */}
              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">
                      1. Template Pesan Order Store (WhatsApp)
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Atur format pesan otomatis saat pembeli klik tombol pesan produk di Store.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        templates: {
                          ...data.templates,
                          storeWhatsappTemplate: DEFAULT_STORE_WA_TEMPLATE,
                        },
                      })
                    }
                    className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
                  >
                    Reset Template Default
                  </button>
                </div>

                <div>
                  <span className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Klik variabel untuk menyisipkan ke akhir template:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {STORE_TEMPLATE_VARS.map(([token, desc]) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() =>
                          setData({
                            ...data,
                            templates: {
                              ...data.templates,
                              storeWhatsappTemplate: `${data.templates.storeWhatsappTemplate}${token}`,
                            },
                          })
                        }
                        className="px-2 py-1 rounded border border-zinc-300 bg-zinc-50 hover:border-red-500 hover:text-red-600 text-[11px] font-mono text-zinc-700 transition cursor-pointer"
                        title={desc}
                      >
                        {token} <span className="font-sans text-zinc-400">({desc})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Isi Template Pesan Order
                    </label>
                    <textarea
                      rows={13}
                      value={data.templates.storeWhatsappTemplate}
                      onChange={(e) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            storeWhatsappTemplate: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm font-mono text-zinc-900 focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-zinc-700 mb-1">
                      Preview Tampilan di WhatsApp
                    </span>
                    <pre className="w-full rounded border border-emerald-200 bg-emerald-50/60 p-3 text-xs font-mono text-zinc-800 whitespace-pre-wrap overflow-x-auto min-h-[16rem]">
                      {storePreviewMessage}
                    </pre>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                    Label &amp; Placeholder Form Pemesanan Store
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField
                      label="Judul Kecil Modal"
                      value={data.templates.storeModalBadge}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: { ...data.templates, storeModalBadge: v },
                        })
                      }
                    />
                    <InputField
                      label="Teks Tombol Kirim Order"
                      value={data.templates.storeSubmitButtonText}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            storeSubmitButtonText: v,
                          },
                        })
                      }
                    />
                    <InputField
                      label="Label Nama Pemesan"
                      value={data.templates.storeNameLabel}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: { ...data.templates, storeNameLabel: v },
                        })
                      }
                    />
                    <InputField
                      label="Placeholder Nama Pemesan"
                      value={data.templates.storeNamePlaceholder}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            storeNamePlaceholder: v,
                          },
                        })
                      }
                    />
                    <InputField
                      label="Label Nomor WhatsApp"
                      value={data.templates.storePhoneLabel}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: { ...data.templates, storePhoneLabel: v },
                        })
                      }
                    />
                    <InputField
                      label="Placeholder Nomor WhatsApp"
                      value={data.templates.storePhonePlaceholder}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            storePhonePlaceholder: v,
                          },
                        })
                      }
                    />
                    <InputField
                      label="Label Ukuran"
                      value={data.templates.storeSizeLabel}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: { ...data.templates, storeSizeLabel: v },
                        })
                      }
                    />
                    <InputField
                      label="Label Jumlah (Qty)"
                      value={data.templates.storeQtyLabel}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: { ...data.templates, storeQtyLabel: v },
                        })
                      }
                    />
                    <InputField
                      label="Label Alamat Pengiriman"
                      value={data.templates.storeAddressLabel}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            storeAddressLabel: v,
                          },
                        })
                      }
                    />
                    <InputField
                      label="Placeholder Alamat Pengiriman"
                      value={data.templates.storeAddressPlaceholder}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            storeAddressPlaceholder: v,
                          },
                        })
                      }
                    />
                    <InputField
                      label="Label Catatan"
                      value={data.templates.storeNotesLabel}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: { ...data.templates, storeNotesLabel: v },
                        })
                      }
                    />
                    <InputField
                      label="Placeholder Catatan"
                      value={data.templates.storeNotesPlaceholder}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            storeNotesPlaceholder: v,
                          },
                        })
                      }
                    />
                    <InputField
                      label="Label Total Harga"
                      value={data.templates.storeTotalLabel}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: { ...data.templates, storeTotalLabel: v },
                        })
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Contact Us WA Template */}
              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">
                      2. Template Pesan Contact Us (WhatsApp)
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Atur format pesan saat pengunjung mengirim pesan lewat form Contact Us di bawah halaman.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        templates: {
                          ...data.templates,
                          contactWhatsappTemplate: DEFAULT_CONTACT_WA_TEMPLATE,
                        },
                      })
                    }
                    className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
                  >
                    Reset Template Default
                  </button>
                </div>

                <div>
                  <span className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Klik variabel untuk menyisipkan ke akhir template:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTACT_TEMPLATE_VARS.map(([token, desc]) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() =>
                          setData({
                            ...data,
                            templates: {
                              ...data.templates,
                              contactWhatsappTemplate: `${data.templates.contactWhatsappTemplate}${token}`,
                            },
                          })
                        }
                        className="px-2 py-1 rounded border border-zinc-300 bg-zinc-50 hover:border-red-500 hover:text-red-600 text-[11px] font-mono text-zinc-700 transition cursor-pointer"
                      >
                        {token} <span className="font-sans text-zinc-400">({desc})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Isi Template Pesan Kontak
                    </label>
                    <textarea
                      rows={9}
                      value={data.templates.contactWhatsappTemplate}
                      onChange={(e) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            contactWhatsappTemplate: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm font-mono text-zinc-900 focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-zinc-700 mb-1">
                      Preview Tampilan di WhatsApp
                    </span>
                    <pre className="w-full rounded border border-emerald-200 bg-emerald-50/60 p-3 text-xs font-mono text-zinc-800 whitespace-pre-wrap overflow-x-auto min-h-[12rem]">
                      {contactPreviewMessage}
                    </pre>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                    Label &amp; Placeholder Form Contact Us
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField
                      label="Label Input Nama"
                      value={data.templates.contactNameLabel}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: { ...data.templates, contactNameLabel: v },
                        })
                      }
                    />
                    <InputField
                      label="Placeholder Input Nama"
                      value={data.templates.contactNamePlaceholder}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            contactNamePlaceholder: v,
                          },
                        })
                      }
                    />
                    <InputField
                      label="Label Input Email"
                      value={data.templates.contactEmailLabel}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            contactEmailLabel: v,
                          },
                        })
                      }
                    />
                    <InputField
                      label="Placeholder Input Email"
                      value={data.templates.contactEmailPlaceholder}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            contactEmailPlaceholder: v,
                          },
                        })
                      }
                    />
                    <InputField
                      label="Label Input Pesan"
                      value={data.templates.contactMessageLabel}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            contactMessageLabel: v,
                          },
                        })
                      }
                    />
                    <InputField
                      label="Placeholder Input Pesan"
                      value={data.templates.contactMessagePlaceholder}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            contactMessagePlaceholder: v,
                          },
                        })
                      }
                    />
                    <InputField
                      label="Teks Tombol Kirim Pesan"
                      value={data.templates.contactSubmitButtonText}
                      onChange={(v) =>
                        setData({
                          ...data,
                          templates: {
                            ...data.templates,
                            contactSubmitButtonText: v,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* 3. GAMES & ROSTER */}
          {effectiveActiveTab === "games" && (
            <div className="space-y-5">
              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Judul &amp; Label Seksi Roster di Home
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <InputField
                    label="Badge Atas Seksi"
                    value={data.homeSections.rosterBadge}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: { ...data.homeSections, rosterBadge: v },
                      })
                    }
                  />
                  <InputField
                    label="Judul Kata Putih"
                    value={data.homeSections.rosterTitleWhite}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          rosterTitleWhite: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Judul Kata Merah"
                    value={data.homeSections.rosterTitleAccent}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          rosterTitleAccent: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Akhiran Banner (Contoh: DIVISION)"
                    value={data.homeSections.rosterDivisionSuffix}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          rosterDivisionSuffix: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Subjudul Coach"
                    value={data.homeSections.rosterCoachesHeading}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          rosterCoachesHeading: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Subjudul Daftar Player"
                    value={data.homeSections.rosterPlayersHeading}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          rosterPlayersHeading: v,
                        },
                      })
                    }
                  />
                </div>
                <InputField
                  label="Petunjuk Klik Kartu Player (Kosongkan jika ingin disembunyikan)"
                  value={data.homeSections.rosterTapBioHint}
                  onChange={(v) =>
                    setData({
                      ...data,
                      homeSections: {
                        ...data.homeSections,
                        rosterTapBioHint: v,
                      },
                    })
                  }
                />
              </section>

              <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">
                      Divisi Game &amp; Anggota Roster
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
                    {/* PROMINENT SUB-DIVISI / MULTI-TEAM SWITCHER RIGHT AT TOP */}
                    <div className="rounded-md border border-red-200 bg-red-50/40 p-3.5 sm:p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-red-600" />
                            Sub-Divisi / Daftar Tim di Dalam {activeGame.name}
                          </h4>
                          <p className="text-xs text-zinc-600 mt-0.5">
                            {hasSubTeams
                              ? `Aktif (${activeSubTeams.length} Tim): Saat pengunjung klik ${activeGame.shortName} di web, akan muncul daftar kartu tim ini terlebih dahulu, baru setelah diklik muncul rosternya.`
                              : `Tidak memakai sub-divisi (seperti RF): Saat pengunjung klik ${activeGame.shortName}, langsung muncul roster. Klik tombol di kanan jika ${activeGame.shortName} punya beberapa tim.`}
                          </p>
                        </div>

                        {!hasSubTeams ? (
                          <button
                            type="button"
                            onClick={() => {
                              const id1 = `sub-${Date.now()}-1`;
                              const id2 = `sub-${Date.now()}-2`;
                              const firstTeam: GameSubTeam = {
                                id: id1,
                                name: `GODLIKE NOVUS 1`,
                                shortName: "SQUAD 1",
                                logo: "",
                                description: `Skuad utama divisi ${activeGame.name}.`,
                                bannerImage: "",
                                roster: [...activeGame.roster],
                              };
                              const secondTeam: GameSubTeam = {
                                id: id2,
                                name: `GODLIKE NOVUS 2`,
                                shortName: "SQUAD 2",
                                logo: "",
                                description: `Skuad kedua divisi ${activeGame.name}.`,
                                bannerImage: "",
                                roster: [],
                              };
                              updateGame(activeGame.id, (g) => ({
                                ...g,
                                roster: [],
                                subTeams: [firstTeam, secondTeam],
                              }));
                              setSelectedSubTeamId(id1);
                            }}
                            className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-medium text-white cursor-pointer shrink-0 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tambah Sub-Divisi / Tim di{" "}
                            {activeGame.shortName}
                          </button>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newSubId = `sub-${Date.now()}`;
                                const nextNum = activeSubTeams.length + 1;
                                const newSub: GameSubTeam = {
                                  id: newSubId,
                                  name: `GODLIKE NOVUS ${nextNum}`,
                                  shortName: `SQUAD ${nextNum}`,
                                  logo: "",
                                  description: "",
                                  bannerImage: "",
                                  roster: [],
                                };
                                updateGame(activeGame.id, (g) => ({
                                  ...g,
                                  subTeams: [...(g.subTeams || []), newSub],
                                }));
                                setSelectedSubTeamId(newSubId);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-700 px-2.5 py-1.5 text-xs font-medium text-white cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Tambah Tim Baru
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  !confirm(
                                    `Matikan mode sub-divisi dan gabungkan semua anggota ke 1 daftar langsung untuk ${activeGame.name}?`
                                  )
                                )
                                  return;
                                const mergedRoster = activeSubTeams.flatMap(
                                  (st) => st.roster
                                );
                                updateGame(activeGame.id, (g) => ({
                                  ...g,
                                  subTeams: [],
                                  roster: mergedRoster,
                                }));
                                setSelectedSubTeamId("");
                              }}
                              className="inline-flex items-center gap-1 rounded border border-zinc-300 bg-white hover:bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 cursor-pointer"
                            >
                              Matikan Sub-Divisi
                            </button>
                          </div>
                        )}
                      </div>

                      {hasSubTeams && (
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                          {activeSubTeams.map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setSelectedSubTeamId(st.id)}
                              className={`shrink-0 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer border ${
                                activeSubTeam?.id === st.id
                                  ? "bg-red-600 border-red-600 text-white"
                                  : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                              }`}
                            >
                              {st.name} ({st.roster.length})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <h3 className="text-sm font-semibold text-zinc-800">
                        Detail Divisi Game: {activeGame.name}
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
                      label="Banner Divisi (Foto atau Video MP4/WebM)"
                      value={activeGame.bannerImage}
                      onChange={(v) =>
                        updateGame(activeGame.id, (g) => ({
                          ...g,
                          bannerImage: v,
                        }))
                      }
                    />

                    {/* SELECTED SUB-TEAM SETTINGS & ROSTER */}
                    <div className="pt-4 border-t border-zinc-200 space-y-4">
                      {activeSubTeam && (
                        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3.5 sm:p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                              Detail Tim / Sub-Divisi: {activeSubTeam.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (activeSubTeams.length <= 1) {
                                  updateGame(activeGame.id, (g) => ({
                                    ...g,
                                    roster: activeSubTeam.roster,
                                    subTeams: [],
                                  }));
                                  setSelectedSubTeamId("");
                                  return;
                                }
                                const remaining = activeSubTeams.filter(
                                  (s) => s.id !== activeSubTeam.id
                                );
                                updateGame(activeGame.id, (g) => ({
                                  ...g,
                                  subTeams: remaining,
                                }));
                                setSelectedSubTeamId(remaining[0]?.id || "");
                              }}
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus Tim Ini
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InputField
                              label="Nama Tim (Muncul di Kartu Tim — Contoh: GODLIKE BEKASI)"
                              value={activeSubTeam.name}
                              onChange={(v) =>
                                updateSubTeam(
                                  activeGame.id,
                                  activeSubTeam.id,
                                  (st) => ({ ...st, name: v })
                                )
                              }
                            />
                            <InputField
                              label="Kode / Badge Tim (Contoh: BEKASI / LADIES / ACADEMY)"
                              value={activeSubTeam.shortName}
                              onChange={(v) =>
                                updateSubTeam(
                                  activeGame.id,
                                  activeSubTeam.id,
                                  (st) => ({ ...st, shortName: v })
                                )
                              }
                            />
                          </div>

                          <InputField
                            label="Deskripsi Singkat Tim (Muncul di kartu pilihan tim)"
                            value={activeSubTeam.description || ""}
                            placeholder={`Deskripsi singkat untuk tim ${activeSubTeam.name}`}
                            onChange={(v) =>
                              updateSubTeam(
                                activeGame.id,
                                activeSubTeam.id,
                                (st) => ({ ...st, description: v })
                              )
                            }
                          />

                          <ImageField
                            label="Gambar / Logo Kartu Tim (Muncul saat daftar tim ditampilkan)"
                            value={activeSubTeam.logo || ""}
                            placeholder="Upload logo/foto tim (kosongkan = ikut banner)"
                            onChange={(v) =>
                              updateSubTeam(
                                activeGame.id,
                                activeSubTeam.id,
                                (st) => ({ ...st, logo: v })
                              )
                            }
                            allowClear
                          />

                          <ImageField
                            label="Banner Header Tim saat Dibuka (Opsional Foto/Video)"
                            value={activeSubTeam.bannerImage || ""}
                            placeholder={activeGame.bannerImage}
                            onChange={(v) =>
                              updateSubTeam(
                                activeGame.id,
                                activeSubTeam.id,
                                (st) => ({ ...st, bannerImage: v })
                              )
                            }
                            allowClear
                          />
                        </div>
                      )}

                      {/* Roster List (Operates on activeSubTeam.roster if hasSubTeams, else activeGame.roster!) */}
                      {(() => {
                        const targetRoster = activeSubTeam
                          ? activeSubTeam.roster
                          : activeGame.roster;

                        const setTargetRoster = (
                          updater: (list: RosterMember[]) => RosterMember[]
                        ) => {
                          if (activeSubTeam) {
                            updateSubTeam(
                              activeGame.id,
                              activeSubTeam.id,
                              (st) => ({
                                ...st,
                                roster: updater(st.roster),
                              })
                            );
                          } else {
                            updateGame(activeGame.id, (g) => ({
                              ...g,
                              roster: updater(g.roster),
                            }));
                          }
                        };

                        return (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-zinc-900">
                                Anggota Roster{" "}
                                {activeSubTeam
                                  ? `(${activeSubTeam.shortName || activeSubTeam.name})`
                                  : `(${activeGame.shortName})`}{" "}
                                — {targetRoster.length} Orang
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
                                  setTargetRoster((list) => [
                                    ...list,
                                    newMember,
                                  ]);
                                }}
                                className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-700 px-2.5 py-1.5 text-xs font-medium text-white cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Tambah Anggota
                              </button>
                            </div>

                            {targetRoster.length === 0 ? (
                              <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-xs text-zinc-500">
                                Belum ada anggota di tim ini. Klik &ldquo;+ Tambah Anggota&rdquo; untuk menambahkan player atau coach.
                              </div>
                            ) : (
                              <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md">
                                {targetRoster.map((member) => (
                                  <div
                                    key={member.id}
                                    className="p-3.5 sm:p-4 space-y-3"
                                  >
                                    <div className="flex items-center justify-between">
                                      <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={member.isCoach}
                                          onChange={(e) =>
                                            setTargetRoster((list) =>
                                              list.map((m) =>
                                                m.id === member.id
                                                  ? {
                                                      ...m,
                                                      isCoach: e.target.checked,
                                                    }
                                                  : m
                                              )
                                            )
                                          }
                                          className="accent-red-600 w-3.5 h-3.5"
                                        />
                                        Coach / Pelatih
                                      </label>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setTargetRoster((list) =>
                                            list.filter(
                                              (m) => m.id !== member.id
                                            )
                                          )
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
                                          setTargetRoster((list) =>
                                            list.map((m) =>
                                              m.id === member.id
                                                ? { ...m, ign: v }
                                                : m
                                            )
                                          )
                                        }
                                      />
                                      <InputField
                                        label="Nama Lengkap"
                                        value={member.realName}
                                        onChange={(v) =>
                                          setTargetRoster((list) =>
                                            list.map((m) =>
                                              m.id === member.id
                                                ? { ...m, realName: v }
                                                : m
                                            )
                                          )
                                        }
                                      />
                                      <InputField
                                        label="Role / Posisi"
                                        value={member.role}
                                        onChange={(v) =>
                                          setTargetRoster((list) =>
                                            list.map((m) =>
                                              m.id === member.id
                                                ? { ...m, role: v }
                                                : m
                                            )
                                          )
                                        }
                                      />
                                    </div>

                                    <ImageField
                                      label="Foto / Video Anggota (Resolusi Asli Utuh)"
                                      value={member.photo}
                                      onChange={(v) =>
                                        setTargetRoster((list) =>
                                          list.map((m) =>
                                            m.id === member.id
                                              ? { ...m, photo: v }
                                              : m
                                          )
                                        )
                                      }
                                    />

                                    <MultiMediaField
                                      label="Foto / Video Tambahan Anggota (Swipe ala IG)"
                                      values={member.images || []}
                                      hiddenUrls={member.hiddenImages || []}
                                      onToggleHidden={(url) =>
                                        setTargetRoster((list) =>
                                          list.map((m) =>
                                            m.id === member.id
                                              ? {
                                                  ...m,
                                                  hiddenImages: toggleUrl(
                                                    m.hiddenImages,
                                                    url
                                                  ),
                                                }
                                              : m
                                          )
                                        )
                                      }
                                      onChange={(urls) =>
                                        setTargetRoster((list) =>
                                          list.map((m) =>
                                            m.id === member.id
                                              ? { ...m, images: urls }
                                              : m
                                          )
                                        )
                                      }
                                      onPromoteToCover={(url) =>
                                        setTargetRoster((list) =>
                                          list.map((m) =>
                                            m.id === member.id
                                              ? { ...m, photo: url }
                                              : m
                                          )
                                        )
                                      }
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <InputField
                                        label="Bio Singkat"
                                        value={member.bio}
                                        onChange={(v) =>
                                          setTargetRoster((list) =>
                                            list.map((m) =>
                                              m.id === member.id
                                                ? { ...m, bio: v }
                                                : m
                                            )
                                          )
                                        }
                                      />
                                      <InputField
                                        label="Prestasi"
                                        value={member.achievements}
                                        onChange={(v) =>
                                          setTargetRoster((list) =>
                                            list.map((m) =>
                                              m.id === member.id
                                                ? { ...m, achievements: v }
                                                : m
                                            )
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. ABOUT US */}
          {effectiveActiveTab === "about" && (
            <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-5">
              <div className="border-b border-zinc-100 pb-3">
                <h2 className="text-base font-semibold text-zinc-900">
                  About Us &amp; Dokumentasi Foto
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <InputField
                  label="Prefix Kode Seksi"
                  value={data.homeSections.aboutBadgePrefix}
                  placeholder="[03] //"
                  onChange={(v) =>
                    setData({
                      ...data,
                      homeSections: {
                        ...data.homeSections,
                        aboutBadgePrefix: v,
                      },
                    })
                  }
                />
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

              <ImageField
                label="Gambar Background Seksi About Us (Opsional)"
                value={data.homeSections.aboutBgImage}
                placeholder="Kosongkan untuk latar gelap standar"
                onChange={(v) =>
                  setData({
                    ...data,
                    homeSections: { ...data.homeSections, aboutBgImage: v },
                  })
                }
                allowClear
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

              {/* About Photos & Videos */}
              <div className="pt-3 border-t border-zinc-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-semibold text-zinc-800 block">
                      Foto &amp; Video Showcase
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Bisa upload foto resolusi penuh, video MP4/MOV/WebM, atau paste link YouTube.
                    </span>
                  </div>
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
                    className="inline-flex items-center gap-1 rounded bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Media
                  </button>
                </div>

                <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md">
                  {data.about.photos.map((ph) => (
                    <div key={ph.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ph.enabled !== false}
                            onChange={(e) =>
                              setData({
                                ...data,
                                about: {
                                  ...data.about,
                                  photos: data.about.photos.map((p) =>
                                    p.id === ph.id
                                      ? { ...p, enabled: e.target.checked }
                                      : p
                                  ),
                                },
                              })
                            }
                            className="accent-red-600 w-3.5 h-3.5"
                          />
                          {ph.enabled !== false ? "Tampil di Web" : "Disembunyikan"}
                        </label>
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
                        label="File / URL Foto atau Video (MP4 / MOV / YouTube)"
                        value={ph.url}
                        placeholder="/images/... atau upload foto/video atau link YouTube"
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
                      <MultiMediaField
                        label="Foto / Video Tambahan (Swipe ala IG)"
                        values={ph.images || []}
                        hiddenUrls={ph.hiddenImages || []}
                        onToggleHidden={(url) =>
                          setData({
                            ...data,
                            about: {
                              ...data.about,
                              photos: data.about.photos.map((p) =>
                                p.id === ph.id
                                  ? { ...p, hiddenImages: toggleUrl(p.hiddenImages, url) }
                                  : p
                              ),
                            },
                          })
                        }
                        onChange={(urls) =>
                          setData({
                            ...data,
                            about: {
                              ...data.about,
                              photos: data.about.photos.map((p) =>
                                p.id === ph.id ? { ...p, images: urls } : p
                              ),
                            },
                          })
                        }
                        onPromoteToCover={(url) =>
                          setData({
                            ...data,
                            about: {
                              ...data.about,
                              photos: data.about.photos.map((p) =>
                                p.id === ph.id ? { ...p, url } : p
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

          {/* 5. GALLERY EVENTS */}
          {effectiveActiveTab === "gallery" && (
            <div className="space-y-5">
              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Judul &amp; Label Seksi Gallery di Home
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <InputField
                    label="Badge Atas Seksi"
                    value={data.homeSections.galleryBadge}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: { ...data.homeSections, galleryBadge: v },
                      })
                    }
                  />
                  <InputField
                    label="Judul Kata Putih"
                    value={data.homeSections.galleryTitleWhite}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          galleryTitleWhite: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Judul Kata Merah"
                    value={data.homeSections.galleryTitleAccent}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          galleryTitleAccent: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Label Filter Semua (All)"
                    value={data.homeSections.galleryAllLabel}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          galleryAllLabel: v,
                        },
                      })
                    }
                  />
                </div>
              </section>

              <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Daftar Event Gallery
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
                      <div className="flex items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={evt.enabled !== false}
                            onChange={(e) =>
                              setData({
                                ...data,
                                gallery: data.gallery.map((g) =>
                                  g.id === evt.id
                                    ? { ...g, enabled: e.target.checked }
                                    : g
                                ),
                              })
                            }
                            className="accent-red-600 w-3.5 h-3.5"
                          />
                          {evt.enabled !== false ? "Tampil di Web" : "Disembunyikan"}
                        </label>
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
                        label="Cover / Poster Utama Event (Tampil di Grid Gallery)"
                        value={evt.image}
                        placeholder="Upload poster foto asli, video MP4/MOV, atau link YouTube"
                        onChange={(v) =>
                          setData({
                            ...data,
                            gallery: data.gallery.map((g) =>
                              g.id === evt.id ? { ...g, image: v } : g
                            ),
                          })
                        }
                      />
                      <MultiMediaField
                        label="Foto & Video Aktivitas Tambahan"
                        values={evt.images || []}
                        hiddenUrls={evt.hiddenImages || []}
                        onToggleHidden={(url) =>
                          setData((prev) => ({
                            ...prev,
                            gallery: prev.gallery.map((g) =>
                              g.id === evt.id
                                ? { ...g, hiddenImages: toggleUrl(g.hiddenImages, url) }
                                : g
                            ),
                          }))
                        }
                        onChange={(urls) =>
                          setData((prev) => ({
                            ...prev,
                            gallery: prev.gallery.map((g) =>
                              g.id === evt.id ? { ...g, images: urls } : g
                            ),
                          }))
                        }
                        onPromoteToCover={(url, idx) =>
                          setData((prev) => ({
                            ...prev,
                            gallery: prev.gallery.map((g) => {
                              if (g.id !== evt.id) return g;
                              const nextExtras = [...(g.images || [])];
                              if (g.image) nextExtras[idx] = g.image;
                              else nextExtras.splice(idx, 1);
                              return { ...g, image: url, images: nextExtras };
                            }),
                          }))
                        }
                      />
                      <ImageField
                        label="Video Highlight / Teaser Tambahan (Opsional — muncul di bawah poster saat event diklik)"
                        value={evt.videoUrl || ""}
                        placeholder="Kosongkan jika tidak ada, atau upload MP4/MOV / link YouTube"
                        acceptMedia="video"
                        allowClear
                        onChange={(v) =>
                          setData({
                            ...data,
                            gallery: data.gallery.map((g) =>
                              g.id === evt.id ? { ...g, videoUrl: v } : g
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
            </div>
          )}

          {/* 5B. BRAND AMBASSADOR */}
          {effectiveActiveTab === "ambassadors" && (
            <div className="space-y-5">
              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Judul &amp; Subjudul Seksi Brand Ambassador
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Seksi ini tampil tepat di atas Official Store.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <InputField
                    label="Label Kecil Atas"
                    value={data.homeSections.baBadge}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: { ...data.homeSections, baBadge: v },
                      })
                    }
                  />
                  <InputField
                    label="Judul Kata Putih"
                    value={data.homeSections.baTitleWhite}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: { ...data.homeSections, baTitleWhite: v },
                      })
                    }
                  />
                  <InputField
                    label="Judul Kata Merah"
                    value={data.homeSections.baTitleAccent}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          baTitleAccent: v,
                        },
                      })
                    }
                  />
                </div>

                <InputField
                  label="Deskripsi Singkat Seksi"
                  value={data.homeSections.baSubtitle}
                  onChange={(v) =>
                    setData({
                      ...data,
                      homeSections: { ...data.homeSections, baSubtitle: v },
                    })
                  }
                />
              </section>

              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">
                      Daftar Brand Ambassador ({data.ambassadors.length})
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Foto tampil besar bersama nama, di bawahnya tampil nama tim, dan saat diklik muncul nickname, game yang dimainkan, serta sosial media.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newBa: BrandAmbassador = {
                        id: `ba-${Date.now()}`,
                        name: "NAMA BRAND AMBASSADOR",
                        nickname: "GL.NICKNAME",
                        team: "Godlike Novus Talent",
                        photo: "/images/seed/ba-1.svg",
                        games: ["Honor of Kings", "RF Online"],
                        bio: "",
                        socials: [
                          {
                            id: `basoc-${Date.now()}`,
                            platform: "instagram",
                            label: "@username",
                            url: "https://instagram.com/",
                          },
                        ],
                      };
                      setData({
                        ...data,
                        ambassadors: [...data.ambassadors, newBa],
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-medium text-white cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah BA
                  </button>
                </div>

                {data.ambassadors.length === 0 ? (
                  <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-xs text-zinc-500">
                    Belum ada Brand Ambassador. Klik &ldquo;+ Tambah BA&rdquo; untuk menambahkan.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md">
                    {data.ambassadors.map((ba) => {
                      const updateBa = (
                        updater: (item: BrandAmbassador) => BrandAmbassador
                      ) => {
                        setData((prev) => ({
                          ...prev,
                          ambassadors: prev.ambassadors.map((item) =>
                            item.id === ba.id ? updater(item) : item
                          ),
                        }));
                      };

                      return (
                        <div key={ba.id} className="p-4 space-y-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                                {ba.name || "Brand Ambassador"}
                              </span>
                              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={ba.enabled !== false}
                                  onChange={(e) =>
                                    updateBa((item) => ({
                                      ...item,
                                      enabled: e.target.checked,
                                    }))
                                  }
                                  className="accent-red-600 w-3.5 h-3.5"
                                />
                                {ba.enabled !== false ? "Tampil di Web" : "Disembunyikan"}
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setData({
                                  ...data,
                                  ambassadors: data.ambassadors.filter(
                                    (item) => item.id !== ba.id
                                  ),
                                })
                              }
                              className="text-xs font-medium text-red-600 hover:text-red-800 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus BA
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <InputField
                              label="Nama Lengkap / Panggung (Tampil Besar)"
                              value={ba.name}
                              onChange={(v) =>
                                updateBa((item) => ({ ...item, name: v }))
                              }
                            />
                            <InputField
                              label="Nickname / IGN (Muncul saat Diklik)"
                              value={ba.nickname}
                              onChange={(v) =>
                                updateBa((item) => ({ ...item, nickname: v }))
                              }
                            />
                            <InputField
                              label="Team / Asal Tim"
                              value={ba.team}
                              onChange={(v) =>
                                updateBa((item) => ({ ...item, team: v }))
                              }
                            />
                          </div>

                          <ImageField
                            label="Foto Orang (Sisi Kiri Kartu & Foto Detail saat Diklik)"
                            value={ba.photo}
                            onChange={(v) =>
                              updateBa((item) => ({ ...item, photo: v }))
                            }
                          />

                          {/* Aksen kanan kartu landscape */}
                          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 space-y-3">
                            <div>
                              <span className="block text-xs font-semibold text-zinc-800">
                                Aksen Kartu (Sisi Kanan)
                              </span>
                              <span className="block text-[11px] text-zinc-500">
                                Kosongkan teks untuk memakai bawaan (WELCOME / TO THE SQUAD / AMBASSADOR). Upload gambar aksen untuk mengganti sisi kanan, atau upload banner penuh untuk mengganti seluruh kartu dengan desain sendiri.
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <InputField
                                label="Teks Merah"
                                value={ba.accentHeadline || ""}
                                placeholder="WELCOME"
                                onChange={(v) =>
                                  updateBa((item) => ({
                                    ...item,
                                    accentHeadline: v,
                                  }))
                                }
                              />
                              <InputField
                                label="Teks Putih"
                                value={ba.accentSubline || ""}
                                placeholder="TO THE SQUAD"
                                onChange={(v) =>
                                  updateBa((item) => ({
                                    ...item,
                                    accentSubline: v,
                                  }))
                                }
                              />
                              <InputField
                                label="Label Kotak Bawah"
                                value={ba.accentLabel || ""}
                                placeholder="AMBASSADOR"
                                onChange={(v) =>
                                  updateBa((item) => ({
                                    ...item,
                                    accentLabel: v,
                                  }))
                                }
                              />
                            </div>
                            <ImageField
                              label="Logo di Aksen (Opsional — kosong = logo navbar)"
                              value={ba.accentLogo || ""}
                              allowClear
                              acceptMedia="image"
                              onChange={(v) =>
                                updateBa((item) => ({ ...item, accentLogo: v }))
                              }
                            />
                            <ImageField
                              label="Gambar Aksen Sendiri (Opsional — mengganti sisi kanan)"
                              value={ba.accentImage || ""}
                              allowClear
                              onChange={(v) =>
                                updateBa((item) => ({ ...item, accentImage: v }))
                              }
                            />
                            <ImageField
                              label="Banner Penuh Desain Sendiri (Opsional — mengganti seluruh kartu, rasio 16:9)"
                              value={ba.bannerImage || ""}
                              allowClear
                              onChange={(v) =>
                                updateBa((item) => ({ ...item, bannerImage: v }))
                              }
                            />
                          </div>

                          <MultiMediaField
                            label="Foto / Video Tambahan Brand Ambassador (Swipe ala IG)"
                            values={ba.images || []}
                            hiddenUrls={ba.hiddenImages || []}
                            onToggleHidden={(url) =>
                              updateBa((item) => ({
                                ...item,
                                hiddenImages: toggleUrl(item.hiddenImages, url),
                              }))
                            }
                            onChange={(urls) =>
                              updateBa((item) => ({ ...item, images: urls }))
                            }
                            onPromoteToCover={(url) =>
                              updateBa((item) => ({ ...item, photo: url }))
                            }
                          />

                          <InputField
                            label="Main Game Apa Saja (Pisahkan dengan koma — contoh: Honor of Kings, RF Online, Valorant)"
                            value={ba.games.join(", ")}
                            onChange={(v) =>
                              updateBa((item) => ({
                                ...item,
                                games: v
                                  .split(",")
                                  .map((g) => g.trim())
                                  .filter(Boolean),
                              }))
                            }
                          />

                          <TextareaField
                            label="Bio / Cerita Singkat (Opsional)"
                            value={ba.bio}
                            onChange={(v) =>
                              updateBa((item) => ({ ...item, bio: v }))
                            }
                          />

                          {/* BA Social Links */}
                          <div className="pt-2 border-t border-zinc-100 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-zinc-700">
                                Sosial Media {ba.name}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateBa((item) => ({
                                    ...item,
                                    socials: [
                                      ...item.socials,
                                      {
                                        id: `basoc-${Date.now()}`,
                                        platform: "instagram",
                                        label: "@username",
                                        url: "https://instagram.com/",
                                      },
                                    ],
                                  }))
                                }
                                className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
                              >
                                + Tambah Sosmed BA
                              </button>
                            </div>

                            {ba.socials.map((soc) => (
                              <div
                                key={soc.id}
                                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end rounded border border-zinc-200 bg-zinc-50 p-2.5"
                              >
                                <div className="sm:col-span-3 min-w-0">
                                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                                    Platform
                                  </label>
                                  <select
                                    value={soc.platform}
                                    onChange={(e) =>
                                      updateBa((item) => ({
                                        ...item,
                                        socials: item.socials.map((s) =>
                                          s.id === soc.id
                                            ? {
                                                ...s,
                                                platform: e.target
                                                  .value as SocialLink["platform"],
                                              }
                                            : s
                                        ),
                                      }))
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
                                <div className="sm:col-span-4 min-w-0">
                                  <InputField
                                    label="Username / Nama Akun"
                                    value={soc.label}
                                    placeholder="@username"
                                    onChange={(v) =>
                                      updateBa((item) => ({
                                        ...item,
                                        socials: item.socials.map((s) =>
                                          s.id === soc.id
                                            ? { ...s, label: v }
                                            : s
                                        ),
                                      }))
                                    }
                                  />
                                </div>
                                <div className="sm:col-span-4 min-w-0">
                                  <InputField
                                    label="Link URL"
                                    value={soc.url}
                                    onChange={(v) =>
                                      updateBa((item) => ({
                                        ...item,
                                        socials: item.socials.map((s) =>
                                          s.id === soc.id
                                            ? { ...s, url: v }
                                            : s
                                        ),
                                      }))
                                    }
                                  />
                                </div>
                                <div className="sm:col-span-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateBa((item) => ({
                                        ...item,
                                        socials: item.socials.filter(
                                          (s) => s.id !== soc.id
                                        ),
                                      }))
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
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* 6. OFFICIAL STORE */}
          {effectiveActiveTab === "store" && (
            <div className="space-y-5">
              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Judul, Deskripsi &amp; Tombol Seksi Store di Home
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <InputField
                    label="Badge Atas Seksi"
                    value={data.homeSections.storeBadge}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: { ...data.homeSections, storeBadge: v },
                      })
                    }
                  />
                  <InputField
                    label="Judul Kata Putih"
                    value={data.homeSections.storeTitleWhite}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          storeTitleWhite: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Judul Kata Merah"
                    value={data.homeSections.storeTitleAccent}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          storeTitleAccent: v,
                        },
                      })
                    }
                  />
                </div>
                <InputField
                  label="Subteks Petunjuk di Kanan Judul Store"
                  value={data.homeSections.storeSubtitle}
                  onChange={(v) =>
                    setData({
                      ...data,
                      homeSections: { ...data.homeSections, storeSubtitle: v },
                    })
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField
                    label="Teks Tombol Pesan (Saat Stok Ada)"
                    value={data.homeSections.storeOrderButtonText}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          storeOrderButtonText: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Teks Tombol Habis (Saat Stok Kosong)"
                    value={data.homeSections.storeOutOfStockText}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          storeOutOfStockText: v,
                        },
                      })
                    }
                  />
                </div>
              </section>

              <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">
                      Daftar Produk Store
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Format pesan order dapat diatur di tab &ldquo;Template Pesan&rdquo;.
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
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-4">
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
                          <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prod.enabled !== false}
                              onChange={(e) =>
                                setData({
                                  ...data,
                                  store: data.store.map((p) =>
                                    p.id === prod.id
                                      ? { ...p, enabled: e.target.checked }
                                      : p
                                  ),
                                })
                              }
                              className="accent-red-600 w-3.5 h-3.5"
                            />
                            {prod.enabled !== false ? "Tampil di Web" : "Disembunyikan"}
                          </label>
                        </div>
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
                                    ? {
                                        ...p,
                                        price: Number(e.target.value) || 0,
                                      }
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

                      <MultiMediaField
                        label="Foto / Video Produk Tambahan (Swipe ala IG)"
                        values={prod.images || []}
                        hiddenUrls={prod.hiddenImages || []}
                        onToggleHidden={(url) =>
                          setData({
                            ...data,
                            store: data.store.map((p) =>
                              p.id === prod.id
                                ? { ...p, hiddenImages: toggleUrl(p.hiddenImages, url) }
                                : p
                            ),
                          })
                        }
                        onChange={(urls) =>
                          setData({
                            ...data,
                            store: data.store.map((p) =>
                              p.id === prod.id ? { ...p, images: urls } : p
                            ),
                          })
                        }
                        onPromoteToCover={(url) =>
                          setData({
                            ...data,
                            store: data.store.map((p) =>
                              p.id === prod.id ? { ...p, image: url } : p
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
            </div>
          )}

          {/* 7. SPONSORS */}
          {effectiveActiveTab === "sponsors" && (
            <div className="space-y-5">
              <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Judul Seksi Sponsors di Home
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <InputField
                    label="Badge Atas Seksi"
                    value={data.homeSections.sponsorsBadge}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          sponsorsBadge: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Judul Kata Putih"
                    value={data.homeSections.sponsorsTitleWhite}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          sponsorsTitleWhite: v,
                        },
                      })
                    }
                  />
                  <InputField
                    label="Judul Kata Merah"
                    value={data.homeSections.sponsorsTitleAccent}
                    onChange={(v) =>
                      setData({
                        ...data,
                        homeSections: {
                          ...data.homeSections,
                          sponsorsTitleAccent: v,
                        },
                      })
                    }
                  />
                </div>
              </section>

              <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Daftar Sponsors &amp; Partners
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
                      <div className="flex items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sp.enabled !== false}
                            onChange={(e) =>
                              setData({
                                ...data,
                                sponsors: data.sponsors.map((s) =>
                                  s.id === sp.id
                                    ? { ...s, enabled: e.target.checked }
                                    : s
                                ),
                              })
                            }
                            className="accent-red-600 w-3.5 h-3.5"
                          />
                          {sp.enabled !== false ? "Tampil di Web" : "Disembunyikan"}
                        </label>
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
            </div>
          )}

          {/* 8. CONTACT & SOCIAL MEDIA */}
          {effectiveActiveTab === "contact" && (
            <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-5">
              <div className="border-b border-zinc-100 pb-3">
                <h2 className="text-base font-semibold text-zinc-900">
                  Kontak &amp; Sosial Media
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Format pesan &amp; label form Contact Us juga bisa diatur di tab &ldquo;Template Pesan&rdquo;.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <InputField
                  label="Badge Atas Seksi Kontak"
                  value={data.homeSections.contactBadge}
                  onChange={(v) =>
                    setData({
                      ...data,
                      homeSections: { ...data.homeSections, contactBadge: v },
                    })
                  }
                />
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
    </AdminAutoSaveContext.Provider>
  );
}

function InputField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
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
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-600 focus:outline-none"
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
