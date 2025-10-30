#!/bin/bash

echo "🧹 Cleaning up old Docker containers..."
echo ""

# Stop and remove old containers
echo "Stopping containers..."
docker stop it-inventory-frontend 2>/dev/null || true

echo "Removing containers..."
docker rm it-inventory-frontend 2>/dev/null || true

echo "Removing old images..."
docker rmi tds-inventory-sqlite-update_it-inventory-app 2>/dev/null || true

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Now run: docker-compose up -d --build"

