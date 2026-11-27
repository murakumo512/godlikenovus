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

const DATA_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(DATA_DIR, "admin-activity.json");
const MAX_LOGS = 500;

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

async function readLogsRaw(): Promise<ActivityLogEntry[]> {
  try {
    const raw = await fs.readFile(LOG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ActivityLogEntry[]) : [];
  } catch {
    return [];
  }
}

export async function appendActivityLog(entry: {
  action: ActivityAction;
  username: string;
  displayName?: string;
  detail: string;
  ip?: string;
}): Promise<ActivityLogEntry> {
  const logs = await readLogsRaw();
  const record: ActivityLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    action: entry.action,
    username: entry.username || "unknown",
    displayName: entry.displayName || entry.username || "Unknown",
    detail: entry.detail,
    ip: entry.ip || "-",
  };
  const next = [record, ...logs].slice(0, MAX_LOGS);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(LOG_FILE, JSON.stringify(next, null, 2), "utf-8");
  return record;
}

export async function getActivityLogs(limit = 200): Promise<ActivityLogEntry[]> {
  const logs = await readLogsRaw();
  return logs.slice(0, limit);
}

export async function clearActivityLogs(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(LOG_FILE, "[]", "utf-8");
}
