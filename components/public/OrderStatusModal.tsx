"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PackageCheck, Search, Swords, X } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import { useLockBodyAndLenis } from "./SmoothScroll";
import { ModalPortal } from "./MediaDisplay";

interface PublicOrderInfo {
  id: string;
  orderCode: string;
  productName: string;
  size: string;
  qty: number;
  totalPrice: number;
  customerName: string;
  status: string;
  adminNote: string;
  createdAt: string;
}

interface PublicScrimInfo {
  id: string;
  scrimCode: string;
  teamName: string;
  gameName: string;
  preferredDate: string;
  preferredTime: string;
  format: string;
  status: string;
  adminNote: string;
  createdAt: string;
}

const ORDER_STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Menunggu Konfirmasi",
    cls: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  processing: {
    label: "Sedang Diproses",
    cls: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  shipped: {
    label: "Dikirim",
    cls: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  completed: {
    label: "Selesai",
    cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  cancelled: {
    label: "Dibatalkan",
    cls: "bg-red-500/20 text-red-300 border-red-500/30",
  },
};

const SCRIM_STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Menunggu Jadwal",
    cls: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  approved: {
    label: "Disetujui / Dijadwalkan",
    cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  completed: {
    label: "Selesai",
    cls: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  rejected: {
    label: "Ditolak / Penuh",
    cls: "bg-red-500/20 text-red-300 border-red-500/30",
  },
};

export function OrderStatusModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<PublicOrderInfo[]>([]);
  const [scrims, setScrims] = useState<PublicScrimInfo[]>([]);

  useLockBodyAndLenis(open);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const q = encodeURIComponent(query.trim());
      const [ordRes, scrRes] = await Promise.all([
        fetch(`${BASE_PATH}/api/orders?q=${q}`),
        fetch(`${BASE_PATH}/api/scrim?q=${q}`),
      ]);
      if (ordRes.ok) {
        const json = (await ordRes.json()) as { orders: PublicOrderInfo[] };
        setOrders(json.orders || []);
      }
      if (scrRes.ok) {
        const json = (await scrRes.json()) as { scrims: PublicScrimInfo[] };
        setScrims(json.scrims || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <AnimatePresence>
      {open && (
        <ModalPortal>
          <motion.div
            role="dialog"
            aria-modal="true"
            data-lenis-prevent
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-3 sm:p-4"
            onClick={onClose}
          >
            <motion.div
              data-lenis-prevent
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[82dvh] sm:max-h-[86dvh] overflow-y-auto overscroll-contain rounded-lg border border-white/12 bg-[#0e0e11] p-4 pb-10 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#E11D2E]">
                    <PackageCheck className="w-3.5 h-3.5" /> Tracking Status
                  </span>
                  <h3 className="font-display text-2xl font-bold uppercase text-white mt-0.5">
                    Cek Status Pesanan &amp; Scrim
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Masukkan Kode (GL-xxxx / SCRIM-xxxx) atau No. WA"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#E11D2E] hover:bg-red-600 disabled:opacity-60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition cursor-pointer shrink-0"
                >
                  {loading ? "Cek..." : "Cari"}
                </button>
              </form>

              {searched && !loading && orders.length === 0 && scrims.length === 0 && (
                <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-5 text-center text-xs text-zinc-400">
                  Tidak ditemukan pesanan atau scrim dengan kode / nomor WA tersebut.
                </div>
              )}

              {orders.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Pesanan Store ({orders.length})
                  </div>
                  {orders.map((ord) => {
                    const meta =
                      ORDER_STATUS_META[ord.status] || ORDER_STATUS_META.pending;
                    return (
                      <div
                        key={ord.id}
                        className="rounded-lg border border-white/10 bg-zinc-900/80 p-3.5 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-white">
                            {ord.orderCode}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${meta.cls}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {ord.productName} ({ord.size}) × {ord.qty}
                        </div>
                        <div className="text-xs text-zinc-400 flex flex-wrap justify-between gap-2">
                          <span>Pemesan: {ord.customerName}</span>
                          <span className="font-semibold text-zinc-200">
                            {formatRupiah(ord.totalPrice)}
                          </span>
                        </div>
                        {ord.adminNote && (
                          <div className="rounded bg-black/40 border border-white/8 px-2.5 py-1.5 text-xs text-zinc-300">
                            Catatan Admin: {ord.adminNote}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {scrims.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-[#E11D2E]" />
                    Scrim Request ({scrims.length})
                  </div>
                  {scrims.map((scr) => {
                    const meta =
                      SCRIM_STATUS_META[scr.status] || SCRIM_STATUS_META.pending;
                    return (
                      <div
                        key={scr.id}
                        className="rounded-lg border border-white/10 bg-zinc-900/80 p-3.5 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-white">
                            {scr.scrimCode}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${meta.cls}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {scr.teamName} — {scr.gameName} ({scr.format})
                        </div>
                        <div className="text-xs text-zinc-400">
                          Jadwal: {scr.preferredDate} · {scr.preferredTime} WIB
                        </div>
                        {scr.adminNote && (
                          <div className="rounded bg-black/40 border border-white/8 px-2.5 py-1.5 text-xs text-zinc-300">
                            Catatan Admin: {scr.adminNote}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
}
