# 🐳 Docker Troubleshooting Guide

## 🚨 Common Issues & Solutions

---

## Issue 1: Container Name Conflict

**Error:**
```
ERROR: Cannot create container for service: Conflict. 
The container name "/it-inventory-frontend" is already in use
```

**Solution - Quick Fix:**
```bash
# Stop and remove the old container
docker stop it-inventory-frontend
docker rm it-inventory-frontend

# Start fresh
docker-compose up -d --build
```

**Or use docker-compose:**
```bash
# Remove and recreate all containers
docker-compose down
docker-compose up -d --build
```

---

## Issue 2: Port Already in Use

**Error:**
```
ERROR: bind: address already in use
```

**Solution:**
```bash
# Find what's using port 5555
sudo lsof -i :5555
# or
sudo netstat -tulpn | grep :5555

# Option 1: Stop the other service
sudo systemctl stop conflicting-service

# Option 2: Change port in docker-compose.yml
# Edit ports: "5555:80" to "7777:80"
```

---

## Issue 3: Permissions Denied

**Error:**
```
ERROR: permission denied while trying to connect to Docker daemon socket
```

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply changes (logout/login or)
newgrp docker

# Verify
docker ps
```

---

## Issue 4: Out of Disk Space

**Error:**
```
no space left on device
```

**Solution:**
```bash
# Check disk usage
docker system df

# Remove unused data
docker system prune -a

# Remove old images
docker image prune -a

# Remove old volumes (BE CAREFUL - this deletes data!)
docker volume prune
```

---

## Issue 5: Build Failures

**Error:**
```
ERROR: failed to build image
```

**Solution:**
```bash
# Remove old images and rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d

# Check build logs for specific errors
docker-compose build 2>&1 | tee build.log
```

---

## Issue 6: Cannot Access App

**Check Container Status:**
```bash
# Is container running?
docker ps

# Should show: it-inventory-frontend Up x minutes ago

# If not running, check logs:
docker logs it-inventory-frontend
```

**Check Network:**
```bash
# Test from host
curl http://localhost:5555

# Or from another container
docker exec -it it-inventory-frontend curl http://localhost
```

**Check Firewall:**
```bash
# Allow port 5555
sudo ufw allow 5555/tcp

# Check status
sudo ufw status
```

---

## Issue 7: Database Connection Failed

**Error:**
```
Error: connect ECONNREFUSED
```

**Solution:**
```bash
# Check if using full stack
docker ps | grep postgres

# Should show: tds-inventory-db

# Check database logs
docker logs tds-inventory-db

# Test connection
docker exec -it tds-inventory-db psql -U postgres -d tds_inventory

# Verify DATABASE_URL in .env
docker exec -it tds-inventory-backend env | grep DATABASE
```

---

## Issue 8: Nginx Configuration Error

**Error:**
```
nginx: [emerg] invalid configuration
```

**Solution:**
```bash
# Test nginx config inside container
docker exec -it it-inventory-frontend nginx -t

# If error, check nginx.conf
docker exec -it it-inventory-frontend cat /etc/nginx/conf.d/default.conf

# Fix and rebuild
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 🔧 Useful Commands

### Container Management
```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop container
docker stop it-inventory-frontend

# Start container
docker start it-inventory-frontend

# Restart container
docker restart it-inventory-frontend

# Remove container
docker rm it-inventory-frontend

# Remove container (force)
docker rm -f it-inventory-frontend
```

### Docker Compose
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose up -d --build

# Stop and remove everything
docker-compose down -v
```

### Logs & Debugging
```bash
# View logs
docker logs it-inventory-frontend

# Follow logs
docker logs -f it-inventory-frontend

# View last 100 lines
docker logs --tail 100 it-inventory-frontend

# All services logs
docker-compose logs
```

### Inspect & Execute
```bash
# Inspect container
docker inspect it-inventory-frontend

# Shell access
docker exec -it it-inventory-frontend sh

# Execute command
docker exec -it it-inventory-frontend ls /usr/share/nginx/html

# Network info
docker network ls
docker network inspect tds-inventory-sqlite-update_default
```

### Cleanup
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Clean everything
docker system prune -a
```

### Resource Monitoring
```bash
# Container stats
docker stats

# Disk usage
docker system df

# Process list
docker top it-inventory-frontend
```

---

## 🚀 Quick Restart Script

Save as `restart.sh`:
```bash
#!/bin/bash
echo "🔄 Restarting TDS Inventory..."
docker-compose down
docker-compose up -d --build
echo "✅ Done! Access at http://localhost:5555"
```

Make executable and run:
```bash
chmod +x restart.sh
./restart.sh
```

---

## 🎯 Complete Fresh Start

If nothing works, start completely fresh:

```bash
# Stop everything
docker-compose down

# Remove all containers
docker rm -f $(docker ps -aq)

# Remove all images
docker rmi -f $(docker images -q)

# Remove all volumes (WARNING: deletes data!)
docker volume rm $(docker volume ls -q)

# Clean everything
docker system prune -a --volumes

# Fresh build
docker-compose build --no-cache
docker-compose up -d
```

---

## ✅ Health Check

Run this to verify everything is working:

```bash
#!/bin/bash
echo "🔍 Running Health Checks..."
echo ""

# Container running?
if docker ps | grep -q it-inventory-frontend; then
    echo "✅ Container is running"
else
    echo "❌ Container is NOT running"
fi

# Port accessible?
if curl -s http://localhost:5555 > /dev/null; then
    echo "✅ Port 5555 is accessible"
else
    echo "❌ Port 5555 is NOT accessible"
fi

# Nginx responding?
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5555)
if [ "$response" = "200" ]; then
    echo "✅ Nginx is responding correctly"
else
    echo "❌ Nginx returned: $response"
fi

echo ""
echo "Done!"
```

---

## 📞 Getting Help

### Collect Debug Info
```bash
# Save all relevant info
{
    docker ps -a
    docker images
    docker logs it-inventory-frontend
    docker network ls
    docker volume ls
    curl -v http://localhost:5555
} > debug.txt 2>&1
```

### Check Logs
```bash
# Application logs
docker logs it-inventory-frontend

# Docker daemon logs (Ubuntu)
sudo journalctl -u docker.service -n 50
```

---

**Last Updated:** October 30, 2025  
**Status:** ✅ Complete Troubleshooting Guide

