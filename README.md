# Godlike Novus — Official Website & Admin CMS

Website resmi **Godlike Novus** berbasis **Next.js (App Router + TypeScript + Tailwind CSS)** lengkap dengan panel admin dinamis (`/admin`), multi-foto/video ala Instagram, urutan section & menu admin drag-and-drop, serta penyimpanan data berbasis file JSON + folder upload lokal.

---

## Struktur Folder Project

```text
godlikenovus/
├── app/                         # Halaman Next.js (/, /admin) & API Routes (/api/*)
├── components/
│   ├── admin/                   # Panel Admin (Dashboard, Login, MultiMedia, Drag & Drop)
│   └── public/                  # Tampilan Publik (Hero, Roster, BA, Gallery, Store, Modal)
├── data/
│   ├── site-data.json           # Data konten website (tersync ke GitHub)
│   └── admin-users.json         # Akun login admin (DI-IGNORE GitHub demi keamanan)
├── public/
│   └── uploads/                 # File foto/video yang diupload dari panel admin
├── backups/                     # Folder backup lokal (DI-IGNORE GitHub)
│   └── YYYY-MM-DD/              # Snapshot data/, uploads/, dan arsip .tar.gz
├── Dockerfile                   # Build image production mandiri
├── docker-compose.yml           # Compose untuk Docker Swarm + NFS (server CasaOS saat ini)
└── docker-compose.standalone.yml # Compose mandiri untuk VPS / Docker biasa / Portainer
```

---

## Menjalankan di Lokal (Development)

```bash
npm install
npm run dev
```

Buka di browser:
- Website publik: `http://localhost:3000`
- Panel admin: `http://localhost:3000/admin`

---

## 1. Cara Push Perubahan ke Repo GitHub

Setiap kali selesai mengedit kode atau sinkronisasi data di lokal, jalankan langkah berikut di terminal:

### A. Push Rutin (Repo Sudah Terhubung)

```bash
# 1. Masuk ke folder project
cd /Users/brobroriel/.gemini/antigravity/scratch/godlikenovus

# 2. Cek file apa saja yang berubah
git status

# 3. Masukkan semua perubahan ke staging
git add -A

# 4. Buat commit dengan pesan yang jelas
git commit -m "feat: deskripsi singkat perubahan"

# 5. Kirim (push) ke GitHub branch main
git push origin main
```

### B. Jika Ingin Push ke Repo GitHub Baru (Dari Awal)

```bash
git init
git branch -M main
git remote add origin https://github.com/<USERNAME>/<NAMA-REPO>.git
git add -A
git commit -m "initial commit"
git push -u origin main
```

> **Catatan Keamanan (`.gitignore`):**
> File `data/admin-users.json`, folder `backups/`, `.env*`, dan isi `public/uploads/*` otomatis **tidak ikut ter-push ke GitHub** agar password hash admin dan file media berukuran besar tetap aman.

---

## 2. Cara Deploy di Docker **Tanpa Portainer** (CLI)

### Opsi A — Docker Compose Biasa (VPS / Server Tunggal / Laptop)

Cocok jika kamu deploy di satu server tanpa NFS/Swarm.

```bash
# 1. Clone repo di server
git clone https://github.com/murakumo512/godlikenovus.git
cd godlikenovus

# 2. Pastikan folder data & uploads tersedia (agar data/foto tidak hilang saat rebuild)
mkdir -p data public/uploads

# 3. Build image dan jalankan di background
docker compose -f docker-compose.standalone.yml up -d --build

# 4. Cek status & log container
docker ps
docker logs -f godlikenovus_web
```

Website akan jalan di `http://<IP-SERVER>:8088`.

**Cara update setelah ada push baru di GitHub:**
```bash
cd godlikenovus
git pull origin main
docker compose -f docker-compose.standalone.yml up -d --build
```
> Karena `./data` dan `./public/uploads` di-mount sebagai volume, semua foto dan konten yang sudah kamu upload **tidak akan hilang** saat rebuild.

---

### Opsi B — Docker Swarm + NFS (Setup Server CasaOS Saat Ini)

Jika menggunakan arsitektur Docker Swarm dengan volume NFS (seperti di `docker-compose.yml`):

```bash
# 1. Deploy stack pertama kali di node Swarm manager
docker stack deploy -c docker-compose.yml godlikenovus

# 2. Cek status service
docker service ls
docker service ps godlikenovus_web

# 3. Jika update kode di folder NFS (/home/godlikenovus/app), build dulu lalu force update:
docker run --rm \
  -v /home/godlikenovus/app:/app \
  -v /home/godlikenovus/data:/app/data \
  -v /home/godlikenovus/uploads:/app/public/uploads \
  -w /app node:22-alpine npm run build

docker service update --force godlikenovus_web
```

---

## 3. Cara Deploy di Docker **Pakai Portainer**

### Cara 1: Deploy Langsung dari GitHub Repository (Paling Praktis)

1. Buka dashboard **Portainer** → pilih Environment (**local** atau **Swarm**).
2. Di menu kiri, klik **Stacks** → klik tombol **+ Add stack**.
3. Isi **Name**, misalnya: `godlikenovus`.
4. Pada **Build method**, pilih **Repository**.
5. Isi detail repo:
   - **Repository URL:** `https://github.com/murakumo512/godlikenovus.git`
   - **Repository reference:** `refs/heads/main`
   - **Compose path:**
     - Isi `docker-compose.standalone.yml` (jika server biasa / non-Swarm)
     - Atau `docker-compose.yml` (jika Docker Swarm + NFS)
6. (Opsional) Aktifkan **GitOps updates** jika ingin Portainer otomatis pull & redeploy saat ada commit baru di GitHub.
7. Klik **Deploy the stack**.

### Cara 2: Paste Manual via Web Editor di Portainer

1. Buka **Portainer** → **Stacks** → **+ Add stack**.
2. Isi **Name**: `godlikenovus`.
3. Pilih **Build method**: **Web editor**.
4. Copy-paste isi file [`docker-compose.yml`](./docker-compose.yml) (untuk Swarm + NFS) atau [`docker-compose.standalone.yml`](./docker-compose.standalone.yml) (untuk server tunggal).
   - **Penting untuk mode Standalone di Web Editor:** Ganti path volume `./data` dan `./public/uploads` menjadi path absolut di server, misalnya:
     ```yaml
     volumes:
       - /home/godlikenovus/data:/app/data
       - /home/godlikenovus/uploads:/app/public/uploads
     ```
5. Klik **Deploy the stack**.

### Cara Update / Redeploy di Portainer
- Masuk ke **Stacks** → klik `godlikenovus` → klik **Pull and redeploy** (atau **Update the stack** jika edit dari Web editor).
- Data di `/app/data` dan foto di `/app/public/uploads` tetap aman selama volume-nya tidak dihapus.

---

## 4. Backup & Restore Data

Backup tersimpan di folder lokal `backups/YYYY-MM-DD/` berisi:
- `data/site-data.json` (seluruh teks, roster, BA, gallery, store, urutan section & menu admin)
- `data/admin-users.json` (akun & password admin)
- `uploads/` (seluruh foto & video yang diupload)
- `godlikenovus-live-backup-YYYY-MM-DD.tar.gz` (arsip lengkap siap restore)

**Cara restore arsip backup ke server:**
```bash
tar -xzf godlikenovus-live-backup-YYYY-MM-DD.tar.gz -C /home/godlikenovus/
```
