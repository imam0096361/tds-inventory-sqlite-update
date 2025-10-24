# 🚀 Deployment Guide for Vercel

This guide will walk you through deploying the TDS IT Inventory Management System to Vercel with PostgreSQL database.

## Why PostgreSQL Instead of SQLite?

SQLite doesn't work well with Vercel because:
- **Vercel is serverless** - Each request runs in an isolated environment
- **No persistent filesystem** - SQLite files can't be saved between requests
- **Read-only filesystem** - Serverless functions can't write to disk

**PostgreSQL solves these issues** by providing:
- ✅ Centralized database that all serverless functions can access
- ✅ Persistent data storage
- ✅ Better performance for multiple concurrent users

---

## 📋 Prerequisites

1. **GitHub Account** - To host your code
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Your code pushed to GitHub** - Complete the GitHub setup first

---

## 🗄️ Step 1: Set Up PostgreSQL Database

You have several options for PostgreSQL hosting:

### Option A: Vercel Postgres (Recommended - Easiest)

1. Go to your Vercel dashboard
2. Click on the **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose your database name and region
6. Click **Create**
7. Vercel will automatically provide environment variables

### Option B: Supabase (Free Tier Available)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the **Connection String** (PostgreSQL)
5. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

### Option C: Railway (Free Tier Available)

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add **PostgreSQL** service
4. Copy the **Connection URL** from the database settings

### Option D: Neon (Generous Free Tier)

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string provided

---

## ☁️ Step 2: Deploy to Vercel

### 2.1 Push Your Code to GitHub

If you haven't already:

```bash
# Make sure you're in your project directory
cd path/to/copy-of-tds-it-inventory

# Add all changes
git add .

# Commit with a message
git commit -m "Add PostgreSQL support for Vercel deployment"

# Push to GitHub
git push origin main
```

### 2.2 Import Project to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. **Import** your GitHub repository
4. Vercel will detect the project settings automatically

### 2.3 Configure Build Settings

Make sure these settings are correct (Vercel should auto-detect):

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run vercel-build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 2.4 Add Environment Variables

Before deploying, add these environment variables:

1. In Vercel project settings, go to **Environment Variables**
2. Add the following:

```
DATABASE_URL=your_postgresql_connection_string
POSTGRES_URL=your_postgresql_connection_string
NODE_ENV=production
PORT=3001
```

**Example PostgreSQL connection string:**
```
postgresql://username:password@host:5432/database_name
```

**Notes:**
- Both `DATABASE_URL` and `POSTGRES_URL` should have the same value
- If using Vercel Postgres, these are automatically added
- Replace placeholders with your actual database credentials

### 2.5 Deploy!

1. Click **Deploy**
2. Wait for the build to complete (2-3 minutes)
3. You'll get a URL like: `https://your-project.vercel.app`

---

## ✅ Step 3: Verify Your Deployment

### 3.1 Check Database Connection

1. Open your deployed app URL
2. Check the browser console (F12) for any errors
3. Try adding a PC or Laptop entry to test database writes

### 3.2 Test All Features

- ✅ Dashboard loads correctly
- ✅ Can add new PC entries
- ✅ Can add new Laptop entries
- ✅ Can edit entries
- ✅ Can delete entries
- ✅ Can export to CSV
- ✅ Can import from CSV
- ✅ All charts display correctly

### 3.3 Check Deployment Logs

If something isn't working:

1. Go to Vercel dashboard → Your project
2. Click on the latest deployment
3. Check the **Function Logs** tab
4. Look for any errors

---

## 🔄 Step 4: Updating Your Deployment

Vercel has **automatic deployments** enabled by default!

Every time you push to GitHub:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build your project
3. Deploy the new version
4. Give you a preview URL

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
- Verify `DATABASE_URL` or `POSTGRES_URL` is set in Vercel environment variables
- Check that your database is running and accessible
- Make sure the connection string format is correct
- Check database provider firewall settings

### Issue: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Commit and push
git add .
git commit -m "Fix dependencies"
git push origin main
```

### Issue: Build fails on Vercel

**Solution:**
- Check the build logs in Vercel dashboard
- Make sure all dependencies are in `package.json` (not just devDependencies)
- Verify `vercel.json` is correctly configured

### Issue: Database tables not created

**Solution:**
The server automatically creates tables on first run. If tables aren't created:
- Check function logs for SQL errors
- Manually connect to your PostgreSQL database and run the CREATE TABLE queries from `server-postgres.cjs`

### Issue: Data from local SQLite not showing on Vercel

**Solution:**
This is expected! SQLite and PostgreSQL are separate databases. To migrate data:
1. Export all data to CSV from your local app
2. Import the CSV files into your deployed app
3. Or manually migrate data using a database tool

---

## 🔧 Advanced Configuration

### Custom Domain

1. Go to Vercel project settings → **Domains**
2. Add your custom domain
3. Follow the DNS configuration instructions
4. Wait for DNS propagation (up to 48 hours)

### Environment Variables for Different Environments

Vercel supports different environment variables per environment:
- **Production** - Main deployment
- **Preview** - Pull request deployments
- **Development** - Local development

Set variables for each environment separately.

### Monitoring and Analytics

1. Go to **Analytics** tab in Vercel dashboard
2. Enable **Web Analytics** for traffic insights
3. Check **Function Logs** for backend monitoring

---

## 📊 Database Management

### Viewing Data Directly

**Option 1: Use your database provider's UI**
- Supabase: Built-in table editor
- Railway: Database viewer
- Vercel Postgres: Data browser

**Option 2: Use a PostgreSQL client**
- [pgAdmin](https://www.pgadmin.org/)
- [DBeaver](https://dbeaver.io/)
- [TablePlus](https://tableplus.com/)

Connect using your `DATABASE_URL` connection string.

### Backing Up Data

**Method 1: Export to CSV from the app**
- Use the built-in export functionality
- Download CSV files for each module

**Method 2: Database dump**
```bash
# If using pg_dump locally
pg_dump -h hostname -U username -d database_name > backup.sql
```

### Restoring Data

**Method 1: Import CSV via the app**
- Use the import functionality

**Method 2: SQL restore**
```bash
psql -h hostname -U username -d database_name < backup.sql
```

---

## 🎯 Next Steps

After successful deployment:

1. **Set up monitoring** - Track errors and performance
2. **Add authentication** - Protect sensitive data
3. **Set up backups** - Regular database backups
4. **Custom domain** - Use your own domain name
5. **Test thoroughly** - Ensure all features work as expected

---

## 📞 Need Help?

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **PostgreSQL Documentation**: [postgresql.org/docs](https://www.postgresql.org/docs/)
- **Project Issues**: Open an issue on GitHub

---

**Happy Deploying! 🚀**

