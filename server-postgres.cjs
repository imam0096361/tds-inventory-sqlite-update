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
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

        // Create a detailed prompt for Gemini
        const prompt = `You are an IT inventory database assistant. Convert the following natural language query into a structured JSON response that can be used to query a PostgreSQL database.

Available tables and their columns:
1. pcs: department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status (OK/NO/Repair), floor (5/6/7)
2. laptops: pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus (Good/Battery Problem/Platform Problem)
3. servers: serverID, brand, model, cpu, totalCores, ram, storage, raid, status (Online/Offline/Maintenance), department
4. mouselogs: productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment
5. keyboardlogs: productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment
6. ssdlogs: productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment

User Query: "${query}"

Respond ONLY with a valid JSON object (no markdown, no explanation) in this exact format:
{
  "module": "pcs" | "laptops" | "servers" | "mouselogs" | "keyboardlogs" | "ssdlogs",
  "filters": {
    "fieldName": { "operator": "equals" | "contains" | "greaterThan" | "lessThan", "value": "..." }
  },
  "interpretation": "A brief explanation of what you understood from the query"
}

Examples:
Query: "Show me all PCs with Core i7 and 8GB RAM"
Response: {"module":"pcs","filters":{"cpu":{"operator":"contains","value":"Core i7"},"ram":{"operator":"contains","value":"8 GB"}},"interpretation":"Finding all PCs with Core i7 processor and 8GB RAM"}

Query: "Find laptops in HR department with battery problems"
Response: {"module":"laptops","filters":{"department":{"operator":"equals","value":"HR"},"hardwareStatus":{"operator":"equals","value":"Battery Problem"}},"interpretation":"Finding laptops in HR department that have battery issues"}

Query: "List all servers that are offline"
Response: {"module":"servers","filters":{"status":{"operator":"equals","value":"Offline"}},"interpretation":"Finding all servers with offline status"}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let aiResponse = response.text();

        // Clean up the response (remove markdown if present)
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse AI response
        const parsedResponse = JSON.parse(aiResponse);
        const { module, filters, interpretation } = parsedResponse;

        // Build SQL query based on AI response
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

