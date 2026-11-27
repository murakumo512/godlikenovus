import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { cookies } from "next/headers";

export interface AdminUserRecord {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

export interface AdminSessionUser {
  id: string;
  username: string;
  displayName: string;
}

interface UsersFileSchema {
  secret: string;
  users: AdminUserRecord[];
}

export const SESSION_COOKIE_NAME = "godlike_admin_session";
export const SESSION_TTL_SECONDS = 10 * 60; // 10 menit
export const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "admin-users.json");

function hashPassword(password: string, salt?: string): string {
  const realSalt = salt || crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, realSalt, 64).toString("hex");
  return `${realSalt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(key, "hex"),
    Buffer.from(derived, "hex")
  );
}

async function readUsersStore(): Promise<UsersFileSchema> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(USERS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as UsersFileSchema;
    if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0 && parsed.secret) {
      return parsed;
    }
  } catch {
    // Initialize default store below
  }

  const initial: UsersFileSchema = {
    secret:
      process.env.ADMIN_SESSION_SECRET ||
      crypto.randomBytes(32).toString("hex"),
    users: [
      {
        id: "usr-owner",
        username: "admin",
        displayName: "Owner Admin",
        passwordHash: hashPassword("godlike2026"),
        createdAt: new Date().toISOString(),
      },
    ],
  };
  await fs.writeFile(USERS_FILE, JSON.stringify(initial, null, 2), "utf-8");
  return initial;
}

async function writeUsersStore(store: UsersFileSchema): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function signToken(payload: object, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(
  token: string,
  secret: string
): { id: string; username: string; exp: number } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(data, "base64url").toString("utf-8")
    ) as { id: string; username: string; exp: number };
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function issueSessionToken(
  user: Pick<AdminSessionUser, "id" | "username">
): Promise<string> {
  const store = await readUsersStore();
  const exp = Date.now() + SESSION_TTL_MS;
  return signToken({ id: user.id, username: user.username, exp }, store.secret);
}

export async function authenticateAdmin(
  username: string,
  password: string
): Promise<{ token: string; user: AdminSessionUser } | null> {
  const store = await readUsersStore();
  const clean = username.trim().toLowerCase();
  const found = store.users.find((u) => u.username.toLowerCase() === clean);
  if (!found || !verifyPassword(password, found.passwordHash)) {
    return null;
  }
  const exp = Date.now() + SESSION_TTL_MS;
  const token = signToken(
    { id: found.id, username: found.username, exp },
    store.secret
  );
  return {
    token,
    user: {
      id: found.id,
      username: found.username,
      displayName: found.displayName,
    },
  };
}

export async function getSessionAdminFromToken(
  token?: string | null
): Promise<AdminSessionUser | null> {
  if (!token) return null;
  const store = await readUsersStore();
  const verified = verifyToken(token, store.secret);
  if (!verified) return null;
  const found = store.users.find((u) => u.id === verified.id);
  if (!found) return null;
  return {
    id: found.id,
    username: found.username,
    displayName: found.displayName,
  };
}

export async function getCurrentAdmin(): Promise<AdminSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getSessionAdminFromToken(token);
}

export async function verifyAdminRequest(
  request: Request
): Promise<AdminSessionUser | null> {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  const token = match ? decodeURIComponent(match.split("=")[1] || "") : null;
  return getSessionAdminFromToken(token);
}

export async function listAdminUsers() {
  const store = await readUsersStore();
  return store.users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    createdAt: u.createdAt,
  }));
}

export async function createAdminUser(
  username: string,
  displayName: string,
  password: string
) {
  const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  if (cleanUser.length < 3) {
    throw new Error("Username minimal 3 karakter (huruf/angka).");
  }
  if (password.length < 4) {
    throw new Error("Password minimal 4 karakter.");
  }
  const store = await readUsersStore();
  if (store.users.some((u) => u.username.toLowerCase() === cleanUser)) {
    throw new Error("Username sudah digunakan.");
  }
  const newUser: AdminUserRecord = {
    id: `usr-${Date.now()}`,
    username: cleanUser,
    displayName: displayName.trim() || cleanUser,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  store.users.push(newUser);
  await writeUsersStore(store);
  return {
    id: newUser.id,
    username: newUser.username,
    displayName: newUser.displayName,
    createdAt: newUser.createdAt,
  };
}

export async function changeAdminPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  if (!currentPassword) {
    throw new Error("Password lama wajib diisi.");
  }
  if (!newPassword || newPassword.length < 4) {
    throw new Error("Password baru minimal 4 karakter.");
  }
  if (newPassword === currentPassword) {
    throw new Error("Password baru tidak boleh sama dengan password lama.");
  }
  const store = await readUsersStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    throw new Error("User tidak ditemukan.");
  }
  if (!verifyPassword(currentPassword, store.users[idx].passwordHash)) {
    throw new Error("Password lama salah.");
  }
  store.users[idx].passwordHash = hashPassword(newPassword);
  await writeUsersStore(store);
}

export async function deleteAdminUser(userId: string, requesterId: string) {
  const store = await readUsersStore();
  if (store.users.length <= 1) {
    throw new Error("Tidak bisa menghapus satu-satunya akun admin.");
  }
  if (userId === requesterId) {
    throw new Error("Tidak bisa menghapus akun yang sedang dipakai login.");
  }
  const remaining = store.users.filter((u) => u.id !== userId);
  store.users = remaining;
  await writeUsersStore(store);
}
