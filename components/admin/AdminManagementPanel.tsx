"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ManagementDivision, ManagementMember, SiteData } from "@/lib/types";
import { ImageField } from "./ImageField";

export function AdminManagementPanel({
  data,
  setData,
}: {
  data: SiteData;
  setData: React.Dispatch<React.SetStateAction<SiteData>>;
}) {
  const divisions = data.management || [];

  const updateDivisions = (next: ManagementDivision[]) => {
    setData((prev) => ({ ...prev, management: next }));
  };

  const moveDivision = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= divisions.length) return;
    const next = [...divisions];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    updateDivisions(next);
  };

  const moveMember = (divId: string, idx: number, delta: -1 | 1) => {
    updateDivisions(
      divisions.map((div) => {
        if (div.id !== divId) return div;
        const target = idx + delta;
        if (target < 0 || target >= div.members.length) return div;
        const nextMembers = [...div.members];
        const [item] = nextMembers.splice(idx, 1);
        nextMembers.splice(target, 0, item);
        return { ...div, members: nextMembers };
      })
    );
  };

  return (
    <div className="space-y-5">
      {/* Section Heading Settings */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="border-b border-zinc-100 pb-3">
          <h2 className="text-base font-semibold text-zinc-900">
            Pengaturan Seksi Our Management (Home &amp; Halaman /management)
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Di halaman Home tampil sebagai foto bertumpuk di bawah Brand Ambassador; saat diklik membuka halaman khusus <code>/management</code>. ON/OFF seksi juga bisa diatur di tab &ldquo;Urutan Section&rdquo;.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Badge</label>
            <input
              type="text"
              value={data.homeSections.managementBadge ?? "Struktur Organisasi"}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  homeSections: { ...prev.homeSections, managementBadge: e.target.value },
                }))
              }
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Judul Putih</label>
            <input
              type="text"
              value={data.homeSections.managementTitleWhite ?? "OUR"}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  homeSections: { ...prev.homeSections, managementTitleWhite: e.target.value },
                }))
              }
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Judul Aksen Merah</label>
            <input
              type="text"
              value={data.homeSections.managementTitleAccent ?? "MANAGEMENT"}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  homeSections: { ...prev.homeSections, managementTitleAccent: e.target.value },
                }))
              }
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Teks Tombol</label>
            <input
              type="text"
              value={data.homeSections.managementButtonText ?? "Lihat Struktur Management"}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  homeSections: { ...prev.homeSections, managementButtonText: e.target.value },
                }))
              }
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Deskripsi</label>
          <textarea
            rows={2}
            value={
              data.homeSections.managementSubtitle ??
              "Tim manajemen di balik operasional, divisi kompetitif, media, komunitas, dan kemitraan Godlike Novus."
            }
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                homeSections: { ...prev.homeSections, managementSubtitle: e.target.value },
              }))
            }
            className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
          />
        </div>
      </section>

      {/* Divisions CRUD + Reorder + ON/OFF */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Divisi Management ({divisions.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Atur urutan (panah atas/bawah), ON/OFF tiap divisi, serta daftar pengurus di dalamnya.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next: ManagementDivision = {
                id: `mgmt-${Date.now()}`,
                name: "Divisi Baru",
                description: "",
                enabled: true,
                members: [],
              };
              updateDivisions([...divisions, next]);
            }}
            className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Divisi
          </button>
        </div>

        <div className="space-y-4">
          {divisions.map((div, dIdx) => (
            <div
              key={div.id}
              className={`rounded-md border p-4 space-y-4 ${
                div.enabled === false
                  ? "border-zinc-200 bg-zinc-50/70 opacity-75"
                  : "border-zinc-200 bg-white"
              }`}
            >
              {/* Division Header Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">#{dIdx + 1}</span>
                  <span className="text-sm font-semibold text-zinc-900">{div.name}</span>
                  <span className="text-[11px] text-zinc-500">
                    ({div.members.length} orang)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveDivision(dIdx, -1)}
                    disabled={dIdx === 0}
                    className="p-1 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                    title="Naikkan urutan"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDivision(dIdx, 1)}
                    disabled={dIdx === divisions.length - 1}
                    className="p-1 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                    title="Turunkan urutan"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <label className="inline-flex items-center gap-1.5 rounded border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={div.enabled !== false}
                      onChange={(e) =>
                        updateDivisions(
                          divisions.map((item) =>
                            item.id === div.id
                              ? { ...item, enabled: e.target.checked }
                              : item
                          )
                        )
                      }
                    />
                    {div.enabled !== false ? "ON" : "OFF"}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateDivisions(divisions.filter((item) => item.id !== div.id))
                    }
                    className="p-1.5 text-zinc-400 hover:text-red-600 cursor-pointer"
                    title="Hapus Divisi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Nama Divisi
                  </label>
                  <input
                    type="text"
                    value={div.name}
                    onChange={(e) =>
                      updateDivisions(
                        divisions.map((item) =>
                          item.id === div.id ? { ...item, name: e.target.value } : item
                        )
                      )
                    }
                    className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Deskripsi Singkat Divisi
                  </label>
                  <input
                    type="text"
                    value={div.description || ""}
                    onChange={(e) =>
                      updateDivisions(
                        divisions.map((item) =>
                          item.id === div.id
                            ? { ...item, description: e.target.value }
                            : item
                        )
                      )
                    }
                    className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                  />
                </div>
              </div>

              {/* Members inside this division */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700">
                    Pengurus di {div.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newMember: ManagementMember = {
                        id: `mm-${Date.now()}`,
                        name: "Nama Pengurus",
                        role: div.name,
                        photo: "",
                        bio: "",
                        socialUrl: "",
                        enabled: true,
                      };
                      updateDivisions(
                        divisions.map((item) =>
                          item.id === div.id
                            ? { ...item, members: [...item.members, newMember] }
                            : item
                        )
                      );
                    }}
                    className="inline-flex items-center gap-1 rounded border border-zinc-300 bg-white hover:bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-800 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Tambah Pengurus
                  </button>
                </div>

                {div.members.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">
                    Belum ada pengurus di divisi ini.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {div.members.map((m, mIdx) => (
                      <div
                        key={m.id}
                        className="rounded border border-zinc-200 bg-zinc-50/70 p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-zinc-800">
                            {m.name || "Pengurus"} — {m.role}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => moveMember(div.id, mIdx, -1)}
                              disabled={mIdx === 0}
                              className="p-1 rounded border border-zinc-200 bg-white text-zinc-600 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveMember(div.id, mIdx, 1)}
                              disabled={mIdx === div.members.length - 1}
                              className="p-1 rounded border border-zinc-200 bg-white text-zinc-600 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <label className="inline-flex items-center gap-1 text-xs text-zinc-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={m.enabled !== false}
                                onChange={(e) =>
                                  updateDivisions(
                                    divisions.map((item) =>
                                      item.id === div.id
                                        ? {
                                            ...item,
                                            members: item.members.map((mem) =>
                                              mem.id === m.id
                                                ? { ...mem, enabled: e.target.checked }
                                                : mem
                                            ),
                                          }
                                        : item
                                    )
                                  )
                                }
                              />
                              Aktif
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                updateDivisions(
                                  divisions.map((item) =>
                                    item.id === div.id
                                      ? {
                                          ...item,
                                          members: item.members.filter(
                                            (mem) => mem.id !== m.id
                                          ),
                                        }
                                      : item
                                  )
                                )
                              }
                              className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                              Nama
                            </label>
                            <input
                              type="text"
                              value={m.name}
                              onChange={(e) =>
                                updateDivisions(
                                  divisions.map((item) =>
                                    item.id === div.id
                                      ? {
                                          ...item,
                                          members: item.members.map((mem) =>
                                            mem.id === m.id
                                              ? { ...mem, name: e.target.value }
                                              : mem
                                          ),
                                        }
                                      : item
                                  )
                                )
                              }
                              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                              Jabatan / Role
                            </label>
                            <input
                              type="text"
                              value={m.role}
                              onChange={(e) =>
                                updateDivisions(
                                  divisions.map((item) =>
                                    item.id === div.id
                                      ? {
                                          ...item,
                                          members: item.members.map((mem) =>
                                            mem.id === m.id
                                              ? { ...mem, role: e.target.value }
                                              : mem
                                          ),
                                        }
                                      : item
                                  )
                                )
                              }
                              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                              Link Sosmed (Opsional)
                            </label>
                            <input
                              type="text"
                              placeholder="https://instagram.com/..."
                              value={m.socialUrl || ""}
                              onChange={(e) =>
                                updateDivisions(
                                  divisions.map((item) =>
                                    item.id === div.id
                                      ? {
                                          ...item,
                                          members: item.members.map((mem) =>
                                            mem.id === m.id
                                              ? { ...mem, socialUrl: e.target.value }
                                              : mem
                                          ),
                                        }
                                      : item
                                  )
                                )
                              }
                              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Bio Singkat (Opsional)
                          </label>
                          <input
                            type="text"
                            value={m.bio || ""}
                            onChange={(e) =>
                              updateDivisions(
                                divisions.map((item) =>
                                  item.id === div.id
                                    ? {
                                        ...item,
                                        members: item.members.map((mem) =>
                                          mem.id === m.id
                                            ? { ...mem, bio: e.target.value }
                                            : mem
                                        ),
                                      }
                                    : item
                                )
                              )
                            }
                            className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                          />
                        </div>

                        <ImageField
                          label="Foto Pengurus"
                          value={m.photo}
                          acceptMedia="image"
                          allowClear
                          onChange={(url) =>
                            updateDivisions(
                              divisions.map((item) =>
                                item.id === div.id
                                  ? {
                                      ...item,
                                      members: item.members.map((mem) =>
                                        mem.id === m.id ? { ...mem, photo: url } : mem
                                      ),
                                    }
                                  : item
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
