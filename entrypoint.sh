#!/bin/bash
set -e

echo "========================================"
echo "  🚀 Kasir App - Production Startup"
echo "========================================"

# Tunggu Postgres siap via TCP check (max 60 detik)
echo "⏳ Waiting for database to be ready..."
RETRIES=30
DB_HOST="${PGHOST:-postgres}"
DB_PORT="${PGPORT:-5432}"

until node -e "
const net = require('net');
const c = net.createConnection($DB_PORT, '$DB_HOST', () => { c.destroy(); process.exit(0); });
c.on('error', () => process.exit(1));
" 2>/dev/null; do
  echo "   Retrying... ($RETRIES attempts left)"
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -eq 0 ]; then
    echo "❌ Database not reachable after 60s. Exiting."
    exit 1
  fi
  sleep 2
done
echo "✅ Database is ready!"

# Jalankan migrasi
echo "🔄 Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations complete!"

# Seed jika tabel users kosong
echo "🌱 Checking if seed is needed..."
USER_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*)::int FROM users;" 2>/dev/null | grep -E '^[0-9]+$' || echo "1")
if [ "$USER_COUNT" = "0" ]; then
  echo "   Seeding initial data..."
  npx tsx prisma/seed.ts
  echo "✅ Seed complete!"
else
  echo "   Data already exists, skipping seed."
fi

echo "========================================"
echo "  🎯 Starting Next.js server on :3000"
echo "========================================"
exec node server.js
