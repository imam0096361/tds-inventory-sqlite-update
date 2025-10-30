# 🔍 Complete Diagnosis

## Run These Commands IN ORDER

```bash
echo "=== 1. CHECK CONTAINERS ===" && docker ps | grep tds-inventory
echo -e "\n=== 2. CHECK DATA IN DATABASE ===" && docker exec tds-inventory-backend node -e "
require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT COUNT(*) FROM pcs')
  .then(r => console.log('✅ PCs:', r.rows[0].count))
  .catch(e => console.log('❌ Error:', e.message));
"
echo -e "\n=== 3. CHECK API RESPONSE ===" && curl -s http://localhost:5555/api/pcs | head -c 200
echo -e "\n=== 4. CHECK BACKEND LOGS ===" && docker logs --tail 10 tds-inventory-backend
echo -e "\n=== 5. CHECK CORS ===" && docker exec tds-inventory-backend env | grep CORS_ORIGIN
```

**Paste the COMPLETE output here.**

---

## Possible Issues:

### A. Database Still Empty
If PCs count = 0, seed failed or wasn't run.
**Fix**: Run seed again

### B. API Returns HTML Instead of JSON
If curl shows `<html>`, nginx proxy is broken.
**Fix**: Rebuild frontend

### C. CORS Still Wrong
If CORS_ORIGIN=localhost, CORS is blocking.
**Fix**: Rebuild backend with correct CORS

### D. Backend Crash
If backend logs show errors, backend is failing.
**Fix**: Check logs

---

**SEND ME THE COMPLETE OUTPUT OF THE COMMANDS ABOVE!**

