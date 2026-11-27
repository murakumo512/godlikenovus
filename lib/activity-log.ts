import fs from "fs/promises";
import path from "path";

export type ActivityAction =
  | "login"
  | "login_failed"
  | "logout"
  | "session_timeout"
  | "upload"
  | "edit"
  | "reset"
  | "user_create"
  | "user_password"
  | "user_delete";

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action: ActivityAction;
  username: string;
  displayName: string;
  detail: string;
  ip: string;
}

export interface ActivityLogConfig {
  retentionDays: number; // default 7 hari (1 minggu)
  maxEntries: number; // default 500 entri
  autoPurgeExpired: boolean; // true = hapus otomatis setelah lewat retentionDays, false = biarkan tersimpan
}

const DATA_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(DATA_DIR, "admin-activity.json");
const CONFIG_FILE = path.join(DATA_DIR, "admin-log-config.json");

export const DEFAULT_LOG_CONFIG: ActivityLogConfig = {
  retentionDays: 7,
  maxEntries: 500,
  autoPurgeExpired: true,
};

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "-";
}

export async function getActivityLogConfig(): Promise<ActivityLogConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<ActivityLogConfig>;
    return {
      retentionDays:
        typeof parsed.retentionDays === "number" && parsed.retentionDays >= 1
          ? Math.min(365, Math.round(parsed.retentionDays))
          : DEFAULT_LOG_CONFIG.retentionDays,
      maxEntries:
        typeof parsed.maxEntries === "number" && parsed.maxEntries >= 10
          ? Math.min(5000, Math.round(parsed.maxEntries))
          : DEFAULT_LOG_CONFIG.maxEntries,
      autoPurgeExpired:
        typeof parsed.autoPurgeExpired === "boolean"
          ? parsed.autoPurgeExpired
          : DEFAULT_LOG_CONFIG.autoPurgeExpired,
    };
  } catch {
    return { ...DEFAULT_LOG_CONFIG };
  }
}

export async function saveActivityLogConfig(
  next: Partial<ActivityLogConfig>
): Promise<ActivityLogConfig> {
  const current = await getActivityLogConfig();
  const merged: ActivityLogConfig = {
    retentionDays:
      typeof next.retentionDays === "number" && next.retentionDays >= 1
        ? Math.min(365, Math.round(next.retentionDays))
        : current.retentionDays,
    maxEntries:
      typeof next.maxEntries === "number" && next.maxEntries >= 10
        ? Math.min(5000, Math.round(next.maxEntries))
        : current.maxEntries,
    autoPurgeExpired:
      typeof next.autoPurgeExpired === "boolean"
        ? next.autoPurgeExpired
        : current.autoPurgeExpired,
  };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(merged, null, 2), "utf-8");

  // Apply retention immediately if autoPurgeExpired is enabled
  if (merged.autoPurgeExpired) {
    const logs = await readLogsRaw();
    const pruned = applyRetentionPolicy(logs, merged);
    if (pruned.length !== logs.length) {
      await fs.writeFile(LOG_FILE, JSON.stringify(pruned, null, 2), "utf-8");
    }
  }
  return merged;
}

async function readLogsRaw(): Promise<ActivityLogEntry[]> {
  try {
    const raw = await fs.readFile(LOG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ActivityLogEntry[]) : [];
  } catch {
    return [];
  }
}

function applyRetentionPolicy(
  logs: ActivityLogEntry[],
  config: ActivityLogConfig
): ActivityLogEntry[] {
  let result = logs;
  if (config.autoPurgeExpired && config.retentionDays > 0) {
    const cutoff = Date.now() - config.retentionDays * 24 * 60 * 60 * 1000;
    result = result.filter((entry) => {
      const ts = new Date(entry.timestamp).getTime();
      return Number.isNaN(ts) || ts >= cutoff;
    });
  }
  return result.slice(0, config.maxEntries);
}

export async function appendActivityLog(entry: {
  action: ActivityAction;
  username: string;
  displayName?: string;
  detail: string;
  ip?: string;
}): Promise<ActivityLogEntry> {
  const [logs, config] = await Promise.all([
    readLogsRaw(),
    getActivityLogConfig(),
  ]);
  const record: ActivityLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    action: entry.action,
    username: entry.username || "unknown",
    displayName: entry.displayName || entry.username || "Unknown",
    detail: entry.detail,
    ip: entry.ip || "-",
  };
  const next = applyRetentionPolicy([record, ...logs], config);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(LOG_FILE, JSON.stringify(next, null, 2), "utf-8");
  return record;
}

export async function getActivityLogs(): Promise<{
  logs: ActivityLogEntry[];
  config: ActivityLogConfig;
}> {
  const [logs, config] = await Promise.all([
    readLogsRaw(),
    getActivityLogConfig(),
  ]);
  const cleaned = applyRetentionPolicy(logs, config);
  if (cleaned.length !== logs.length) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(LOG_FILE, JSON.stringify(cleaned, null, 2), "utf-8");
  }
  return { logs: cleaned, config };
}

export async function clearActivityLogs(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(LOG_FILE, "[]", "utf-8");
}
