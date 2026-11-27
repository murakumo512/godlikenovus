"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, LogIn, ArrowLeft, Loader2 } from "lucide-react";
import { BrandingConfig } from "@/lib/types";
import type { AdminSessionUser } from "@/lib/auth";
import { assetUrl, BASE_PATH } from "@/lib/base-path";

export function AdminLogin({
  branding,
  onSuccess,
}: {
  branding: BrandingConfig;
  onSuccess: (user: AdminSessionUser) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoSrc =
    branding.adminLogo ||
    branding.navbarLogo ||
    branding.logoRed ||
    "/images/logo-red.png";
  const adminTitle = branding.adminTitle || "Godlike Admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_PATH}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as {
        user?: AdminSessionUser;
        error?: string;
      };
      if (!res.ok || !json.user) {
        setError(json.error || "Login gagal.");
        return;
      }
      onSuccess(json.user);
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-white/12 bg-[#111115] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="h-14 px-3 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center mb-3">
            <img
              src={assetUrl(logoSrc)}
              alt={adminTitle}
              className="max-h-10 w-auto object-contain"
            />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white">
            {adminTitle}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#E11D2E]" />
            Masuk untuk mengelola konten website
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#E11D2E] hover:bg-red-600 disabled:opacity-60 py-2.5 text-sm font-semibold text-white transition cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{loading ? "Memeriksa..." : "Masuk ke Admin"}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-white/10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Website
          </Link>
        </div>
      </div>
    </div>
  );
}
