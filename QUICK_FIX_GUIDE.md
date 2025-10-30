# ⚡ Quick Fix Guide - Database Connection Issues

## 🔴 Problem

Vercel deployment works locally but database connection fails in production.

---

## ✅ Solution (Quick Steps)

### Step 1: Generate JWT Secret (2 minutes)

Open terminal and run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output** (looks like: `a1b2c3d4e5f6g7h8...`)

---

### Step 2: Set Environment Variables in Vercel (3 minutes)

1. Go to: https://vercel.com/
2. Click your project: `tds-inventory-sqlite-update`
3. Go to: **Settings** → **Environment Variables**
4. Add these variables:

| Variable | Value | Check All 3 |
|----------|-------|-------------|
| `DATABASE_URL` | Your Neon PostgreSQL URL | ☑ Production ☑ Preview ☑ Development |
| `JWT_SECRET` | Paste the generated secret from Step 1 | ☑ Production ☑ Preview ☑ Development |
| `NODE_ENV` | `production` | ☑ Production ☑ Preview |

**Example DATABASE_URL**:
```
postgresql://neondb_owner:npg_VWYJCfilwL47@ep-lively-cloud-a1lfo3j0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

---

### Step 3: Redeploy (2 minutes)

1. Go to: **Deployments** tab
2. Click on the **latest deployment**
3. Click **"..." (three dots)** on the right
4. Click **"Redeploy"**
5. Click **"Redeploy"** again to confirm
6. ⏳ Wait ~2-3 minutes

---

### Step 4: Test (1 minute)

1. Open your Vercel URL: `https://tds-inventory-sqlite-update.vercel.app`
2. Try logging in:
   - Username: `admin`
   - Password: `admin123`
3. ✅ If login works, your database is connected!

---

## 🔧 If Still Not Working

### Check 1: Environment Variables

Make sure **all three** environments are checked:
- ☑ Production
- ☑ Preview
- ☑ Development

### Check 2: DATABASE_URL Format

Must end with `?sslmode=require`:
```
postgresql://user:pass@host/db?sslmode=require
```

### Check 3: Neon Project Active

1. Go to https://neon.tech/
2. Check your project status
3. If paused, click **"Resume"**

### Check 4: JWT_SECRET Length

Must be **at least 32 characters**. If you see:
```
❌ FATAL ERROR: JWT_SECRET must be at least 32 characters
```

Generate a new one (Step 1 above) and make sure it's long enough.

---

## 📊 Checklist

- [ ] Generated JWT_SECRET (32+ characters)
- [ ] Added DATABASE_URL in Vercel
- [ ] Added JWT_SECRET in Vercel
- [ ] Added NODE_ENV=production in Vercel
- [ ] Checked all 3 environments for each variable
- [ ] Redeployed from Vercel dashboard
- [ ] Waited for deployment to show "Ready"
- [ ] Tested login on production URL

---

## 🎯 Expected Result

After completing all steps:
- ✅ Login page loads
- ✅ Can login with admin/admin123
- ✅ Dashboard shows
- ✅ Can view PC Info, Laptop Info, etc.
- ✅ Can add/edit/delete data
- ✅ No "Failed to fetch" errors

---

## 📞 Still Having Issues?

See detailed guides:
- **Environment Variables**: `ENV_VARIABLES.md`
- **Vercel Setup**: `VERCEL_SETUP_GUIDE.md`
- **All Fixes**: `CODE_REVIEW_AND_FIXES_SUMMARY.md`

Or check Vercel logs:
1. Vercel → Deployments → Latest
2. Click **"Runtime Logs"**
3. Look for error messages

---

**Total Time**: ~8 minutes ⏱️  
**Difficulty**: Easy ⭐

---

Last Updated: October 30, 2025

