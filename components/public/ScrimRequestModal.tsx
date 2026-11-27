"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Swords, X } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import type { GameDivision } from "@/lib/types";
import { useLockBodyAndLenis } from "./SmoothScroll";
import { ModalPortal } from "./MediaDisplay";

export function ScrimRequestModal({
  open,
  games,
  whatsappNumber,
  onClose,
}: {
  open: boolean;
  games: GameDivision[];
  whatsappNumber: string;
  onClose: () => void;
}) {
  const activeGames = games.filter((g) => g.enabled !== false);
  const [teamName, setTeamName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [gameName, setGameName] = useState(
    activeGames[0]?.name || "Honor of Kings"
  );
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("20:00");
  const [format, setFormat] = useState("BO3");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  useLockBodyAndLenis(open);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let scrimCode = "";
    try {
      const res = await fetch(`${BASE_PATH}/api/scrim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          contactName,
          contactPhone,
          gameName,
          preferredDate,
          preferredTime,
          format,
          notes,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { scrim?: { scrimCode: string } };
        scrimCode = json.scrim?.scrimCode || "";
      }
    } catch {
      // fallback to WA even if offline
    } finally {
      setSubmitting(false);
    }

    if (scrimCode) {
      setSubmittedCode(scrimCode);
    }

    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
    const message = [
      `Halo Godlike Novus, kami ingin mengajukan *Scrim Request*!`,
      scrimCode ? `Kode Scrim: *${scrimCode}*` : "",
      `Nama Tim: ${teamName}`,
      `PIC / Kontak: ${contactName} (${contactPhone})`,
      `Divisi Game: ${gameName}`,
      `Jadwal: ${preferredDate || "-"} jam ${preferredTime || "-"} WIB`,
      `Format: ${format}`,
      notes ? `Catatan: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

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
            onClick={() => {
              setSubmittedCode(null);
              onClose();
            }}
          >
            <motion.div
              data-lenis-prevent
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto overscroll-contain rounded-lg border border-white/12 bg-[#0e0e11] p-4 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#E11D2E]">
                    <Swords className="w-3.5 h-3.5" /> Matchmaking
                  </span>
                  <h3 className="font-display text-2xl font-bold uppercase text-white mt-0.5">
                    Ajukan Scrim Request
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedCode(null);
                    onClose();
                  }}
                  className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submittedCode && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Pengajuan scrim tersimpan! Kode Scrim Anda:{" "}
                    <strong className="font-mono text-white">
                      {submittedCode}
                    </strong>{" "}
                    (bisa dicek di Cek Status).
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Nama Tim Lawan *
                    </label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Contoh: Alter Ego Academy"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Divisi Game *
                    </label>
                    <select
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#E11D2E] focus:outline-none"
                    >
                      {activeGames.map((g) => (
                        <option key={g.id} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Nama Manager / Kapten *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Nama kontak"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      No. WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Tanggal *
                    </label>
                    <input
                      type="date"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs sm:text-sm text-white focus:border-[#E11D2E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Jam (WIB) *
                    </label>
                    <input
                      type="time"
                      required
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs sm:text-sm text-white focus:border-[#E11D2E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs sm:text-sm text-white focus:border-[#E11D2E] focus:outline-none"
                    >
                      <option value="BO1">BO1</option>
                      <option value="BO3">BO3</option>
                      <option value="BO5">BO5</option>
                      <option value="2 Game">2 Game</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Catatan / Rank / Tier (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Scrim serius, custom lobby on"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#E11D2E] hover:bg-red-600 disabled:opacity-60 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white transition cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  {submitting ? "Mengirim..." : "Kirim Scrim Request & Buka WA"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
}
