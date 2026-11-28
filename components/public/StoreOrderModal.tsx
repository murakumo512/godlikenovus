"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, ShoppingBag, MessageCircle } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import { MessageTemplatesConfig, StoreProduct } from "@/lib/types";
import { renderWhatsappTemplate } from "@/lib/template-utils";
import { DEFAULT_STORE_WA_TEMPLATE } from "@/lib/default-data";
import { collectVisibleMediaList } from "@/lib/media";
import { LightboxMediaItem, MediaCarousel, ModalPortal } from "./MediaDisplay";
import { useLockBodyAndLenis } from "./SmoothScroll";

interface StoreOrderModalProps {
  product: StoreProduct | null;
  whatsappNumber: string;
  templates: MessageTemplatesConfig;
  onInspectMedia?: (item: LightboxMediaItem) => void;
  onClose: () => void;
}

export function StoreOrderModal({
  product,
  whatsappNumber,
  templates,
  onInspectMedia,
  onClose,
}: StoreOrderModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [size, setSize] = useState(product?.sizes?.[0] || "L");
  const [qtyText, setQtyText] = useState("1");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useLockBodyAndLenis(Boolean(product));

  useEffect(() => {
    if (product?.sizes?.length) {
      setSize(product.sizes[0]);
    }
    setQtyText("1");
  }, [product]);

  if (!product) return null;

  const parsedQty = Math.max(1, parseInt(qtyText || "1", 10) || 1);
  const totalPrice = product.price * parsedQty;

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let orderCode = "";
    try {
      const res = await fetch(`${BASE_PATH}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          size,
          qty: parsedQty,
          unitPrice: product.price,
          customerName: name,
          customerPhone: phone,
          address,
          notes: notes || "-",
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { order?: { orderCode: string } };
        orderCode = json.order?.orderCode || "";
      }
    } catch {
      // continue to WhatsApp even if offline
    } finally {
      setSubmitting(false);
    }

    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
    const rawTemplate =
      templates.storeWhatsappTemplate || DEFAULT_STORE_WA_TEMPLATE;

    const baseMessage = renderWhatsappTemplate(rawTemplate, {
      product: product.name,
      category: product.category,
      price: formatRupiah(product.price),
      size,
      qty: parsedQty,
      total: formatRupiah(totalPrice),
      name,
      phone,
      address,
      notes: notes || "-",
    });
    const message = orderCode
      ? `${baseMessage}\n\nKode Pesanan: *${orderCode}*`
      : baseMessage;

    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <ModalPortal>
    <motion.div
      role="dialog"
      aria-modal="true"
      data-lenis-prevent
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 h-[100dvh] z-[80] flex items-center justify-center bg-black/90 p-2.5 sm:p-4 pb-6 sm:pb-4"
      onClick={onClose}
    >
      <motion.div
        data-lenis-prevent
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[82dvh] sm:max-h-[90dvh] overflow-y-auto overscroll-contain rounded-lg border border-white/12 bg-[#0e0e11] shadow-2xl flex flex-col md:grid md:grid-cols-12"
      >
        {/* Left / Top: Swipeable IG-Style Product Media (Click for Fullscreen Zoom) */}
        <MediaCarousel
          items={collectVisibleMediaList(
            product.hiddenImages,
            product.image,
            product.images
          )}
          alt={product.name}
          fit="contain-ambient"
          className="md:col-span-5 border-b md:border-b-0 md:border-r border-white/10"
          stageClassName="w-full max-h-[38vh] md:max-h-none md:h-full aspect-square"
          onInspect={(url, idx) =>
            onInspectMedia?.({
              url,
              items: collectVisibleMediaList(
                product.hiddenImages,
                product.image,
                product.images
              ),
              initialIndex: idx,
              title: product.name,
              caption: product.description,
            })
          }
        />

        {/* Right / Bottom: Full Product Details & Order Form */}
        <div className="md:col-span-7 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5 mb-4">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-[#E11D2E]">
                <ShoppingBag className="w-3.5 h-3.5" />{" "}
                {templates.storeModalBadge || "Form Pemesanan"}
              </span>
              <h3 className="font-display text-2xl font-bold uppercase text-white leading-tight mt-0.5">
                {product.name}
              </h3>
              <p className="text-sm font-semibold text-zinc-200 mt-0.5">
                {formatRupiah(product.price)}
              </p>
              {product.description && (
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {templates.storeNameLabel || "Nama Lengkap *"}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  templates.storeNamePlaceholder || "Contoh: Budi Santoso"
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {templates.storePhoneLabel || "No. WhatsApp *"}
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={templates.storePhonePlaceholder || "0812xxxxxxxx"}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {templates.storeSizeLabel || "Ukuran Baju"}
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
                {templates.storeQtyLabel || "Jumlah (Qty)"}
              </label>
              <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/90 overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setQtyText(String(Math.max(1, parsedQty - 1)))
                  }
                  className="px-3 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
                  aria-label="Kurangi jumlah"
                >
                  −
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={qtyText}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, "");
                    setQtyText(digits);
                  }}
                  onBlur={() => {
                    if (!qtyText || parseInt(qtyText, 10) < 1) {
                      setQtyText("1");
                    }
                  }}
                  className="w-full bg-transparent px-2 py-2 text-center text-sm font-semibold text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQtyText(String(parsedQty + 1))}
                  className="px-3 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
                  aria-label="Tambah jumlah"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              {templates.storeAddressLabel || "Alamat Pengiriman *"}
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={
                templates.storeAddressPlaceholder ||
                "Alamat lengkap, kecamatan, kota, kode pos"
              }
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              {templates.storeNotesLabel || "Catatan (Opsional)"}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                templates.storeNotesPlaceholder ||
                "Custom IGN di punggung / catatan kurir"
              }
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-zinc-900/80 border border-zinc-800 px-4 py-3">
            <span className="text-xs uppercase tracking-wider text-zinc-400">
              {templates.storeTotalLabel || "Total Estimasi"}
            </span>
            <span className="font-display text-xl font-bold text-white">
              {formatRupiah(totalPrice)}
            </span>
          </div>

          <button
            type="submit"
            disabled={!product.inStock || submitting}
            className="w-full flex items-center justify-center gap-2 bg-[#E11D2E] hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-500 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition cursor-pointer mb-6 sm:mb-0"
          >
            <MessageCircle className="w-4 h-4" />
            {submitting
              ? "Memproses Pesanan..."
              : product.inStock
                ? templates.storeSubmitButtonText || "Kirim Pesanan ke WhatsApp"
                : "Stok Habis"}
          </button>
        </form>
        </div>
      </motion.div>
    </motion.div>
    </ModalPortal>
  );
}
