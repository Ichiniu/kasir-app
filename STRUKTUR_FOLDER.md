# Struktur Folder - Website Kasir (POS System)

## Tech Stack
- **Frontend**: Next.js 15 (App Router)
- **Auth & Role**: NextAuth.js
- **Database**: MySQL/MariaDB
- **ORM**: Prisma
- **UI**: Tailwind CSS + shadcn/ui

## Struktur Direktori

```
kasir-app/
├── .git/                          # Git repository
├── .next/                         # Next.js build output
├── node_modules/                  # Dependencies
│
├── prisma/                        # Prisma ORM
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
│   └── seed.ts                   # Database seeder
│
├── public/                        # Static assets
│   ├── images/                   # Images
│   ├── icons/                    # Icons
│   └── favicon.ico               # Favicon
│
├── src/                          # Source code
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Auth route group (tanpa layout dashboard)
│   │   │   ├── login/           # Login page
│   │   │   │   └── page.tsx
│   │   │   └── register/        # Register page (optional)
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/         # Dashboard route group (dengan layout dashboard)
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   │   └── page.tsx
│   │   │   ├── products/        # Product management
│   │   │   │   ├── page.tsx     # List products
│   │   │   │   ├── add/         # Add product
│   │   │   │   └── [id]/        # Edit product
│   │   │   ├── transactions/    # Transaction/Sales
│   │   │   │   ├── page.tsx     # Transaction page (POS)
│   │   │   │   └── history/     # Transaction history
│   │   │   ├── reports/         # Reports
│   │   │   │   ├── page.tsx     # Reports overview
│   │   │   │   ├── sales/       # Sales reports
│   │   │   │   └── inventory/   # Inventory reports
│   │   │   ├── users/           # User management (Admin only)
│   │   │   │   ├── page.tsx     # List users
│   │   │   │   └── [id]/        # Edit user
│   │   │   ├── settings/        # Settings
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx       # Dashboard layout (sidebar, header)
│   │   │
│   │   ├── api/                 # API Routes
│   │   │   ├── auth/            # Auth endpoints
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts # NextAuth configuration
│   │   │   ├── products/        # Product endpoints
│   │   │   │   ├── route.ts     # GET, POST
│   │   │   │   └── [id]/        # GET, PUT, DELETE by ID
│   │   │   ├── transactions/    # Transaction endpoints
│   │   │   │   ├── route.ts     # GET, POST
│   │   │   │   └── [id]/        # GET by ID
│   │   │   ├── users/           # User endpoints
│   │   │   │   ├── route.ts     # GET, POST
│   │   │   │   └── [id]/        # GET, PUT, DELETE
│   │   │   └── reports/         # Report endpoints
│   │   │       ├── sales/
│   │   │       └── inventory/
│   │   │
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Homepage (redirect to dashboard/login)
│   │   └── globals.css          # Global styles
│   │
│   ├── components/              # React Components
│   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...              # Other shadcn components
│   │   │
│   │   ├── auth/                # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── dashboard/           # Dashboard components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── RecentTransactions.tsx
│   │   │
│   │   ├── products/            # Product components
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProductFilter.tsx
│   │   │
│   │   ├── transactions/        # Transaction components
│   │   │   ├── POSInterface.tsx
│   │   │   ├── CartItem.tsx
│   │   │   ├── PaymentModal.tsx
│   │   │   └── TransactionHistory.tsx
│   │   │
│   │   ├── reports/             # Report components
│   │   │   ├── SalesChart.tsx
│   │   │   ├── ReportTable.tsx
│   │   │   └── DateRangePicker.tsx
│   │   │
│   │   └── shared/              # Shared components
│   │       ├── Loading.tsx
│   │       ├── ErrorMessage.tsx
│   │       ├── Pagination.tsx
│   │       └── SearchBar.tsx
│   │
│   ├── lib/                     # Library & utilities
│   │   ├── prisma.ts            # Prisma client instance
│   │   ├── auth.ts              # Auth configuration (NextAuth)
│   │   └── utils.ts             # Utility functions (cn, etc)
│   │
│   ├── types/                   # TypeScript types
│   │   ├── index.ts             # Common types
│   │   ├── product.ts           # Product types
│   │   ├── transaction.ts       # Transaction types
│   │   └── user.ts              # User types
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts           # Authentication hook
│   │   ├── useProducts.ts       # Product data hook
│   │   └── useTransactions.ts   # Transaction data hook
│   │
│   ├── utils/                   # Utility functions
│   │   ├── format.ts            # Formatting helpers (currency, date)
│   │   └── validation.ts        # Validation schemas (Zod)
│   │
│   ├── config/                  # Configuration files
│   │   └── constants.ts         # App constants
│   │
│   └── middleware.ts            # Next.js middleware (auth protection)
│
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── components.json              # shadcn/ui configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies
├── postcss.config.mjs           # PostCSS configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # Project documentation
```

## Penjelasan Struktur

### 1. **prisma/**
Berisi konfigurasi database dan schema Prisma
- `schema.prisma`: Definisi model database (User, Product, Transaction, dll)
- `migrations/`: History perubahan database
- `seed.ts`: Data awal untuk development

### 2. **src/app/**
Menggunakan App Router Next.js 13+

#### Route Groups:
- **(auth)**: Group untuk halaman authentication tanpa dashboard layout
- **(dashboard)**: Group untuk halaman yang menggunakan dashboard layout

#### API Routes:
- Semua endpoint REST API
- NextAuth configuration di `/api/auth/[...nextauth]`

### 3. **src/components/**
Komponen React yang reusable

- **ui/**: Komponen dari shadcn/ui
- **auth/**: Komponen untuk authentication
- **dashboard/**: Komponen untuk dashboard
- **products/**: Komponen untuk manajemen produk
- **transactions/**: Komponen untuk transaksi (POS)
- **reports/**: Komponen untuk laporan
- **shared/**: Komponen yang digunakan di berbagai tempat

### 4. **src/lib/**
Library dan konfigurasi utilities
- Prisma client
- NextAuth configuration
- Helper functions

### 5. **src/types/**
TypeScript type definitions untuk type safety

### 6. **src/hooks/**
Custom React hooks untuk logic yang reusable

### 7. **src/utils/**
Utility functions (formatting, validation, dll)

## Environment Variables (.env)

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/kasir_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Fitur Utama

### 1. **Authentication & Authorization**
- Login/Logout dengan NextAuth
- Role-based access (Admin, Kasir)
- Protected routes dengan middleware

### 2. **Dashboard**
- Overview statistik penjualan
- Grafik penjualan
- Transaksi terbaru

### 3. **Manajemen Produk**
- CRUD produk
- Kategori produk
- Stock management
- Upload gambar produk

### 4. **Transaksi (POS)**
- Interface kasir untuk transaksi
- Pencarian produk cepat
- Keranjang belanja
- Multiple payment methods
- Print receipt

### 5. **History Transaksi**
- Daftar semua transaksi
- Filter berdasarkan tanggal, status
- Detail transaksi

### 6. **Laporan**
- Laporan penjualan (harian, bulanan, tahunan)
- Laporan inventory
- Laporan best selling products
- Export ke PDF/Excel

### 7. **User Management** (Admin only)
- CRUD users
- Assign roles
- User permissions

### 8. **Settings**
- Pengaturan toko (nama, alamat, logo)
- Pengaturan receipt template
- Pengaturan pajak

## Database Models (Prisma)

Models yang dibutuhkan:
- **User**: Pengguna sistem (admin, kasir)
- **Product**: Produk yang dijual
- **Category**: Kategori produk
- **Transaction**: Transaksi penjualan
- **TransactionItem**: Item dalam transaksi
- **Payment**: Pembayaran transaksi

## Instalasi Dependencies

```bash
# Core dependencies
npm install next@latest react react-dom

# Database & ORM
npm install @prisma/client
npm install -D prisma

# Authentication
npm install next-auth bcrypt
npm install -D @types/bcrypt

# UI Library
npm install tailwindcss postcss autoprefixer
npx shadcn-ui@latest init

# Form & Validation
npm install react-hook-form zod @hookform/resolvers

# Utils
npm install date-fns clsx tailwind-merge

# Charts (untuk reports)
npm install recharts

# Icons
npm install lucide-react

# State Management (optional)
npm install zustand
```

## Next Steps

1. **Setup Prisma**
   ```bash
   npx prisma init
   npx prisma generate
   npx prisma db push
   ```

2. **Setup shadcn/ui**
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button input card table dialog
   ```

3. **Configure NextAuth**
   - Setup auth configuration di `src/lib/auth.ts`
   - Create API route di `src/app/api/auth/[...nextauth]/route.ts`

4. **Create Database Schema**
   - Design schema di `prisma/schema.prisma`
   - Run migrations

5. **Build Components**
   - Mulai dari komponen UI dasar
   - Lalu komponen fitur spesifik

6. **Implement Features**
   - Authentication first
   - Lalu fitur-fitur utama (Products, Transactions, dll)

## Notes

- Gunakan TypeScript untuk type safety
- Implement proper error handling
- Add loading states untuk UX yang lebih baik
- Implement optimistic updates untuk performa
- Add data validation di client dan server side
- Implement proper authorization checks
- Add proper logging untuk debugging
