"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Eye,
  Monitor,
  MousePointerClick,
  RefreshCw,
  Smartphone,
  Trash2,
  Users,
} from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import type { AdminRole } from "@/lib/types";

interface AnalyticsSummary {
  totalPageViews: number;
  uniqueVisitors: number;
  totalSectionClicks: number;
  totalMediaClicks: number;
  deviceCounts: { mobile: number; desktop: number };
  topSections: Array<{ section: string; count: number }>;
  topMedia: Array<{
    key: string;
    label: string;
    category: string;
    url: string;
    count: number;
    lastClickedAt: string;
  }>;
  recentVisits: Array<{
    id: string;
    timestamp: string;
    ip: string;
    device: "Mobile" | "Desktop";
    browser: string;
    event: "pageview" | "section" | "media";
    target: string;
  }>;
}

const SECTION_NAME_MAP: Record<string, string> = {
  top: "Hero / Home",
  hero: "Hero / Home",
  roster: "Games & Roster",
  about: "About Us",
  gallery: "Gallery Event",
  ambassadors: "Brand Ambassador",
  store: "Official Store",
  sponsors: "Sponsors",
  contact: "Contact Us",
};

function formatWib(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminAnalyticsPanel({
  role,
  onUnauthorized,
}: {
  role: AdminRole;
  onUnauthorized?: () => void;
}) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/analytics`);
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      if (res.ok) {
        const json = (await res.json()) as AnalyticsSummary;
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleReset = async () => {
    if (!confirm("Reset seluruh data statistik website menjadi 0?")) return;
    const res = await fetch(`${BASE_PATH}/api/admin/analytics`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadStats();
    }
  };

  const totalDevices =
    (data?.deviceCounts.mobile || 0) + (data?.deviceCounts.desktop || 0);
  const mobilePct =
    totalDevices > 0
      ? Math.round(((data?.deviceCounts.mobile || 0) / totalDevices) * 100)
      : 0;
  const maxSectionCount = Math.max(
    1,
    ...(data?.topSections.map((s) => s.count) || [1])
  );

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-red-600" />
              Statistik Pengunjung &amp; Klik Website
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Pantau jumlah buka website, pengunjung unik, section paling ramai, dan gambar/konten yang paling sering diklik.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadStats}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded border border-zinc-300 bg-white hover:border-red-600 hover:text-red-600 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            {role === "full" && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-3.5">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Total Kunjungan</span>
              <Eye className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 mt-1 tabular-nums">
              {data?.totalPageViews ?? 0}
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-3.5">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Pengunjung Unik</span>
              <Users className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 mt-1 tabular-nums">
              {data?.uniqueVisitors ?? 0}
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-3.5">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>View Section</span>
              <BarChart3 className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 mt-1 tabular-nums">
              {data?.totalSectionClicks ?? 0}
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-3.5">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Klik Gambar / Konten</span>
              <MousePointerClick className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 mt-1 tabular-nums">
              {data?.totalMediaClicks ?? 0}
            </div>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="rounded-md border border-zinc-200 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-700">
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-red-600" />
              HP / Mobile: {data?.deviceCounts.mobile ?? 0} ({mobilePct}%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-zinc-600" />
              Laptop / Desktop: {data?.deviceCounts.desktop ?? 0} (
              {totalDevices > 0 ? 100 - mobilePct : 0}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
            <div
              className="h-full bg-red-600 transition-all"
              style={{ width: `${mobilePct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Section Popularity & Top Media Clicks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
            Section Paling Banyak Dilihat
          </h3>
          {!data || data.topSections.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              Belum ada data section.
            </p>
          ) : (
            <div className="space-y-2.5">
              {data.topSections.map((item) => {
                const pct = Math.round((item.count / maxSectionCount) * 100);
                return (
                  <div key={item.section} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-800">
                        {SECTION_NAME_MAP[item.section] || item.section}
                      </span>
                      <span className="font-mono text-zinc-600">
                        {item.count}x
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
            Gambar / Konten Paling Banyak Diklik
          </h3>
          {!data || data.topMedia.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              Belum ada klik gambar/konten yang tercatat.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto">
              {data.topMedia.slice(0, 20).map((m) => (
                <div
                  key={m.key}
                  className="py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 mr-1.5">
                      {m.category}
                    </span>
                    <span className="font-medium text-zinc-900 truncate">
                      {m.label}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-red-600 shrink-0">
                    {m.count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent Visitors */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
          Aktivitas Pengunjung Terbaru
        </h3>
        {!data || data.recentVisits.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">
            Belum ada pengunjung yang tercatat.
          </p>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 rounded-md max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-semibold">Waktu (WIB)</th>
                  <th className="px-3 py-2 font-semibold">IP</th>
                  <th className="px-3 py-2 font-semibold">Perangkat</th>
                  <th className="px-3 py-2 font-semibold">Aktivitas</th>
                  <th className="px-3 py-2 font-semibold">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.recentVisits.slice(0, 50).map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-50/70">
                    <td className="px-3 py-1.5 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {formatWib(v.timestamp)}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[11px] text-zinc-600 whitespace-nowrap">
                      {v.ip}
                    </td>
                    <td className="px-3 py-1.5 text-zinc-700 whitespace-nowrap">
                      {v.device} · {v.browser}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          v.event === "pageview"
                            ? "bg-emerald-100 text-emerald-800"
                            : v.event === "media"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {v.event === "pageview"
                          ? "Buka Web"
                          : v.event === "media"
                            ? "Klik Konten"
                            : "Lihat Section"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-zinc-800 truncate max-w-xs">
                      {SECTION_NAME_MAP[v.target] || v.target}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
