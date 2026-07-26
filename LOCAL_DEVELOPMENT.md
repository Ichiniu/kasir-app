# Local Development

Gunakan panduan ini untuk menjalankan project di laptop/PC lokal.

## 1. Buat File Env Lokal

Copy `.env.example` menjadi `.env`.

```bash
cp .env.example .env
```

Default env lokal memakai:

```text
App URL: http://localhost:3000
Database: postgresql://kasir_user:kasir_password_secret@localhost:5432/kasir_db
```

## 2. Jalankan PostgreSQL Lokal via Docker

```bash
docker compose up -d postgres
```

Kalau port `5432` di mesin lokal sudah dipakai, ubah ini di `.env`:

```env
POSTGRES_PORT="5433"
DATABASE_URL="postgresql://kasir_user:kasir_password_secret@localhost:5433/kasir_db?schema=public"
```

## 3. Setup Database

```bash
npm install
npm run db:generate
npm run db:push
npm run seed
```

## 4. Jalankan App Lokal

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

## Login Default

```text
Admin
Email: admin@admin.com
Password: admin123

Kasir
Email: kasir@kasir.com
Password: cashier123
```

## Catatan Server

Server tidak harus memakai `.env` lokal. Untuk server, pakai nilai dari `.env.server.example`, terutama:

```text
BETTER_AUTH_URL=https://casirplus.my.id
NEXTAUTH_URL=https://casirplus.my.id
NEXT_PUBLIC_APP_URL=https://casirplus.my.id
APP_PORT=3003
```
