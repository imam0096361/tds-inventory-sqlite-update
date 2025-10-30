# 🌱 Seed Database Guide

## ❌ Error: Cannot find module 'pg'

You're trying to run `seed-database.cjs` on your Ubuntu host, but `pg` is only installed inside the Docker container.

---

## ✅ Solution: Run Seed Script Inside Container

### Option 1: Run via Docker (Recommended)

```bash
# Copy seed-database.cjs into container and run it
docker cp seed-database.cjs tds-inventory-backend:/app/seed-database.cjs
docker exec -it tds-inventory-backend node seed-database.cjs
```

### Option 2: One-liner (Easier)

```bash
cat seed-database.cjs | docker exec -i tds-inventory-backend node
```

### Option 3: Install Node.js on Host (For Development)

```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
npm install

# Now run seed
node seed-database.cjs
```

---

## 🎯 Recommended: Use Docker

Since you're using Docker, the easiest way is:

```bash
# Step 1: Make sure backend container is running
docker ps | grep tds-inventory-backend

# Step 2: Copy seed script to container
docker cp seed-database.cjs tds-inventory-backend:/app/seed-database.cjs

# Step 3: Copy .env to container (if not already mounted)
docker cp .env tds-inventory-backend:/app/.env

# Step 4: Run seed script inside container
docker exec -it tds-inventory-backend node seed-database.cjs
```

**Expected Output:**
```
🌱 Seeding database...
✅ Seeded 15 PCs
✅ Seeded 12 Laptops  
✅ Seeded 8 Servers
✅ Seeded 10 Mouse Logs
✅ Seeded 10 Keyboard Logs
✅ Seeded 10 SSD Logs
✅ Seeded 10 Headphone Logs
✅ Seeded 10 Portable HDD Logs
✅ Database seeded successfully!
```

---

## 🔧 Alternative: Manual Insert via Neon Console

If Docker method doesn't work:

1. Go to https://console.neon.tech/
2. Click on your project
3. Open **SQL Editor**
4. Run seed script SQL manually

Or add data one by one through the UI after logging in.

---

## 📝 Check Data Was Added

```bash
# Count records in each table
docker exec -it tds-inventory-backend node -e "
require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
Promise.all([
  pool.query('SELECT COUNT(*) FROM pcs'),
  pool.query('SELECT COUNT(*) FROM laptops'),
  pool.query('SELECT COUNT(*) FROM servers')
]).then(([pcs, laps, srv]) => {
  console.log('✅ PCs:', pcs.rows[0].count);
  console.log('✅ Laptops:', laps.rows[0].count);
  console.log('✅ Servers:', srv.rows[0].count);
});
"
```

Should show:
```
✅ PCs: 15
✅ Laptops: 12
✅ Servers: 8
```

---

## 🆘 Troubleshooting

### Backend container not running?
```bash
docker-compose -f docker-compose.full.yml up -d backend
```

### .env file missing?
```bash
# Check if .env exists
cat .env

# If not, create it
cp .env.template .env
nano .env  # Add your Neon DATABASE_URL
```

### Still having issues?
Just add data manually through the web UI after logging in!

---

**Quick Command:**
```bash
docker cp seed-database.cjs tds-inventory-backend:/app/seed-database.cjs && docker exec -it tds-inventory-backend node seed-database.cjs
```

