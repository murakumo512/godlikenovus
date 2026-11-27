"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, Trash2, Clock, Save, SlidersHorizontal } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import type {
  ActivityAction,
  ActivityLogConfig,
  ActivityLogEntry,
} from "@/lib/activity-log";
import type { AdminRole } from "@/lib/types";

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
  role = "full",
  onUnauthorized,
  onToast,
}: {
  role?: AdminRole;
  onUnauthorized?: () => void;
  onToast?: (type: "success" | "error", text: string) => void;
}) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "auth" | "upload" | "edit" | "user">("all");
  const [rangePreset, setRangePreset] = useState<"1d" | "3d" | "7d" | "30d" | "all" | "custom">("7d");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [displayLimit, setDisplayLimit] = useState<number>(100);
  const [query, setQuery] = useState("");

  // Dynamic retention config
  const [retentionDays, setRetentionDays] = useState<number>(7);
  const [maxEntries, setMaxEntries] = useState<number>(500);
  const [autoPurgeExpired, setAutoPurgeExpired] = useState<boolean>(true);
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/logs`);
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      if (res.ok) {
        const json = (await res.json()) as {
          logs: ActivityLogEntry[];
          config?: ActivityLogConfig;
        };
        setLogs(json.logs || []);
        if (json.config) {
          setRetentionDays(json.config.retentionDays);
          setMaxEntries(json.config.maxEntries);
          setAutoPurgeExpired(json.config.autoPurgeExpired);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/logs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retentionDays: Math.max(1, Number(retentionDays) || 7),
          maxEntries: Math.max(10, Number(maxEntries) || 500),
          autoPurgeExpired,
        }),
      });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      const json = (await res.json()) as {
        config?: ActivityLogConfig;
        logs?: ActivityLogEntry[];
        error?: string;
      };
      if (!res.ok) {
        onToast?.("error", json.error || "Gagal menyimpan pengaturan log.");
        return;
      }
      if (json.logs) setLogs(json.logs);
      onToast?.("success", "Pengaturan retensi & batas log disimpan.");
    } finally {
      setSavingConfig(false);
    }
  };

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
      onToast?.("success", "Riwayat log dibersihkan.");
    }
  };

  const nowMs = Date.now();
  const filtered = logs.filter((entry) => {
    const meta = ACTION_META[entry.action];
    if (filter !== "all" && meta?.group !== filter) return false;

    const ts = new Date(entry.timestamp).getTime();
    if (!Number.isNaN(ts)) {
      if (rangePreset === "1d" && ts < nowMs - 1 * 24 * 60 * 60 * 1000) return false;
      if (rangePreset === "3d" && ts < nowMs - 3 * 24 * 60 * 60 * 1000) return false;
      if (rangePreset === "7d" && ts < nowMs - 7 * 24 * 60 * 60 * 1000) return false;
      if (rangePreset === "30d" && ts < nowMs - 30 * 24 * 60 * 60 * 1000) return false;
      if (rangePreset === "custom") {
        if (dateFrom) {
          const fromMs = new Date(`${dateFrom}T00:00:00`).getTime();
          if (ts < fromMs) return false;
        }
        if (dateTo) {
          const toMs = new Date(`${dateTo}T23:59:59`).getTime();
          if (ts > toMs) return false;
        }
      }
    }

    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      entry.username.toLowerCase().includes(q) ||
      entry.displayName.toLowerCase().includes(q) ||
      entry.detail.toLowerCase().includes(q) ||
      entry.ip.toLowerCase().includes(q)
    );
  });

  const visibleLogs =
    displayLimit > 0 ? filtered.slice(0, displayLimit) : filtered;

  return (
    <div className="space-y-5">
      {/* Dynamic Log Retention & Entries Settings */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="border-b border-zinc-100 pb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-zinc-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-red-600" />
              Pengaturan Retensi &amp; Kapasitas Log
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Default retensi adalah <strong>7 hari (1 minggu)</strong>. Pilih apakah log lama otomatis dihilangkan atau dibiarkan tersimpan.
            </p>
          </div>
          {role === "full" && (
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="inline-flex items-center gap-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-60 px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {savingConfig ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Rentang Waktu Log (Hari)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={365}
                disabled={role !== "full"}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value) || 7)}
                className="w-20 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 disabled:bg-zinc-100"
              />
              <select
                disabled={role !== "full"}
                value={[1, 3, 7, 14, 30].includes(retentionDays) ? retentionDays : ""}
                onChange={(e) => {
                  if (e.target.value) setRetentionDays(Number(e.target.value));
                }}
                className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-700 disabled:bg-zinc-100"
              >
                <option value="">Custom</option>
                <option value={1}>1 Hari</option>
                <option value={3}>3 Hari</option>
                <option value={7}>7 Hari (1 Minggu)</option>
                <option value={14}>14 Hari (2 Minggu)</option>
                <option value={30}>30 Hari (1 Bulan)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Maksimal Entries Disimpan
            </label>
            <select
              disabled={role !== "full"}
              value={maxEntries}
              onChange={(e) => setMaxEntries(Number(e.target.value))}
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 disabled:bg-zinc-100"
            >
              <option value={100}>100 entries</option>
              <option value={250}>250 entries</option>
              <option value={500}>500 entries</option>
              <option value={1000}>1.000 entries</option>
              <option value={2000}>2.000 entries</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Setelah Lewat {retentionDays} Hari
            </label>
            <select
              disabled={role !== "full"}
              value={autoPurgeExpired ? "purge" : "keep"}
              onChange={(e) => setAutoPurgeExpired(e.target.value === "purge")}
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 disabled:bg-zinc-100"
            >
              <option value="purge">Otomatis Hilangkan (Hapus)</option>
              <option value="keep">Biarkan Tetap Tersimpan</option>
            </select>
          </div>
        </div>
      </section>

      {/* Activity Log Viewer */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              Log Aktivitas Admin ({visibleLogs.length} / {filtered.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Total tersimpan: {logs.length} entri · Kebijakan:{" "}
              {autoPurgeExpired
                ? `Auto-hapus > ${retentionDays} hari`
                : `Simpan permanen (maks ${maxEntries})`}
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
            {role === "full" && logs.length > 0 && (
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

        {/* Range & Display Limit Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-zinc-50 border border-zinc-200 p-2.5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-semibold text-zinc-500 mr-1">
              Range:
            </span>
            {(
              [
                ["1d", "Hari Ini"],
                ["3d", "3 Hari"],
                ["7d", "1 Minggu"],
                ["30d", "30 Hari"],
                ["all", "Semua"],
                ["custom", "Custom"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setRangePreset(id)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                  rangePreset === id
                    ? "bg-zinc-900 text-white"
                    : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500">Tampilkan:</span>
            <select
              value={displayLimit}
              onChange={(e) => setDisplayLimit(Number(e.target.value))}
              className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800"
            >
              <option value={50}>50 entries</option>
              <option value={100}>100 entries</option>
              <option value={250}>250 entries</option>
              <option value={500}>500 entries</option>
              <option value={0}>Semua</option>
            </select>
          </div>
        </div>

        {rangePreset === "custom" && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-600">Dari:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded border border-zinc-300 px-2 py-1 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-600">Sampai:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded border border-zinc-300 px-2 py-1 text-xs"
              />
            </div>
          </div>
        )}

        {/* Action Filter & Search Bar */}
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
        ) : visibleLogs.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded">
            Belum ada log aktivitas pada rentang waktu ini.
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
                {visibleLogs.map((entry) => {
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
    </div>
  );
}
