# 📋 Panduan Setup - Kasir App

Panduan step-by-step untuk setup aplikasi kasir dari awal.

## 🔧 Langkah 1: Install Dependencies

```bash
npm install
```

Dependencies yang akan diinstall:
- **@prisma/client**: ORM untuk database
- **next-auth**: Authentication
- **bcrypt**: Password hashing
- **react-hook-form + zod**: Form validation
- **shadcn/ui components**: UI library
- **lucide-react**: Icons
- **recharts**: Charts untuk laporan
- Dan lain-lain...

## 🗄️ Langkah 2: Setup Database

### 2.1. Buat Database MySQL

```sql
CREATE DATABASE kasir_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.2. Konfigurasi .env

Copy file `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit `.env` dan sesuaikan dengan database Anda:

```env
DATABASE_URL="mysql://root:password@localhost:3306/kasir_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-dengan-openssl-rand-base64-32"
```

**Generate NEXTAUTH_SECRET:**

```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Linux/Mac
openssl rand -base64 32
```

### 2.3. Push Schema ke Database

```bash
npm run db:generate
npm run db:push
```

### 2.4. Seed Database (Optional)

```bash
npm run seed
```

Ini akan membuat:
- 2 user (admin & kasir)
- 3 kategori produk
- 7 produk sample
- Settings default

## 🎨 Langkah 3: Setup shadcn/ui

shadcn/ui sudah dikonfigurasi di `components.json`. Sekarang install komponen yang dibutuhkan:

```bash
# Install komponen dasar
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add form
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add toast
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group

# Atau install sekaligus (perlu konfirmasi)
npx shadcn@latest add
```

## 🚀 Langkah 4: Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📝 Langkah 5: Login

Gunakan kredensial default:

**Admin:**
- Email: `admin@kasir.com`
- Password: `admin123`

**Kasir:**
- Email: `cashier@kasir.com`
- Password: `cashier123`

## ✅ Checklist Setup

- [ ] Dependencies terinstall (`npm install`)
- [ ] Database MySQL/MariaDB sudah dibuat
- [ ] File `.env` sudah dikonfigurasi
- [ ] Schema database sudah di-push (`npm run db:push`)
- [ ] Database sudah di-seed (`npm run seed`)
- [ ] shadcn/ui components sudah terinstall
- [ ] Development server berjalan (`npm run dev`)
- [ ] Bisa login dengan kredensial default

## 🔍 Troubleshooting

### Error: Can't reach database server

**Solusi:**
- Pastikan MySQL/MariaDB sudah running
- Cek kredensial di `DATABASE_URL`
- Pastikan database `kasir_db` sudah dibuat

### Error: Module not found

**Solusi:**
```bash
# Hapus node_modules dan install ulang
rm -rf node_modules package-lock.json
npm install
```

### Error: Prisma Client did not initialize yet

**Solusi:**
```bash
npm run db:generate
```

### Error: NextAuth session not found

**Solusi:**
- Pastikan `NEXTAUTH_SECRET` sudah di-set di `.env`
- Restart development server

## 📚 Langkah Selanjutnya

Setelah setup berhasil, Anda bisa:

1. **Customize UI**
   - Edit theme di `tailwind.config.ts`
   - Modify components di `src/components/`

2. **Tambah Fitur**
   - Lihat `STRUKTUR_FOLDER.md` untuk struktur project
   - Buat API routes di `src/app/api/`
   - Buat pages di `src/app/(dashboard)/`

3. **Database Management**
   - Buka Prisma Studio: `npm run db:studio`
   - Create migration: `npx prisma migrate dev --name [migration-name]`

4. **Development**
   - Edit schema di `prisma/schema.prisma`
   - Buat components di `src/components/`
   - Test di development server

## 🎯 Fitur yang Harus Dibangun

Struktur folder sudah siap! Sekarang tinggal implement:

### 1. Authentication (Priority: HIGH)
- [ ] Login page (`src/app/(auth)/login/page.tsx`)
- [ ] NextAuth configuration (`src/lib/auth.ts`)
- [ ] API auth route (`src/app/api/auth/[...nextauth]/route.ts`)

### 2. Dashboard (Priority: HIGH)
- [ ] Dashboard layout (`src/app/(dashboard)/layout.tsx`)
- [ ] Dashboard page (`src/app/(dashboard)/dashboard/page.tsx`)
- [ ] Sidebar component (`src/components/dashboard/Sidebar.tsx`)
- [ ] TopBar component (`src/components/dashboard/TopBar.tsx`)

### 3. Products (Priority: HIGH)
- [ ] Product list page
- [ ] Product form (create/edit)
- [ ] Product API routes
- [ ] Product components

### 4. POS/Transactions (Priority: HIGH)
- [ ] POS interface
- [ ] Cart management
- [ ] Payment modal
- [ ] Transaction API routes

### 5. Reports (Priority: MEDIUM)
- [ ] Sales report page
- [ ] Charts components
- [ ] Report API routes

### 6. Users (Priority: MEDIUM)
- [ ] User management page (Admin only)
- [ ] User API routes

### 7. Settings (Priority: LOW)
- [ ] Settings page
- [ ] Settings API routes

## 💡 Tips

1. **Mulai dari Authentication** - Ini adalah fondasi aplikasi
2. **Gunakan shadcn/ui** - Jangan buat komponen UI dari nol
3. **Follow Struktur Folder** - Tetap konsisten dengan struktur yang sudah dibuat
4. **Test di Prisma Studio** - Untuk debug database
5. **Gunakan TypeScript** - Untuk type safety
6. **Validate Input** - Gunakan Zod schemas yang sudah dibuat

## 🎓 Learning Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Quickstart](https://www.prisma.io/docs/getting-started/quickstart)
- [NextAuth.js Guide](https://next-auth.js.org/getting-started/example)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)

---

**Selamat coding! 🚀**
