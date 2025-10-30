# 🚀 Deployment Instructions for Ubuntu Server

## ⚠️ IMPORTANT: Pull Latest Changes First!

The image you showed is still using the **old nginx.conf** with `host.docker.internal`.

---

## ✅ Quick Fix Commands

Run these commands **IN ORDER** on your Ubuntu server:

```bash
# Navigate to project
cd /home/star/it-inventory/tds-inventory-sqlite-update

# Pull latest changes from GitHub
git pull origin main

# Stop and remove ALL containers
docker-compose down

# Remove old cached image
docker rmi tds-inventory-sqlite-update_it-inventory-app 2>/dev/null || true

# Clean any old nginx config cache
docker system prune -f

# Rebuild with new config
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Check status
docker ps

# View logs
docker logs -f it-inventory-frontend
```

---

## 🎯 What Changed

✅ **nginx.conf** - API proxy commented out (no more `host.docker.internal`)
✅ **Dockerfile** - Uses new nginx.conf
✅ Already pushed to GitHub

---

## 📋 Full Step-by-Step

### Step 1: Pull Changes
```bash
cd /home/star/it-inventory/tds-inventory-sqlite-update
git pull origin main
```

### Step 2: Stop Everything
```bash
docker-compose down
```

### Step 3: Remove Old Images
```bash
docker rmi tds-inventory-sqlite-update_it-inventory-app
docker system prune -f
```

### Step 4: Rebuild Fresh
```bash
docker-compose build --no-cache
```

### Step 5: Start
```bash
docker-compose up -d
```

### Step 6: Verify
```bash
# Should show: Up (not Restarting)
docker ps

# Should show 200 OK
curl http://localhost:5555

# Or open in browser
# http://103.118.19.134:5555
```

---

## 🔍 Troubleshooting

### Still seeing old error?
```bash
# Force remove everything
docker-compose down -v
docker system prune -a -f

# Fresh build
docker-compose build --no-cache
docker-compose up -d
```

### Check which nginx.conf is being used
```bash
docker exec -it it-inventory-frontend cat /etc/nginx/conf.d/default.conf | grep -i proxy_pass
```

Should show:
```nginx
# location /api/ {
#     proxy_pass http://backend:5000;
```

NOT:
```nginx
proxy_pass http://host.docker.internal:5000;
```

---

## 🎉 After Successful Deployment

You should see:
- ✅ Container status: `Up` (not Restarting)
- ✅ No nginx errors in logs
- ✅ Login page loads at http://103.118.19.134:5555
- ✅ (Note: Login won't work yet - API returns HTML instead of JSON because you only deployed frontend)

---

## 📝 Next: Full Stack Setup

To get login working, you need to deploy the **full stack** with backend:

```bash
# Use full stack compose file
docker-compose -f docker-compose.full.yml up -d --build
```

This includes:
- Frontend (Nginx)
- Backend (Node.js API)
- PostgreSQL database

---

**Commands are pushed to GitHub. Pull and rebuild!**

