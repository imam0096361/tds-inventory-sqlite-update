# 🔄 Migration Guide: SQLite to PostgreSQL

This guide helps you migrate from the SQLite version to the PostgreSQL version of the TDS IT Inventory Management System.

---

## 📋 Overview

### What Changed?
- **Database**: SQLite → PostgreSQL
- **Server File**: `server.cjs` (SQLite) → `server-postgres.cjs` (PostgreSQL)
- **Configuration**: Added environment variable support for database connection

### Why PostgreSQL?
- ✅ **Vercel Compatibility**: Works with serverless deployments
- ✅ **Scalability**: Better performance with multiple users
- ✅ **Concurrent Access**: Handles simultaneous database operations better
- ✅ **Production Ready**: Industry standard for web applications

---

## 🚀 Quick Migration (No Data to Preserve)

If you don't have existing data to migrate, simply:

1. **Install PostgreSQL**:
   ```bash
   npm install pg
   ```

2. **Set up environment variables**:
   - Copy `env.template` to `.env`
   - Add your PostgreSQL connection string

3. **Run with PostgreSQL**:
   ```bash
   npm run dev
   ```

The new server will automatically create all required tables.

---

## 📦 Full Migration (With Existing Data)

If you have existing data in SQLite that you want to migrate:

### Step 1: Export Existing Data

1. **Start your old SQLite version**:
   ```bash
   npm run dev:server:sqlite
   ```

2. **Export all your data to CSV**:
   - Go to **PC Info** → Click "⬇ Export CSV"
   - Go to **Laptop Info** → Click "⬇ Export CSV"
   - Go to **Server Info** → Click "⬇ Export CSV"
   - Go to **Peripheral Log** (Mouse) → Export each section
   - Go to **Keyboard Log** → Export
   - Go to **SSD Log** → Export

3. **Save all CSV files** to a safe location

### Step 2: Set Up PostgreSQL

#### Option A: Local PostgreSQL

1. **Install PostgreSQL**:
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Mac: `brew install postgresql@14`
   - Linux: `sudo apt-get install postgresql`

2. **Create a database**:
   ```bash
   # Mac/Linux
   psql -U postgres
   CREATE DATABASE inventory_db;
   \q

   # Windows (using pgAdmin or command line)
   createdb -U postgres inventory_db
   ```

3. **Configure environment variables**:
   Create a `.env` file:
   ```
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/inventory_db
   NODE_ENV=development
   ```

#### Option B: Cloud PostgreSQL (Recommended for Vercel)

Use one of these providers:
- **Vercel Postgres** (if deploying to Vercel)
- **Supabase** - [supabase.com](https://supabase.com) (Free tier)
- **Railway** - [railway.app](https://railway.app) (Free tier)
- **Neon** - [neon.tech](https://neon.tech) (Free tier)

Copy the connection string they provide.

### Step 3: Start PostgreSQL Server

```bash
npm run dev
```

The server will automatically create all necessary tables in your PostgreSQL database.

### Step 4: Import Your Data

1. **Open your application** at `http://localhost:3000`

2. **Import data for each module**:
   - Go to **PC Info**
   - Click **Import CSV** button
   - Select the PC Info CSV file you exported earlier
   - Verify data imported correctly
   - Repeat for all other modules:
     - Laptop Info
     - Server Info
     - Peripheral Logs (Mouse, Keyboard, SSD)

3. **Verify all data**:
   - Check that all entries are present
   - Test search and filtering
   - Test editing entries
   - Test adding new entries

### Step 5: Clean Up (Optional)

If everything works correctly:

```bash
# Backup your old SQLite database
cp database.db database.db.backup

# You can now safely delete it or keep as backup
# rm database.db
```

---

## 🔧 Manual Migration (Advanced)

If you have a large amount of data, you can migrate programmatically:

### Create Migration Script

Create `migrate-sqlite-to-postgres.cjs`:

```javascript
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

// SQLite connection
const sqliteDb = new sqlite3.Database('./database.db');

// PostgreSQL connection
const pgPool = new Pool({
    connectionString: 'postgresql://username:password@localhost:5432/inventory_db'
});

async function migrate() {
    console.log('Starting migration...');

    // Migrate PCs
    await new Promise((resolve) => {
        sqliteDb.all('SELECT * FROM pcs', async (err, rows) => {
            if (err) {
                console.error('Error reading PCs:', err);
                return resolve();
            }
            
            for (const row of rows) {
                await pgPool.query(
                    'INSERT INTO pcs (id, department, ip, "pcName", username, motherboard, cpu, ram, storage, monitor, os, status, floor, "customFields") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
                    [row.id, row.department, row.ip, row.pcName, row.username, row.motherboard, row.cpu, row.ram, row.storage, row.monitor, row.os, row.status, row.floor, row.customFields || '{}']
                );
            }
            
            console.log(`Migrated ${rows.length} PCs`);
            resolve();
        });
    });

    // Migrate Laptops
    await new Promise((resolve) => {
        sqliteDb.all('SELECT * FROM laptops', async (err, rows) => {
            if (err) {
                console.error('Error reading laptops:', err);
                return resolve();
            }
            
            for (const row of rows) {
                await pgPool.query(
                    'INSERT INTO laptops (id, "pcName", username, brand, model, cpu, "serialNumber", ram, storage, "userStatus", department, date, "hardwareStatus", "customFields") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
                    [row.id, row.pcName, row.username, row.brand, row.model, row.cpu, row.serialNumber, row.ram, row.storage, row.userStatus, row.department, row.date, row.hardwareStatus, row.customFields || '{}']
                );
            }
            
            console.log(`Migrated ${rows.length} Laptops`);
            resolve();
        });
    });

    // Add similar blocks for other tables (servers, mouseLogs, keyboardLogs, ssdLogs)

    console.log('Migration complete!');
    sqliteDb.close();
    await pgPool.end();
}

migrate().catch(console.error);
```

### Run Migration

```bash
node migrate-sqlite-to-postgres.cjs
```

---

## ⚙️ Configuration Changes

### Package.json Scripts

The scripts have been updated:

```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:server\" \"npm:dev:client\"",
    "dev:server": "node server-postgres.cjs",      // Now uses PostgreSQL
    "dev:server:sqlite": "node server.cjs",        // SQLite still available
    "start": "node server-postgres.cjs"
  }
}
```

### Environment Variables

New `.env` file required:

```
# PostgreSQL Connection (Required)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Alternative (some providers use this)
POSTGRES_URL=postgresql://username:password@localhost:5432/database_name

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Server Files

| File | Database | Usage |
|------|----------|-------|
| `server.cjs` | SQLite | Legacy/local development |
| `server-postgres.cjs` | PostgreSQL | Production/Vercel |

---

## 🔍 Verification Checklist

After migration, verify:

- [ ] All PC entries migrated
- [ ] All Laptop entries migrated (including username field)
- [ ] All Server entries migrated
- [ ] All Peripheral logs migrated (Mouse, Keyboard, SSD)
- [ ] Custom fields preserved
- [ ] Can add new entries
- [ ] Can edit existing entries
- [ ] Can delete entries
- [ ] Export to CSV works
- [ ] Import from CSV works
- [ ] Search and filter work
- [ ] Dashboard displays correctly
- [ ] Department Summary shows correct data

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to PostgreSQL"

**Solutions:**
1. Check PostgreSQL is running:
   ```bash
   # Mac/Linux
   pg_isready
   
   # Check service status
   sudo service postgresql status
   ```

2. Verify connection string in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

3. Check PostgreSQL accepts connections:
   ```bash
   psql -U postgres -h localhost
   ```

### Issue: "Table does not exist"

**Solution:**
The tables are created automatically. If they're not created:
1. Check server logs for errors
2. Verify database permissions
3. Manually run table creation queries from `server-postgres.cjs`

### Issue: "Import fails with customFields error"

**Solution:**
PostgreSQL uses JSONB for custom fields. The import should handle this automatically, but if it fails:
1. Ensure your CSV has `customFields` as valid JSON: `{}`
2. Or remove the `customFields` column from CSV before importing

### Issue: "Performance is slow"

**Solutions:**
1. Add indexes to frequently queried columns
2. Use connection pooling (already implemented)
3. Consider upgrading your PostgreSQL hosting plan

---

## 💡 Tips

### Keep Both Versions Temporarily

During transition, you can keep both working:

```bash
# Run SQLite version
npm run dev:server:sqlite

# In another terminal, run Vite client
npm run dev:client

# Or run PostgreSQL version
npm run dev
```

### Backup Strategy

After migration:
1. **Keep your SQLite database** as a backup for 1-2 weeks
2. **Export to CSV weekly** as an additional backup
3. **Set up automated PostgreSQL backups** (most providers offer this)

### Testing Locally Before Deploying

1. Test with PostgreSQL locally first
2. Verify all features work
3. Then deploy to Vercel
4. This helps identify issues before production deployment

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Vercel Postgres Guide](https://vercel.com/docs/storage/vercel-postgres)
- [pg (node-postgres) Documentation](https://node-postgres.com/)

---

## ✅ Migration Complete!

Once migration is complete and verified:

1. ✅ Update your Git repository
2. ✅ Deploy to Vercel (see `DEPLOYMENT.md`)
3. ✅ Share the new URL with your team
4. ✅ Celebrate! 🎉

---

**Need help? Check `DEPLOYMENT.md` for Vercel deployment or open an issue on GitHub.**

