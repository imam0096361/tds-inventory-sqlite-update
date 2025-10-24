const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL database:', err.message);
    } else {
        console.log('✅ Connected to PostgreSQL database');
        release();
    }
});

// Health check endpoint - to verify database connection
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            status: 'OK', 
            database: 'Connected',
            timestamp: result.rows[0].now,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ 
            status: 'ERROR', 
            database: 'Disconnected',
            error: error.message,
            environment: process.env.NODE_ENV || 'development'
        });
    }
});

// Initialize database tables
async function initDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS pcs (
                id TEXT PRIMARY KEY,
                department TEXT,
                ip TEXT,
                "pcName" TEXT,
                username TEXT,
                motherboard TEXT,
                cpu TEXT,
                ram TEXT,
                storage TEXT,
                monitor TEXT,
                os TEXT,
                status TEXT,
                floor INTEGER,
                "customFields" JSONB DEFAULT '{}'::jsonb
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS laptops (
                id TEXT PRIMARY KEY,
                "pcName" TEXT,
                username TEXT,
                brand TEXT,
                model TEXT,
                cpu TEXT,
                "serialNumber" TEXT,
                ram TEXT,
                storage TEXT,
                "userStatus" TEXT,
                department TEXT,
                date TEXT,
                "hardwareStatus" TEXT,
                "customFields" JSONB DEFAULT '{}'::jsonb
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS servers (
                id TEXT PRIMARY KEY,
                "serverID" TEXT,
                brand TEXT,
                model TEXT,
                cpu TEXT,
                "totalCores" INTEGER,
                ram TEXT,
                storage TEXT,
                raid TEXT,
                status TEXT,
                department TEXT,
                "customFields" JSONB DEFAULT '{}'::jsonb
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS "mouseLogs" (
                id TEXT PRIMARY KEY,
                "productName" TEXT,
                "serialNumber" TEXT,
                "pcName" TEXT,
                "pcUsername" TEXT,
                department TEXT,
                date TEXT,
                time TEXT,
                "servicedBy" TEXT,
                comment TEXT
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS "keyboardLogs" (
                id TEXT PRIMARY KEY,
                "productName" TEXT,
                "serialNumber" TEXT,
                "pcName" TEXT,
                "pcUsername" TEXT,
                department TEXT,
                date TEXT,
                time TEXT,
                "servicedBy" TEXT,
                comment TEXT
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS "ssdLogs" (
                id TEXT PRIMARY KEY,
                "productName" TEXT,
                "serialNumber" TEXT,
                "pcName" TEXT,
                "pcUsername" TEXT,
                department TEXT,
                date TEXT,
                time TEXT,
                "servicedBy" TEXT,
                comment TEXT
            )
        `);

        console.log('✅ Database tables initialized');
    } catch (err) {
        console.error('Error initializing database:', err.message);
    } finally {
        client.release();
    }
}

// Initialize database on startup
initDatabase();

// ============= PC ENDPOINTS =============
app.get('/api/pcs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pcs');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/pcs', async (req, res) => {
    const { id, department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, customFields } = req.body;
    try {
        await pool.query(
            'INSERT INTO pcs (id, department, ip, "pcName", username, motherboard, cpu, ram, storage, monitor, os, status, floor, "customFields") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
            [id, department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, JSON.stringify(customFields || {})]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/pcs/:id', async (req, res) => {
    const { department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, customFields } = req.body;
    try {
        const result = await pool.query(
            'UPDATE pcs SET department = $1, ip = $2, "pcName" = $3, username = $4, motherboard = $5, cpu = $6, ram = $7, storage = $8, monitor = $9, os = $10, status = $11, floor = $12, "customFields" = $13 WHERE id = $14',
            [department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, JSON.stringify(customFields || {}), req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/pcs/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM pcs WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= LAPTOP ENDPOINTS =============
app.get('/api/laptops', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM laptops');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/laptops', async (req, res) => {
    const { id, pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, customFields } = req.body;
    try {
        await pool.query(
            'INSERT INTO laptops (id, "pcName", username, brand, model, cpu, "serialNumber", ram, storage, "userStatus", department, date, "hardwareStatus", "customFields") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
            [id, pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, JSON.stringify(customFields || {})]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/laptops/:id', async (req, res) => {
    const { pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, customFields } = req.body;
    try {
        const result = await pool.query(
            'UPDATE laptops SET "pcName" = $1, username = $2, brand = $3, model = $4, cpu = $5, "serialNumber" = $6, ram = $7, storage = $8, "userStatus" = $9, department = $10, date = $11, "hardwareStatus" = $12, "customFields" = $13 WHERE id = $14',
            [pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, JSON.stringify(customFields || {}), req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/laptops/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM laptops WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= SERVER ENDPOINTS =============
app.get('/api/servers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM servers');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/servers', async (req, res) => {
    const { id, serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, customFields } = req.body;
    try {
        await pool.query(
            'INSERT INTO servers (id, "serverID", brand, model, cpu, "totalCores", ram, storage, raid, status, department, "customFields") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
            [id, serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, JSON.stringify(customFields || {})]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/servers/:id', async (req, res) => {
    const { serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, customFields } = req.body;
    try {
        const result = await pool.query(
            'UPDATE servers SET "serverID" = $1, brand = $2, model = $3, cpu = $4, "totalCores" = $5, ram = $6, storage = $7, raid = $8, status = $9, department = $10, "customFields" = $11 WHERE id = $12',
            [serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, JSON.stringify(customFields || {}), req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/servers/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM servers WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= MOUSE LOG ENDPOINTS =============
app.get('/api/mouselogs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "mouseLogs"');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/mouselogs', async (req, res) => {
    const { id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    try {
        await pool.query(
            'INSERT INTO "mouseLogs" (id, "productName", "serialNumber", "pcName", "pcUsername", department, date, time, "servicedBy", comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/mouselogs/:id', async (req, res) => {
    const { productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    try {
        const result = await pool.query(
            'UPDATE "mouseLogs" SET "productName" = $1, "serialNumber" = $2, "pcName" = $3, "pcUsername" = $4, department = $5, date = $6, time = $7, "servicedBy" = $8, comment = $9 WHERE id = $10',
            [productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment, req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/mouselogs/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM "mouseLogs" WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= KEYBOARD LOG ENDPOINTS =============
app.get('/api/keyboardlogs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "keyboardLogs"');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/keyboardlogs', async (req, res) => {
    const { id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    try {
        await pool.query(
            'INSERT INTO "keyboardLogs" (id, "productName", "serialNumber", "pcName", "pcUsername", department, date, time, "servicedBy", comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/keyboardlogs/:id', async (req, res) => {
    const { productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    try {
        const result = await pool.query(
            'UPDATE "keyboardLogs" SET "productName" = $1, "serialNumber" = $2, "pcName" = $3, "pcUsername" = $4, department = $5, date = $6, time = $7, "servicedBy" = $8, comment = $9 WHERE id = $10',
            [productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment, req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/keyboardlogs/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM "keyboardLogs" WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= SSD LOG ENDPOINTS =============
app.get('/api/ssdlogs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "ssdLogs"');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ssdlogs', async (req, res) => {
    const { id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    try {
        await pool.query(
            'INSERT INTO "ssdLogs" (id, "productName", "serialNumber", "pcName", "pcUsername", department, date, time, "servicedBy", comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/ssdlogs/:id', async (req, res) => {
    const { productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    try {
        const result = await pool.query(
            'UPDATE "ssdLogs" SET "productName" = $1, "serialNumber" = $2, "pcName" = $3, "pcUsername" = $4, department = $5, date = $6, time = $7, "servicedBy" = $8, comment = $9 WHERE id = $10',
            [productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment, req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/ssdlogs/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM "ssdLogs" WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'postgresql' });
});

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});

