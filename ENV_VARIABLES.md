# Environment Variables Configuration

## 📋 Overview

This file documents all environment variables required for the IT Inventory Management System.

## ⚙️ Required Environment Variables

### 1. **Database Configuration**

```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

- **Purpose**: PostgreSQL database connection string
- **Required**: Yes
- **Format**: `postgresql://username:password@host:port/database?sslmode=require`
- **Examples**:
  - **Neon** (recommended for Vercel): `postgresql://user:password@ep-xxx.aws.neon.tech/database?sslmode=require`
  - **Local**: `postgresql://postgres:password@localhost:5432/inventory_db`

```env
POSTGRES_URL=
```

- **Purpose**: Alternative PostgreSQL URL (used by some hosting providers)
- **Required**: No (optional, used by Vercel Postgres)

### 2. **Server Configuration**

```env
PORT=5000
```

- **Purpose**: Backend API server port
- **Required**: No (defaults to 5000)
- **Development**: `5000`
- **Production**: Automatically set by hosting provider (Vercel)

```env
NODE_ENV=development
```

- **Purpose**: Application environment
- **Required**: Yes
- **Values**: `development` | `production`
- **Development**: `development`
- **Production**: `production`

### 3. **Authentication & Security** (CRITICAL!)

```env
JWT_SECRET=your-32-character-or-longer-secret-here
```

- **Purpose**: Secret key for signing JWT tokens
- **Required**: **YES** (application will not start without it!)
- **Length**: **Minimum 32 characters** (enforced by server)
- **Security**: Use a cryptographically secure random string

#### 🔐 Generate Secure JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6`

### 4. **AI Configuration** (Optional)

```env
AI_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here
```

- **Purpose**: Enable AI Assistant features
- **Required**: No (optional, but needed for AI features)
- **AI_ENABLED**: `true` | `false`
- **AI_PROVIDER**: Currently only `gemini` is supported
- **GEMINI_API_KEY**: Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 5. **Frontend Configuration** (for Vite)

```env
VITE_API_URL=
```

- **Purpose**: API base URL for frontend requests
- **Required**: No
- **Development**: `http://localhost:5000` (optional, auto-detected)
- **Production**: Leave empty for same-origin requests

---

## 🚀 Local Development Setup

### Step 1: Create `.env` file

Copy the template below and save it as `.env` in the project root:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/inventory_db
NODE_ENV=development
PORT=5000

# Authentication (REQUIRED!)
JWT_SECRET=REPLACE_WITH_SECURE_32_CHAR_SECRET

# AI (Optional)
AI_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
```

### Step 2: Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and replace `REPLACE_WITH_SECURE_32_CHAR_SECRET` in your `.env` file.

### Step 3: Set Database URL

Update `DATABASE_URL` with your actual database credentials.

---

## ☁️ Vercel Production Setup

### Step 1: Go to Vercel Dashboard

1. Navigate to: https://vercel.com/dashboard
2. Select your project: `tds-inventory-sqlite-update`
3. Click **Settings** → **Environment Variables**

### Step 2: Add Environment Variables

Add the following variables:

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_xxx@ep-xxx.aws.neon.tech/neondb?sslmode=require` | ☑ Production ☑ Preview ☑ Development |
| `NODE_ENV` | `production` | ☑ Production ☑ Preview |
| `JWT_SECRET` | (use 32+ char secure secret) | ☑ Production ☑ Preview ☑ Development |
| `GEMINI_API_KEY` | (your API key) | ☑ Production ☑ Preview (optional) |

### Step 3: Generate Secure JWT_SECRET for Production

**IMPORTANT**: Use a different, secure secret for production!

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4: Redeploy

After adding/updating environment variables:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"..." (three dots)** → **"Redeploy"**
4. Wait for deployment to complete (~2-3 minutes)

---

## ⚠️ Security Best Practices

### ✅ DO:
- ✅ Use **different** JWT_SECRET for development and production
- ✅ Use **cryptographically secure** random strings (use the node command above)
- ✅ Keep `.env` file in `.gitignore` (already configured)
- ✅ Use **at least 32 characters** for JWT_SECRET (64+ recommended for production)
- ✅ Rotate secrets periodically (every 3-6 months)

### ❌ DON'T:
- ❌ Commit `.env` file to version control
- ❌ Share environment variables publicly
- ❌ Use weak or simple secrets like "your-secret-key"
- ❌ Reuse the same secret across multiple projects
- ❌ Use secrets shorter than 32 characters

---

## 🔍 Troubleshooting

### Error: "JWT_SECRET environment variable is required"

**Cause**: JWT_SECRET is missing or too short (< 32 characters)

**Solution**:
1. Generate a secure secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Add to `.env` file (local) or Vercel environment variables (production)
3. Restart server (local) or redeploy (Vercel)

### Error: "Error connecting to PostgreSQL database"

**Cause**: DATABASE_URL is incorrect or database is not accessible

**Solution**:
1. Verify DATABASE_URL format is correct
2. Check database credentials (username, password)
3. Ensure database server is running and accessible
4. For Neon: Verify connection string includes `?sslmode=require`

### Error: "Failed to fetch" in production

**Cause**: Environment variables not set in Vercel or deployment not redeployed after changes

**Solution**:
1. Verify all required environment variables are set in Vercel
2. Make sure they're enabled for Production, Preview, and Development
3. Redeploy the application after adding variables

---

## 📝 Environment Variable Checklist

### Local Development:
- [ ] Created `.env` file
- [ ] Set `DATABASE_URL` with local PostgreSQL
- [ ] Generated and set `JWT_SECRET` (32+ characters)
- [ ] Set `NODE_ENV=development`
- [ ] (Optional) Set `GEMINI_API_KEY` for AI features

### Vercel Production:
- [ ] Added `DATABASE_URL` in Vercel dashboard
- [ ] Added `JWT_SECRET` in Vercel dashboard (different from local!)
- [ ] Added `NODE_ENV=production` in Vercel dashboard
- [ ] (Optional) Added `GEMINI_API_KEY` in Vercel dashboard
- [ ] Enabled variables for all environments (Production, Preview, Development)
- [ ] Redeployed application after adding variables
- [ ] Tested login and API calls after deployment

---

## 📚 Additional Resources

- **Neon PostgreSQL**: https://neon.tech/
- **Google Gemini API**: https://makersuite.google.com/app/apikey
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **JWT Best Practices**: https://tools.ietf.org/html/rfc7519

---

**Last Updated**: October 30, 2025

