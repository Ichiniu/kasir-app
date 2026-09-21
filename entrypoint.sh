#!/bin/sh
set -e

echo "========================================"
echo "  🚀 Kasir App - Production Startup"
echo "========================================"

# Tunggu Postgres siap (max 60 detik)
echo "⏳ Waiting for database to be ready..."
RETRIES=30
until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "   Retrying... ($RETRIES attempts left)"
  RETRIES=$((RETRIES - 1))
  sleep 2
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ Database not reachable after 60s. Exiting."
  exit 1
fi
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
