# 🗄️ Panduan Setup Database MySQL untuk Kasir App

## ⚠️ Error yang Terjadi

```
Error: P1000: Authentication failed against database server
```

Artinya: Kredensial database di `.env` tidak sesuai dengan setup MySQL Anda.

## ✅ Solusi: Update File .env

### Langkah 1: Cek Kredensial MySQL Anda

Anda perlu tahu:
- **Username MySQL** (biasanya `root`)
- **Password MySQL** (yang Anda set saat install MySQL)
- **Host** (biasanya `localhost`)
- **Port** (biasanya `3306`)

### Langkah 2: Buat Database (Jika Belum Ada)

Buka MySQL command line atau MySQL Workbench, lalu jalankan:

```sql
CREATE DATABASE kasir_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Langkah 3: Update File .env

Edit file `.env` di root project, ubah baris `DATABASE_URL`:

#### **Format:**
```env
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/kasir_db"
```

#### **Contoh-contoh:**

**Jika password root adalah "admin123":**
```env
DATABASE_URL="mysql://root:admin123@localhost:3306/kasir_db"
```

**Jika MySQL tanpa password (XAMPP default):**
```env
DATABASE_URL="mysql://root:@localhost:3306/kasir_db"
```

**Jika port MySQL custom (misal 3307):**
```env
DATABASE_URL="mysql://root:password@localhost:3307/kasir_db"
```

**Jika pakai user custom (bukan root):**
```env
DATABASE_URL="mysql://myuser:mypassword@localhost:3306/kasir_db"
```

### Langkah 4: Test Koneksi Database

Setelah update `.env`, jalankan:

```bash
npx prisma db push
```

Jika berhasil, Anda akan melihat:

```
✔ Database synchronized with Prisma schema.
```

## 📋 Checklist Troubleshooting

- [ ] MySQL/MariaDB sudah terinstall dan running
- [ ] Database `kasir_db` sudah dibuat
- [ ] Username dan password di `.env` sudah benar
- [ ] Port MySQL sudah benar (cek di MySQL config)
- [ ] Firewall tidak memblokir koneksi ke MySQL

## 🔍 Cara Cek MySQL Running

**Windows (PowerShell):**
```powershell
# Cek service MySQL
Get-Service -Name MySQL* | Select-Object Name, Status

# Atau cek port 3306
Test-NetConnection -ComputerName localhost -Port 3306
```

**Cek versi MySQL:**
```bash
mysql --version
```

## 🚀 Setelah Database Tersambung

Setelah berhasil `npx prisma db push`, lanjutkan dengan:

### 1. Seed Database
```bash
npm run seed
```

Ini akan membuat:
- 2 users (admin & kasir)
- 3 categories
- 7 sample products
- Default settings

### 2. Verifikasi dengan Prisma Studio
```bash
npx prisma studio
```

Akan membuka UI di browser untuk melihat data database.

## 💡 Tips

1. **XAMPP Users**: Biasanya MySQL di XAMPP tidak pakai password, jadi:
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/kasir_db"
   ```

2. **Laragon Users**: Cek password di Laragon settings

3. **MySQL Workbench Users**: Gunakan kredensial yang sama dengan workbench

4. **Jika masih error**, coba test koneksi manual:
   ```bash
   mysql -u root -p
   # Masukkan password, lalu:
   SHOW DATABASES;
   ```

## 📞 Butuh Bantuan Lanjut?

Jika masih error, berikan info:
- Tool apa yang digunakan? (XAMPP, Laragon, MySQL standalone, etc)
- Error message lengkap dari `npx prisma db push`
- Output dari `Get-Service -Name MySQL*`

---

**Catatan:** File `.env` sudah di-gitignore, jadi kredensial Anda aman dan tidak akan ter-commit ke git.
