# 🐳 Ubuntu Docker Deployment Guide

## 📋 Prerequisites

### On Your Ubuntu Server:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installations
docker --version
docker-compose --version
```

---

## 🚀 Deployment Options

### Option 1: Frontend Only (Recommended for Development)

If you only want to deploy the frontend and connect to an external database:

```bash
# Build and run frontend
docker build -t tds-inventory-frontend .
docker run -d -p 80:80 --name tds-inventory tds-inventory-frontend

# Or use docker-compose
docker-compose up -d
```

**Access:** http://your-server-ip/

---

### Option 2: Full Stack (Recommended for Production)

Includes Frontend + Backend + PostgreSQL:

```bash
# 1. Create .env file
cp .env.template .env

# 2. Edit .env with your settings:
nano .env
```

**Required .env variables:**
```env
# Database
DATABASE_URL=postgresql://postgres:your_password@postgres:5432/tds_inventory
POSTGRES_DB=tds_inventory
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_very_secure_jwt_secret_here_min_32_chars

# CORS
CORS_ORIGIN=http://your-server-ip

# AI (Optional)
GEMINI_API_KEY=your_gemini_api_key
AI_ENABLED=true

# Node Environment
NODE_ENV=production
PORT=5000
```

```bash
# 3. Update nginx.conf to point to backend
# The API proxy should point to: http://backend:5000
# (Change line 29 in nginx.conf)

# 4. Run full stack
docker-compose -f docker-compose.full.yml up -d

# 5. Check status
docker-compose -f docker-compose.full.yml ps

# 6. View logs
docker-compose -f docker-compose.full.yml logs -f
```

**Access:** 
- Frontend: http://your-server-ip/
- API: http://your-server-ip/api/
- PostgreSQL: localhost:5432 (from host)

---

## 🔧 Configuration Files

### 1. **Dockerfile** (Frontend)
Multi-stage build:
- Stage 1: Build React app with Vite
- Stage 2: Serve with Nginx

### 2. **Dockerfile.backend** (Backend)
- Node.js 18 Alpine
- PostgreSQL client
- Non-root user for security
- Health checks

### 3. **nginx.conf**
- SPA routing support (`try_files $uri $uri/ /index.html`)
- Gzip compression
- Static asset caching
- API proxy to backend
- Security headers

### 4. **docker-compose.full.yml**
- 3 services: frontend, backend, postgres
- Persistent volumes for database
- Network isolation
- Auto-restart on failure

---

## 📁 File Structure

```
your-ubuntu-server/
├── Dockerfile                    # Frontend build
├── Dockerfile.backend            # Backend build
├── docker-compose.yml            # Frontend only
├── docker-compose.full.yml       # Full stack
├── nginx.conf                    # Nginx config
├── .env                          # Environment variables
├── package.json
├── package-lock.json
├── server-postgres.cjs
├── vite.config.ts
├── tsconfig.json
└── src/                          # Your React source files
```

---

## 🛠️ Important: Update nginx.conf for Backend

**CRITICAL:** When using the full stack, update line 29 in `nginx.conf`:

**Before:**
```nginx
proxy_pass http://host.docker.internal:5000;
```

**After:**
```nginx
proxy_pass http://backend:5000;  # Points to backend service
```

---

## 🔒 Security Best Practices

### 1. **Firewall Setup**
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Only allow SSH from specific IPs (optional)
sudo ufw allow from your.trusted.ip to any port 22

# Enable firewall
sudo ufw enable
sudo ufw status
```

### 2. **SSL Certificate (Recommended)**
Use Let's Encrypt with Certbot:
```bash
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 3. **Environment Variables**
Never commit `.env` file:
```bash
# In .gitignore (already present)
echo ".env" >> .gitignore
chmod 600 .env  # Restrict permissions
```

### 4. **Database Backup**
```bash
# Manual backup
docker exec -t tds-inventory-db pg_dump -U postgres tds_inventory > backup.sql

# Restore
docker exec -i tds-inventory-db psql -U postgres tds_inventory < backup.sql

# Automated backup (cron)
0 2 * * * /usr/local/bin/docker exec tds-inventory-db pg_dump -U postgres tds_inventory > /backups/tds_backup_$(date +\%Y\%m\%d).sql
```

---

## 🔍 Troubleshooting

### Issue 1: Connection Refused
**Problem:** Can't access the app

**Solution:**
```bash
# Check if containers are running
docker ps

# Check logs
docker logs tds-inventory-frontend
docker logs tds-inventory-backend

# Check firewall
sudo ufw status
```

### Issue 2: Database Connection Failed
**Problem:** Backend can't connect to PostgreSQL

**Solution:**
```bash
# Check database is running
docker ps | grep postgres

# Test connection
docker exec -it tds-inventory-db psql -U postgres -d tds_inventory

# Check DATABASE_URL in .env
docker exec -it tds-inventory-backend env | grep DATABASE
```

### Issue 3: 404 on Refresh
**Problem:** Same as Vercel - refreshing `/pc-info` returns 404

**Solution:** Already handled in `nginx.conf`:
```nginx
location / {
    try_files $uri $uri/ /index.html;  # ✅ This fixes it!
}
```

### Issue 4: Port Already in Use
**Problem:** Port 80 already occupied

**Solution:**
```bash
# Find what's using port 80
sudo lsof -i :80
sudo netstat -tulpn | grep :80

# Stop the service (e.g., Apache)
sudo systemctl stop apache2

# Or change port in docker-compose.yml
ports:
  - "8080:80"  # Use port 8080 instead
```

---

## 📊 Monitoring & Maintenance

### View Logs
```bash
# Frontend logs
docker logs -f tds-inventory-frontend

# Backend logs
docker logs -f tds-inventory-backend

# Database logs
docker logs -f tds-inventory-db

# All logs
docker-compose -f docker-compose.full.yml logs -f
```

### Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.full.yml up -d --build

# Clean old images (optional)
docker image prune -a
```

### Stop/Start Services
```bash
# Stop
docker-compose -f docker-compose.full.yml down

# Start
docker-compose -f docker-compose.full.yml up -d

# Restart specific service
docker restart tds-inventory-backend
```

---

## 🌐 Domain Setup

### 1. DNS Configuration
Point your domain to your server IP:
```
A Record: @ -> your.server.ip.address
CNAME: www -> @
```

### 2. Nginx Reverse Proxy (If using a domain)
Create `/etc/nginx/sites-available/tds-inventory`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/tds-inventory /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Post-Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] `.env` file created with all variables
- [ ] `nginx.conf` updated to point to `backend:5000`
- [ ] Firewall configured (port 80/443 open)
- [ ] Containers running: `docker ps`
- [ ] Frontend accessible: http://your-ip/
- [ ] Backend API working: http://your-ip/api/health
- [ ] Database accessible and initialized
- [ ] Can login to application
- [ ] AI Assistant working (if enabled)
- [ ] SSL certificate installed (if using domain)
- [ ] Backups configured
- [ ] Monitoring set up

---

## 🎉 You're Done!

Your TDS Inventory system is now running on your Ubuntu server!

**Access URLs:**
- Frontend: http://your-server-ip/
- API: http://your-server-ip/api/

**Default Login:** Check your database or `.env` file

**Support:** All features from Vercel work exactly the same!

---

## 📝 Quick Reference Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker logs -f container-name

# Rebuild
docker-compose up -d --build

# Backup database
docker exec -t tds-inventory-db pg_dump -U postgres tds_inventory > backup.sql

# Shell access
docker exec -it container-name sh

# Check status
docker ps
docker stats
```

---

**Last Updated:** October 30, 2025  
**Docker Version:** Requires Docker 20.10+  
**Status:** ✅ Production Ready

