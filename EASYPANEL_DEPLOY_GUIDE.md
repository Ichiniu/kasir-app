# 🚀 Panduan Deploy Kasir App ke Easypanel

Panduan singkat dan praktis untuk deploy Kasir App ke VPS via Easypanel.

---

## 📋 Langkah 1: Buat Project & Database di Easypanel

1. Buka dashboard **Easypanel** Anda.
2. Klik **New Project** $\rightarrow$ Beri nama, misalnya `kasir-app`.
3. Di dalam project, klik **+ Service** $\rightarrow$ Pilih **Database** $\rightarrow$ Pilih **PostgreSQL**.
4. Beri nama service: `postgres`.
5. Catat kredensial database yang muncul di tab **General**:
   - **User**: (default: `postgres`)
   - **Password**: (tersedia di tab General/Environment)
   - **Database**: (default: `postgres`)
   - **Port internal**: `5432`

---

## 📦 Langkah 2: Buat Service Aplikasi (Next.js)

1. Di project yang sama, klik **+ Service** $\rightarrow$ Pilih **App**.
2. Beri nama service: `app` (atau `kasir-web`).
3. Di bagian **Source**:
   - Pilih **GitHub** (atau Git Repository Anda).
   - Masukkan repository URL dan pilih branch (`master` atau `main`).
4. Di bagian **Build**:
   - Build Type: **Dockerfile**
   - Dockerfile Path: `Dockerfile`
   - Context: `.`
5. Di bagian **Ports**:
   - Masukkan Port: `3000`

---

## 🔑 Langkah 3: Masukkan Environment Variables

Buka tab **Environment** pada Service App, lalu copy-paste konfigurasi berikut (sesuaikan password & domain):

```env
DATABASE_URL=postgresql://postgres:PASSWORD_DARI_EASYPANEL@postgres:5432/postgres?schema=public
BETTER_AUTH_SECRET=buat_random_string_32_karakter_bebas
BETTER_AUTH_URL=https://kasir.domainanda.com
NEXTAUTH_SECRET=buat_random_string_32_karakter_bebas
NEXTAUTH_URL=https://kasir.domainanda.com
NEXT_PUBLIC_APP_URL=https://kasir.domainanda.com
NEXT_PUBLIC_APP_NAME=Kasir Digital
NODE_ENV=production
PORT=3000
```

> **Tips:**
> - Ubah `PASSWORD_DARI_EASYPANEL` dengan password dari service postgres.
> - Host `@postgres:5432` menggunakan nama service database di Easypanel.
> - Ubah `https://kasir.domainanda.com` sesuai domain Anda.

---

## 🌐 Langkah 4: Hubungkan Domain

1. Buka tab **Domains** pada Service App.
2. Tambahkan domain Anda, misalnya: `kasir.domainanda.com`.
3. Arahkan DNS Record (A Record) di Cloudflare/DNS provider Anda ke IP VPS Easypanel.
4. Easypanel akan otomatis menerbitkan sertifikat SSL (Let's Encrypt).

---

## 💾 Langkah 5 (Opsional): Persistent Storage untuk Uploads

Jika ingin file upload gambar/logo tidak hilang saat redeploy:
1. Buka tab **Storage** / **Mounts** pada Service App.
2. Tambahkan Volume:
   - **Host Path** / **Volume**: `kasir_uploads`
   - **Mount Path**: `/app/public/uploads`

---

## 🚀 Langkah 6: Deploy!

1. Klik tombol **Deploy** di pojok kanan atas.
2. Cek tab **Deployments** / **Logs**:
   - Script startup otomatis mendeteksi database.
   - Menjalankan migrasi Prisma (`migrate deploy`).
   - Melakukan seeding data awal jika database masih baru.
   - Menjalankan Next.js server pada port 3000.
3. Buka domain Anda, Kasir App sudah siap digunakan!
   - Akun default awal: `superadmin@admin.com` / `superadmin123`.
