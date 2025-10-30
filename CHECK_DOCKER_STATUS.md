# 🔍 Docker Status Check Guide

## Issue: White screen when clicking on servers, peripherals, etc.

This happens when the **backend API returns empty data** (empty Neon database).

---

## ✅ Check Status Commands

Run these on your Ubuntu server to diagnose:

### 1. Check All Containers Are Running
```bash
docker ps
```

Should show:
```
✅ tds-inventory-frontend  Up
✅ tds-inventory-backend   Up
✅ tds-inventory-db        Up
```

### 2. Check Backend Logs
```bash
docker logs tds-inventory-backend
```

**Look for:**
- ✅ "Connected to PostgreSQL database"
- ✅ "Database tables initialized"
- ✅ "Default admin user created"
- ❌ Any errors about missing tables

### 3. Check Frontend Logs
```bash
docker logs tds-inventory-frontend
```

Should show Nginx running without errors.

### 4. Check Backend Environment Variables
```bash
docker exec -it tds-inventory-backend env | grep -E "DATABASE_URL|JWT_SECRET|NODE_ENV"
```

Should show:
```
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
JWT_SECRET=your_secret_here
NODE_ENV=production
```

### 5. Test Backend API Directly
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test login (should work even with empty DB)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 6. Test Frontend API Proxy
```bash
# Through Nginx
curl http://localhost:5555/api/health
```

---

## 🚨 Common Issues & Fixes

### Issue 1: Backend Not Running
```bash
# Start backend
docker-compose -f docker-compose.full.yml up -d backend

# Check logs
docker logs -f tds-inventory-backend
```

### Issue 2: Database Not Connected
```bash
# Check DATABASE_URL
docker exec -it tds-inventory-backend env | grep DATABASE_URL

# Test connection
docker exec -it tds-inventory-backend node -e "
require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()').then(r => console.log('✅ Connected:', r.rows[0]));
"
```

### Issue 3: Empty Database (No Tables)
```bash
# Check if tables exist
docker exec -it tds-inventory-backend node -e "
require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query(\"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'\")
  .then(r => console.log('Tables:', r.rows.map(x => x.table_name)));
"
```

If no tables, restart backend:
```bash
docker restart tds-inventory-backend
docker logs -f tds-inventory-backend
```

### Issue 4: Empty Database (No Data)
Your Neon database is **empty** - no PC, laptop, server data.

**Solution: Seed the database**
```bash
# Option A: Run seed script locally
node seed-database.cjs

# Option B: Restart backend - it auto-creates admin user
docker restart tds-inventory-backend
```

---

## 📊 Add Demo Data

To populate your Neon database with demo data:

### Option 1: Using Seed Script (Recommended)
```bash
# On your local machine or server
cd /home/star/it-inventory/tds-inventory-sqlite-update

# Make sure .env file has DATABASE_URL
cat .env

# Run seed script
node seed-database.cjs

# Verify data was added
docker exec -it tds-inventory-backend node -e "
require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT COUNT(*) FROM pcs')
  .then(r => console.log('PCs:', r.rows[0].count));
"
```

### Option 2: Through Neon Console
1. Go to https://console.neon.tech/
2. Click on your project
3. Open SQL Editor
4. Run INSERT statements

### Option 3: Manual Entry
Use the UI to add data manually after logging in.

---

## 🔧 Quick Fix Sequence

```bash
# 1. Stop everything
docker-compose -f docker-compose.full.yml down

# 2. Check .env file exists
cat .env

# 3. Start services
docker-compose -f docker-compose.full.yml up -d

# 4. Wait for backend to initialize
sleep 10

# 5. Check logs
docker logs tds-inventory-backend | grep -E "Connected|initialized|admin"

# 6. Seed database
node seed-database.cjs

# 7. Check data
docker exec -it tds-inventory-backend node -e "
require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
Promise.all([
  pool.query('SELECT COUNT(*) FROM pcs'),
  pool.query('SELECT COUNT(*) FROM laptops'),
  pool.query('SELECT COUNT(*) FROM servers')
]).then(([pcs, laps, srv]) => {
  console.log('✅ PCs:', pcs.rows[0].count);
  console.log('✅ Laptops:', laps.rows[0].count);
  console.log('✅ Servers:', srv.rows[0].count);
});
"

# 8. Test in browser
# http://103.118.19.134:5555/login
# Username: admin
# Password: admin123
```

---

## 📋 Troubleshooting Checklist

- [ ] All 3 containers running (frontend, backend, postgres)
- [ ] Backend logs show "Connected to PostgreSQL"
- [ ] Backend logs show "Database tables initialized"
- [ ] DATABASE_URL is set correctly in .env
- [ ] Can connect to Neon from backend
- [ ] Tables exist in Neon database
- [ ] At least demo data exists (or seed-database.cjs was run)
- [ ] Frontend can reach backend through Nginx
- [ ] Login works with admin/admin123
- [ ] PC info shows data
- [ ] Server info shows data
- [ ] Peripherals show data

---

## 🆘 Still Not Working?

Collect debug info:
```bash
{
  echo "=== CONTAINER STATUS ==="
  docker ps
  
  echo -e "\n=== BACKEND LOGS (last 50 lines) ==="
  docker logs --tail 50 tds-inventory-backend
  
  echo -e "\n=== FRONTEND LOGS (last 20 lines) ==="
  docker logs --tail 20 tds-inventory-frontend
  
  echo -e "\n=== BACKEND ENV ==="
  docker exec tds-inventory-backend env | grep -E "DATABASE|JWT|NODE"
  
  echo -e "\n=== DATABASE CONNECTION TEST ==="
  docker exec tds-inventory-backend node -e "
    require('dotenv').config();
    const {Pool} = require('pg');
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      pool.query('SELECT NOW(), version()')
        .then(r => console.log('✅ DB OK:', r.rows[0]))
        .catch(e => console.log('❌ DB Error:', e.message));
    } catch(e) {
      console.log('❌ Config Error:', e.message);
    }
  "
  
  echo -e "\n=== TABLE COUNT ==="
  docker exec tds-inventory-backend node -e "
    require('dotenv').config();
    const {Pool} = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    pool.query(\"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'\")
      .then(r => console.log('Tables:', r.rows.length, r.rows.map(x => x.table_name).join(', ')));
  "
} > docker-debug.txt 2>&1

# View results
cat docker-debug.txt
```

---

**Most likely cause: Empty Neon database. Run `node seed-database.cjs` to populate it!**

