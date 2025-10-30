# 🚨 QUICK FIX: Cost Management Error

## ⚡ The Problem:
```
Error: column "username" of relation "maintenance_costs" does not exist
```

**Why?** Your database `maintenance_costs` table is missing the new columns we added.

---

## ✅ **EASY FIX (Choose ONE method):**

### **Method 1: Auto-fix (RECOMMENDED for Docker)**

Run this on your **Ubuntu server**:

```bash
# 1. Pull latest code
cd /home/star/it-inventory/tds-inventory-sqlite-update
git pull origin main

# 2. Copy the SQL file into the backend container
docker cp fix-maintenance-table.sql tds-inventory-backend:/app/

# 3. Run the SQL to add missing columns
docker exec tds-inventory-backend sh -c "psql \$DATABASE_URL -f /app/fix-maintenance-table.sql"

# 4. Restart backend
docker-compose -f docker-compose.full.yml restart backend

# 5. Done! Try adding maintenance cost now
```

---

### **Method 2: Manual SQL (For Neon DB or if you prefer)**

Go to your **Neon dashboard** → SQL Editor → Run this:

```sql
ALTER TABLE maintenance_costs
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS warranty_status TEXT,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS completion_date DATE;
```

---

## 🎯 **What This Does:**

Adds 8 new columns to your `maintenance_costs` table:
- ✅ `username` - Who uses the asset
- ✅ `status` - Pending/Completed/Cancelled  
- ✅ `priority` - Low/Medium/High/Critical
- ✅ `invoice_number` - Track invoices
- ✅ `warranty_status` - In/Out of warranty
- ✅ `approval_status` - Approve/reject tracking
- ✅ `approved_by` - Who approved
- ✅ `completion_date` - When work finished

---

## 🧪 **Test After Fix:**

1. Go to **Cost Management** page
2. Click **"+ Add Maintenance Cost"**
3. Fill in the form (including Username field)
4. Click **"Add Maintenance Cost"**
5. **Should work now!** ✅

---

## 💡 **Why Did This Happen?**

The new code expects these columns, but your database was created with the old schema. This SQL migration adds them.

---

## 🆘 **Still Having Issues?**

Run this to check your database:

```bash
docker exec tds-inventory-backend node -e "
require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}});
pool.query('SELECT column_name FROM information_schema.columns WHERE table_name=\\'maintenance_costs\\'').then(r => console.log('Columns:', r.rows.map(r=>r.column_name).join(', '))).then(() => process.exit(0));
"
```

This will show you all columns in your table!

