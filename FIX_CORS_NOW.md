# 🚨 URGENT: Fix CORS Now

## Problem:
Your `.env` file still has the OLD value at the top:
```
CORS_ORIGIN=http://localhost
```

The new `CORS_ORIGIN=*` was added at the bottom, but Docker reads the FIRST value.

---

## ✅ QUICK FIX:

```bash
# 1. Edit .env and REMOVE the old line
nano .env

# Find this line and DELETE IT:
CORS_ORIGIN=http://localhost

# Keep ONLY this line:
CORS_ORIGIN=*

# Save and exit (Ctrl+X, then Y, then Enter)

# 2. Rebuild backend with new .env
docker-compose -f docker-compose.full.yml stop backend
docker-compose -f docker-compose.full.yml up -d --build backend

# 3. Wait 10 seconds
sleep 10

# 4. Check it worked
docker exec tds-inventory-backend env | grep CORS_ORIGIN
# Should show: CORS_ORIGIN=*
```

---

## 🔧 Alternative: Force Override

```bash
# Stop everything
docker-compose -f docker-compose.full.yml down

# Recreate .env with correct value
cat > .env << 'EOF'
DATABASE_URL=postgresql://neondb_owner:npg_VWYJCfilwL47@ep-lively-cloud-a1lfo3j0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=d24915667aa98800320828c505c8a24de4c7b841fb14405aac62fa57d305bd70
CORS_ORIGIN=*
EOF

# Start fresh
docker-compose -f docker-compose.full.yml up -d --build

# Wait for backend to start
sleep 15

# Verify CORS
docker exec tds-inventory-backend env | grep CORS_ORIGIN
# Should show: CORS_ORIGIN=*
```

---

## 📋 Your .env Should Look Like:

```env
DATABASE_URL=postgresql://neondb_owner:npg_VWYJCfilwL47@ep-lively-cloud-a1lfo3j0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=d24915667aa98800320828c505c8a24de4c7b841fb14405aac62fa57d305bd70
CORS_ORIGIN=*
```

**NO other CORS_ORIGIN line!**

---

## ✅ After Fix:

```bash
# Check backend logs
docker logs --tail 20 tds-inventory-backend

# Should show it starting with CORS_ORIGIN=*

# Test in browser
# Go to: http://103.118.19.134:5555/login
# Login with: admin / admin123
```

**The "Unexpected token" error should be gone!**

