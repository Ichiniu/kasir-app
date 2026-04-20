# 🏪 Kasir App - Modern POS System

Aplikasi Point of Sale (POS) / Kasir modern yang dibangun dengan Next.js 15, Prisma ORM, MySQL, dan shadcn/ui.

## ✨ Fitur Utama

- ✅ **Authentication & Authorization** - Login dengan NextAuth + role-based access (Admin & Kasir)
- 📦 **Manajemen Produk** - CRUD produk dengan kategori, upload gambar, dan stock management
- 💰 **Point of Sale (POS)** - Interface kasir yang intuitif untuk transaksi cepat
- 📊 **Dashboard** - Overview penjualan dengan grafik dan statistik
- 📝 **History Transaksi** - Riwayat transaksi lengkap dengan filter dan pencarian
- 📈 **Laporan** - Laporan penjualan dan inventory (harian, bulanan, tahunan)
- 👥 **User Management** - Kelola user dan role (Admin only)
- ⚙️ **Settings** - Konfigurasi toko dan aplikasi

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Database**: MySQL / MariaDB
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Form Validation**: Zod + React Hook Form
- **Charts**: Recharts
- **Icons**: Lucide React

## 📁 Struktur Folder

Lihat file `STRUKTUR_FOLDER.md` untuk dokumentasi lengkap struktur folder.

## 🛠️ Instalasi

### Prerequisites

- Node.js 18+ 
- MySQL / MariaDB
- npm atau yarn atau pnpm

### 1. Clone Repository

```bash
git clone <repository-url>
cd kasir-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit file `.env` dan sesuaikan dengan konfigurasi Anda:

```env
DATABASE_URL="mysql://user:password@localhost:3306/kasir_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 4. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database
npx prisma db push

# (Optional) Seed database dengan data dummy
npm run seed
```

### 5. Setup shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Install komponen yang dibutuhkan
npx shadcn@latest add button input card table dialog select badge avatar dropdown-menu form label textarea toast checkbox radio-group
```

### 6. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 📦 Instalasi Dependencies Lengkap

```bash
# Core
npm install next@latest react react-dom

# Database & ORM
npm install @prisma/client
npm install -D prisma

# Authentication
npm install next-auth bcrypt
npm install -D @types/bcrypt

# UI & Styling
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Utils
npm install date-fns

# Charts
npm install recharts

# State Management (optional)
npm install zustand
```

## 🗄️ Database Schema

Database schema mencakup:

- **Users** - Data user dan role
- **Categories** - Kategori produk
- **Products** - Data produk
- **Transactions** - Data transaksi
- **TransactionItems** - Detail item transaksi
- **Settings** - Pengaturan aplikasi

Lihat `prisma/schema.prisma` untuk detail lengkap.

## 🔐 Kredensial Default

Setelah menjalankan seed, Anda bisa login dengan:

**Admin:**
- Email: `admin@kasir.com`
- Password: `admin123`

**Kasir:**
- Email: `cashier@kasir.com`
- Password: `cashier123`

## 📝 Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Prisma commands
npx prisma studio          # Open Prisma Studio
npx prisma generate        # Generate Prisma Client
npx prisma db push         # Push schema to database
npx prisma db seed         # Seed database
npx prisma migrate dev     # Create migration

# Linting
npm run lint
```

## 🏗️ Workflow Development

### 1. Membuat Fitur Baru

1. Buat schema di `prisma/schema.prisma` (jika perlu)
2. Buat API route di `src/app/api/[feature]/`
3. Buat page di `src/app/(dashboard)/[feature]/`
4. Buat components di `src/components/[feature]/`
5. Tambahkan types di `src/types/`

### 2. Menambah Komponen UI

```bash
# Cek komponen yang tersedia
npx shadcn@latest add

# Install komponen tertentu
npx shadcn@latest add [component-name]
```

### 3. Database Migration

```bash
# Setelah mengubah schema.prisma
npx prisma migrate dev --name [migration-name]

# Apply migration ke production
npx prisma migrate deploy
```

## 🎨 Customization

### Mengubah Theme

Edit `tailwind.config.ts` untuk mengubah color palette dan theme.

### Mengubah Logo & Branding

1. Ganti logo di `public/`
2. Update konstanta di `src/config/constants.ts`
3. Update settings di database

## 📱 API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get session

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product detail
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/[id]` - Get transaction detail

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/inventory` - Inventory report

## 🔒 Security

- Password di-hash menggunakan bcrypt
- JWT token untuk session management
- Protected API routes dengan NextAuth
- Role-based access control (RBAC)
- Input validation dengan Zod
- SQL injection prevention dengan Prisma

## 🚀 Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project di Vercel
3. Set environment variables
4. Deploy

### Manual Deployment

```bash
# Build
npm run build

# Start production server
npm start
```

Pastikan:
- Database sudah di-setup
- Environment variables sudah di-set
- Prisma client sudah di-generate

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Author

Created with ❤️ for modern businesses

## 🐛 Bug Reports

Jika menemukan bug, silakan buat issue di GitHub repository.

## 💡 Feature Requests

Punya ide fitur baru? Buat issue dengan label "feature request".

---

**Happy Coding! 🚀**
