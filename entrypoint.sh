#!/bin/bash
set -e

echo "========================================"
echo "  🚀 Kasir App - Production Startup"
echo "========================================"

# Validasi DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: Variabel DATABASE_URL belum diatur di environment!"
  exit 1
fi

# Deteksi host dan port otomatis dari DATABASE_URL jika PGHOST tidak diset
if [ -z "$PGHOST" ]; then
  DB_HOST=$(node -e 'try { const u = new URL(process.env.DATABASE_URL); console.log(u.hostname || "postgres"); } catch(e){ console.log("postgres"); }')
  DB_PORT=$(node -e 'try { const u = new URL(process.env.DATABASE_URL); console.log(u.port || "5432"); } catch(e){ console.log("5432"); }')
else
  DB_HOST="$PGHOST"
  DB_PORT="${PGPORT:-5432}"
fi

# Tunggu Postgres siap via TCP check (max 60 detik)
echo "⏳ Waiting for database ($DB_HOST:$DB_PORT) to be ready..."
RETRIES=30

until node -e "
const net = require('net');
const c = net.createConnection($DB_PORT, '$DB_HOST', () => { c.destroy(); process.exit(0); });
c.on('error', () => process.exit(1));
" 2>/dev/null; do
  echo "   Retrying... ($RETRIES attempts left)"
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -eq 0 ]; then
    echo "❌ Database ($DB_HOST:$DB_PORT) not reachable after 60s. Exiting."
    exit 1
  fi
  sleep 2
done
echo "✅ Database is ready!"

# Jalankan migrasi database
echo "🔄 Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy
echo "✅ Migrations complete!"

# Seed jika tabel users kosong
echo "🌱 Checking if seed is needed..."
USER_COUNT=$(node -e '
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.user.count()
  .then(count => { console.log(count); return prisma.$disconnect(); })
  .catch(() => { console.log("0"); return prisma.$disconnect(); });
' 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "   Seeding initial data..."
  node node_modules/tsx/dist/cli.mjs prisma/seed.ts
  echo "✅ Seed complete!"
else
  echo "   Data already exists (found $USER_COUNT users), skipping seed."
fi

echo "========================================"
echo "  🎯 Starting Next.js server on :3000"
echo "========================================"
exec node server.js
