const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS pcs (
        id TEXT PRIMARY KEY,
        department TEXT,
        ip TEXT,
        pcName TEXT,
        username TEXT,
        motherboard TEXT,
        cpu TEXT,
        ram TEXT,
        storage TEXT,
        monitor TEXT,
        os TEXT,
        status TEXT,
        floor INTEGER,
        customFields TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS laptops (
        id TEXT PRIMARY KEY,
        pcName TEXT,
        username TEXT,
        brand TEXT,
        model TEXT,
        cpu TEXT,
        serialNumber TEXT,
        ram TEXT,
        storage TEXT,
        userStatus TEXT,
        department TEXT,
        date TEXT,
        hardwareStatus TEXT,
        customFields TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY,
        serverID TEXT,
        brand TEXT,
        model TEXT,
        cpu TEXT,
        totalCores INTEGER,
        ram TEXT,
        storage TEXT,
        raid TEXT,
        status TEXT,
        department TEXT,
        customFields TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS mouseLogs (
        id TEXT PRIMARY KEY,
        productName TEXT,
        serialNumber TEXT,
        pcName TEXT,
        pcUsername TEXT,
        department TEXT,
        date TEXT,
        time TEXT,
        servicedBy TEXT,
        comment TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS keyboardLogs (
        id TEXT PRIMARY KEY,
        productName TEXT,
        serialNumber TEXT,
        pcName TEXT,
        pcUsername TEXT,
        department TEXT,
        date TEXT,
        time TEXT,
        servicedBy TEXT,
        comment TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ssdLogs (
        id TEXT PRIMARY KEY,
        productName TEXT,
        serialNumber TEXT,
        pcName TEXT,
        pcUsername TEXT,
        department TEXT,
        date TEXT,
        time TEXT,
        servicedBy TEXT,
        comment TEXT
    )`);
});

app.get('/api/pcs', (req, res) => {
    db.all('SELECT * FROM pcs', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(row => ({...row, customFields: JSON.parse(row.customFields || '{}')})));
    });
});

app.post('/api/pcs', (req, res) => {
    const { id, department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, customFields } = req.body;
    const customFieldsJson = JSON.stringify(customFields || {});
    db.run('INSERT INTO pcs (id, department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, customFields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [id, department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, customFieldsJson], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/pcs/:id', (req, res) => {
    const { department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, customFields } = req.body;
    const customFieldsJson = JSON.stringify(customFields || {});
    db.run('UPDATE pcs SET department = ?, ip = ?, pcName = ?, username = ?, motherboard = ?, cpu = ?, ram = ?, storage = ?, monitor = ?, os = ?, status = ?, floor = ?, customFields = ? WHERE id = ?', 
        [department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status, floor, customFieldsJson, req.params.id], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        }
    );
});

app.delete('/api/pcs/:id', (req, res) => {
    db.run('DELETE FROM pcs WHERE id = ?', req.params.id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
});

app.get('/api/laptops', (req, res) => {
    db.all('SELECT * FROM laptops', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(row => ({...row, customFields: JSON.parse(row.customFields || '{}')})));
    });
});

app.post('/api/laptops', (req, res) => {
    const { id, pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, customFields } = req.body;
    const customFieldsJson = JSON.stringify(customFields || {});
    db.run('INSERT INTO laptops (id, pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, customFields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [id, pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, customFieldsJson], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/laptops/:id', (req, res) => {
    const { pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, customFields } = req.body;
    const customFieldsJson = JSON.stringify(customFields || {});
    db.run('UPDATE laptops SET pcName = ?, username = ?, brand = ?, model = ?, cpu = ?, serialNumber = ?, ram = ?, storage = ?, userStatus = ?, department = ?, date = ?, hardwareStatus = ?, customFields = ? WHERE id = ?', 
        [pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus, customFieldsJson, req.params.id], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        }
    );
});

app.delete('/api/laptops/:id', (req, res) => {
    db.run('DELETE FROM laptops WHERE id = ?', req.params.id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
});

app.get('/api/servers', (req, res) => {
    db.all('SELECT * FROM servers', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(row => ({...row, customFields: JSON.parse(row.customFields || '{}')})));
    });
});

app.post('/api/servers', (req, res) => {
    const { id, serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, customFields } = req.body;
    const customFieldsJson = JSON.stringify(customFields || {});
    db.run('INSERT INTO servers (id, serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, customFields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [id, serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, customFieldsJson], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/servers/:id', (req, res) => {
    const { serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, customFields } = req.body;
    const customFieldsJson = JSON.stringify(customFields || {});
    db.run('UPDATE servers SET serverID = ?, brand = ?, model = ?, cpu = ?, totalCores = ?, ram = ?, storage = ?, raid = ?, status = ?, department = ?, customFields = ? WHERE id = ?', 
        [serverID, brand, model, cpu, totalCores, ram, storage, raid, status, department, customFieldsJson, req.params.id], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        }
    );
});

app.delete('/api/servers/:id', (req, res) => {
    db.run('DELETE FROM servers WHERE id = ?', req.params.id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
});

app.get('/api/mouselogs', (req, res) => {
    db.all('SELECT * FROM mouseLogs', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/mouselogs', (req, res) => {
    const { id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    db.run('INSERT INTO mouseLogs (id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/mouselogs/:id', (req, res) => {
    const { productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    db.run('UPDATE mouseLogs SET productName = ?, serialNumber = ?, pcName = ?, pcUsername = ?, department = ?, date = ?, time = ?, servicedBy = ?, comment = ? WHERE id = ?', 
        [productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment, req.params.id], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        }
    );
});

app.delete('/api/mouselogs/:id', (req, res) => {
    db.run('DELETE FROM mouseLogs WHERE id = ?', req.params.id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
});

app.get('/api/keyboardlogs', (req, res) => {
    db.all('SELECT * FROM keyboardLogs', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/keyboardlogs', (req, res) => {
    const { id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    db.run('INSERT INTO keyboardLogs (id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/keyboardlogs/:id', (req, res) => {
    const { productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    db.run('UPDATE keyboardLogs SET productName = ?, serialNumber = ?, pcName = ?, pcUsername = ?, department = ?, date = ?, time = ?, servicedBy = ?, comment = ? WHERE id = ?', 
        [productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment, req.params.id], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        }
    );
});

app.delete('/api/keyboardlogs/:id', (req, res) => {
    db.run('DELETE FROM keyboardLogs WHERE id = ?', req.params.id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
});

app.get('/api/ssdlogs', (req, res) => {
    db.all('SELECT * FROM ssdLogs', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/ssdlogs', (req, res) => {
    const { id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    db.run('INSERT INTO ssdLogs (id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [id, productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/ssdlogs/:id', (req, res) => {
    const { productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment } = req.body;
    db.run('UPDATE ssdLogs SET productName = ?, serialNumber = ?, pcName = ?, pcUsername = ?, department = ?, date = ?, time = ?, servicedBy = ?, comment = ? WHERE id = ?', 
        [productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment, req.params.id], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        }
    );
});

app.delete('/api/ssdlogs/:id', (req, res) => {
    db.run('DELETE FROM ssdLogs WHERE id = ?', req.params.id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
