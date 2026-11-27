import { NextResponse } from "next/server";
import {
  issueSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  verifyAdminRequest,
} from "@/lib/auth";
import {
  createStoreOrder,
  deleteStoreOrder,
  listStoreOrders,
  lookupStoreOrders,
  updateStoreOrderStatus,
} from "@/lib/orders-scrim";
import { appendActivityLog, getClientIp } from "@/lib/activity-log";
import type { OrderStatus } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isAdminList = searchParams.get("admin") === "1";

  if (isAdminList) {
    const admin = await verifyAdminRequest(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orders = await listStoreOrders();
    const freshToken = await issueSessionToken(admin);
    const res = NextResponse.json({ orders });
    res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  }

  const q = searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ orders: [] });
  }
  const matched = await lookupStoreOrders(q);
  // Return sanitized public fields (hide full street address on public lookup)
  return NextResponse.json({
    orders: matched.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      productName: o.productName,
      size: o.size,
      qty: o.qty,
      totalPrice: o.totalPrice,
      customerName: o.customerName,
      status: o.status,
      adminNote: o.adminNote || "",
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      productName?: string;
      size?: string;
      qty?: number;
      unitPrice?: number;
      customerName?: string;
      customerPhone?: string;
      address?: string;
      notes?: string;
    };
    if (!body.productName || !body.customerName || !body.customerPhone) {
      return NextResponse.json(
        { error: "Data pesanan belum lengkap." },
        { status: 400 }
      );
    }
    const order = await createStoreOrder({
      productId: body.productId || "",
      productName: body.productName,
      size: body.size || "-",
      qty: Number(body.qty) || 1,
      unitPrice: Number(body.unitPrice) || 0,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      address: body.address || "-",
      notes: body.notes || "-",
    });
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan pesanan." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (admin.role === "read") {
    return NextResponse.json(
      { error: "Mode Read-Only tidak diizinkan mengubah status pesanan." },
      { status: 403 }
    );
  }
  try {
    const body = (await request.json()) as {
      id?: string;
      status?: OrderStatus;
      adminNote?: string;
    };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "ID & status wajib diisi." }, { status: 400 });
    }
    const updated = await updateStoreOrderStatus(
      body.id,
      body.status,
      body.adminNote
    );
    if (!updated) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }
    await appendActivityLog({
      action: "edit",
      username: admin.username,
      displayName: admin.displayName,
      detail: `Update status pesanan ${updated.orderCode} -> ${updated.status}`,
      ip: getClientIp(request),
    });
    const freshToken = await issueSessionToken(admin);
    const res = NextResponse.json({ order: updated });
    res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Gagal mengupdate pesanan." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (admin.role === "read") {
    return NextResponse.json(
      { error: "Mode Read-Only tidak diizinkan menghapus pesanan." },
      { status: 403 }
    );
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
  }
  await deleteStoreOrder(id);
  const freshToken = await issueSessionToken(admin);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
