# 🔍 Debug Authentication Issue

## Quick Test Commands (run on Ubuntu server)

### 1. Check if containers are running:
```bash
docker ps
```

### 2. Check backend logs for errors:
```bash
docker logs tds-inventory-backend --tail 50
```

### 3. Check frontend is serving correctly:
```bash
curl http://localhost:5555 | head -20
```

### 4. Test login API manually:
```bash
curl -X POST http://localhost:5555/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -v
```

### 5. If login works, test adding PC with token:
```bash
# First, login and save token
TOKEN=$(curl -s -X POST http://localhost:5555/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

echo "Token: $TOKEN"

# Then try to add a PC
curl -X POST http://localhost:5555/api/pcs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id":"test-pc-123","department":"IT","pcName":"Test PC"}' \
  -v
```

### 6. Check browser console:
1. Open browser developer tools (F12)
2. Go to Console tab
3. Try to add a PC
4. Look for any error messages
5. Copy the error and send it

### 7. Check Network tab:
1. Open browser developer tools (F12)
2. Go to Network tab
3. Try to add a PC
4. Find the POST request to `/api/pcs`
5. Check:
   - Request Headers (does it have `Authorization: Bearer <token>`?)
   - Response status code
   - Response body

### 8. Check if .env file has correct values:
```bash
cat .env | grep -E 'DATABASE_URL|JWT_SECRET|CORS_ORIGIN'
```

### 9. Rebuild containers:
```bash
docker-compose -f docker-compose.full.yml down
docker-compose -f docker-compose.full.yml up -d --build
```

## Common Issues:

### Issue 1: Token not being sent
**Symptom**: Browser Network tab shows no `Authorization` header
**Fix**: Check `utils/api.ts` to ensure `apiFetch` is being used

### Issue 2: Token invalid
**Symptom**: Error message "Invalid or expired token"
**Fix**: Re-login to get a fresh token

### Issue 3: CORS error
**Symptom**: Browser console shows CORS error
**Fix**: Ensure `CORS_ORIGIN=*` in `.env` file

### Issue 4: Database connection error
**Symptom**: Backend logs show database error
**Fix**: Check `DATABASE_URL` in `.env` file

### Issue 5: Wrong backend URL
**Symptom**: 404 error when calling API
**Fix**: Check `nginx.full.conf` proxy configuration

## Send me the output of these commands:

```bash
# Run all diagnostics
echo "=== Containers ===" && docker ps
echo -e "\n=== Backend Logs ===" && docker logs tds-inventory-backend --tail 20
echo -e "\n=== Environment ===" && docker exec tds-inventory-backend env | grep -E 'DATABASE_URL|JWT_SECRET|CORS_ORIGIN|NODE_ENV'
echo -e "\n=== Test API ===" && curl -s http://localhost:5555/api/health | jq
```

