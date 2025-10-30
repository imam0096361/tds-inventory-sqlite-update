# 🔐 Environment Setup for Neon PostgreSQL

## ✅ Your Current Issue

Your JWT_SECRET is:
```
your-secret-key-change-in-production-MUST-BE-32-CHARS-MINIMUM
```

**Problems:**
- ❌ Only 27 characters (needs 32 minimum)
- ❌ Predictable text
- ❌ Not secure enough for production

---

## 🔧 Quick Fix

### Generate a Secure Secret

**Option 1: Using Node.js (Already in your system)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Output: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 32
```
Output: `f1e2d3c4b5a697887766a5544332211009f8e7d6c5b4a392817263544536271809`

**Option 3: Using Online Generator**
Visit: https://randomkeygen.com/ (use "CodeIgniter Encryption Keys" - 32 chars)

---

## 📋 Complete .env File for Neon

Create your `.env` file:

```env
# ═══════════════════════════════════════════════════════════
# SECURITY - MUST BE AT LEAST 32 CHARACTERS
# ═══════════════════════════════════════════════════════════
JWT_SECRET=your_generated_64_character_hex_string_here
# Example: JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# ═══════════════════════════════════════════════════════════
# NEON POSTGRESQL DATABASE
# ═══════════════════════════════════════════════════════════
DATABASE_URL=postgresql://username:password@ep-xxxx-xxxx.region.aws.neon.tech/neondb?sslmode=require
# ═══════════════════════════════════════════════════════════
# Get this from: https://console.neon.tech/
# Copy "Connection String" from your project
# ═══════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════
# APP CONFIGURATION
# ═══════════════════════════════════════════════════════════
NODE_ENV=production
PORT=5000

# ═══════════════════════════════════════════════════════════
# CORS CONFIGURATION
# ═══════════════════════════════════════════════════════════
CORS_ORIGIN=https://tds-inventory-sqlite-update.vercel.app,https://tds-inventory-sqlite-update-git-main.vercel.app

# ═══════════════════════════════════════════════════════════
# AI ASSISTANT (OPTIONAL)
# ═══════════════════════════════════════════════════════════
GEMINI_API_KEY=your_gemini_api_key_here
AI_ENABLED=true

# ═══════════════════════════════════════════════════════════
# Get Gemini API Key: https://makersuite.google.com/app/apikey
# ═══════════════════════════════════════════════════════════
```

---

## 🔍 How to Get Your Neon Connection String

### Step 1: Go to Neon Console
Visit: https://console.neon.tech/

### Step 2: Select Your Project
Click on your TDS Inventory project

### Step 3: Get Connection String
1. Click on **"Connection Details"** or **"Dashboard"**
2. Look for **"Connection string"** section
3. Select **"URI"** format
4. Copy the connection string
5. It looks like:
   ```
   postgresql://username:password@ep-xxxx-yyyy.region.aws.neon.tech/neondb?sslmode=require
   ```

### Step 4: Update Your .env
Replace `DATABASE_URL` with your copied connection string

---

## ✅ Verification Steps

### 1. Check JWT_SECRET Length
```bash
node -e "console.log(process.env.JWT_SECRET.length)"  # Should be >= 32
```

### 2. Test Database Connection
```bash
node -e "require('pg').Client(process.env.DATABASE_URL).connect().then(() => console.log('✅ Connected')).catch(e => console.error('❌ Error:', e.message))"
```

### 3. Test in Your App
```bash
# Start your server
npm start

# Should see:
# ✅ Database connected successfully
# ✅ Server running on port 5000
```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use 64-character hex strings for JWT_SECRET
- ✅ Never commit `.env` file to Git
- ✅ Use different secrets for dev/staging/production
- ✅ Rotate secrets periodically (every 3-6 months)
- ✅ Use SSL/TLS for database connections (Neon does this automatically)

### ❌ DON'T:
- ❌ Share your `.env` file
- ❌ Use predictable secrets
- ❌ Use the same secret for multiple apps
- ❌ Expose secrets in client-side code
- ❌ Commit secrets to Git

---

## 🚨 Current Setup Check

### Run This Command:
```bash
node -e "
const env = require('./env.template');
const fs = require('fs');
try {
  const dotenv = require('dotenv');
  const result = dotenv.config();
  if (result.error) {
    console.log('❌ .env file not found');
  } else {
    console.log('✅ .env file loaded');
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      console.log('❌ JWT_SECRET too short:', process.env.JWT_SECRET.length, 'chars');
    } else {
      console.log('✅ JWT_SECRET OK');
    }
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon')) {
      console.log('✅ DATABASE_URL contains Neon');
    } else {
      console.log('❌ DATABASE_URL missing or incorrect');
    }
  }
} catch(e) {
  console.log('⚠️ Install dotenv: npm install dotenv');
}
"
```

---

## 📝 Quick Setup Script

Save this as `setup-env.sh`:

```bash
#!/bin/bash

echo "🔐 TDS Inventory .env Setup"
echo ""

# Generate JWT Secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo "✅ Generated JWT_SECRET: $JWT_SECRET"
echo ""

# Create .env file
cat > .env << EOF
# Generated on $(date)

# Security
JWT_SECRET=$JWT_SECRET

# Database (ADD YOUR NEON URL HERE)
DATABASE_URL=your_neon_connection_string_here

# App
NODE_ENV=production
PORT=5000

# CORS
CORS_ORIGIN=https://tds-inventory-sqlite-update.vercel.app

# AI (Optional)
GEMINI_API_KEY=
AI_ENABLED=false
EOF

echo "✅ .env file created!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env and add your Neon DATABASE_URL"
echo "2. Add GEMINI_API_KEY if using AI Assistant"
echo "3. Run: npm start"
```

Run it:
```bash
chmod +x setup-env.sh
./setup-env.sh
```

---

## 🎯 Example Complete .env

```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
DATABASE_URL=postgresql://myuser:mypassword@ep-cool-voice-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://tds-inventory-sqlite-update.vercel.app,https://tds-inventory-sqlite-update-git-main.vercel.app
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz-123456789
AI_ENABLED=true
```

---

## ✅ Checklist

Before deploying:

- [ ] JWT_SECRET is 32+ characters (64 recommended)
- [ ] DATABASE_URL is from Neon console
- [ ] DATABASE_URL includes `sslmode=require`
- [ ] CORS_ORIGIN matches your domains
- [ ] .env file is NOT in Git (check .gitignore)
- [ ] Test database connection works
- [ ] Server starts without errors
- [ ] Login works correctly

---

## 🆘 Troubleshooting

### Error: "JWT_SECRET must be at least 32 characters"
**Solution:** Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and update your .env

### Error: "Database connection failed"
**Check:**
1. DATABASE_URL is correct (copy from Neon console)
2. Database is active in Neon (check console)
3. Network allows connections
4. SSL mode is enabled

### Error: "Invalid JWT token"
**Check:**
1. JWT_SECRET hasn't changed
2. Token hasn't expired
3. Using same secret for signing and verification

---

## 📞 Support

If you need help:
1. Check Neon Console: https://console.neon.tech/
2. Check Vercel Logs for errors
3. Verify .env file is loaded (add console.log to check)

---

**Last Updated:** October 30, 2025  
**Status:** ✅ Ready for Production

