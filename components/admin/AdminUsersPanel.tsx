"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, RotateCcw, Shield, Trash2, UserPlus } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";

interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
}

export function AdminUsersPanel({
  currentUser,
  onShowToast,
  onResetSiteData,
}: {
  currentUser: { id: string; username: string; displayName: string };
  onShowToast: (type: "success" | "error", msg: string) => void;
  onResetSiteData: () => void;
}) {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Add new user form
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

  // Change password form
  const [targetUserId, setTargetUserId] = useState(currentUser.id);
  const [changePwd, setChangePwd] = useState("");
  const [changePwdConfirm, setChangePwdConfirm] = useState("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BASE_PATH}/api/admin/users`);
        if (res.ok) {
          const json = (await res.json()) as { users: UserInfo[] };
          setUsers(json.users || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          username: newUsername,
          displayName: newDisplayName,
          password: newPassword,
        }),
      });
      const json = (await res.json()) as { users?: UserInfo[]; error?: string };
      if (!res.ok) {
        onShowToast("error", json.error || "Gagal menambah user.");
        return;
      }
      setUsers(json.users || []);
      setNewUsername("");
      setNewDisplayName("");
      setNewPassword("");
      onShowToast("success", "Akun admin baru berhasil ditambahkan.");
    } catch {
      onShowToast("error", "Gagal menghubungi server.");
    } finally {
      setCreating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePwd !== changePwdConfirm) {
      onShowToast("error", "Konfirmasi password tidak cocok.");
      return;
    }
    setChanging(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          userId: targetUserId,
          newPassword: changePwd,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        onShowToast("error", json.error || "Gagal mengganti password.");
        return;
      }
      setChangePwd("");
      setChangePwdConfirm("");
      onShowToast("success", "Password berhasil diperbarui.");
    } catch {
      onShowToast("error", "Gagal menghubungi server.");
    } finally {
      setChanging(false);
    }
  };

  const handleDeleteUser = async (u: UserInfo) => {
    if (!confirm(`Hapus akun admin "${u.username}"?`)) return;
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", userId: u.id }),
      });
      const json = (await res.json()) as { users?: UserInfo[]; error?: string };
      if (!res.ok) {
        onShowToast("error", json.error || "Gagal menghapus user.");
        return;
      }
      setUsers(json.users || []);
      onShowToast("success", `User "${u.username}" dihapus.`);
    } catch {
      onShowToast("error", "Gagal menghubungi server.");
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Ganti Password */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="border-b border-zinc-100 pb-3">
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-red-600" />
            Ganti Password Admin
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Ubah password akun Anda sendiri atau akun admin lainnya.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Pilih Akun
              </label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.displayName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Password Baru
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={changePwd}
                onChange={(e) => setChangePwd(e.target.value)}
                placeholder="Minimal 4 karakter"
                className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Ulangi Password Baru
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={changePwdConfirm}
                onChange={(e) => setChangePwdConfirm(e.target.value)}
                placeholder="Ketik ulang password"
                className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changing}
            className="inline-flex items-center gap-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-2 text-xs font-medium text-white cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {changing ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      </section>

      {/* 2. Tambah User Admin Baru */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="border-b border-zinc-100 pb-3">
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-red-600" />
            Tambah User Admin Baru
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Buat akun tambahan untuk rekan tim/manajer yang ikut mengelola website.
          </p>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Username Login *
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="contoh: manager_hok"
                className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Nama Tampilan
              </label>
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Contoh: Admin HoK"
                className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Password Awal *
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 4 karakter"
                className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-2 text-xs font-medium text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {creating ? "Menambahkan..." : "Tambah Akun Admin"}
          </button>
        </form>
      </section>

      {/* 3. Daftar Semua User Admin */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="border-b border-zinc-100 pb-3">
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-600" />
            Daftar Akun Admin ({users.length})
          </h2>
        </div>

        {loading ? (
          <p className="text-xs text-zinc-500">Memuat daftar akun...</p>
        ) : (
          <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md">
            {users.map((u) => {
              const isSelf = u.id === currentUser.id;
              return (
                <div
                  key={u.id}
                  className="p-3 sm:p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">
                        {u.username}
                      </span>
                      {isSelf && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-emerald-700">
                          Sedang Login
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {u.displayName}
                    </span>
                  </div>

                  {!isSelf && users.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Zona Berbahaya: Reset Default (Dipindah dari bar atas agar tidak terpencet tidak sengaja!) */}
      <section className="rounded-md border border-red-200 bg-red-50/40 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-red-800">
            Reset Seluruh Konten ke Default Awal
          </h3>
          <p className="text-xs text-red-700/80 mt-0.5">
            Hati-hati: tindakan ini mengembalikan teks &amp; daftar ke bawaan pabrik (file di Galeri Server tetap aman).
          </p>
        </div>
        <button
          type="button"
          onClick={onResetSiteData}
          className="inline-flex items-center gap-1.5 rounded border border-red-300 bg-white hover:bg-red-600 hover:text-white px-3 py-1.5 text-xs font-medium text-red-700 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Konten Default
        </button>
      </section>
    </div>
  );
}
