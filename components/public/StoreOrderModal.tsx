"use client";

import { useState } from "react";
import { X, ShoppingBag, MessageCircle } from "lucide-react";
import { StoreProduct } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";

interface StoreOrderModalProps {
  product: StoreProduct | null;
  whatsappNumber: string;
  onClose: () => void;
}

export function StoreOrderModal({
  product,
  whatsappNumber,
  onClose,
}: StoreOrderModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [size, setSize] = useState(product?.sizes?.[0] || "L");
  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  if (!product) return null;

  const totalPrice = product.price * qty;

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
    const message = [
      `*ORDER MERCH GODLIKE NOVUS*`,
      `==============================`,
      `Produk: ${product.name}`,
      `Harga Satuan: ${formatRupiah(product.price)}`,
      `Ukuran: ${size}`,
      `Jumlah: ${qty} pcs`,
      `Total Estimasi: ${formatRupiah(totalPrice)}`,
      `------------------------------`,
      `Nama Pemesan: ${name}`,
      `No. WhatsApp: ${phone}`,
      `Alamat Pengiriman: ${address}`,
      notes ? `Catatan: ${notes}` : null,
      `==============================`,
      `Mohon info ketersediaan & pembayaran ya min!`,
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-lg border border-zinc-700 bg-[#0d0d11] p-4 sm:p-6 shadow-2xl my-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 border-b border-zinc-800 pb-4 mb-5">
          <img
            src={assetUrl(product.image)}
            alt={product.name}
            className="w-16 h-16 rounded-xl object-cover bg-zinc-900 border border-zinc-800"
          />
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#E11D2E]">
              <ShoppingBag className="w-3.5 h-3.5" /> Form Pemesanan
            </span>
            <h3 className="font-display text-xl font-bold text-white leading-tight">
              {product.name}
            </h3>
            <p className="text-sm font-semibold text-red-400">
              {formatRupiah(product.price)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                No. WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Ukuran Baju
              </label>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition border ${
                      size === s
                        ? "bg-[#E11D2E] border-[#E11D2E] text-white"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Jumlah (Qty)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-sm text-white focus:border-[#E11D2E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Alamat Pengiriman *
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat lengkap, kecamatan, kota, kode pos"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Custom IGN di punggung / catatan kurir"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-zinc-900/80 border border-zinc-800 px-4 py-3">
            <span className="text-xs uppercase tracking-wider text-zinc-400">
              Total Estimasi
            </span>
            <span className="font-display text-xl font-bold text-white">
              {formatRupiah(totalPrice)}
            </span>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#E11D2E] hover:bg-red-500 py-3.5 font-display text-base font-bold uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            Kirim Pesanan ke WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
