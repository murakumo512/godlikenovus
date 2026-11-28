"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ContentCreator, SiteData } from "@/lib/types";
import { ImageField } from "./ImageField";

export function AdminCreatorsPanel({
  data,
  setData,
}: {
  data: SiteData;
  setData: React.Dispatch<React.SetStateAction<SiteData>>;
}) {
  const creators = data.creators || [];

  const updateCreators = (next: ContentCreator[]) => {
    setData((prev) => ({ ...prev, creators: next }));
  };

  const moveCreator = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= creators.length) return;
    const next = [...creators];
    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);
    updateCreators(next);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="border-b border-zinc-100 pb-3">
          <h2 className="text-base font-semibold text-zinc-900">
            Pengaturan Seksi Content Creator Hub
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Toggle ON/OFF seluruh seksi Content Creator Hub bisa diatur di tab &ldquo;Urutan Section&rdquo;.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Badge</label>
            <input
              type="text"
              value={data.homeSections.creatorsBadge ?? "Creator Network"}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  homeSections: { ...prev.homeSections, creatorsBadge: e.target.value },
                }))
              }
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Judul Putih</label>
            <input
              type="text"
              value={data.homeSections.creatorsTitleWhite ?? "CONTENT CREATOR"}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  homeSections: { ...prev.homeSections, creatorsTitleWhite: e.target.value },
                }))
              }
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Judul Aksen Merah</label>
            <input
              type="text"
              value={data.homeSections.creatorsTitleAccent ?? "HUB"}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  homeSections: { ...prev.homeSections, creatorsTitleAccent: e.target.value },
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
              data.homeSections.creatorsSubtitle ??
              "Streamer, kreator konten, dan talenta kreatif resmi yang membawa semangat Godlike Novus."
            }
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                homeSections: { ...prev.homeSections, creatorsSubtitle: e.target.value },
              }))
            }
            className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
          />
        </div>
      </section>

      <section className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Daftar Content Creator ({creators.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tambah, urutkan, aktif/nonaktifkan, atau hapus kreator konten.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next: ContentCreator = {
                id: `creator-${Date.now()}`,
                name: "Nama Creator",
                handle: "@handle",
                platform: "tiktok",
                role: "Streamer / Content Creator",
                followers: "",
                photo: "",
                bio: "",
                channelUrl: "",
                enabled: true,
              };
              updateCreators([...creators, next]);
            }}
            className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Creator
          </button>
        </div>

        {creators.length === 0 ? (
          <p className="text-xs text-zinc-500 border border-dashed border-zinc-300 rounded-md p-4">
            Belum ada Content Creator. Klik &ldquo;Tambah Creator&rdquo; untuk menambahkan.
          </p>
        ) : (
          <div className="space-y-4">
            {creators.map((c, idx) => (
              <div
                key={c.id}
                className="rounded-md border border-zinc-200 bg-zinc-50/70 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200">
                  <span className="text-xs font-semibold text-zinc-800">
                    #{idx + 1} — {c.name || "Creator"} ({c.platform})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveCreator(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded border border-zinc-200 bg-white text-zinc-600 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCreator(idx, 1)}
                      disabled={idx === creators.length - 1}
                      className="p-1 rounded border border-zinc-200 bg-white text-zinc-600 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <label className="inline-flex items-center gap-1.5 rounded border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={c.enabled !== false}
                        onChange={(e) =>
                          updateCreators(
                            creators.map((item) =>
                              item.id === c.id
                                ? { ...item, enabled: e.target.checked }
                                : item
                            )
                          )
                        }
                      />
                      {c.enabled !== false ? "ON" : "OFF"}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateCreators(creators.filter((item) => item.id !== c.id))
                      }
                      className="p-1.5 text-zinc-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Nama Creator
                    </label>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) =>
                        updateCreators(
                          creators.map((item) =>
                            item.id === c.id ? { ...item, name: e.target.value } : item
                          )
                        )
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Handle (@username)
                    </label>
                    <input
                      type="text"
                      value={c.handle}
                      onChange={(e) =>
                        updateCreators(
                          creators.map((item) =>
                            item.id === c.id ? { ...item, handle: e.target.value } : item
                          )
                        )
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Platform Utama
                    </label>
                    <select
                      value={c.platform}
                      onChange={(e) =>
                        updateCreators(
                          creators.map((item) =>
                            item.id === c.id
                              ? {
                                  ...item,
                                  platform: e.target.value as ContentCreator["platform"],
                                }
                              : item
                          )
                        )
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                    >
                      <option value="tiktok">TikTok</option>
                      <option value="youtube">YouTube</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitch">Twitch</option>
                      <option value="facebook">Facebook</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Role / Spesialisasi
                    </label>
                    <input
                      type="text"
                      value={c.role}
                      onChange={(e) =>
                        updateCreators(
                          creators.map((item) =>
                            item.id === c.id ? { ...item, role: e.target.value } : item
                          )
                        )
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Followers / Subscribers (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="cth: 120K Followers"
                      value={c.followers || ""}
                      onChange={(e) =>
                        updateCreators(
                          creators.map((item) =>
                            item.id === c.id
                              ? { ...item, followers: e.target.value }
                              : item
                          )
                        )
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Link Channel / Profil
                    </label>
                    <input
                      type="text"
                      placeholder="https://tiktok.com/@..."
                      value={c.channelUrl}
                      onChange={(e) =>
                        updateCreators(
                          creators.map((item) =>
                            item.id === c.id
                              ? { ...item, channelUrl: e.target.value }
                              : item
                          )
                        )
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Bio / Deskripsi Singkat
                  </label>
                  <textarea
                    rows={2}
                    value={c.bio}
                    onChange={(e) =>
                      updateCreators(
                        creators.map((item) =>
                          item.id === c.id ? { ...item, bio: e.target.value } : item
                        )
                      )
                    }
                    className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                  />
                </div>

                <ImageField
                  label="Foto / Thumbnail Creator"
                  value={c.photo}
                  acceptMedia="image"
                  allowClear
                  onChange={(url) =>
                    updateCreators(
                      creators.map((item) =>
                        item.id === c.id ? { ...item, photo: url } : item
                      )
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
