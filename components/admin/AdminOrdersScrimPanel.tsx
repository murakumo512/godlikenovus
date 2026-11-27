"use client";

import { useCallback, useEffect, useState } from "react";
import { PackageCheck, RefreshCw, Swords, Trash2 } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import type {
  AdminRole,
  OrderStatus,
  ScrimRequest,
  ScrimStatus,
  StoreOrder,
} from "@/lib/types";

const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: "pending", label: "Menunggu Konfirmasi" },
  { value: "processing", label: "Sedang Diproses" },
  { value: "shipped", label: "Dikirim" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

const SCRIM_STATUS_OPTIONS: Array<{ value: ScrimStatus; label: string }> = [
  { value: "pending", label: "Menunggu Jadwal" },
  { value: "approved", label: "Disetujui / Dijadwalkan" },
  { value: "completed", label: "Selesai" },
  { value: "rejected", label: "Ditolak / Penuh" },
];

export function AdminOrdersScrimPanel({
  role,
  onUnauthorized,
  onToast,
}: {
  role: AdminRole;
  onUnauthorized?: () => void;
  onToast?: (type: "success" | "error", text: string) => void;
}) {
  const isReadOnly = role === "read";
  const [subTab, setSubTab] = useState<"orders" | "scrim">("orders");
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [scrims, setScrims] = useState<ScrimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ordRes, scrRes] = await Promise.all([
        fetch(`${BASE_PATH}/api/orders?admin=1`),
        fetch(`${BASE_PATH}/api/scrim?admin=1`),
      ]);
      if (ordRes.status === 401 || scrRes.status === 401) {
        onUnauthorized?.();
        return;
      }
      if (ordRes.ok) {
        const json = (await ordRes.json()) as { orders: StoreOrder[] };
        setOrders(json.orders || []);
      }
      if (scrRes.ok) {
        const json = (await scrRes.json()) as { scrims: ScrimRequest[] };
        setScrims(json.scrims || []);
      }
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  const handleUpdateOrder = async (ord: StoreOrder, status: OrderStatus) => {
    const adminNote =
      noteDrafts[ord.id] !== undefined ? noteDrafts[ord.id] : ord.adminNote || "";
    const res = await fetch(`${BASE_PATH}/api/orders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ord.id, status, adminNote }),
    });
    if (res.ok) {
      const json = (await res.json()) as { order: StoreOrder };
      setOrders((prev) =>
        prev.map((item) => (item.id === ord.id ? json.order : item))
      );
      onToast?.("success", `Status pesanan ${ord.orderCode} diperbarui.`);
    } else {
      onToast?.("error", "Gagal mengupdate status pesanan.");
    }
  };

  const handleDeleteOrder = async (ord: StoreOrder) => {
    if (!confirm(`Hapus pesanan ${ord.orderCode}?`)) return;
    const res = await fetch(`${BASE_PATH}/api/orders?id=${ord.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setOrders((prev) => prev.filter((item) => item.id !== ord.id));
      onToast?.("success", `Pesanan ${ord.orderCode} dihapus.`);
    }
  };

  const handleUpdateScrim = async (scr: ScrimRequest, status: ScrimStatus) => {
    const adminNote =
      noteDrafts[scr.id] !== undefined ? noteDrafts[scr.id] : scr.adminNote || "";
    const res = await fetch(`${BASE_PATH}/api/scrim`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: scr.id, status, adminNote }),
    });
    if (res.ok) {
      const json = (await res.json()) as { scrim: ScrimRequest };
      setScrims((prev) =>
        prev.map((item) => (item.id === scr.id ? json.scrim : item))
      );
      onToast?.("success", `Status scrim ${scr.scrimCode} diperbarui.`);
    } else {
      onToast?.("error", "Gagal mengupdate status scrim.");
    }
  };

  const handleDeleteScrim = async (scr: ScrimRequest) => {
    if (!confirm(`Hapus scrim request ${scr.scrimCode}?`)) return;
    const res = await fetch(`${BASE_PATH}/api/scrim?id=${scr.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setScrims((prev) => prev.filter((item) => item.id !== scr.id));
      onToast?.("success", `Scrim ${scr.scrimCode} dihapus.`);
    }
  };

  return (
    <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab("orders")}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              subTab === "orders"
                ? "bg-red-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            Pesanan Store ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("scrim")}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              subTab === "scrim"
                ? "bg-red-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            Scrim Request ({scrims.length})
          </button>
        </div>

        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded border border-zinc-300 bg-white hover:border-red-600 hover:text-red-600 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-xs text-zinc-500">
          Memuat data pesanan &amp; scrim...
        </div>
      ) : subTab === "orders" ? (
        orders.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded">
            Belum ada pesanan store yang masuk.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md">
            {orders.map((ord) => (
              <div key={ord.id} className="p-3.5 sm:p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-zinc-900 text-white px-2 py-0.5 rounded">
                      {ord.orderCode}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900">
                      {ord.productName} ({ord.size}) × {ord.qty}
                    </span>
                    <span className="text-xs font-bold text-red-600">
                      {formatRupiah(ord.totalPrice)}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {new Date(ord.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="text-xs text-zinc-600 space-y-0.5">
                  <div>
                    Pemesan: <strong>{ord.customerName}</strong> · WA:{" "}
                    <strong>{ord.customerPhone}</strong>
                  </div>
                  <div>Alamat: {ord.address}</div>
                  {ord.notes && ord.notes !== "-" && (
                    <div>Catatan pembeli: {ord.notes}</div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <select
                    disabled={isReadOnly}
                    value={ord.status}
                    onChange={(e) =>
                      handleUpdateOrder(ord, e.target.value as OrderStatus)
                    }
                    className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 disabled:bg-zinc-100"
                  >
                    {ORDER_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={
                      noteDrafts[ord.id] !== undefined
                        ? noteDrafts[ord.id]
                        : ord.adminNote || ""
                    }
                    onChange={(e) =>
                      setNoteDrafts((prev) => ({
                        ...prev,
                        [ord.id]: e.target.value,
                      }))
                    }
                    placeholder="Catatan admin / No. Resi..."
                    className="flex-1 min-w-[180px] rounded border border-zinc-300 px-2.5 py-1 text-xs"
                  />

                  {!isReadOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateOrder(ord, ord.status)}
                        className="rounded bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white cursor-pointer"
                      >
                        Simpan Catatan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(ord)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : scrims.length === 0 ? (
        <div className="py-10 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded">
          Belum ada pengajuan scrim yang masuk.
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md">
          {scrims.map((scr) => (
            <div key={scr.id} className="p-3.5 sm:p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-zinc-900 text-white px-2 py-0.5 rounded">
                    {scr.scrimCode}
                  </span>
                  <span className="text-xs font-semibold text-zinc-900">
                    {scr.teamName} — {scr.gameName} ({scr.format})
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400">
                  {new Date(scr.createdAt).toLocaleString("id-ID")}
                </span>
              </div>

              <div className="text-xs text-zinc-600 space-y-0.5">
                <div>
                  PIC: <strong>{scr.contactName}</strong> · WA:{" "}
                  <strong>{scr.contactPhone}</strong>
                </div>
                <div>
                  Jadwal Diminta: <strong>{scr.preferredDate}</strong> jam{" "}
                  <strong>{scr.preferredTime} WIB</strong>
                </div>
                {scr.notes && scr.notes !== "-" && (
                  <div>Catatan: {scr.notes}</div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <select
                  disabled={isReadOnly}
                  value={scr.status}
                  onChange={(e) =>
                    handleUpdateScrim(scr, e.target.value as ScrimStatus)
                  }
                  className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 disabled:bg-zinc-100"
                >
                  {SCRIM_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  disabled={isReadOnly}
                  value={
                    noteDrafts[scr.id] !== undefined
                      ? noteDrafts[scr.id]
                      : scr.adminNote || ""
                  }
                  onChange={(e) =>
                    setNoteDrafts((prev) => ({
                      ...prev,
                      [scr.id]: e.target.value,
                    }))
                  }
                  placeholder="Catatan jadwal / Link lobby..."
                  className="flex-1 min-w-[180px] rounded border border-zinc-300 px-2.5 py-1 text-xs"
                />

                {!isReadOnly && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateScrim(scr, scr.status)}
                      className="rounded bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white cursor-pointer"
                    >
                      Simpan Catatan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteScrim(scr)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
