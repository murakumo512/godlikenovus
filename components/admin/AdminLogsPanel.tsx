"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, Trash2, Clock } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import type { ActivityAction, ActivityLogEntry } from "@/lib/activity-log";

const ACTION_META: Record<
  ActivityAction,
  { label: string; badgeClass: string; group: "auth" | "upload" | "edit" | "user" }
> = {
  login: {
    label: "LOGIN",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    group: "auth",
  },
  login_failed: {
    label: "LOGIN GAGAL",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    group: "auth",
  },
  logout: {
    label: "LOGOUT",
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
    group: "auth",
  },
  session_timeout: {
    label: "TIMEOUT",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    group: "auth",
  },
  upload: {
    label: "UPLOAD",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    group: "upload",
  },
  edit: {
    label: "EDIT",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    group: "edit",
  },
  reset: {
    label: "RESET",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
    group: "edit",
  },
  user_create: {
    label: "TAMBAH USER",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
    group: "user",
  },
  user_password: {
    label: "GANTI PASS",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
    group: "user",
  },
  user_delete: {
    label: "HAPUS USER",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    group: "user",
  },
};

function formatWib(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminLogsPanel({
  onUnauthorized,
}: {
  onUnauthorized?: () => void;
}) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "auth" | "upload" | "edit" | "user">("all");
  const [query, setQuery] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/logs`);
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      if (res.ok) {
        const json = (await res.json()) as { logs: ActivityLogEntry[] };
        setLogs(json.logs || []);
      }
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClear = async () => {
    if (!confirm("Hapus seluruh riwayat log aktivitas admin?")) return;
    const res = await fetch(`${BASE_PATH}/api/admin/logs`, {
      method: "DELETE",
    });
    if (res.status === 401) {
      onUnauthorized?.();
      return;
    }
    if (res.ok) {
      setLogs([]);
    }
  };

  const filtered = logs.filter((entry) => {
    const meta = ACTION_META[entry.action];
    if (filter !== "all" && meta?.group !== filter) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      entry.username.toLowerCase().includes(q) ||
      entry.displayName.toLowerCase().includes(q) ||
      entry.detail.toLowerCase().includes(q) ||
      entry.ip.toLowerCase().includes(q)
    );
  });

  return (
    <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" />
            Log Aktivitas Admin ({filtered.length})
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Mencatat riwayat login, logout/timeout, upload media, edit konten, dan perubahan akun (maks. 500 entri terbaru).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded border border-zinc-300 bg-white hover:border-red-600 hover:text-red-600 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Bersihkan
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              ["all", "Semua"],
              ["auth", "Login / Sesi"],
              ["upload", "Upload"],
              ["edit", "Edit Konten"],
              ["user", "Akun"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                filter === id
                  ? "bg-red-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari user, file, atau IP..."
            className="w-full rounded border border-zinc-300 bg-white pl-8 pr-2.5 py-1.5 text-xs text-zinc-800 focus:border-red-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Log List */}
      {loading ? (
        <div className="py-10 text-center text-xs text-zinc-500">
          Memuat riwayat aktivitas...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded">
          Belum ada log aktivitas yang cocok.
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 rounded-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
              <tr>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">Waktu (WIB)</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">Aksi</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">User</th>
                <th className="px-3 py-2 font-semibold">Detail</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((entry) => {
                const meta = ACTION_META[entry.action] || {
                  label: entry.action.toUpperCase(),
                  badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
                };
                return (
                  <tr key={entry.id} className="hover:bg-zinc-50/80">
                    <td className="px-3 py-2 text-zinc-500 whitespace-nowrap font-mono text-[11px]">
                      {formatWib(entry.timestamp)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="font-medium text-zinc-900">
                        {entry.displayName}
                      </span>
                      <span className="text-zinc-400 ml-1">@{entry.username}</span>
                    </td>
                    <td className="px-3 py-2 text-zinc-700 break-words max-w-md">
                      {entry.detail}
                    </td>
                    <td className="px-3 py-2 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                      {entry.ip}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
