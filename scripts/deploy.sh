#!/bin/bash
set -e

echo "🚀 Starting deployment for Kasir App..."

# 1. Pull latest changes
echo "📥 Pulling latest updates from git repository..."
git pull origin main

# 2. Build Docker images
echo "🏗️ Building Docker containers..."
docker compose build --no-cache

# 3. Start services in background
echo "⚡ Starting Docker services..."
docker compose up -d

# 4. Wait for container initialization
echo "⏳ Waiting for services to become healthy..."
sleep 5

# 5. Run Prisma Migration in production
echo "🗄️ Running Prisma Database Migration..."
docker exec kasir_nextjs npx prisma migrate deploy

# 6. Cleanup unused docker resources
echo "🧹 Pruning unused Docker images and build cache..."
docker system prune -f

echo "✅ Deployment completed successfully!"
