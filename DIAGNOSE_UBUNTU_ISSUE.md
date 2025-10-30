# 🔍 Diagnose Ubuntu Docker Issue

## 🚨 Problem: Can't Add Any PC + White Screens

Run these commands **IN ORDER** to diagnose:

---

## Step 1: Check Containers Are Running

```bash
docker ps
```

**Should show:**
```
✅ tds-inventory-frontend   Up
✅ tds-inventory-backend    Up  
✅ tds-inventory-db        Up
```

---

## Step 2: Check Backend Logs

```bash
docker logs -f tds-inventory-backend --tail 100
```

**Look for:**
- ✅ "Connected to PostgreSQL database"
- ✅ "Database tables initialized"
- ❌ Any error messages

**Press Ctrl+C to exit logs**

---

## Step 3: Test Backend Health Endpoint

```bash
curl http://localhost:5000/api/health
```

**Should return:**
```
{"status":"ok","database":"connected"}
```

---

## Step 4: Test API Through Frontend Nginx

```bash
curl http://localhost:5555/api/health
```

**Should return:**
```
{"status":"ok","database":"connected"}
```

**If this fails**, your Nginx proxy is broken!

---

## Step 5: Check .env File in Container

```bash
docker exec -it tds-inventory-backend cat .env
```

**Must have:**
```
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
JWT_SECRET=...
```

---

## Step 6: Test Database Connection

```bash
docker exec -it tds-inventory-backend node -e "
require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW(), COUNT(*) FROM pcs')
  .then(r => console.log('✅ DB OK:', r.rows[0]))
  .catch(e => console.log('❌ Error:', e.message));
"
```

---

## Step 7: Check Frontend Can Reach Backend

In your browser, open DevTools (F12) and go to Network tab.

**Try to add a PC**, then look at the network request:

**Should show:**
```
POST http://103.118.19.134:5555/api/pcs
Status: 200 or 401
```

**If you see:**
- ❌ 404 Not Found → API proxy not working
- ❌ CORS error → CORS misconfigured
- ❌ Timeout → Backend not responding

---

## Step 8: Check Browser Console for Errors

Open browser DevTools (F12) → Console tab.

**Look for errors like:**
- `Failed to fetch`
- `Unexpected token`
- `404 Not Found`
- CORS errors

---

## 🎯 Most Likely Issues

### Issue 1: Backend Not Running
```bash
# Check status
docker ps | grep backend

# If not running, start it
docker-compose -f docker-compose.full.yml up -d backend

# Check logs
docker logs -f tds-inventory-backend
```

### Issue 2: API Proxy Not Working
```bash
# Check Nginx config inside container
docker exec -it tds-inventory-frontend cat /etc/nginx/conf.d/default.conf | grep -A 10 "location /api"

# Should show proxy_pass to backend
```

### Issue 3: CORS Error
```bash
# Check CORS_ORIGIN in backend
docker exec -it tds-inventory-backend env | grep CORS

# Should show your server IP
CORS_ORIGIN=http://103.118.19.134:5555
```

### Issue 4: Database Not Connected
```bash
# Check database connection
docker logs tds-inventory-backend | grep -i "connect"

# Should show: "✅ Connected to PostgreSQL database"
```

### Issue 5: JWT/Auth Issue
```bash
# Check JWT_SECRET is set
docker exec -it tds-inventory-backend env | grep JWT_SECRET

# Must be 32+ characters
```

---

## 🔧 Quick Fix Commands

### Full Restart
```bash
docker-compose -f docker-compose.full.yml down
docker-compose -f docker-compose.full.yml up -d --build
sleep 10
docker logs tds-inventory-backend
```

### Check Everything
```bash
echo "=== CONTAINERS ===" && docker ps
echo -e "\n=== BACKEND LOGS ===" && docker logs --tail 20 tds-inventory-backend
echo -e "\n=== HEALTH CHECK ===" && curl -s http://localhost:5555/api/health
echo -e "\n=== ENV VARS ===" && docker exec tds-inventory-backend env | grep -E "DATABASE|JWT|CORS"
```

---

## 📊 Collect Full Debug Info

```bash
{
  echo "=== DOCKER STATUS ==="
  docker ps -a
  
  echo -e "\n=== BACKEND LOGS ==="
  docker logs --tail 100 tds-inventory-backend
  
  echo -e "\n=== FRONTEND LOGS ==="
  docker logs --tail 50 tds-inventory-frontend
  
  echo -e "\n=== DATABASE LOGS ==="
  docker logs --tail 50 tds-inventory-db
  
  echo -e "\n=== NETWORK ==="
  docker network inspect tds-inventory-sqlite-update_tds-network
  
  echo -e "\n=== BACKEND ENV ==="
  docker exec tds-inventory-backend env | sort
  
  echo -e "\n=== NGINX CONFIG ==="
  docker exec tds-inventory-frontend cat /etc/nginx/conf.d/default.conf
  
  echo -e "\n=== API TEST ==="
  curl -v http://localhost:5000/api/health 2>&1
  echo ""
  curl -v http://localhost:5555/api/health 2>&1
} > full-debug.txt 2>&1

# View results
cat full-debug.txt
```

---

## 🆘 Paste Results

After running diagnostics, please share:

1. Output of: `docker ps`
2. Last 20 lines of: `docker logs tds-inventory-backend`
3. Result of: `curl http://localhost:5555/api/health`
4. Browser console errors (screenshot or text)

This will help identify the exact problem!

---

**Most common: API proxy not working or backend not started!**

