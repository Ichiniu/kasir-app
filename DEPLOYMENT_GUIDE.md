# 🚀 Panduan Deployment Production - Kasir App

Panduan ini berisi langkah-langkah menyiapkan dan menjalankan **Kasir App** di server **Ubuntu Server 24.04** menggunakan **Docker Compose**, **PostgreSQL**, **Nginx Proxy Manager**, dan **Cloudflare Tunnel**.

---

## 🛠️ 1. Persyaratan Server (Prerequisites)

Pastikan paket berikut sudah terinstall di server Ubuntu 24.04:
- **Docker Engine** & **Docker Compose** (`docker compose version`)
- **Git**
- **Cloudflare Tunnel** / **Nginx Proxy Manager**

---

## ⚙️ 2. Langkah Instalasi Awal Server (First-Time Setup)

### Step 1: Clone Repository
```bash
git clone https://github.com/username/kasir-app.git
cd kasir-app
```

### Step 2: Buat File `.env` Production
Salin dari `.env.example` lalu sesuaikan isinya:
```bash
cp .env.example .env
nano .env
```

Isi variabel penting:
```env
DATABASE_URL="postgresql://kasir_user:password_rahasia_db@postgres:5432/kasir_db?schema=public"
POSTGRES_USER="kasir_user"
POSTGRES_PASSWORD="password_rahasia_db"
POSTGRES_DB="kasir_db"

BETTER_AUTH_SECRET="buat-secret-key-acak-dengan-openssl"
BETTER_AUTH_URL="https://kasir.domainanda.com"
NEXTAUTH_URL="https://kasir.domainanda.com"
NEXTAUTH_SECRET="buat-secret-key-acak-dengan-openssl"
NEXT_PUBLIC_APP_URL="https://kasir.domainanda.com"

MIDTRANS_SERVER_KEY="Mid-server-xxxx"
MIDTRANS_CLIENT_KEY="Mid-client-xxxx"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="Mid-client-xxxx"
MIDTRANS_IS_PRODUCTION="true"
```

### Step 3: Jalankan Docker Compose
```bash
docker compose up -d --build
```

### Step 4: Jalankan Migrasi Database Pertama Kali
```bash
docker exec kasir_nextjs npx prisma migrate deploy
```

*(Opsional)* Seeding Data Awal (User Admin & Default Categories):
```bash
docker exec kasir_nextjs npx tsx prisma/seed.ts
```

---

## 🔄 3. Workflow Migrasi Database (Prisma)

- **Di Komputer Development (Lokal)**:
  Saat membuat/mengubah schema `prisma/schema.prisma`:
  ```bash
  npx prisma migrate dev --name <nama_migrasi>
  ```
  *Commit folder `prisma/migrations` ke Git repository.*

- **Di Server Production**:
  Jangan jalankan `migrate dev` di server! Selalu gunakan script deploy atau jalankan:
  ```bash
  docker exec kasir_nextjs npx prisma migrate deploy
  ```

---

## 🛡️ 4. Konfigurasi Nginx Proxy Manager & Cloudflare Tunnel

1. **Routing Nginx Proxy Manager / Cloudflare Tunnel**:
   - Forward traffic HTTPS domain `https://kasir.domainanda.com` ke container host port **`3000`** (`http://localhost:3000` atau `http://kasir_nextjs:3000`).
2. **Endpoint Webhook Midtrans**:
   - URL Notification Midtrans di Dashboard Midtrans: `https://kasir.domainanda.com/api/payment/webhook`.

---

## 📂 5. Manajemen Storage / File Upload

- File upload publik atau sertifikat tersimpan dalam Docker Volume atau lokasi persisten `/public/uploads` di server host.
- Seluruh data transaksi & audit log tersimpan aman di Docker Volume PostgreSQL (`postgres_data`).

---

## 🔁 6. Prosedur Deploy Ulang & Rollback

### Manual Deploy:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Prosedur Rollback jika Build / Deploy Gagal:
1. Revert commit ke versi stabil sebelumnya:
   ```bash
   git reset --hard HEAD~1
   ```
2. Build dan jalankan ulang container:
   ```bash
   docker compose up -d --build
   ```
