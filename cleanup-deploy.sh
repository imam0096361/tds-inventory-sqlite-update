#!/bin/bash

echo "🧹 Cleaning up old containers..."
echo ""

# Stop all old containers
docker-compose down
docker-compose -f docker-compose.full.yml down

# Remove orphan containers
docker stop it-inventory-frontend 2>/dev/null || true
docker rm it-inventory-frontend 2>/dev/null || true

# Remove old networks
docker network prune -f

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Now run:"
echo "  docker-compose -f docker-compose.full.yml up -d --build"

