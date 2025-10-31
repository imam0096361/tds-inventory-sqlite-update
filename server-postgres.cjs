// Load environment variables
require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ==================== FUZZY SEARCH UTILITIES ====================
// Levenshtein distance for typo tolerance
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len2; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
        for (let j = 1; j <= len1; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[len2][len1];
}

function findBestMatch(input, options) {
    let bestMatch = null;
    let lowestDistance = Infinity;
    const maxThreshold = Math.min(3, Math.ceil(input.length * 0.3));

    options.forEach(option => {
        const distance = levenshteinDistance(input.toLowerCase(), option.toLowerCase());
        if (distance < lowestDistance && distance <= maxThreshold) {
            lowestDistance = distance;
            bestMatch = option;
        }
    });

    const confidence = bestMatch 
        ? Math.round((1 - lowestDistance / maxThreshold) * 100)
        : 0;

    return { match: bestMatch, confidence };
}

const app = express();
const port = process.env.PORT || 5000;

// JWT Secret - REQUIRED (no fallback for security)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.error('❌ FATAL ERROR: JWT_SECRET environment variable is required and must be at least 32 characters long!');
    console.error('📝 Generate a strong secret with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

// CORS configuration - supports both Vercel and Docker deployments
const corsOrigins = process.env.CORS_ORIGIN 
    ? (process.env.CORS_ORIGIN === '*' ? '*' : process.env.CORS_ORIGIN.split(',').map(o => o.trim()))
    : (process.env.NODE_ENV === 'production'
        ? ['https://tds-inventory-sqlite-update.vercel.app', 'https://tds-inventory-sqlite-update-git-main.vercel.app']
        : ['http://localhost:3000', 'http://localhost:5173']);

app.use(cors({
    origin: corsOrigins,
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Prevent large payload attacks
app.use(cookieParser());

// PostgreSQL connection pool
// Note: Neon requires SSL but with rejectUnauthorized: false
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false  // Required for Neon and other managed PostgreSQL services
    }
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

        // ==================== COST MANAGEMENT SCHEMA ====================
        console.log('💰 Adding cost management fields...');

        // Add cost fields to PCs table
        await client.query(`
            ALTER TABLE pcs 
            ADD COLUMN IF NOT EXISTS purchase_cost DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS purchase_date DATE,
            ADD COLUMN IF NOT EXISTS warranty_end DATE,
            ADD COLUMN IF NOT EXISTS supplier TEXT,
            ADD COLUMN IF NOT EXISTS depreciation_years INTEGER DEFAULT 5
        `);

        // Add cost fields to Laptops table
        await client.query(`
            ALTER TABLE laptops 
            ADD COLUMN IF NOT EXISTS purchase_cost DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS purchase_date DATE,
            ADD COLUMN IF NOT EXISTS warranty_end DATE,
            ADD COLUMN IF NOT EXISTS supplier TEXT,
            ADD COLUMN IF NOT EXISTS depreciation_years INTEGER DEFAULT 3
        `);

        // Add cost fields to Servers table
        await client.query(`
            ALTER TABLE servers 
            ADD COLUMN IF NOT EXISTS purchase_cost DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS purchase_date DATE,
            ADD COLUMN IF NOT EXISTS warranty_end DATE,
            ADD COLUMN IF NOT EXISTS supplier TEXT,
            ADD COLUMN IF NOT EXISTS depreciation_years INTEGER DEFAULT 7
        `);

        // Add cost fields to peripheral logs
        const peripheralTables = ['mouseLogs', 'keyboardLogs', 'ssdLogs', 'headphoneLogs', 'portableHDDLogs'];
        for (const table of peripheralTables) {
            await client.query(`
                ALTER TABLE "${table}" 
                ADD COLUMN IF NOT EXISTS purchase_cost DECIMAL(10,2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS purchase_date DATE,
                ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 12,
                ADD COLUMN IF NOT EXISTS supplier TEXT
            `);
        }

        // Create Maintenance Costs table
        await client.query(`
            CREATE TABLE IF NOT EXISTS maintenance_costs (
                id TEXT PRIMARY KEY,
                asset_type TEXT NOT NULL,
                asset_id TEXT NOT NULL,
                asset_name TEXT,
                username TEXT,
                cost DECIMAL(10,2) NOT NULL,
                date DATE NOT NULL,
                description TEXT,
                service_provider TEXT,
                category TEXT,
                department TEXT,
                status TEXT DEFAULT 'Pending',
                priority TEXT DEFAULT 'Medium',
                invoice_number TEXT,
                warranty_status TEXT,
                approval_status TEXT DEFAULT 'Pending',
                approved_by TEXT,
                completion_date DATE,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Budgets table
        await client.query(`
            CREATE TABLE IF NOT EXISTS budgets (
                id TEXT PRIMARY KEY,
                department TEXT NOT NULL,
                year INTEGER NOT NULL,
                quarter INTEGER,
                category TEXT NOT NULL,
                allocated_amount DECIMAL(10,2) NOT NULL,
                spent_amount DECIMAL(10,2) DEFAULT 0,
                notes TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(department, year, quarter, category)
            )
        `);

        // Create Cost Centers table (for department allocation)
        await client.query(`
            CREATE TABLE IF NOT EXISTS cost_centers (
                id TEXT PRIMARY KEY,
                department TEXT UNIQUE NOT NULL,
                cost_center_code TEXT UNIQUE NOT NULL,
                manager_name TEXT,
                annual_budget DECIMAL(10,2),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Cost management schema added successfully');
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

// ============= INPUT VALIDATION HELPERS =============
const validateRequired = (fields, data) => {
    const missing = [];
    for (const field of fields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            missing.push(field);
        }
    }
    return missing;
};

const validateLength = (field, value, max) => {
    if (value && value.length > max) {
        return `${field} must be less than ${max} characters`;
    }
    return null;
};

const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    // Remove potentially dangerous characters and trim
    return str.trim().substring(0, 500); // Max 500 chars
};

const validateInput = (req, res, next) => {
    // Sanitize all string inputs in body
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        }
    }
    next();
};

// ============= RATE LIMITING =============
const loginAttempts = new Map(); // Store login attempts: IP -> { count, resetTime }

const rateLimitLogin = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5; // 5 attempts per window

    if (!loginAttempts.has(ip)) {
        loginAttempts.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
    }

    const attempt = loginAttempts.get(ip);

    // Reset if window has expired
    if (now > attempt.resetTime) {
        loginAttempts.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
    }

    // Check if limit exceeded
    if (attempt.count >= maxAttempts) {
        const remainingTime = Math.ceil((attempt.resetTime - now) / 1000 / 60);
        return res.status(429).json({
            error: `Too many login attempts. Please try again in ${remainingTime} minutes.`
        });
    }

    // Increment attempt count
    attempt.count++;
    return next();
};

// Clean up old entries every hour
setInterval(() => {
    const now = Date.now();
    for (const [ip, attempt] of loginAttempts.entries()) {
        if (now > attempt.resetTime) {
            loginAttempts.delete(ip);
        }
    }
}, 60 * 60 * 1000);

// ==================== AI INSIGHTS GENERATION ====================
async function generateInsights(data, module, filters) {
    const insights = [];
    
    try {
        if (module === 'all' && typeof data === 'object') {
            // Cross-module insights
            const moduleCount = Object.keys(data).length;
            const totalItems = Object.values(data).reduce((sum, items) => sum + items.length, 0);
            
            insights.push({
                type: 'summary',
                icon: '📊',
                text: `Found ${totalItems} items across ${moduleCount} modules`,
                priority: 'low'
            });
            
            // Check for PC issues
            if (data.pcs && data.pcs.some(pc => pc.status === 'Repair')) {
                const repairCount = data.pcs.filter(pc => pc.status === 'Repair').length;
                insights.push({
                    type: 'warning',
                    icon: '⚠️',
                    text: `${repairCount} PC(s) need repair`,
                    action: 'Create maintenance ticket',
                    priority: 'high'
                });
            }
            
            // Check for laptop battery issues
            if (data.laptops && data.laptops.some(laptop => laptop.hardwareStatus === 'Battery Problem')) {
                const batteryCount = data.laptops.filter(l => l.hardwareStatus === 'Battery Problem').length;
                insights.push({
                    type: 'warning',
                    icon: '🔋',
                    text: `${batteryCount} laptop(s) have battery issues`,
                    action: 'Schedule battery replacement',
                    priority: 'medium'
                });
            }
            
            // Cost estimation
            const peripheralCount = (data.mouseLogs?.length || 0) + 
                                   (data.keyboardLogs?.length || 0) + 
                                   (data.headphoneLogs?.length || 0);
            if (peripheralCount > 0) {
                insights.push({
                    type: 'info',
                    icon: '💰',
                    text: `Estimated peripheral value: $${peripheralCount * 25}`,
                    details: 'Based on average peripheral costs ($25 per item)',
                    priority: 'low'
                });
            }
            
            // Maintenance costs summary
            if (data.maintenance_costs && data.maintenance_costs.length > 0) {
                const totalMaintenanceCost = data.maintenance_costs.reduce(
                    (sum, item) => sum + parseFloat(item.cost || 0), 0
                );
                const pendingMaintenance = data.maintenance_costs.filter(
                    item => item.status === 'Pending'
                ).length;
                
                insights.push({
                    type: 'info',
                    icon: '🔧',
                    text: `Maintenance costs: $${totalMaintenanceCost.toFixed(2)} (${pendingMaintenance} pending)`,
                    details: `Total of ${data.maintenance_costs.length} maintenance records`,
                    priority: 'medium'
                });
            }
        } else if (module === 'pcs' && Array.isArray(data)) {
            // PC-specific insights
            const avgRam = data.reduce((sum, pc) => {
                const ramMatch = pc.ram?.match(/(\d+)/);
                return sum + (ramMatch ? parseInt(ramMatch[1]) : 0);
            }, 0) / data.length;
            
            insights.push({
                type: 'info',
                icon: '📈',
                text: `Average RAM: ${Math.round(avgRam)} GB`,
                recommendation: avgRam < 8 ? 'Consider upgrading to 16 GB for better performance' : null,
                priority: 'medium'
            });
            
            // OS distribution check
            const oldOS = data.filter(pc => 
                pc.os?.includes('Windows 7') || pc.os?.includes('Windows 8')
            ).length;
            
            if (oldOS > 0) {
                insights.push({
                    type: 'alert',
                    icon: '🚨',
                    text: `${oldOS} PC(s) running outdated OS`,
                    action: 'Urgent: Schedule OS upgrade',
                    recommendation: 'Windows 7/8 are no longer supported and pose security risks',
                    priority: 'critical'
                });
            }
        } else if (module === 'laptops' && Array.isArray(data)) {
            // Laptop-specific insights
            const problemLaptops = data.filter(l => 
                l.hardwareStatus !== 'Good'
            ).length;
            
            if (problemLaptops > 0) {
                insights.push({
                    type: 'warning',
                    icon: '💻',
                    text: `${problemLaptops} of ${data.length} laptops need attention`,
                    action: 'Review hardware status',
                    priority: 'high'
                });
            }
        } else if (module === 'servers' && Array.isArray(data)) {
            // Server-specific insights
            const offline = data.filter(s => s.status === 'Offline').length;
            const maintenance = data.filter(s => s.status === 'Maintenance').length;
            
            if (offline > 0) {
                insights.push({
                    type: 'alert',
                    icon: '🔴',
                    text: `${offline} server(s) are offline`,
                    action: 'Investigate server issues immediately',
                    priority: 'critical'
                });
            }
            
            if (maintenance > 0) {
                insights.push({
                    type: 'warning',
                    icon: '🔧',
                    text: `${maintenance} server(s) in maintenance`,
                    priority: 'medium'
                });
            }
        } else if (module === 'maintenance_costs' && Array.isArray(data)) {
            // Maintenance Costs insights
            const totalCost = data.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0);
            const pending = data.filter(item => item.status === 'Pending').length;
            const critical = data.filter(item => item.priority === 'Critical').length;
            const inWarranty = data.filter(item => item.warranty_status === 'In Warranty').length;
            
            insights.push({
                type: 'info',
                icon: '💰',
                text: `Total maintenance costs: $${totalCost.toFixed(2)}`,
                priority: 'medium'
            });
            
            if (critical > 0) {
                insights.push({
                    type: 'alert',
                    icon: '🔴',
                    text: `${critical} critical priority maintenance issue(s)`,
                    action: 'Address critical items immediately',
                    priority: 'critical'
                });
            }
            
            if (pending > 0) {
                insights.push({
                    type: 'warning',
                    icon: '⏳',
                    text: `${pending} pending maintenance item(s)`,
                    action: 'Review and approve pending items',
                    priority: 'medium'
                });
            }
            
            if (inWarranty > 0) {
                const warrantyCost = data
                    .filter(item => item.warranty_status === 'In Warranty')
                    .reduce((sum, item) => sum + parseFloat(item.cost || 0), 0);
                
                insights.push({
                    type: 'success',
                    icon: '🛡️',
                    text: `${inWarranty} warranty repair(s) - potential savings: $${warrantyCost.toFixed(2)}`,
                    action: 'Contact vendor for warranty claims',
                    priority: 'high'
                });
            }
        } else if (module === 'budgets' && Array.isArray(data)) {
            // Budget insights
            const totalBudget = data.reduce((sum, item) => sum + parseFloat(item.budget_amount || 0), 0);
            const totalSpent = data.reduce((sum, item) => sum + parseFloat(item.spent_amount || 0), 0);
            const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;
            
            insights.push({
                type: 'info',
                icon: '📊',
                text: `Budget utilization: ${utilizationRate.toFixed(1)}% ($${totalSpent.toFixed(2)} of $${totalBudget.toFixed(2)})`,
                priority: 'medium'
            });
            
            if (utilizationRate > 90) {
                insights.push({
                    type: 'alert',
                    icon: '⚠️',
                    text: 'Budget nearly exhausted',
                    action: 'Request additional budget or reduce spending',
                    priority: 'high'
                });
            } else if (utilizationRate > 75) {
                insights.push({
                    type: 'warning',
                    icon: '📉',
                    text: 'Budget utilization above 75%',
                    action: 'Monitor spending closely',
                    priority: 'medium'
                });
            }
            
            // Check for over-budget departments
            const overBudget = data.filter(item => 
                parseFloat(item.spent_amount || 0) > parseFloat(item.budget_amount || 0)
            );
            
            if (overBudget.length > 0) {
                insights.push({
                    type: 'alert',
                    icon: '🚨',
                    text: `${overBudget.length} department(s) over budget`,
                    action: 'Review department spending immediately',
                    priority: 'critical'
                });
            }
        }
        
        // Always show result count
        if (Array.isArray(data) && data.length > 0) {
            insights.unshift({
                type: 'summary',
                icon: '✅',
                text: `Found ${data.length} matching ${module}`,
                priority: 'low'
            });
        }
        
    } catch (error) {
        console.error('Error generating insights:', error);
    }
    
    return insights;
}

// ==================== GENERATE RECOMMENDATIONS ====================
function generateRecommendations(data, module, query, filters) {
    const recommendations = [];
    
    try {
        // Always offer export options
        if (data && ((Array.isArray(data) && data.length > 0) || 
            (typeof data === 'object' && Object.keys(data).length > 0))) {
            
            recommendations.push({
                id: 'export_pdf',
                icon: '📄',
                text: 'Export as Professional PDF Report',
                action: 'export_pdf',
                priority: 1
            });
            
            recommendations.push({
                id: 'export_csv',
                icon: '📊',
                text: 'Export as CSV for Excel',
                action: 'export_csv',
                priority: 2
            });
        }
        
        // Context-aware suggestions based on module
        if (module === 'all') {
            // Cross-module search recommendations
            recommendations.push({
                id: 'filter_by_module',
                icon: '🔍',
                text: 'Filter results by specific module',
                action: 'run_query',
                query: `Show me just the PCs from previous results`,
                priority: 3
            });
        } else if (module === 'pcs') {
            recommendations.push({
                id: 'check_department',
                icon: '🏢',
                text: 'View department summary',
                action: 'run_query',
                query: `Show me all IT department equipment`,
                priority: 3
            });
        } else if (module === 'laptops' && filters?.username) {
            recommendations.push({
                id: 'user_all_equipment',
                icon: '👤',
                text: `View all equipment for this user`,
                action: 'run_query',
                query: `Show me everything about user ${filters.username.value}`,
                priority: 4
            });
        }
        
        // If repairs/issues found, suggest maintenance
        if (Array.isArray(data) && data.some(item => 
            item.status === 'Repair' || item.hardwareStatus === 'Battery Problem'
        )) {
            recommendations.push({
                id: 'schedule_maintenance',
                icon: '🔧',
                text: 'Schedule maintenance for problematic items',
                action: 'create_ticket',
                priority: 5
            });
        }
        
    } catch (error) {
        console.error('Error generating recommendations:', error);
    }
    
    return recommendations;
}

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Cost Management access middleware (Admin only)
const isAdminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Access denied. Admin access required for Cost Management.' 
        });
    }
    next();
};

// ============= AUTHENTICATION ENDPOINTS =============

// Login
app.post('/api/auth/login', rateLimitLogin, async (req, res) => {
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
app.post('/api/auth/register', authenticateToken, isAdmin, validateInput, async (req, res) => {
    const { username, password, fullName, email, role, department } = req.body;

    // Validate required fields
    const missing = validateRequired(['username', 'password', 'fullName', 'email'], req.body);
    if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Validate username (alphanumeric, 3-50 chars)
    if (username.length < 3 || username.length > 50) {
        return res.status(400).json({ error: 'Username must be between 3 and 50 characters' });
    }

    // Validate role if provided
    if (role && !['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user"' });
    }

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
        console.error('User registration error:', err);
        res.status(500).json({ error: 'Failed to create user' });
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
app.get('/api/pcs', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pcs');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/pcs', authenticateToken, validateInput, async (req, res) => {
    const { id, department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, customFields, purchase_cost, purchase_date, warranty_end, supplier, depreciation_years } = req.body;

    // Validate required fields
    const missing = validateRequired(['id', 'department', 'pcName'], req.body);
    if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Validate field lengths
    const lengthErrors = [
        validateLength('id', id, 100),
        validateLength('department', department, 100),
        validateLength('pcName', pcName, 100),
        validateLength('username', username, 100)
    ].filter(Boolean);

    if (lengthErrors.length > 0) {
        return res.status(400).json({ error: lengthErrors[0] });
    }

    try {
        await pool.query(
            'INSERT INTO pcs (id, department, ip, "pcName", username, motherboard, cpu, ram, storage, monitor, os, status, floor, "customFields", purchase_cost, purchase_date, warranty_end, supplier, depreciation_years) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)',
            [id, department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, JSON.stringify(customFields || {}), purchase_cost || null, purchase_date || null, warranty_end || null, supplier || null, depreciation_years || null]
        );
        res.json({ id });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to create PC record' });
    }
});

app.put('/api/pcs/:id', authenticateToken, async (req, res) => {
    const { department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, customFields, purchase_cost, purchase_date, warranty_end, supplier, depreciation_years } = req.body;
    try {
        const result = await pool.query(
            'UPDATE pcs SET department = $1, ip = $2, "pcName" = $3, username = $4, motherboard = $5, cpu = $6, ram = $7, storage = $8, monitor = $9, os = $10, status = $11, floor = $12, "customFields" = $13, purchase_cost = $14, purchase_date = $15, warranty_end = $16, supplier = $17, depreciation_years = $18 WHERE id = $19',
            [department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, JSON.stringify(customFields || {}), purchase_cost || null, purchase_date || null, warranty_end || null, supplier || null, depreciation_years || null, req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/pcs/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM pcs WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= LAPTOP ENDPOINTS =============
app.get('/api/laptops', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM laptops');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/laptops', authenticateToken, async (req, res) => {
    const { id, pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, customFields, purchase_cost, purchase_date, warranty_end, supplier, depreciation_years } = req.body;
    try {
        await pool.query(
            'INSERT INTO laptops (id, "pcName", username, brand, model, cpu, "serialNumber", ram, storage, "userStatus", department, date, "hardwareStatus", "customFields", purchase_cost, purchase_date, warranty_end, supplier, depreciation_years) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)',
            [id, pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, JSON.stringify(customFields || {}), purchase_cost || null, purchase_date || null, warranty_end || null, supplier || null, depreciation_years || null]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/laptops/:id', authenticateToken, async (req, res) => {
    const { pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, customFields, purchase_cost, purchase_date, warranty_end, supplier, depreciation_years } = req.body;
    try {
        const result = await pool.query(
            'UPDATE laptops SET "pcName" = $1, username = $2, brand = $3, model = $4, cpu = $5, "serialNumber" = $6, ram = $7, storage = $8, "userStatus" = $9, department = $10, date = $11, "hardwareStatus" = $12, "customFields" = $13, purchase_cost = $14, purchase_date = $15, warranty_end = $16, supplier = $17, depreciation_years = $18 WHERE id = $19',
            [pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, JSON.stringify(customFields || {}), purchase_cost || null, purchase_date || null, warranty_end || null, supplier || null, depreciation_years || null, req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/laptops/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM laptops WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= SERVER ENDPOINTS =============
app.get('/api/servers', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM servers');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/servers', authenticateToken, async (req, res) => {
    const { id, serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, customFields, purchase_cost, purchase_date, warranty_end, supplier, depreciation_years } = req.body;
    try {
        await pool.query(
            'INSERT INTO servers (id, "serverID", brand, model, cpu, "totalCores", ram, storage, raid, status, department, "customFields", purchase_cost, purchase_date, warranty_end, supplier, depreciation_years) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
            [id, serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, JSON.stringify(customFields || {}), purchase_cost || null, purchase_date || null, warranty_end || null, supplier || null, depreciation_years || null]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/servers/:id', authenticateToken, async (req, res) => {
    const { serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, customFields, purchase_cost, purchase_date, warranty_end, supplier, depreciation_years } = req.body;
    try {
        const result = await pool.query(
            'UPDATE servers SET "serverID" = $1, brand = $2, model = $3, cpu = $4, "totalCores" = $5, ram = $6, storage = $7, raid = $8, status = $9, department = $10, "customFields" = $11, purchase_cost = $12, purchase_date = $13, warranty_end = $14, supplier = $15, depreciation_years = $16 WHERE id = $17',
            [serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, JSON.stringify(customFields || {}), purchase_cost || null, purchase_date || null, warranty_end || null, supplier || null, depreciation_years || null, req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/servers/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM servers WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= MOUSE LOG ENDPOINTS =============
app.get('/api/mouselogs', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "mouseLogs"');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/mouselogs', authenticateToken, async (req, res) => {
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

app.put('/api/mouselogs/:id', authenticateToken, async (req, res) => {
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

app.delete('/api/mouselogs/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM "mouseLogs" WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= KEYBOARD LOG ENDPOINTS =============
app.get('/api/keyboardlogs', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "keyboardLogs"');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/keyboardlogs', authenticateToken, async (req, res) => {
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

app.put('/api/keyboardlogs/:id', authenticateToken, async (req, res) => {
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

app.delete('/api/keyboardlogs/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM "keyboardLogs" WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= SSD LOG ENDPOINTS =============
app.get('/api/ssdlogs', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "ssdLogs"');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ssdlogs', authenticateToken, async (req, res) => {
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

app.put('/api/ssdlogs/:id', authenticateToken, async (req, res) => {
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

app.delete('/api/ssdlogs/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM "ssdLogs" WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= HEADPHONE LOG ENDPOINTS =============
app.get('/api/headphonelogs', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "headphoneLogs"');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/headphonelogs', authenticateToken, async (req, res) => {
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

app.put('/api/headphonelogs/:id', authenticateToken, async (req, res) => {
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

app.delete('/api/headphonelogs/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM "headphoneLogs" WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= PORTABLE HDD LOG ENDPOINTS =============
app.get('/api/portablehddlogs', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "portableHDDLogs"');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/portablehddlogs', authenticateToken, async (req, res) => {
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

app.put('/api/portablehddlogs/:id', authenticateToken, async (req, res) => {
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

app.delete('/api/portablehddlogs/:id', authenticateToken, async (req, res) => {
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

// ==================== AUTOCOMPLETE SUGGESTIONS ENDPOINT ====================
app.post('/api/ai-suggestions', authenticateToken, async (req, res) => {
    const { partial } = req.body;
    
    if (!partial || partial.length < 2) {
        return res.json({ suggestions: [] });
    }
    
    try {
        const suggestions = [];
        const partialLower = partial.toLowerCase();
        
        // Get unique usernames from all modules
        const usernameQuery = await pool.query(`
            SELECT DISTINCT username FROM (
                SELECT username FROM pcs WHERE username ILIKE $1
                UNION
                SELECT username FROM laptops WHERE username ILIKE $1
                UNION
                SELECT "pcUsername" as username FROM "mouseLogs" WHERE "pcUsername" ILIKE $1
                LIMIT 5
            ) AS users WHERE username IS NOT NULL
        `, [`%${partial}%`]);
        
        usernameQuery.rows.forEach(row => {
            if (row.username) {
                suggestions.push({
                    id: `user-${row.username}`,
                    text: `Show me everything about user ${row.username}`,
                    type: 'user',
                    icon: '👤',
                    priority: 1,
                    metadata: { username: row.username }
                });
            }
        });
        
        // Get unique departments
        const deptQuery = await pool.query(`
            SELECT DISTINCT department FROM (
                SELECT department FROM pcs WHERE department ILIKE $1
                UNION
                SELECT department FROM laptops WHERE department ILIKE $1
                LIMIT 3
            ) AS depts WHERE department IS NOT NULL
        `, [`%${partial}%`]);
        
        deptQuery.rows.forEach(row => {
            if (row.department) {
                suggestions.push({
                    id: `dept-${row.department}`,
                    text: `Find all equipment in ${row.department} department`,
                    type: 'department',
                    icon: '🏢',
                    priority: 2,
                    metadata: { department: row.department }
                });
            }
        });
        
        // Hardware-based suggestions
        if (partialLower.includes('i7') || partialLower.includes('core i7')) {
            suggestions.push({
                id: 'hw-i7-16gb',
                text: 'Show me all PCs with Core i7 and 16GB RAM',
                type: 'hardware',
                icon: '💻',
                priority: 3
            });
            suggestions.push({
                id: 'hw-i7-8gb',
                text: 'Find PCs with Core i7 and 8GB RAM',
                type: 'hardware',
                icon: '💻',
                priority: 4
            });
        }
        
        if (partialLower.includes('i5') || partialLower.includes('core i5')) {
            suggestions.push({
                id: 'hw-i5',
                text: 'Show me all PCs with Core i5',
                type: 'hardware',
                icon: '💻',
                priority: 3
            });
        }
        
        // Status-based suggestions
        if (partialLower.includes('repair') || partialLower.includes('fix')) {
            suggestions.push({
                id: 'status-repair',
                text: 'Show me all PCs that need repair',
                type: 'status',
                icon: '🔧',
                priority: 3
            });
        }
        
        if (partialLower.includes('battery')) {
            suggestions.push({
                id: 'status-battery',
                text: 'Find laptops with battery problems',
                type: 'status',
                icon: '🔋',
                priority: 3
            });
        }
        
        // Popular query templates
        if (suggestions.length < 3) {
            const templates = [
                { id: 'query-all-pcs', text: 'Show me all PCs', type: 'query', icon: '🖥️', priority: 5 },
                { id: 'query-all-laptops', text: 'Show me all laptops', type: 'query', icon: '💻', priority: 5 },
                { id: 'query-offline-servers', text: 'Find all offline servers', type: 'query', icon: '🔴', priority: 5 }
            ];
            
            templates.forEach(template => {
                if (template.text.toLowerCase().includes(partialLower)) {
                    suggestions.push(template);
                }
            });
        }
        
        // Sort by priority and limit to top 8
        suggestions.sort((a, b) => (a.priority || 999) - (b.priority || 999));
        
        res.json({ 
            suggestions: suggestions.slice(0, 8)
        });
        
    } catch (error) {
        console.error('Error generating suggestions:', error);
        res.json({ suggestions: [] });
    }
});

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

5. **Maintenance Costs** (maintenance_costs):
   - asset_type (TEXT): "PC", "Laptop", "Server", "Mouse", "Keyboard", "SSD", "Headphone", "Portable HDD"
   - asset_id (TEXT): Asset identifier like "PC-001", "LAP-05"
   - asset_name (TEXT): Asset name
   - username (TEXT): User who uses the asset
   - cost (NUMBER): Maintenance cost amount (e.g., 5000.50)
   - date (TEXT): Maintenance date in YYYY-MM-DD
   - description (TEXT): What was done
   - service_provider (TEXT): Company/technician who did the work
   - category (TEXT): "Repair", "Upgrade", "Replacement", "Maintenance", "Cleaning"
   - department (TEXT): Department name
   - status (TEXT): "Pending", "Completed", "Cancelled"
   - priority (TEXT): "Low", "Medium", "High", "Critical"
   - invoice_number (TEXT): Invoice reference
   - warranty_status (TEXT): "In Warranty", "Out of Warranty"
   - approval_status (TEXT): "Pending", "Approved", "Rejected"
   - created_by (TEXT): Who created the record
   - created_at (TEXT): Creation timestamp

6. **Budgets** (budgets):
   - department (TEXT): Department name
   - year (NUMBER): Budget year like 2025
   - quarter (NUMBER): 1, 2, 3, or 4
   - budget_amount (NUMBER): Allocated budget
   - spent_amount (NUMBER): Amount already spent
   - remaining_amount (NUMBER): Budget remaining
   - status (TEXT): Budget status
   - created_at (TEXT): Creation timestamp

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
- "maintenance costs" or "repair costs" or "service costs" → module: "maintenance_costs"
- "budgets" or "department budgets" or "financial budget" → module: "budgets"
- "cost for user X" → module: "maintenance_costs", filter username
- "pending repairs" → module: "maintenance_costs", filter status="Pending"
- "critical maintenance" → module: "maintenance_costs", filter priority="Critical"
- "warranty repairs" → module: "maintenance_costs", filter warranty_status="In Warranty"

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
  "module": "pcs" | "laptops" | "servers" | "mouselogs" | "keyboardlogs" | "ssdlogs" | "headphonelogs" | "portablehddlogs" | "maintenance_costs" | "budgets" | "all",
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

Query: "Show all maintenance costs"
{"module":"maintenance_costs","filters":{},"interpretation":"Retrieving all maintenance cost records"}

Query: "Pending repairs"
{"module":"maintenance_costs","filters":{"status":{"operator":"equals","value":"Pending"}},"interpretation":"Finding all pending maintenance work"}

Query: "Critical maintenance issues"
{"module":"maintenance_costs","filters":{"priority":{"operator":"equals","value":"Critical"}},"interpretation":"Finding critical priority maintenance costs"}

Query: "Repairs for IT department"
{"module":"maintenance_costs","filters":{"department":{"operator":"equals","value":"IT"}},"interpretation":"Finding all maintenance costs for IT department"}

Query: "Maintenance costs over 5000"
{"module":"maintenance_costs","filters":{"cost":{"operator":"greaterThan","value":"5000"}},"interpretation":"Finding maintenance costs exceeding 5000"}

Query: "Warranty repairs"
{"module":"maintenance_costs","filters":{"warranty_status":{"operator":"equals","value":"In Warranty"}},"interpretation":"Finding repairs covered by warranty"}

Query: "Maintenance for user John"
{"module":"maintenance_costs","filters":{"username":{"operator":"contains","value":"John"}},"interpretation":"Finding maintenance costs for user John"}

Query: "Show IT department budget"
{"module":"budgets","filters":{"department":{"operator":"equals","value":"IT"}},"interpretation":"Retrieving IT department budget information"}

Query: "All budgets for 2025"
{"module":"budgets","filters":{"year":{"operator":"equals","value":"2025"}},"interpretation":"Retrieving all department budgets for year 2025"}

Query: "Quarter 1 budgets"
{"module":"budgets","filters":{"quarter":{"operator":"equals","value":"1"}},"interpretation":"Finding Q1 budget allocations"}

NOW PROCESS THE USER QUERY AND RETURN ONLY THE JSON RESPONSE.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let aiResponse = response.text();

        // Clean up the response (remove markdown if present)
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse AI response
        const parsedResponse = JSON.parse(aiResponse);
        let { module, filters, interpretation } = parsedResponse;

        // ==================== FUZZY SEARCH INTEGRATION ====================
        // Apply fuzzy matching to correct typos in username filters
        const fuzzyCorrections = [];
        
        if (filters && filters.username) {
            try {
                // Fetch all unique usernames from database
                const usernamesQuery = await pool.query(`
                    SELECT DISTINCT username FROM (
                        SELECT username FROM pcs WHERE username IS NOT NULL
                        UNION
                        SELECT username FROM laptops WHERE username IS NOT NULL
                        UNION
                        SELECT username FROM maintenance_costs WHERE username IS NOT NULL
                        UNION
                        SELECT "pcUsername" as username FROM "mouseLogs" WHERE "pcUsername" IS NOT NULL
                        UNION
                        SELECT "pcUsername" as username FROM "keyboardLogs" WHERE "pcUsername" IS NOT NULL
                        UNION
                        SELECT "pcUsername" as username FROM "ssdLogs" WHERE "pcUsername" IS NOT NULL
                        UNION
                        SELECT "pcUsername" as username FROM "headphoneLogs" WHERE "pcUsername" IS NOT NULL
                        UNION
                        SELECT "pcUsername" as username FROM "portableHDDLogs" WHERE "pcUsername" IS NOT NULL
                    ) AS all_usernames
                `);
                
                const allUsernames = usernamesQuery.rows.map(row => row.username);
                const inputUsername = filters.username.value;
                
                // Check if it's an exact match (case-insensitive)
                const exactMatch = allUsernames.find(u => 
                    u.toLowerCase() === inputUsername.toLowerCase()
                );
                
                if (!exactMatch && allUsernames.length > 0) {
                    // No exact match, try fuzzy matching
                    console.log(`🔍 Fuzzy search: Looking for match for "${inputUsername}"`);
                    const fuzzyResult = findBestMatch(inputUsername, allUsernames);
                    
                    if (fuzzyResult.match && fuzzyResult.confidence >= 60) {
                        // Found a good match!
                        console.log(`✅ Fuzzy match found: "${inputUsername}" → "${fuzzyResult.match}" (${fuzzyResult.confidence}% confidence)`);
                        
                        // Correct the filter
                        filters.username.value = fuzzyResult.match;
                        
                        // Track the correction
                        fuzzyCorrections.push({
                            field: 'username',
                            original: inputUsername,
                            corrected: fuzzyResult.match,
                            confidence: fuzzyResult.confidence
                        });
                        
                        // Update interpretation to mention the correction
                        interpretation += ` (corrected "${inputUsername}" to "${fuzzyResult.match}")`;
                    } else {
                        console.log(`⚠️ No fuzzy match found for "${inputUsername}" (confidence: ${fuzzyResult.confidence}%)`);
                    }
                }
                
            } catch (error) {
                console.error('Fuzzy search error:', error);
                // Continue with original username if fuzzy search fails
            }
        }
        
        // Also check department names for fuzzy matching
        if (filters && filters.department) {
            try {
                const deptsQuery = await pool.query(`
                    SELECT DISTINCT department FROM (
                        SELECT department FROM pcs WHERE department IS NOT NULL
                        UNION
                        SELECT department FROM laptops WHERE department IS NOT NULL
                        UNION
                        SELECT department FROM servers WHERE department IS NOT NULL
                    ) AS all_depts
                `);
                
                const allDepts = deptsQuery.rows.map(row => row.department);
                const inputDept = filters.department.value;
                
                const exactMatch = allDepts.find(d => 
                    d.toLowerCase() === inputDept.toLowerCase()
                );
                
                if (!exactMatch && allDepts.length > 0) {
                    const fuzzyResult = findBestMatch(inputDept, allDepts);
                    
                    if (fuzzyResult.match && fuzzyResult.confidence >= 60) {
                        console.log(`✅ Fuzzy match found: "${inputDept}" → "${fuzzyResult.match}" (${fuzzyResult.confidence}% confidence)`);
                        filters.department.value = fuzzyResult.match;
                        fuzzyCorrections.push({
                            field: 'department',
                            original: inputDept,
                            corrected: fuzzyResult.match,
                            confidence: fuzzyResult.confidence
                        });
                        interpretation += ` (corrected "${inputDept}" to "${fuzzyResult.match}")`;
                    }
                }
            } catch (error) {
                console.error('Department fuzzy search error:', error);
            }
        }

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

            // Maintenance Costs (field: username)
            const maintenanceQuery = buildConditions({ username: 'username' });
            const maintenanceWhere = maintenanceQuery.conditions.length > 0 ? `WHERE ${maintenanceQuery.conditions.join(' AND ')}` : '';
            searchPromises.push(
                pool.query(`SELECT *, 'Maintenance Cost' as "itemType" FROM maintenance_costs ${maintenanceWhere}`, maintenanceQuery.values)
                    .then(result => ({ module: 'maintenance_costs', data: result.rows }))
                    .catch(err => ({ module: 'maintenance_costs', data: [], error: err.message }))
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

            // Generate insights and recommendations
            const insights = await generateInsights(aggregatedData, 'all', filters);
            const recommendations = generateRecommendations(aggregatedData, 'all', query, filters);

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
                }, {}),
                insights: insights,
                recommendations: recommendations,
                fuzzyCorrections: fuzzyCorrections.length > 0 ? fuzzyCorrections : undefined
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
            case 'maintenance_costs':
                tableName = 'maintenance_costs';
                break;
            case 'budgets':
                tableName = 'budgets';
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

        // Generate insights and recommendations
        const insights = await generateInsights(dbResult.rows, module, filters);
        const recommendations = generateRecommendations(dbResult.rows, module, query, filters);

        res.json({
            success: true,
            data: dbResult.rows,
            module: module,
            filters: filters,
            interpretation: interpretation,
            resultCount: dbResult.rows.length,
            insights: insights,
            recommendations: recommendations,
            fuzzyCorrections: fuzzyCorrections.length > 0 ? fuzzyCorrections : undefined
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

// ==========================================
// COST MANAGEMENT API ENDPOINTS
// ==========================================

// ============= MAINTENANCE COSTS =============

// Get all maintenance costs (VIEW permission)
app.get('/api/maintenance-costs', authenticateToken, isAdminOnly, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM maintenance_costs 
            ORDER BY date DESC, created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get maintenance costs by asset (VIEW permission)
app.get('/api/maintenance-costs/asset/:assetType/:assetId', authenticateToken, isAdminOnly, async (req, res) => {
    try {
        const { assetType, assetId } = req.params;
        const result = await pool.query(
            'SELECT * FROM maintenance_costs WHERE asset_type = $1 AND asset_id = $2 ORDER BY date DESC',
            [assetType, assetId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add maintenance cost (EDIT permission required)
app.post('/api/maintenance-costs', authenticateToken, isAdminOnly, async (req, res) => {
    const { 
        id, asset_type, asset_id, asset_name, username, cost, date, description, 
        service_provider, category, department, status, priority, invoice_number, 
        warranty_status, approval_status 
    } = req.body;
    try {
        await pool.query(
            `INSERT INTO maintenance_costs 
            (id, asset_type, asset_id, asset_name, username, cost, date, description, service_provider, 
             category, department, status, priority, invoice_number, warranty_status, approval_status, created_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [id, asset_type, asset_id, asset_name, username, cost, date, description, service_provider, 
             category, department, status || 'Pending', priority || 'Medium', invoice_number, 
             warranty_status, approval_status || 'Pending', req.user.username]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update maintenance cost (EDIT permission required)
app.put('/api/maintenance-costs/:id', authenticateToken, isAdminOnly, async (req, res) => {
    const { 
        asset_type, asset_id, asset_name, username, cost, date, description, 
        service_provider, category, department, status, priority, invoice_number, 
        warranty_status, approval_status, completion_date 
    } = req.body;
    try {
        const result = await pool.query(
            `UPDATE maintenance_costs 
            SET asset_type = $1, asset_id = $2, asset_name = $3, username = $4, cost = $5, date = $6, 
                description = $7, service_provider = $8, category = $9, department = $10, status = $11,
                priority = $12, invoice_number = $13, warranty_status = $14, approval_status = $15,
                completion_date = $16
            WHERE id = $17`,
            [asset_type, asset_id, asset_name, username, cost, date, description, service_provider, 
             category, department, status, priority, invoice_number, warranty_status, approval_status, 
             completion_date, req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete maintenance cost (EDIT permission required)
app.delete('/api/maintenance-costs/:id', authenticateToken, isAdminOnly, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM maintenance_costs WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= BUDGETS =============

// Get all budgets (VIEW permission)
app.get('/api/budgets', authenticateToken, isAdminOnly, async (req, res) => {
    try {
        const { year, department } = req.query;
        let query = 'SELECT * FROM budgets WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        
        if (year) {
            query += ` AND year = $${paramIndex}`;
            params.push(year);
            paramIndex++;
        }
        if (department) {
            query += ` AND department = $${paramIndex}`;
            params.push(department);
            paramIndex++;
        }
        
        query += ' ORDER BY year DESC, quarter DESC, department';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create or update budget (EDIT permission required)
app.post('/api/budgets', authenticateToken, isAdminOnly, async (req, res) => {
    const { id, department, year, quarter, category, allocated_amount, spent_amount, notes } = req.body;
    try {
        await pool.query(
            `INSERT INTO budgets (id, department, year, quarter, category, allocated_amount, spent_amount, notes, created_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (department, year, quarter, category) 
            DO UPDATE SET allocated_amount = $6, spent_amount = $7, notes = $8, updated_at = CURRENT_TIMESTAMP`,
            [id, department, year, quarter, category, allocated_amount, spent_amount || 0, notes, req.user.username]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update budget (EDIT permission required)
app.put('/api/budgets/:id', authenticateToken, isAdminOnly, async (req, res) => {
    const { allocated_amount, spent_amount, notes } = req.body;
    try {
        const result = await pool.query(
            `UPDATE budgets 
            SET allocated_amount = $1, spent_amount = $2, notes = $3, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $4`,
            [allocated_amount, spent_amount, notes, req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete budget
app.delete('/api/budgets/:id', authenticateToken, isAdminOnly, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM budgets WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= COST CENTERS =============

// Get all cost centers
app.get('/api/cost-centers', authenticateToken, isAdminOnly, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cost_centers ORDER BY department');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create cost center
app.post('/api/cost-centers', authenticateToken, isAdminOnly, async (req, res) => {
    const { id, department, cost_center_code, manager_name, annual_budget, notes } = req.body;
    try {
        await pool.query(
            'INSERT INTO cost_centers (id, department, cost_center_code, manager_name, annual_budget, notes) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, department, cost_center_code, manager_name, annual_budget, notes]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update cost center
app.put('/api/cost-centers/:id', authenticateToken, isAdminOnly, async (req, res) => {
    const { cost_center_code, manager_name, annual_budget, notes } = req.body;
    try {
        const result = await pool.query(
            'UPDATE cost_centers SET cost_center_code = $1, manager_name = $2, annual_budget = $3, notes = $4 WHERE id = $5',
            [cost_center_code, manager_name, annual_budget, notes, req.params.id]
        );
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete cost center
app.delete('/api/cost-centers/:id', authenticateToken, isAdminOnly, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM cost_centers WHERE id = $1', [req.params.id]);
        res.json({ changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============= FINANCIAL REPORTS & ANALYTICS =============

// Get financial summary
app.get('/api/financial/summary', authenticateToken, isAdminOnly, async (req, res) => {
    try {
        // Total asset value
        const assetsQuery = await pool.query(`
            SELECT 
                SUM(COALESCE(purchase_cost, 0)) as total_pcs FROM pcs 
            UNION ALL
            SELECT SUM(COALESCE(purchase_cost, 0)) FROM laptops
            UNION ALL
            SELECT SUM(COALESCE(purchase_cost, 0)) FROM servers
        `);
        
        const totalAssets = assetsQuery.rows.reduce((sum, row) => sum + parseFloat(row.total_pcs || 0), 0);
        
        // Total maintenance costs (last 12 months)
        const maintenanceQuery = await pool.query(`
            SELECT SUM(cost) as total_maintenance 
            FROM maintenance_costs 
            WHERE date >= CURRENT_DATE - INTERVAL '12 months'
        `);
        
        // This month spending
        const thisMonthQuery = await pool.query(`
            SELECT SUM(cost) as month_spending 
            FROM maintenance_costs 
            WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
        `);
        
        // Budget summary
        const budgetQuery = await pool.query(`
            SELECT 
                SUM(allocated_amount) as total_budget,
                SUM(spent_amount) as total_spent
            FROM budgets
            WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
        `);
        
        res.json({
            totalAssetValue: parseFloat(totalAssets || 0),
            totalMaintenanceCosts: parseFloat(maintenanceQuery.rows[0]?.total_maintenance || 0),
            thisMonthSpending: parseFloat(thisMonthQuery.rows[0]?.month_spending || 0),
            annualBudget: parseFloat(budgetQuery.rows[0]?.total_budget || 0),
            annualSpent: parseFloat(budgetQuery.rows[0]?.total_spent || 0)
        });
    } catch (err) {
        console.error('Financial summary error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get cost by department
app.get('/api/financial/cost-by-department', authenticateToken, isAdminOnly, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                department,
                COUNT(*) as asset_count,
                SUM(COALESCE(purchase_cost, 0)) as total_cost
            FROM (
                SELECT department, purchase_cost FROM pcs WHERE department IS NOT NULL
                UNION ALL
                SELECT department, purchase_cost FROM laptops WHERE department IS NOT NULL
                UNION ALL
                SELECT department, purchase_cost FROM servers WHERE department IS NOT NULL
            ) AS all_assets
            GROUP BY department
            ORDER BY total_cost DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get depreciation report
app.get('/api/financial/depreciation', authenticateToken, isAdminOnly, async (req, res) => {
    try {
        const calculateDepreciation = (purchaseCost, purchaseDate, depreciationYears) => {
            if (!purchaseCost || !purchaseDate || !depreciationYears) return null;
            
            const cost = parseFloat(purchaseCost);
            const years = parseFloat(depreciationYears);
            const annualDepreciation = cost / years;
            
            const purchase = new Date(purchaseDate);
            const now = new Date();
            const ageInYears = (now - purchase) / (1000 * 60 * 60 * 24 * 365);
            
            const totalDepreciation = Math.min(annualDepreciation * ageInYears, cost);
            const currentValue = Math.max(cost - totalDepreciation, 0);
            
            return {
                purchaseCost: cost,
                annualDepreciation,
                totalDepreciation,
                currentValue,
                ageInYears: ageInYears.toFixed(1)
            };
        };
        
        // Get all assets with cost data
        const pcsQuery = await pool.query('SELECT id, "pcName" as name, purchase_cost, purchase_date, depreciation_years, department FROM pcs WHERE purchase_cost > 0');
        const laptopsQuery = await pool.query('SELECT id, "pcName" as name, purchase_cost, purchase_date, depreciation_years, department FROM laptops WHERE purchase_cost > 0');
        const serversQuery = await pool.query('SELECT id, "serverID" as name, purchase_cost, purchase_date, depreciation_years, department FROM servers WHERE purchase_cost > 0');
        
        const assets = [
            ...pcsQuery.rows.map(a => ({ ...a, type: 'PC', ...calculateDepreciation(a.purchase_cost, a.purchase_date, a.depreciation_years) })),
            ...laptopsQuery.rows.map(a => ({ ...a, type: 'Laptop', ...calculateDepreciation(a.purchase_cost, a.purchase_date, a.depreciation_years) })),
            ...serversQuery.rows.map(a => ({ ...a, type: 'Server', ...calculateDepreciation(a.purchase_cost, a.purchase_date, a.depreciation_years) }))
        ].filter(a => a.currentValue !== null);
        
        res.json(assets);
    } catch (err) {
        console.error('Depreciation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get TCO (Total Cost of Ownership) analysis
app.get('/api/financial/tco', authenticateToken, isAdminOnly, async (req, res) => {
    try {
        const { assetType, assetId } = req.query;
        
        if (!assetType || !assetId) {
            return res.status(400).json({ error: 'assetType and assetId required' });
        }
        
        // Get asset details
        let assetQuery;
        let tableName;
        
        switch(assetType.toLowerCase()) {
            case 'pc':
                tableName = 'pcs';
                assetQuery = await pool.query('SELECT * FROM pcs WHERE id = $1', [assetId]);
                break;
            case 'laptop':
                tableName = 'laptops';
                assetQuery = await pool.query('SELECT * FROM laptops WHERE id = $1', [assetId]);
                break;
            case 'server':
                tableName = 'servers';
                assetQuery = await pool.query('SELECT * FROM servers WHERE id = $1', [assetId]);
                break;
            default:
                return res.status(400).json({ error: 'Invalid asset type' });
        }
        
        if (assetQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        const asset = assetQuery.rows[0];
        
        // Get maintenance costs
        const maintenanceQuery = await pool.query(
            'SELECT SUM(cost) as total FROM maintenance_costs WHERE asset_type = $1 AND asset_id = $2',
            [assetType, assetId]
        );
        
        const purchaseCost = parseFloat(asset.purchase_cost || 0);
        const maintenanceCost = parseFloat(maintenanceQuery.rows[0]?.total || 0);
        
        // Calculate operating cost (estimate: 10% of purchase cost per year)
        const ageInYears = asset.purchase_date 
            ? (new Date() - new Date(asset.purchase_date)) / (1000 * 60 * 60 * 24 * 365)
            : 0;
        const operatingCost = purchaseCost * 0.1 * ageInYears;
        
        // Salvage value (estimate: 10% of purchase cost)
        const salvageValue = purchaseCost * 0.1;
        
        const totalCostOfOwnership = purchaseCost + maintenanceCost + operatingCost - salvageValue;
        const annualTCO = ageInYears > 0 ? totalCostOfOwnership / ageInYears : 0;
        
        res.json({
            asset: {
                id: asset.id,
                name: asset.pcName || asset.serverID,
                type: assetType
            },
            costs: {
                purchase: purchaseCost,
                maintenance: maintenanceCost,
                operating: operatingCost,
                salvage: salvageValue,
                total: totalCostOfOwnership,
                annualTCO: annualTCO
            },
            ageInYears: ageInYears.toFixed(1)
        });
    } catch (err) {
        console.error('TCO error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get monthly spending trend
app.get('/api/financial/monthly-trend', authenticateToken, isAdminOnly, async (req, res) => {
    try {
        const { months = 12 } = req.query;
        
        const result = await pool.query(`
            SELECT 
                TO_CHAR(date, 'YYYY-MM') as month,
                SUM(cost) as total_cost,
                COUNT(*) as transaction_count
            FROM maintenance_costs
            WHERE date >= CURRENT_DATE - INTERVAL '${months} months'
            GROUP BY TO_CHAR(date, 'YYYY-MM')
            ORDER BY month
        `);
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});

