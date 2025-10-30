# 🚀 Vercel Deployment Guide - Complete Setup

## ✅ FIXES APPLIED

This guide reflects the **latest code fixes** applied to resolve database connection issues on Vercel.

### What Was Fixed:
- ✅ **Centralized API Configuration** - All pages now use consistent API URLs
- ✅ **SSL Configuration** - Fixed for Neon PostgreSQL compatibility  
- ✅ **CORS Configuration** - Updated to support Vercel preview deployments
- ✅ **Environment Variables** - Proper detection of production vs development
- ✅ **JWT Secret Validation** - Enforced 32+ character minimum

---

## 🎯 Quick Start Checklist

- [ ] 1. Database setup (Neon PostgreSQL)
- [ ] 2. Environment variables configured in Vercel
- [ ] 3. JWT_SECRET generated (32+ characters)
- [ ] 4. Code deployed to GitHub
- [ ] 5. Vercel project connected to GitHub
- [ ] 6. First deployment successful
- [ ] 7. Database tables created
- [ ] 8. Test login and data operations

---

## 📦 Part 1: Database Setup (Neon PostgreSQL)

### Why Neon?
- ✅ Free tier available
- ✅ Serverless (perfect for Vercel)
- ✅ Auto-scaling
- ✅ Built-in connection pooling
- ✅ SSL support

### Step 1: Create Neon Account

1. Go to https://neon.tech/
2. Click **"Sign Up"** (use GitHub for quick setup)
3. Create a new project

### Step 2: Create Database

1. In Neon dashboard, click **"Create Project"**
2. **Project Name**: `it-inventory-system`
3. **PostgreSQL Version**: Select latest (15 or 16)
4. **Region**: Choose closest to your users (e.g., `AWS US East`)
5. Click **"Create Project"**

### Step 3: Get Connection String

1. After project is created, click **"Connection Details"**
2. Copy the **Connection String** (looks like this):
   ```
   postgresql://neondb_owner:npg_xxx@ep-xxx.aws.neon.tech/neondb?sslmode=require
   ```
3. Save this - you'll need it for Vercel environment variables

---

## ⚙️ Part 2: Vercel Setup

### Step 1: Create Vercel Account

1. Go to https://vercel.com/
2. Click **"Sign Up"**
3. **Use GitHub** for authentication (recommended)

### Step 2: Import Project from GitHub

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find your GitHub repository: `tds-inventory-sqlite-update`
4. Click **"Import"**

### Step 3: Configure Project

**Framework Preset**: Vite  
**Root Directory**: `./` (leave as default)  
**Build Command**: `npm run vercel-build` (should auto-detect)  
**Output Directory**: `dist` (should auto-detect)

### Step 4: Add Environment Variables

**BEFORE** deploying, click **"Environment Variables"** and add:

| Variable | Value | Environments |
|----------|-------|--------------|
| `DATABASE_URL` | (your Neon connection string) | ☑ Production ☑ Preview ☑ Development |
| `NODE_ENV` | `production` | ☑ Production ☑ Preview |
| `JWT_SECRET` | (generate secure 32+ char secret) | ☑ Production ☑ Preview ☑ Development |
| `GEMINI_API_KEY` | (optional - for AI features) | ☑ Production ☑ Preview |

#### Generate JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64 characters) and paste as `JWT_SECRET` value.

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. You'll see ✅ **"Congratulations!"** when ready

---

## 🗄️ Part 3: Initialize Database Tables

### Option A: Using Neon SQL Editor (Recommended)

1. Go to your Neon dashboard
2. Click **"SQL Editor"**
3. Copy the table creation SQL from `seed-database.cjs`
4. Click **"Run"**

### Option B: Run Seed Script Locally

1. Create a local `.env` file:
   ```env
   DATABASE_URL=your-neon-connection-string
   ```

2. Run seed script:
   ```bash
   node seed-database.cjs
   ```

### Tables Created:
- ✅ users
- ✅ pcs
- ✅ laptops
- ✅ servers
- ✅ mouseLogs
- ✅ keyboardLogs
- ✅ ssdLogs
- ✅ headphoneLogs
- ✅ portableHDDLogs
- ✅ maintenance_costs
- ✅ budgets

---

## 🧪 Part 4: Testing Your Deployment

### Step 1: Access Your Site

Your Vercel URL will be:
```
https://tds-inventory-sqlite-update.vercel.app
```

### Step 2: Test Login

Default credentials (created by seed script):
- **Username**: `admin`
- **Password**: `admin123`

### Step 3: Test Data Operations

1. ✅ **Login**: Try logging in with admin credentials
2. ✅ **View Data**: Navigate to "PC Info" or "Laptop Info"
3. ✅ **Add Data**: Try adding a new PC or laptop
4. ✅ **Edit Data**: Edit an existing entry
5. ✅ **Delete Data**: Delete a test entry
6. ✅ **Search**: Test search functionality
7. ✅ **Export**: Try exporting to CSV

### Step 4: Test AI Assistant (Optional)

If you added `GEMINI_API_KEY`:
1. Navigate to "AI Assistant"
2. Try a query like: "Show me all PCs in IT department"
3. Verify response is relevant

---

## 🔧 Part 5: Common Issues & Fixes

### Issue 1: "Failed to fetch" errors

**Symptoms**:
- Login fails
- Data doesn't load
- API calls timeout

**Causes & Solutions**:

#### Cause A: Environment variables not set
**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify `DATABASE_URL`, `JWT_SECRET`, and `NODE_ENV` are set
3. Check they're enabled for **Production**, **Preview**, and **Development**
4. Redeploy: Deployments → Latest → ... → Redeploy

#### Cause B: Database not accessible
**Solution**:
1. Go to Neon dashboard
2. Check project status (should be "Active")
3. Verify connection string is correct
4. Test connection in Neon SQL Editor

#### Cause C: Build failed
**Solution**:
1. Go to Vercel → Deployments
2. Click on failed deployment
3. Check **"Build Logs"** for errors
4. Fix errors in your code and push to GitHub

### Issue 2: JWT_SECRET error

**Error Message**: `❌ FATAL ERROR: JWT_SECRET environment variable is required and must be at least 32 characters long!`

**Solution**:
1. Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Add to Vercel: Settings → Environment Variables → Edit `JWT_SECRET`
3. Make sure the secret is at least 32 characters (64 recommended)
4. Redeploy

### Issue 3: Database connection timeout

**Error**: `Error connecting to PostgreSQL database`

**Solutions**:

1. **Check Neon project status**:
   - Go to Neon dashboard
   - Ensure project is "Active" (not paused)
   - Free tier projects pause after inactivity - click "Resume"

2. **Verify connection string**:
   - Must end with `?sslmode=require`
   - Should include pooler endpoint: `ep-xxx-pooler.aws.neon.tech`
   - No extra spaces or line breaks

3. **Test connection**:
   - In Neon SQL Editor, run: `SELECT current_database();`
   - Should return database name

### Issue 4: CORS errors

**Error**: `Access to fetch at '...' has been blocked by CORS policy`

**Solution**:
This should be fixed by the latest code, but if you still see it:
1. Check `server-postgres.cjs` has your Vercel URL in CORS origins
2. Verify `NODE_ENV=production` is set in Vercel
3. Redeploy

---

## 🔄 Part 6: Updating Your Deployment

### When You Make Code Changes:

1. **Commit to GitHub**:
   ```bash
   git add .
   git commit -m "Your change description"
   git push origin main
   ```

2. **Vercel Auto-Deploys**:
   - Vercel automatically detects GitHub pushes
   - New deployment starts automatically
   - Wait ~2-3 minutes for completion

3. **Check Deployment Status**:
   - Go to Vercel → Deployments
   - Latest deployment should show ✅ **"Ready"**

### When You Update Environment Variables:

1. **Update in Vercel**:
   - Settings → Environment Variables
   - Edit variable
   - Save

2. **Manual Redeploy Required**:
   - Go to Deployments tab
   - Click on latest deployment
   - Click ... → Redeploy
   - Wait for completion

---

## 🎨 Part 7: Custom Domain (Optional)

### Step 1: Add Domain in Vercel

1. Go to Settings → Domains
2. Click **"Add"**
3. Enter your domain (e.g., `inventory.yourcompany.com`)

### Step 2: Configure DNS

Add these DNS records in your domain provider:

**For subdomain** (e.g., `inventory.yourcompany.com`):
```
Type: CNAME
Name: inventory
Value: cname.vercel-dns.com
```

**For root domain** (e.g., `yourcompany.com`):
```
Type: A
Name: @
Value: 76.76.21.21
```

### Step 3: Update CORS

After domain is active, update `server-postgres.cjs`:

```javascript
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? [
            'https://tds-inventory-sqlite-update.vercel.app',
            'https://inventory.yourcompany.com'  // Add your domain
          ]
        : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
```

Commit and push changes.

---

## 📊 Part 8: Monitoring & Logs

### View Deployment Logs

1. Go to Vercel → Deployments
2. Click on any deployment
3. View tabs:
   - **Building**: Build logs and errors
   - **Runtime Logs**: Server errors and API logs
   - **Edge Logs**: Request logs

### View Function Logs

1. Go to Vercel → Logs
2. Filter by:
   - Time range
   - Function (e.g., `server-postgres.cjs`)
   - Status code
   - Error level

### Common Log Errors to Watch:

- `JWT_SECRET` errors → Check environment variables
- `Database connection` errors → Check Neon project status
- `CORS` errors → Verify allowed origins
- `Module not found` → Verify all dependencies in `package.json`

---

## 🔐 Part 9: Security Best Practices

### Production Security Checklist:

- ✅ Use **different** JWT_SECRET for production (not the same as development)
- ✅ Use **64+ character** JWT secrets (32 minimum)
- ✅ Never commit `.env` files to version control
- ✅ Rotate JWT_SECRET every 3-6 months
- ✅ Use **environment-specific** secrets (Production vs Preview vs Development)
- ✅ Enable Vercel **Environment Variable Encryption** (on by default)
- ✅ Review Vercel **Access Control** settings
- ✅ Monitor logs for suspicious activity
- ✅ Keep dependencies updated (`npm audit`)

### Rotate JWT_SECRET:

1. Generate new secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. Update in Vercel: Settings → Environment Variables
3. Redeploy
4. All users will need to login again (tokens invalidated)

---

## 📞 Part 10: Getting Help

### Deployment Issues:

1. **Check Vercel Logs**: Deployments → [Your Deployment] → Runtime Logs
2. **Check Build Logs**: Deployments → [Your Deployment] → Building
3. **Vercel Discord**: https://vercel.com/discord
4. **Vercel Docs**: https://vercel.com/docs

### Database Issues:

1. **Neon Dashboard**: Check project status and connection details
2. **Neon Discord**: https://neon.tech/discord
3. **Neon Docs**: https://neon.tech/docs

### Code Issues:

1. **Check Browser Console**: F12 → Console tab
2. **Check Network Tab**: F12 → Network tab (filter by Fetch/XHR)
3. **Review ENV_VARIABLES.md**: For environment variable requirements

---

## ✅ Deployment Success Checklist

After following this guide, you should have:

- ✅ Neon PostgreSQL database created and active
- ✅ Vercel project connected to GitHub
- ✅ Environment variables configured correctly
- ✅ JWT_SECRET generated (32+ characters)
- ✅ Application deployed successfully
- ✅ Database tables created
- ✅ Admin user can login
- ✅ Data operations working (add, edit, delete)
- ✅ API calls returning data
- ✅ (Optional) Custom domain configured
- ✅ (Optional) AI Assistant working

---

## 🎉 You're Done!

Your IT Inventory Management System should now be **live and fully functional** on Vercel!

**Your Production URL**: https://tds-inventory-sqlite-update.vercel.app

---

**Last Updated**: October 30, 2025  
**Code Version**: Latest (with centralized API configuration and SSL fixes)

