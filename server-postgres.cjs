const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3001;

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://tds-inventory-sqlite-update.vercel.app'] 
        : ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

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

        await client.query(`
            CREATE TABLE IF NOT EXISTS "headphoneLogs" (
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
            CREATE TABLE IF NOT EXISTS "portableHDDLogs" (
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

        // Users table for authentication
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                role TEXT DEFAULT 'user',
                department TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        `);

        // Create default admin user if not exists (password: admin123)
        const adminCheck = await client.query(`SELECT * FROM users WHERE username = 'admin'`);
        if (adminCheck.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await client.query(`
                INSERT INTO users (id, username, password, full_name, email, role, department)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'admin-' + Date.now(),
                'admin',
                hashedPassword,
                'System Administrator',
                'admin@tds-inventory.com',
                'admin',
                'IT'
            ]);
            console.log('✅ Default admin user created (username: admin, password: admin123)');
        }

        console.log('✅ Database tables initialized');
    } catch (err) {
        console.error('Error initializing database:', err.message);
    } finally {
        client.release();
    }
}

// Initialize database on startup
initDatabase();

// ============= AUTHENTICATION MIDDLEWARE =============
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ============= AUTHENTICATION ENDPOINTS =============

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        // Create JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, fullName: user.full_name, department: user.department },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            user: {
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                department: user.department
            },
            token
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify token
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, full_name, email, role, department FROM users WHERE id = $1', [req.user.id]);
        const user = result.rows[0];
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Register new user (admin only)
app.post('/api/auth/register', authenticateToken, isAdmin, async (req, res) => {
    const { username, password, fullName, email, role, department } = req.body;
    
    try {
        // Check if user already exists
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        await pool.query(
            'INSERT INTO users (id, username, password, full_name, email, role, department) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, username, hashedPassword, fullName, email, role || 'user', department]
        );

        res.json({ message: 'User created successfully', userId: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, full_name, email, role, department, created_at, last_login FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user (admin only)
app.put('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { fullName, email, role, department } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE users SET full_name = $1, email = $2, role = $3, department = $4 WHERE id = $5',
            [fullName, email, role, department, req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Prevent deleting the last admin
        const adminCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
        const targetUser = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
        
        if (targetUser.rows[0]?.role === 'admin' && parseInt(adminCount.rows[0].count) <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last admin user' });
        }

        const result = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    try {
        const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
        const user = result.rows[0];

        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

// ============= HEADPHONE LOG ENDPOINTS =============
app.get('/api/headphonelogs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "headphoneLogs"');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/headphonelogs', async (req, res) => {
    const { id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    try {
        await pool.query(
            'INSERT INTO "headphoneLogs" (id, "productName", "serialNumber", "pcName", "pcUsername", department, date, time, "servicedBy", comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/headphonelogs/:id', async (req, res) => {
    const { productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    try {
        const result = await pool.query(
            'UPDATE "headphoneLogs" SET "productName" = $1, "serialNumber" = $2, "pcName" = $3, "pcUsername" = $4, department = $5, date = $6, time = $7, "servicedBy" = $8, comment = $9 WHERE id = $10',
            [productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment, req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/headphonelogs/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM "headphoneLogs" WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= PORTABLE HDD LOG ENDPOINTS =============
app.get('/api/portablehddlogs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "portableHDDLogs"');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/portablehddlogs', async (req, res) => {
    const { id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    try {
        await pool.query(
            'INSERT INTO "portableHDDLogs" (id, "productName", "serialNumber", "pcName", "pcUsername", department, date, time, "servicedBy", comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/portablehddlogs/:id', async (req, res) => {
    const { productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    try {
        const result = await pool.query(
            'UPDATE "portableHDDLogs" SET "productName" = $1, "serialNumber" = $2, "pcName" = $3, "pcUsername" = $4, department = $5, date = $6, time = $7, "servicedBy" = $8, comment = $9 WHERE id = $10',
            [productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment, req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/portablehddlogs/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM "portableHDDLogs" WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'postgresql' });
});

// ==========================================
// AI ASSISTANT ENDPOINT
// ==========================================

// Initialize Gemini AI (only if API key is provided)
let genAI = null;
if (process.env.GEMINI_API_KEY && process.env.AI_ENABLED === 'true') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✅ Gemini AI initialized');
}

// AI Query Endpoint
app.post('/api/ai-query', authenticateToken, async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ success: false, error: 'Query is required' });
    }

    // Check if AI is enabled
    if (!genAI || process.env.AI_ENABLED !== 'true') {
        return res.status(503).json({ 
            success: false, 
            error: 'AI Assistant is not enabled. Please configure GEMINI_API_KEY in environment variables.' 
        });
    }

    try {
        // Try multiple model names as fallback
        let model;
        const modelNames = [
            'gemini-2.0-flash-exp',
            'gemini-1.5-pro',
            'gemini-1.5-flash-002',
            'gemini-1.5-flash',
            'models/gemini-pro'
        ];

        let lastError = null;
        for (const modelName of modelNames) {
            try {
                model = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: {
                        temperature: 0.1,
                        topK: 1,
                        topP: 1,
                        maxOutputTokens: 2048,
                    }
                });
                console.log(`✅ Successfully initialized model: ${modelName}`);
                break;
            } catch (err) {
                lastError = err;
                console.log(`⚠️ Model ${modelName} failed, trying next...`);
                continue;
            }
        }

        if (!model) {
            throw new Error(`Failed to initialize any Gemini model. Last error: ${lastError?.message}`);
        }

        // Create an enhanced, detailed prompt for Gemini
        const prompt = `You are an expert IT inventory database assistant. Your task is to convert natural language queries into precise, structured JSON for querying a PostgreSQL database.

=== DATABASE SCHEMA ===

1. **PCs Table** (pcs):
   - department (TEXT): HR, IT, Finance, Sales, Marketing, Operations, etc.
   - ip (TEXT): IP address like "192.168.1.100"
   - pcName (TEXT): PC identifier like "IT-PC-01", "HR-DESK-05"
   - username (TEXT): User name like "john.doe", "Sarah Wilson"
   - motherboard (TEXT): "ASUS Prime", "MSI B450", "Gigabyte"
   - cpu (TEXT): "Intel Core i5", "Core i7", "AMD Ryzen 5", "i3", "i7-9700K"
   - ram (TEXT): "8 GB", "16 GB", "32 GB", "4GB"
   - storage (TEXT): "500 GB HDD", "1 TB SSD", "256GB SSD"
   - monitor (TEXT): "Dell 24 inch", "Samsung 27", "LG UltraWide"
   - os (TEXT): "Windows 10", "Windows 11", "Ubuntu", "Linux"
   - status (TEXT): "OK", "NO", "Repair" (EXACT match required)
   - floor (NUMBER): 5, 6, or 7

2. **Laptops Table** (laptops):
   - pcName (TEXT): "LAP-001", "HR-LAPTOP-05"
   - username (TEXT): User name
   - brand (TEXT): "Dell", "HP", "Lenovo", "Apple", "ASUS"
   - model (TEXT): "Latitude 5420", "ThinkPad X1", "MacBook Pro"
   - cpu (TEXT): Processor like "Core i5", "i7", "Ryzen 7"
   - serialNumber (TEXT): Serial number
   - ram (TEXT): "8 GB", "16 GB", "32 GB"
   - storage (TEXT): "512 GB SSD", "1 TB HDD"
   - userStatus (TEXT): Current usage status
   - department (TEXT): Department name
   - date (TEXT): Date in YYYY-MM-DD format
   - hardwareStatus (TEXT): "Good", "Battery Problem", "Platform Problem" (EXACT match)

3. **Servers Table** (servers):
   - serverID (TEXT): "SRV-001", "WEB-SERVER-01"
   - brand (TEXT): "Dell", "HP", "IBM", "Cisco"
   - model (TEXT): "PowerEdge R740", "ProLiant DL380"
   - cpu (TEXT): Server processor
   - totalCores (NUMBER): Number of CPU cores
   - ram (TEXT): "64 GB", "128 GB", "256 GB"
   - storage (TEXT): "2 TB RAID", "4 TB SSD"
   - raid (TEXT): "RAID 1", "RAID 5", "RAID 10"
   - status (TEXT): "Online", "Offline", "Maintenance" (EXACT match)
   - department (TEXT): Department owning the server

4. **Peripheral Logs** (mouselogs, keyboardlogs, ssdlogs, headphonelogs, portablehddlogs):
   ALL have the same structure:
   - productName (TEXT): "Logitech MX Master", "Microsoft Ergonomic Keyboard"
   - serialNumber (TEXT): Serial number like "SN123456"
   - pcName (TEXT): Associated PC
   - pcUsername (TEXT): User who received it
   - department (TEXT): Department
   - date (TEXT): Service date in YYYY-MM-DD
   - time (TEXT): Service time like "14:30", "09:00"
   - servicedBy (TEXT): Technician name
   - comment (TEXT): Service notes

=== IMPORTANT INSTRUCTIONS ===

1. **CPU Matching**: 
   - "i7" or "Core i7" → use "contains" with "i7"
   - "i5" or "Core i5" → use "contains" with "i5"
   - "i3" or "Core i3" → use "contains" with "i3"
   - "Ryzen" → use "contains" with "Ryzen"

2. **RAM Matching**:
   - "8GB" or "8 GB" → use "contains" with "8"
   - "16GB" or "16 GB" → use "contains" with "16"
   - Always use "contains" operator for RAM

3. **Status Fields**:
   - For PCs: use EXACT values "OK", "NO", or "Repair"
   - For Laptops hardwareStatus: use "Good", "Battery Problem", or "Platform Problem"
   - For Servers: use "Online", "Offline", or "Maintenance"

4. **Department Matching**:
   - Match common abbreviations: "IT", "HR", "Finance", "Sales"
   - Use "equals" operator for exact department match

5. **Text Search**:
   - For brand names, models, product names: use "contains"
   - For exact IDs, serial numbers: use "equals" if exact, "contains" if partial

6. **Multiple Conditions**:
   - Combine all relevant filters
   - Example: "i7 with 16GB" needs BOTH cpu AND ram filters

=== QUERY INTERPRETATION RULES ===

- "all PCs" → module: "pcs", no filters
- "laptops in IT" → module: "laptops", filter department="IT"
- "servers offline" → module: "servers", filter status="Offline"
- "mouse serviced" → module: "mouselogs"
- "keyboard logs" → module: "keyboardlogs"
- "SSD replacements" → module: "ssdlogs"
- "headphones" → module: "headphonelogs"
- "portable HDD" or "external drives" → module: "portablehddlogs"

**IMPORTANT - USER/PERSON QUERIES:**
- When query mentions a PERSON NAME (like "user Karim", "John Doe", "Sarah Wilson"):
  → module: "all"
  → This searches ALL modules for that person
  → Returns PCs, Laptops, and ALL peripherals for that user

**CROSS-MODULE SEARCH:**
- "everything about user X" → module: "all", filter username/pcUsername
- "show me all items for John" → module: "all", filter for user John
- "what does Karim have" → module: "all", filter for user Karim

=== USER QUERY ===
"${query}"

=== RESPONSE FORMAT ===
Respond with ONLY valid JSON (no markdown, no code blocks, no explanation):

{
  "module": "pcs" | "laptops" | "servers" | "mouselogs" | "keyboardlogs" | "ssdlogs" | "headphonelogs" | "portablehddlogs" | "all",
  "filters": {
    "fieldName": {
      "operator": "equals" | "contains" | "greaterThan" | "lessThan",
      "value": "string or number"
    }
  },
  "interpretation": "Brief explanation of what you understood"
}

**NOTE:** Use module: "all" when searching for a PERSON across all modules!

=== EXAMPLES ===

Query: "Show me all PCs with Core i7 and 8GB RAM"
{"module":"pcs","filters":{"cpu":{"operator":"contains","value":"i7"},"ram":{"operator":"contains","value":"8"}},"interpretation":"Finding all PCs with i7 processor and 8GB RAM"}

Query: "I need core i7 all pc there 8 gb ram"
{"module":"pcs","filters":{"cpu":{"operator":"contains","value":"i7"},"ram":{"operator":"contains","value":"8"}},"interpretation":"Searching for PCs with Core i7 CPU and 8GB RAM"}

Query: "Find laptops in HR department with battery problems"
{"module":"laptops","filters":{"department":{"operator":"equals","value":"HR"},"hardwareStatus":{"operator":"equals","value":"Battery Problem"}},"interpretation":"Finding HR department laptops with battery issues"}

Query: "List all servers that are offline"
{"module":"servers","filters":{"status":{"operator":"equals","value":"Offline"}},"interpretation":"Retrieving all offline servers"}

Query: "Show me Dell laptops with i5 processor"
{"module":"laptops","filters":{"brand":{"operator":"equals","value":"Dell"},"cpu":{"operator":"contains","value":"i5"}},"interpretation":"Finding Dell branded laptops with i5 processors"}

Query: "PCs on floor 5 with 16GB RAM"
{"module":"pcs","filters":{"floor":{"operator":"equals","value":"5"},"ram":{"operator":"contains","value":"16"}},"interpretation":"Finding PCs located on floor 5 with 16GB RAM"}

Query: "All mouse distributed to IT department"
{"module":"mouselogs","filters":{"department":{"operator":"equals","value":"IT"}},"interpretation":"Finding all mouse distribution logs for IT department"}

Query: "Headphones serviced this month"
{"module":"headphonelogs","filters":{},"interpretation":"Retrieving all headphone service logs (apply date filter in UI)"}

Query: "Show all PCs"
{"module":"pcs","filters":{},"interpretation":"Retrieving all PC records"}

Query: "Show me everything about user Karim"
{"module":"all","filters":{"username":{"operator":"contains","value":"Karim"}},"interpretation":"Searching all modules for user Karim - PC, Laptop, and all peripherals"}

Query: "What equipment does John Doe have"
{"module":"all","filters":{"username":{"operator":"contains","value":"John Doe"}},"interpretation":"Finding all equipment assigned to John Doe across all modules"}

Query: "Find everything for Sarah Wilson"
{"module":"all","filters":{"username":{"operator":"contains","value":"Sarah Wilson"}},"interpretation":"Comprehensive search for Sarah Wilson in PCs, Laptops, and peripheral logs"}

NOW PROCESS THE USER QUERY AND RETURN ONLY THE JSON RESPONSE.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let aiResponse = response.text();

        // Clean up the response (remove markdown if present)
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse AI response
        const parsedResponse = JSON.parse(aiResponse);
        const { module, filters, interpretation } = parsedResponse;

        // Special handling for "all" module - search across ALL modules!
        if (module === 'all') {
            console.log('🔍 CROSS-MODULE SEARCH activated!');
            
            // Build condition for each module
            const buildConditions = (fieldMap) => {
                const conditions = [];
                const values = [];
                let paramIndex = 1;

                if (filters) {
                    for (const [filterField, filterDef] of Object.entries(filters)) {
                        const { operator, value } = filterDef;
                        // Map 'username' to appropriate field for each module
                        const actualField = fieldMap[filterField] || filterField;

                        switch (operator) {
                            case 'equals':
                                conditions.push(`"${actualField}" = $${paramIndex}`);
                                values.push(value);
                                paramIndex++;
                                break;
                            case 'contains':
                                conditions.push(`"${actualField}" ILIKE $${paramIndex}`);
                                values.push(`%${value}%`);
                                paramIndex++;
                                break;
                            case 'greaterThan':
                                conditions.push(`"${actualField}" > $${paramIndex}`);
                                values.push(value);
                                paramIndex++;
                                break;
                            case 'lessThan':
                                conditions.push(`"${actualField}" < $${paramIndex}`);
                                values.push(value);
                                paramIndex++;
                                break;
                        }
                    }
                }

                return { conditions, values };
            };

            // Search all modules in parallel
            const searchPromises = [];

            // PCs (field: username)
            const pcQuery = buildConditions({ username: 'username' });
            const pcWhere = pcQuery.conditions.length > 0 ? `WHERE ${pcQuery.conditions.join(' AND ')}` : '';
            searchPromises.push(
                pool.query(`SELECT *, 'PC' as "itemType" FROM pcs ${pcWhere}`, pcQuery.values)
                    .then(result => ({ module: 'pcs', data: result.rows }))
                    .catch(err => ({ module: 'pcs', data: [], error: err.message }))
            );

            // Laptops (field: username)
            const laptopQuery = buildConditions({ username: 'username' });
            const laptopWhere = laptopQuery.conditions.length > 0 ? `WHERE ${laptopQuery.conditions.join(' AND ')}` : '';
            searchPromises.push(
                pool.query(`SELECT *, 'Laptop' as "itemType" FROM laptops ${laptopWhere}`, laptopQuery.values)
                    .then(result => ({ module: 'laptops', data: result.rows }))
                    .catch(err => ({ module: 'laptops', data: [], error: err.message }))
            );

            // Mouse Logs (field: pcUsername)
            const mouseQuery = buildConditions({ username: 'pcUsername' });
            const mouseWhere = mouseQuery.conditions.length > 0 ? `WHERE ${mouseQuery.conditions.join(' AND ')}` : '';
            searchPromises.push(
                pool.query(`SELECT *, 'Mouse' as "itemType" FROM "mouseLogs" ${mouseWhere}`, mouseQuery.values)
                    .then(result => ({ module: 'mouseLogs', data: result.rows }))
                    .catch(err => ({ module: 'mouseLogs', data: [], error: err.message }))
            );

            // Keyboard Logs (field: pcUsername)
            const keyboardQuery = buildConditions({ username: 'pcUsername' });
            const keyboardWhere = keyboardQuery.conditions.length > 0 ? `WHERE ${keyboardQuery.conditions.join(' AND ')}` : '';
            searchPromises.push(
                pool.query(`SELECT *, 'Keyboard' as "itemType" FROM "keyboardLogs" ${keyboardWhere}`, keyboardQuery.values)
                    .then(result => ({ module: 'keyboardLogs', data: result.rows }))
                    .catch(err => ({ module: 'keyboardLogs', data: [], error: err.message }))
            );

            // SSD Logs (field: pcUsername)
            const ssdQuery = buildConditions({ username: 'pcUsername' });
            const ssdWhere = ssdQuery.conditions.length > 0 ? `WHERE ${ssdQuery.conditions.join(' AND ')}` : '';
            searchPromises.push(
                pool.query(`SELECT *, 'SSD' as "itemType" FROM "ssdLogs" ${ssdWhere}`, ssdQuery.values)
                    .then(result => ({ module: 'ssdLogs', data: result.rows }))
                    .catch(err => ({ module: 'ssdLogs', data: [], error: err.message }))
            );

            // Headphone Logs (field: pcUsername)
            const headphoneQuery = buildConditions({ username: 'pcUsername' });
            const headphoneWhere = headphoneQuery.conditions.length > 0 ? `WHERE ${headphoneQuery.conditions.join(' AND ')}` : '';
            searchPromises.push(
                pool.query(`SELECT *, 'Headphone' as "itemType" FROM "headphoneLogs" ${headphoneWhere}`, headphoneQuery.values)
                    .then(result => ({ module: 'headphoneLogs', data: result.rows }))
                    .catch(err => ({ module: 'headphoneLogs', data: [], error: err.message }))
            );

            // Portable HDD Logs (field: pcUsername)
            const hddQuery = buildConditions({ username: 'pcUsername' });
            const hddWhere = hddQuery.conditions.length > 0 ? `WHERE ${hddQuery.conditions.join(' AND ')}` : '';
            searchPromises.push(
                pool.query(`SELECT *, 'Portable HDD' as "itemType" FROM "portableHDDLogs" ${hddWhere}`, hddQuery.values)
                    .then(result => ({ module: 'portableHDDLogs', data: result.rows }))
                    .catch(err => ({ module: 'portableHDDLogs', data: [], error: err.message }))
            );

            // Execute all searches in parallel
            const results = await Promise.all(searchPromises);

            // Aggregate results
            const aggregatedData = {};
            let totalCount = 0;

            results.forEach(({ module, data, error }) => {
                if (error) {
                    console.error(`Error in ${module}:`, error);
                }
                if (data && data.length > 0) {
                    aggregatedData[module] = data;
                    totalCount += data.length;
                }
            });

            console.log(`✅ Cross-module search complete: ${totalCount} items found across ${Object.keys(aggregatedData).length} modules`);

            return res.json({
                success: true,
                data: aggregatedData,
                module: 'all',
                filters: filters,
                interpretation: interpretation,
                resultCount: totalCount,
                moduleBreakdown: Object.keys(aggregatedData).reduce((acc, mod) => {
                    acc[mod] = aggregatedData[mod].length;
                    return acc;
                }, {})
            });
        }

        // Regular single-module search
        let tableName;
        switch (module) {
            case 'pcs':
                tableName = 'pcs';
                break;
            case 'laptops':
                tableName = 'laptops';
                break;
            case 'servers':
                tableName = 'servers';
                break;
            case 'mouselogs':
                tableName = '"mouseLogs"';
                break;
            case 'keyboardlogs':
                tableName = '"keyboardLogs"';
                break;
            case 'ssdlogs':
                tableName = '"ssdLogs"';
                break;
            case 'headphonelogs':
                tableName = '"headphoneLogs"';
                break;
            case 'portablehddlogs':
                tableName = '"portableHDDLogs"';
                break;
            default:
                throw new Error('Invalid module specified');
        }

        // Build WHERE clause
        const conditions = [];
        const values = [];
        let paramIndex = 1;

        if (filters) {
            for (const [field, filterDef] of Object.entries(filters)) {
                const { operator, value } = filterDef;

                switch (operator) {
                    case 'equals':
                        conditions.push(`"${field}" = $${paramIndex}`);
                        values.push(value);
                        paramIndex++;
                        break;
                    case 'contains':
                        conditions.push(`"${field}" ILIKE $${paramIndex}`);
                        values.push(`%${value}%`);
                        paramIndex++;
                        break;
                    case 'greaterThan':
                        conditions.push(`"${field}" > $${paramIndex}`);
                        values.push(value);
                        paramIndex++;
                        break;
                    case 'lessThan':
                        conditions.push(`"${field}" < $${paramIndex}`);
                        values.push(value);
                        paramIndex++;
                        break;
                }
            }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const sqlQuery = `SELECT * FROM ${tableName} ${whereClause}`;

        console.log('Executing SQL:', sqlQuery, 'with values:', values);

        // Execute query
        const dbResult = await pool.query(sqlQuery, values);

        res.json({
            success: true,
            data: dbResult.rows,
            module: module,
            filters: filters,
            interpretation: interpretation,
            resultCount: dbResult.rows.length
        });

    } catch (error) {
        console.error('AI Query Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process AI query',
            details: error.toString()
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});

