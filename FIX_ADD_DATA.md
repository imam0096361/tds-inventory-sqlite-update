# ⚡ QUICK FIX: Can't Add Data

## 🚨 Run These Commands on Your Ubuntu Server:

```bash
# 1. Pull latest code
cd /home/star/it-inventory/tds-inventory-sqlite-update
git pull origin main

# 2. Rebuild everything
docker-compose -f docker-compose.full.yml down
docker-compose -f docker-compose.full.yml up -d --build

# 3. Wait 2 minutes for build to complete, then check logs
docker logs tds-inventory-backend --tail 50

# 4. If backend is running, test the API
curl http://localhost:5555/api/health
```

---

## 🔍 Debug in Browser (IMPORTANT!)

1. **Open the app** at `http://your-server-ip:5555`
2. **Log in** as admin
3. **Open Developer Tools** (F12)
4. **Go to Console tab**
5. **Try to add a PC** (or any data)
6. **Look for these log messages**:
   - `[apiFetch] POST /api/pcs { hasToken: true, body: "..." }`
   - `[apiFetch] Error: /api/pcs {...}` (if there's an error)

7. **Copy the ENTIRE error message** and send it to me

---

## 🎯 Most Likely Issues:

### Issue 1: Token Not Stored
**Check**: Console shows `hasToken: false`
**Fix**: Re-login

### Issue 2: CORS Error
**Check**: Network tab shows CORS error
**Fix**: Run this:
```bash
echo "CORS_ORIGIN=*" >> .env
docker-compose -f docker-compose.full.yml restart backend
```

### Issue 3: Backend Not Running
**Check**: `curl http://localhost:5555/api/health` fails
**Fix**: Run this:
```bash
docker logs tds-inventory-backend --tail 100
# Look for database connection errors
```

---

## ✅ Quick Test (Copy-Paste This):

```bash
cd /home/star/it-inventory/tds-inventory-sqlite-update
git pull origin main
docker-compose -f docker-compose.full.yml down
docker-compose -f docker-compose.full.yml up -d --build
sleep 120  # Wait 2 minutes
curl http://localhost:5555/api/health && echo "✅ Backend is running"
```

**Then**: Open the app, try to add data, check browser console for errors, and send me the error message!

