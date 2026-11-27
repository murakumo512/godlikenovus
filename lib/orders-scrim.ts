import fs from "fs/promises";
import path from "path";
import type {
  OrderStatus,
  ScrimRequest,
  ScrimStatus,
  StoreOrder,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "store-orders.json");
const SCRIM_FILE = path.join(DATA_DIR, "scrim-requests.json");

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("62")) return `0${digits.slice(2)}`;
  return digits;
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function writeJsonArray<T>(filePath: string, data: T[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function genCode(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const num = String(Date.now()).slice(-4);
  return `${prefix}-${num}${rand}`;
}

// --- STORE ORDERS ---

export async function createStoreOrder(input: {
  productId: string;
  productName: string;
  size: string;
  qty: number;
  unitPrice: number;
  customerName: string;
  customerPhone: string;
  address: string;
  notes: string;
}): Promise<StoreOrder> {
  const orders = await readJsonArray<StoreOrder>(ORDERS_FILE);
  const now = new Date().toISOString();
  const safeQty = Math.max(1, Math.round(input.qty || 1));
  const record: StoreOrder = {
    id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    orderCode: genCode("GL"),
    productId: input.productId,
    productName: input.productName,
    size: input.size || "-",
    qty: safeQty,
    unitPrice: input.unitPrice,
    totalPrice: input.unitPrice * safeQty,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    address: input.address.trim(),
    notes: (input.notes || "-").trim(),
    status: "pending",
    adminNote: "",
    createdAt: now,
    updatedAt: now,
  };
  await writeJsonArray(ORDERS_FILE, [record, ...orders].slice(0, 1000));
  return record;
}

export async function listStoreOrders(): Promise<StoreOrder[]> {
  return readJsonArray<StoreOrder>(ORDERS_FILE);
}

export async function lookupStoreOrders(query: string): Promise<StoreOrder[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const qPhone = normalizePhone(q);
  const orders = await readJsonArray<StoreOrder>(ORDERS_FILE);
  return orders.filter((o) => {
    if (o.orderCode.toLowerCase() === q) return true;
    if (qPhone.length >= 6 && normalizePhone(o.customerPhone) === qPhone) {
      return true;
    }
    return false;
  });
}

export async function updateStoreOrderStatus(
  id: string,
  status: OrderStatus,
  adminNote?: string
): Promise<StoreOrder | null> {
  const orders = await readJsonArray<StoreOrder>(ORDERS_FILE);
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = {
    ...orders[idx],
    status,
    adminNote: adminNote !== undefined ? adminNote : orders[idx].adminNote,
    updatedAt: new Date().toISOString(),
  };
  await writeJsonArray(ORDERS_FILE, orders);
  return orders[idx];
}

export async function deleteStoreOrder(id: string): Promise<void> {
  const orders = await readJsonArray<StoreOrder>(ORDERS_FILE);
  await writeJsonArray(
    ORDERS_FILE,
    orders.filter((o) => o.id !== id)
  );
}

// --- SCRIM REQUESTS ---

export async function createScrimRequest(input: {
  teamName: string;
  contactName: string;
  contactPhone: string;
  gameName: string;
  preferredDate: string;
  preferredTime: string;
  format: string;
  notes: string;
}): Promise<ScrimRequest> {
  const list = await readJsonArray<ScrimRequest>(SCRIM_FILE);
  const now = new Date().toISOString();
  const record: ScrimRequest = {
    id: `scr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    scrimCode: genCode("SCRIM"),
    teamName: input.teamName.trim(),
    contactName: input.contactName.trim(),
    contactPhone: input.contactPhone.trim(),
    gameName: input.gameName.trim(),
    preferredDate: input.preferredDate.trim(),
    preferredTime: input.preferredTime.trim(),
    format: input.format.trim() || "BO3",
    notes: (input.notes || "-").trim(),
    status: "pending",
    adminNote: "",
    createdAt: now,
    updatedAt: now,
  };
  await writeJsonArray(SCRIM_FILE, [record, ...list].slice(0, 1000));
  return record;
}

export async function listScrimRequests(): Promise<ScrimRequest[]> {
  return readJsonArray<ScrimRequest>(SCRIM_FILE);
}

export async function lookupScrimRequests(query: string): Promise<ScrimRequest[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const qPhone = normalizePhone(q);
  const list = await readJsonArray<ScrimRequest>(SCRIM_FILE);
  return list.filter((s) => {
    if (s.scrimCode.toLowerCase() === q) return true;
    if (qPhone.length >= 6 && normalizePhone(s.contactPhone) === qPhone) {
      return true;
    }
    return false;
  });
}

export async function updateScrimRequestStatus(
  id: string,
  status: ScrimStatus,
  adminNote?: string
): Promise<ScrimRequest | null> {
  const list = await readJsonArray<ScrimRequest>(SCRIM_FILE);
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    status,
    adminNote: adminNote !== undefined ? adminNote : list[idx].adminNote,
    updatedAt: new Date().toISOString(),
  };
  await writeJsonArray(SCRIM_FILE, list);
  return list[idx];
}

export async function deleteScrimRequest(id: string): Promise<void> {
  const list = await readJsonArray<ScrimRequest>(SCRIM_FILE);
  await writeJsonArray(
    SCRIM_FILE,
    list.filter((s) => s.id !== id)
  );
}
