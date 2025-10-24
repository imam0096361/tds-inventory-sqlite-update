# Installing PostgreSQL on Windows

## Quick Install Guide

### Step 1: Download PostgreSQL

1. Go to: https://www.postgresql.org/download/windows/
2. Click **"Download the installer"**
3. Download the latest version (PostgreSQL 16.x)
4. Choose Windows x86-64

### Step 2: Run the Installer

1. Double-click the downloaded `.exe` file
2. Click **Next** through the welcome screens
3. **Installation Directory**: Keep default (`C:\Program Files\PostgreSQL\16`)
4. **Select Components**: Keep all selected (PostgreSQL Server, pgAdmin, Command Line Tools)
5. **Data Directory**: Keep default
6. **Password**: Set a password for the `postgres` user (REMEMBER THIS!)
7. **Port**: Keep default (5432)
8. **Locale**: Keep default
9. Click **Next** and **Finish**

### Step 3: Add PostgreSQL to PATH

1. Press `Win + X` and select **System**
2. Click **Advanced system settings**
3. Click **Environment Variables**
4. Under **System variables**, find and select **Path**
5. Click **Edit**
6. Click **New**
7. Add: `C:\Program Files\PostgreSQL\16\bin`
8. Click **OK** on all windows
9. **Restart your terminal** or PowerShell

### Step 4: Verify Installation

Open a NEW PowerShell/Terminal window and run:

```powershell
psql --version
```

You should see: `psql (PostgreSQL) 16.x`

### Step 5: Create Database

```powershell
# Login to PostgreSQL (enter your password when prompted)
psql -U postgres

# In the psql prompt, create the database:
CREATE DATABASE inventory_db;

# Verify it was created:
\l

# Exit:
\q
```

### Step 6: Test Connection

```powershell
psql -U postgres -d inventory_db
```

If you can connect, you're all set!

---

## Troubleshooting

### "psql is not recognized"
- Make sure you added PostgreSQL to PATH (Step 3)
- Restart your terminal/PowerShell
- Try using full path: `"C:\Program Files\PostgreSQL\16\bin\psql.exe" --version`

### Can't connect / Authentication failed
- Double-check your password
- Make sure PostgreSQL service is running:
  - Press `Win + R`
  - Type `services.msc`
  - Find "postgresql-x64-16"
  - Right-click → Start

### Port 5432 already in use
- Another program is using port 5432
- During installation, choose a different port (e.g., 5433)
- Update your connection string accordingly

---

## Next Steps

After installation, run:

```powershell
cd "D:\Download running latest\copy-of-tds-it-inventory"
```

Then create a `.env` file with:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/inventory_db
NODE_ENV=development
PORT=3001
```

Replace `YOUR_PASSWORD` with the password you set during installation.

Then run:

```powershell
npm run dev
```

Your app should now be running with PostgreSQL! 🎉

