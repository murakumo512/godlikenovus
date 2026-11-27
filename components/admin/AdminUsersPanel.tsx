"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, RotateCcw, Shield, Trash2, UserPlus } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import type { AdminRole, AdminTabId } from "@/lib/types";

interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  role: AdminRole;
  allowedTabs: AdminTabId[];
  createdAt: string;
}

const EDITABLE_TAB_OPTIONS: Array<{ id: AdminTabId; label: string }> = [
  { id: "sections", label: "Urutan & Enable/Disable Section" },
  { id: "branding", label: "Home & Branding" },
  { id: "opening", label: "Opening & Loading" },
  { id: "games", label: "Games & Roster" },
  { id: "about", label: "About Us" },
  { id: "gallery", label: "Gallery" },
  { id: "ambassadors", label: "Brand Ambassador" },
  { id: "store", label: "Store" },
  { id: "sponsors", label: "Sponsors" },
  { id: "contact", label: "Contact & Sosmed" },
  { id: "templates", label: "Template Pesan" },
  { id: "orders", label: "Pesanan & Scrim" },
  { id: "analytics", label: "Statistik Web" },
  { id: "logs", label: "Log Aktivitas" },
];

const ROLE_LABELS: Record<AdminRole, string> = {
  full: "Full Access",
  read: "Read Only",
  custom: "Custom Menu",
};

export function AdminUsersPanel({
  currentUser,
  onShowToast,
  onResetSiteData,
}: {
  currentUser: {
    id: string;
    username: string;
    displayName: string;
    role: AdminRole;
    allowedTabs: AdminTabId[];
  };
  onShowToast: (type: "success" | "error", msg: string) => void;
  onResetSiteData: () => void;
}) {
  const isFullAdmin = currentUser.role === "full";
  const isReadOnly = currentUser.role === "read";

  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Add new user form
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("full");
  const [newAllowedTabs, setNewAllowedTabs] = useState<AdminTabId[]>([
    "gallery",
    "store",
  ]);
  const [creating, setCreating] = useState(false);

  // Change password form
  const [targetUserId, setTargetUserId] = useState(currentUser.id);
  const [currentPwd, setCurrentPwd] = useState("");
  const [changePwd, setChangePwd] = useState("");
  const [changePwdConfirm, setChangePwdConfirm] = useState("");
  const [changing, setChanging] = useState(false);

  // Inline role editor
  const [editingRoleUserId, setEditingRoleUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AdminRole>("full");
  const [editAllowedTabs, setEditAllowedTabs] = useState<AdminTabId[]>([]);

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

  const toggleTabInList = (list: AdminTabId[], tab: AdminTabId): AdminTabId[] =>
    list.includes(tab) ? list.filter((t) => t !== tab) : [...list, tab];

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRole === "custom" && newAllowedTabs.length === 0) {
      onShowToast("error", "Pilih minimal 1 menu untuk mode Custom.");
      return;
    }
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
          role: newRole,
          allowedTabs: newRole === "custom" ? newAllowedTabs : [],
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
      setNewRole("full");
      onShowToast("success", "Akun admin baru berhasil ditambahkan.");
    } catch {
      onShowToast("error", "Gagal menghubungi server.");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveRole = async (userId: string) => {
    if (editRole === "custom" && editAllowedTabs.length === 0) {
      onShowToast("error", "Pilih minimal 1 menu untuk mode Custom.");
      return;
    }
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-role",
          userId,
          role: editRole,
          allowedTabs: editRole === "custom" ? editAllowedTabs : [],
        }),
      });
      const json = (await res.json()) as { users?: UserInfo[]; error?: string };
      if (!res.ok) {
        onShowToast("error", json.error || "Gagal mengubah role.");
        return;
      }
      setUsers(json.users || []);
      setEditingRoleUserId(null);
      onShowToast("success", "Hak akses akun berhasil diperbarui.");
    } catch {
      onShowToast("error", "Gagal menghubungi server.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwd) {
      onShowToast("error", "Password lama wajib diisi.");
      return;
    }
    if (changePwd !== changePwdConfirm) {
      onShowToast("error", "Konfirmasi password baru tidak cocok.");
      return;
    }
    if (changePwd === currentPwd) {
      onShowToast("error", "Password baru tidak boleh sama dengan password lama.");
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
          currentPassword: currentPwd,
          newPassword: changePwd,
          confirmPassword: changePwdConfirm,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        onShowToast("error", json.error || "Gagal mengganti password.");
        return;
      }
      setCurrentPwd("");
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
            {isReadOnly
              ? "Akun ini dalam mode Read Only dan tidak dapat mengganti password."
              : "Wajib memasukkan password lama dan konfirmasi password baru."}
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Pilih Akun
              </label>
              <select
                value={targetUserId}
                disabled={!isFullAdmin || isReadOnly}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 disabled:bg-zinc-100"
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
                Password Lama *
              </label>
              <input
                type="password"
                required
                disabled={isReadOnly}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="Masukkan password lama"
                className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none disabled:bg-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Password Baru *
              </label>
              <input
                type="password"
                required
                minLength={4}
                disabled={isReadOnly}
                value={changePwd}
                onChange={(e) => setChangePwd(e.target.value)}
                placeholder="Minimal 4 karakter"
                className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none disabled:bg-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Konfirmasi Password Baru *
              </label>
              <input
                type="password"
                required
                minLength={4}
                disabled={isReadOnly}
                value={changePwdConfirm}
                onChange={(e) => setChangePwdConfirm(e.target.value)}
                placeholder="Ketik ulang password baru"
                className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none disabled:bg-zinc-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changing || isReadOnly}
            className="inline-flex items-center gap-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 text-xs font-medium text-white cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {changing ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      </section>

      {/* 2. Tambah User Admin Baru (Full Access Only) */}
      {isFullAdmin && (
        <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-red-600" />
              Tambah User Admin Baru &amp; Role Akses
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Pilih mode akses: <strong>Full Access</strong> (semua menu),{" "}
              <strong>Read Only</strong> (hanya lihat), atau{" "}
              <strong>Custom Menu</strong> (hanya boleh edit menu tertentu).
            </p>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Mode Akses (Role)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                >
                  <option value="full">Full Access (Semua)</option>
                  <option value="read">Read Only (Lihat Saja)</option>
                  <option value="custom">Custom (Pilih Menu Tertentu)</option>
                </select>
              </div>
            </div>

            {newRole === "custom" && (
              <div className="rounded border border-zinc-200 bg-zinc-50 p-3 space-y-2">
                <span className="block text-xs font-semibold text-zinc-700">
                  Pilih Menu yang Boleh Dikelola Akun Ini:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EDITABLE_TAB_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className="inline-flex items-center gap-2 text-xs text-zinc-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={newAllowedTabs.includes(opt.id)}
                        onChange={() =>
                          setNewAllowedTabs((prev) =>
                            toggleTabInList(prev, opt.id)
                          )
                        }
                        className="accent-red-600"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
      )}

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
              const isEditing = editingRoleUserId === u.id;
              return (
                <div key={u.id} className="p-3 sm:p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900">
                          {u.username}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] font-medium text-zinc-600">
                          {u.displayName}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            u.role === "full"
                              ? "bg-emerald-50 text-emerald-700"
                              : u.role === "read"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {ROLE_LABELS[u.role || "full"]}
                          {u.role === "custom"
                            ? ` (${u.allowedTabs?.length || 0} menu)`
                            : ""}
                        </span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 text-[10px] font-semibold text-red-600">
                            Sedang Login
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Dibuat:{" "}
                        {new Date(u.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>

                    {isFullAdmin && !isSelf && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditing) {
                              setEditingRoleUserId(null);
                            } else {
                              setEditingRoleUserId(u.id);
                              setEditRole(u.role || "full");
                              setEditAllowedTabs(u.allowedTabs || []);
                            }
                          }}
                          className="text-xs font-medium text-zinc-700 hover:text-red-600 border border-zinc-300 rounded px-2.5 py-1 cursor-pointer"
                        >
                          {isEditing ? "Batal" : "Ubah Role"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="rounded border border-zinc-200 bg-zinc-50 p-3 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(e.target.value as AdminRole)
                          }
                          className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-900"
                        >
                          <option value="full">Full Access</option>
                          <option value="read">Read Only</option>
                          <option value="custom">Custom Menu</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleSaveRole(u.id)}
                          className="rounded bg-red-600 hover:bg-red-700 px-3 py-1 text-xs font-medium text-white cursor-pointer"
                        >
                          Simpan Role
                        </button>
                      </div>

                      {editRole === "custom" && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {EDITABLE_TAB_OPTIONS.map((opt) => (
                            <label
                              key={opt.id}
                              className="inline-flex items-center gap-2 text-xs text-zinc-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={editAllowedTabs.includes(opt.id)}
                                onChange={() =>
                                  setEditAllowedTabs((prev) =>
                                    toggleTabInList(prev, opt.id)
                                  )
                                }
                                className="accent-red-600"
                              />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Reset Konten Website (Full Access Only) */}
      {isFullAdmin && (
        <section className="rounded-md border border-red-200 bg-red-50/40 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Reset Semua Konten ke Default Pabrik
            </h3>
            <p className="text-xs text-zinc-600 mt-0.5">
              Mengembalikan seluruh teks, banner, dan susunan section ke bawaan awal (akun admin tidak ikut terhapus).
            </p>
          </div>
          <button
            type="button"
            onClick={onResetSiteData}
            className="inline-flex items-center gap-1.5 rounded border border-red-300 bg-white hover:bg-red-600 hover:text-white px-3.5 py-2 text-xs font-semibold text-red-600 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Konten Website
          </button>
        </section>
      )}
    </div>
  );
}
