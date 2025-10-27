/**
 * Database Seed Script
 * Adds demo data to all tables for demonstration purposes
 */

const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

// Generate unique IDs
const generateId = () => crypto.randomUUID();

const seedData = {
    // PC Information - 15 entries
    pcs: [
        { ip: '192.168.1.101', pcName: 'IT-PC-001', username: 'John Doe', department: 'IT', motherboard: 'ASUS Prime B450M', cpu: 'Intel Core i7-9700', ram: '16 GB', storage: '512 GB SSD', monitor: 'Dell 24 inch', os: 'Windows 11 Pro', status: 'OK', floor: 5 },
        { ip: '192.168.1.102', pcName: 'HR-PC-001', username: 'Sarah Wilson', department: 'HR', motherboard: 'MSI B450M PRO', cpu: 'Intel Core i5-8400', ram: '8 GB', storage: '256 GB SSD', monitor: 'Samsung 22 inch', os: 'Windows 10 Pro', status: 'OK', floor: 6 },
        { ip: '192.168.1.103', pcName: 'FIN-PC-001', username: 'Michael Chen', department: 'Finance', motherboard: 'Gigabyte B450M', cpu: 'Intel Core i7-10700', ram: '16 GB', storage: '1 TB HDD', monitor: 'LG 27 inch', os: 'Windows 11 Pro', status: 'OK', floor: 7 },
        { ip: '192.168.1.104', pcName: 'IT-PC-002', username: 'Emily Brown', department: 'IT', motherboard: 'ASUS ROG STRIX', cpu: 'AMD Ryzen 7 3700X', ram: '32 GB', storage: '1 TB SSD', monitor: 'ASUS 27 inch', os: 'Windows 11 Pro', status: 'OK', floor: 5 },
        { ip: '192.168.1.105', pcName: 'SALES-PC-001', username: 'David Miller', department: 'Sales', motherboard: 'MSI B450 TOMAHAWK', cpu: 'Intel Core i5-9400', ram: '8 GB', storage: '512 GB SSD', monitor: 'Dell 22 inch', os: 'Windows 10 Pro', status: 'Repair', floor: 6 },
        { ip: '192.168.1.106', pcName: 'MKT-PC-001', username: 'Jessica Taylor', department: 'Marketing', motherboard: 'Gigabyte B550M', cpu: 'AMD Ryzen 5 3600', ram: '16 GB', storage: '512 GB SSD', monitor: 'HP 24 inch', os: 'Windows 11 Pro', status: 'OK', floor: 6 },
        { ip: '192.168.1.107', pcName: 'IT-PC-003', username: 'Robert Anderson', department: 'IT', motherboard: 'ASUS TUF Gaming', cpu: 'Intel Core i7-11700', ram: '32 GB', storage: '2 TB SSD', monitor: 'Dell 27 inch UltraSharp', os: 'Windows 11 Pro', status: 'OK', floor: 5 },
        { ip: '192.168.1.108', pcName: 'HR-PC-002', username: 'Lisa Martinez', department: 'HR', motherboard: 'MSI B550M PRO', cpu: 'Intel Core i5-10400', ram: '16 GB', storage: '512 GB SSD', monitor: 'Samsung 24 inch', os: 'Windows 10 Pro', status: 'OK', floor: 6 },
        { ip: '192.168.1.109', pcName: 'FIN-PC-002', username: 'James Thompson', department: 'Finance', motherboard: 'Gigabyte H510M', cpu: 'Intel Core i7-11700', ram: '16 GB', storage: '1 TB SSD', monitor: 'LG 24 inch', os: 'Windows 11 Pro', status: 'OK', floor: 7 },
        { ip: '192.168.1.110', pcName: 'OPS-PC-001', username: 'Maria Garcia', department: 'Operations', motherboard: 'ASUS Prime H510M', cpu: 'Intel Core i5-11400', ram: '8 GB', storage: '512 GB SSD', monitor: 'Dell 22 inch', os: 'Windows 10 Pro', status: 'OK', floor: 5 },
        { ip: '192.168.1.111', pcName: 'IT-PC-004', username: 'William Lee', department: 'IT', motherboard: 'MSI MPG Z490', cpu: 'Intel Core i9-10900K', ram: '32 GB', storage: '2 TB NVMe SSD', monitor: 'ASUS 32 inch 4K', os: 'Windows 11 Pro', status: 'OK', floor: 5 },
        { ip: '192.168.1.112', pcName: 'SALES-PC-002', username: 'Jennifer White', department: 'Sales', motherboard: 'Gigabyte B450 AORUS', cpu: 'AMD Ryzen 5 3600', ram: '16 GB', storage: '512 GB SSD', monitor: 'HP 24 inch', os: 'Windows 10 Pro', status: 'OK', floor: 6 },
        { ip: '192.168.1.113', pcName: 'MKT-PC-002', username: 'Daniel Harris', department: 'Marketing', motherboard: 'ASUS B550-PLUS', cpu: 'AMD Ryzen 7 5700X', ram: '32 GB', storage: '1 TB SSD', monitor: 'Dell 27 inch', os: 'Windows 11 Pro', status: 'NO', floor: 6 },
        { ip: '192.168.1.114', pcName: 'HR-PC-003', username: 'Patricia Clark', department: 'HR', motherboard: 'MSI B450M BAZOOKA', cpu: 'Intel Core i5-9400', ram: '8 GB', storage: '256 GB SSD', monitor: 'Samsung 22 inch', os: 'Windows 10 Pro', status: 'Repair', floor: 6 },
        { ip: '192.168.1.115', pcName: 'FIN-PC-003', username: 'Christopher Rodriguez', department: 'Finance', motherboard: 'Gigabyte B560M', cpu: 'Intel Core i7-11700K', ram: '32 GB', storage: '1 TB SSD', monitor: 'LG 27 inch UltraWide', os: 'Windows 11 Pro', status: 'OK', floor: 7 }
    ],

    // Laptop Information - 15 entries
    laptops: [
        { pcName: 'LAP-IT-001', username: 'Alex Johnson', brand: 'Dell', model: 'Latitude 5420', cpu: 'Intel Core i7-1165G7', serialNumber: 'DL5420-2024-001', ram: '16 GB', storage: '512 GB SSD', userStatus: 'Active', department: 'IT', date: '2024-01-15', hardwareStatus: 'Good' },
        { pcName: 'LAP-HR-001', username: 'Sophia Martinez', brand: 'HP', model: 'EliteBook 840 G8', cpu: 'Intel Core i5-1135G7', serialNumber: 'HP840-2024-001', ram: '16 GB', storage: '256 GB SSD', userStatus: 'Active', department: 'HR', date: '2024-02-10', hardwareStatus: 'Good' },
        { pcName: 'LAP-FIN-001', username: 'Oliver Brown', brand: 'Lenovo', model: 'ThinkPad X1 Carbon', cpu: 'Intel Core i7-1185G7', serialNumber: 'LNV-X1C-2024-001', ram: '32 GB', storage: '1 TB SSD', userStatus: 'Active', department: 'Finance', date: '2024-01-20', hardwareStatus: 'Good' },
        { pcName: 'LAP-SALES-001', username: 'Emma Davis', brand: 'Dell', model: 'Inspiron 15 3000', cpu: 'Intel Core i5-1135G7', serialNumber: 'DL3000-2024-001', ram: '8 GB', storage: '512 GB SSD', userStatus: 'Active', department: 'Sales', date: '2024-03-05', hardwareStatus: 'Battery Problem' },
        { pcName: 'LAP-MKT-001', username: 'Noah Wilson', brand: 'ASUS', model: 'ZenBook 14', cpu: 'AMD Ryzen 7 5800H', serialNumber: 'ASUS-ZB14-2024-001', ram: '16 GB', storage: '512 GB SSD', userStatus: 'Active', department: 'Marketing', date: '2024-02-15', hardwareStatus: 'Good' },
        { pcName: 'LAP-IT-002', username: 'Ava Taylor', brand: 'HP', model: 'ProBook 450 G8', cpu: 'Intel Core i7-1165G7', serialNumber: 'HP450-2024-002', ram: '16 GB', storage: '512 GB SSD', userStatus: 'Active', department: 'IT', date: '2024-01-25', hardwareStatus: 'Good' },
        { pcName: 'LAP-HR-002', username: 'Liam Anderson', brand: 'Lenovo', model: 'ThinkPad E15', cpu: 'Intel Core i5-1135G7', serialNumber: 'LNV-E15-2024-002', ram: '8 GB', storage: '256 GB SSD', userStatus: 'Active', department: 'HR', date: '2024-03-10', hardwareStatus: 'Platform Problem' },
        { pcName: 'LAP-FIN-002', username: 'Isabella Thomas', brand: 'Dell', model: 'Vostro 15 3000', cpu: 'Intel Core i5-1135G7', serialNumber: 'DL-VST-2024-002', ram: '16 GB', storage: '512 GB SSD', userStatus: 'Active', department: 'Finance', date: '2024-02-20', hardwareStatus: 'Good' },
        { pcName: 'LAP-OPS-001', username: 'Ethan Jackson', brand: 'HP', model: 'Pavilion 15', cpu: 'AMD Ryzen 5 5500U', serialNumber: 'HP-PAV-2024-001', ram: '8 GB', storage: '512 GB SSD', userStatus: 'Active', department: 'Operations', date: '2024-03-01', hardwareStatus: 'Good' },
        { pcName: 'LAP-IT-003', username: 'Mia White', brand: 'Lenovo', model: 'ThinkPad T14', cpu: 'Intel Core i7-1165G7', serialNumber: 'LNV-T14-2024-003', ram: '32 GB', storage: '1 TB SSD', userStatus: 'Active', department: 'IT', date: '2024-01-30', hardwareStatus: 'Good' },
        { pcName: 'LAP-SALES-002', username: 'Lucas Harris', brand: 'ASUS', model: 'VivoBook 15', cpu: 'Intel Core i5-1135G7', serialNumber: 'ASUS-VB15-2024-002', ram: '8 GB', storage: '512 GB SSD', userStatus: 'Active', department: 'Sales', date: '2024-03-15', hardwareStatus: 'Battery Problem' },
        { pcName: 'LAP-MKT-002', username: 'Charlotte Martin', brand: 'Dell', model: 'XPS 13', cpu: 'Intel Core i7-1185G7', serialNumber: 'DL-XPS13-2024-002', ram: '16 GB', storage: '512 GB SSD', userStatus: 'Active', department: 'Marketing', date: '2024-02-25', hardwareStatus: 'Good' },
        { pcName: 'LAP-IT-004', username: 'Benjamin Garcia', brand: 'HP', model: 'ZBook 15', cpu: 'Intel Core i9-11900H', serialNumber: 'HP-ZB15-2024-004', ram: '64 GB', storage: '2 TB SSD', userStatus: 'Active', department: 'IT', date: '2024-01-10', hardwareStatus: 'Good' },
        { pcName: 'LAP-FIN-003', username: 'Amelia Rodriguez', brand: 'Lenovo', model: 'ThinkPad P15', cpu: 'Intel Core i7-11800H', serialNumber: 'LNV-P15-2024-003', ram: '32 GB', storage: '1 TB SSD', userStatus: 'Active', department: 'Finance', date: '2024-02-05', hardwareStatus: 'Good' },
        { pcName: 'LAP-HR-003', username: 'Henry Lee', brand: 'Dell', model: 'Latitude 7420', cpu: 'Intel Core i7-1185G7', serialNumber: 'DL7420-2024-003', ram: '16 GB', storage: '512 GB SSD', userStatus: 'Active', department: 'HR', date: '2024-03-20', hardwareStatus: 'Good' }
    ],

    // Server Information - 12 entries
    servers: [
        { serverID: 'SRV-WEB-001', brand: 'Dell', model: 'PowerEdge R740', cpu: 'Intel Xeon Gold 6248R', totalCores: 48, ram: '256 GB', storage: '8 TB RAID 10', raid: 'RAID 10', status: 'Online', department: 'IT' },
        { serverID: 'SRV-DB-001', brand: 'HP', model: 'ProLiant DL380 Gen10', cpu: 'Intel Xeon Gold 6226R', totalCores: 32, ram: '512 GB', storage: '12 TB RAID 6', raid: 'RAID 6', status: 'Online', department: 'IT' },
        { serverID: 'SRV-APP-001', brand: 'Dell', model: 'PowerEdge R640', cpu: 'Intel Xeon Silver 4214R', totalCores: 24, ram: '128 GB', storage: '4 TB RAID 5', raid: 'RAID 5', status: 'Online', department: 'IT' },
        { serverID: 'SRV-FILE-001', brand: 'Lenovo', model: 'ThinkSystem SR650', cpu: 'Intel Xeon Gold 5218R', totalCores: 40, ram: '256 GB', storage: '16 TB RAID 6', raid: 'RAID 6', status: 'Online', department: 'Operations' },
        { serverID: 'SRV-MAIL-001', brand: 'HP', model: 'ProLiant DL360 Gen10', cpu: 'Intel Xeon Gold 6230R', totalCores: 52, ram: '384 GB', storage: '6 TB RAID 1', raid: 'RAID 1', status: 'Online', department: 'IT' },
        { serverID: 'SRV-BACKUP-001', brand: 'Dell', model: 'PowerEdge R740xd', cpu: 'Intel Xeon Silver 4216', totalCores: 32, ram: '128 GB', storage: '24 TB RAID 6', raid: 'RAID 6', status: 'Online', department: 'IT' },
        { serverID: 'SRV-TEST-001', brand: 'HP', model: 'ProLiant DL380 Gen9', cpu: 'Intel Xeon E5-2680 v4', totalCores: 28, ram: '64 GB', storage: '2 TB RAID 1', raid: 'RAID 1', status: 'Maintenance', department: 'IT' },
        { serverID: 'SRV-WEB-002', brand: 'Dell', model: 'PowerEdge R640', cpu: 'Intel Xeon Gold 6248R', totalCores: 48, ram: '256 GB', storage: '8 TB RAID 10', raid: 'RAID 10', status: 'Online', department: 'IT' },
        { serverID: 'SRV-DB-002', brand: 'Lenovo', model: 'ThinkSystem SR850', cpu: 'Intel Xeon Platinum 8280', totalCores: 112, ram: '1 TB', storage: '20 TB RAID 10', raid: 'RAID 10', status: 'Online', department: 'IT' },
        { serverID: 'SRV-APP-002', brand: 'HP', model: 'ProLiant DL360 Gen10', cpu: 'Intel Xeon Gold 6226R', totalCores: 32, ram: '192 GB', storage: '4 TB RAID 5', raid: 'RAID 5', status: 'Offline', department: 'IT' },
        { serverID: 'SRV-DEV-001', brand: 'Dell', model: 'PowerEdge R440', cpu: 'Intel Xeon Silver 4214', totalCores: 24, ram: '96 GB', storage: '2 TB RAID 1', raid: 'RAID 1', status: 'Online', department: 'IT' },
        { serverID: 'SRV-MONITOR-001', brand: 'HP', model: 'ProLiant DL20 Gen10', cpu: 'Intel Xeon E-2224', totalCores: 4, ram: '32 GB', storage: '1 TB RAID 1', raid: 'RAID 1', status: 'Online', department: 'IT' }
    ],

    // Mouse Logs - 15 entries
    mouseLogs: [
        { productName: 'Logitech MX Master 3', serialNumber: 'LG-MX3-001', pcName: 'IT-PC-001', pcUsername: 'John Doe', department: 'IT', date: '2024-10-20', time: '09:30', servicedBy: 'Tech Support', comment: 'New mouse issued' },
        { productName: 'Microsoft Ergonomic Mouse', serialNumber: 'MS-ERG-002', pcName: 'HR-PC-001', pcUsername: 'Sarah Wilson', department: 'HR', date: '2024-10-21', time: '10:15', servicedBy: 'Tech Support', comment: 'Replacement due to damage' },
        { productName: 'Dell Wireless Mouse', serialNumber: 'DL-WM-003', pcName: 'FIN-PC-001', pcUsername: 'Michael Chen', department: 'Finance', date: '2024-10-22', time: '14:00', servicedBy: 'Tech Support', comment: 'New assignment' },
        { productName: 'HP X3000 Wireless Mouse', serialNumber: 'HP-X3K-004', pcName: 'SALES-PC-001', pcUsername: 'David Miller', department: 'Sales', date: '2024-10-23', time: '11:00', servicedBy: 'Tech Support', comment: 'Mouse not working - replaced' },
        { productName: 'Logitech M720 Triathlon', serialNumber: 'LG-M720-005', pcName: 'IT-PC-002', pcUsername: 'Emily Brown', department: 'IT', date: '2024-10-24', time: '15:30', servicedBy: 'Tech Support', comment: 'New equipment' },
        { productName: 'A4TECH OP-330', serialNumber: 'A4T-330-006', pcName: '', pcUsername: '', department: '', date: '2024-10-25', time: '09:00', servicedBy: 'Admin', comment: 'Stock replenishment' },
        { productName: 'A4TECH OP-330', serialNumber: 'A4T-330-007', pcName: '', pcUsername: '', department: '', date: '2024-10-25', time: '09:00', servicedBy: 'Admin', comment: 'Stock replenishment' },
        { productName: 'A4TECH OP-330', serialNumber: 'A4T-330-008', pcName: '', pcUsername: '', department: '', date: '2024-10-25', time: '09:00', servicedBy: 'Admin', comment: 'Stock replenishment' },
        { productName: 'Logitech M331 Silent', serialNumber: 'LG-M331-009', pcName: 'MKT-PC-001', pcUsername: 'Jessica Taylor', department: 'Marketing', date: '2024-10-26', time: '10:30', servicedBy: 'Tech Support', comment: 'New issue' },
        { productName: 'Microsoft Basic Optical', serialNumber: 'MS-BO-010', pcName: 'HR-PC-002', pcUsername: 'Lisa Martinez', department: 'HR', date: '2024-10-26', time: '13:00', servicedBy: 'Tech Support', comment: 'Replacement' },
        { productName: 'Dell MS116', serialNumber: 'DL-MS116-011', pcName: '', pcUsername: '', department: '', date: '2024-10-27', time: '09:00', servicedBy: 'Admin', comment: 'New stock' },
        { productName: 'Dell MS116', serialNumber: 'DL-MS116-012', pcName: '', pcUsername: '', department: '', date: '2024-10-27', time: '09:00', servicedBy: 'Admin', comment: 'New stock' },
        { productName: 'HP Z3700 Wireless', serialNumber: 'HP-Z3700-013', pcName: 'FIN-PC-002', pcUsername: 'James Thompson', department: 'Finance', date: '2024-10-27', time: '11:30', servicedBy: 'Tech Support', comment: 'Mouse upgrade' },
        { productName: 'Logitech M170', serialNumber: 'LG-M170-014', pcName: 'OPS-PC-001', pcUsername: 'Maria Garcia', department: 'Operations', date: '2024-10-27', time: '14:00', servicedBy: 'Tech Support', comment: 'New assignment' },
        { productName: 'Microsoft Sculpt Mobile', serialNumber: 'MS-SCULPT-015', pcName: 'SALES-PC-002', pcUsername: 'Jennifer White', department: 'Sales', date: '2024-10-27', time: '16:00', servicedBy: 'Tech Support', comment: 'Ergonomic upgrade' }
    ],

    // Keyboard Logs - 15 entries
    keyboardLogs: [
        { productName: 'Logitech K380', serialNumber: 'LG-K380-001', pcName: 'IT-PC-001', pcUsername: 'John Doe', department: 'IT', date: '2024-10-20', time: '09:45', servicedBy: 'Tech Support', comment: 'New keyboard issued' },
        { productName: 'Microsoft Ergonomic Keyboard', serialNumber: 'MS-ERG-KB-002', pcName: 'HR-PC-001', pcUsername: 'Sarah Wilson', department: 'HR', date: '2024-10-21', time: '10:30', servicedBy: 'Tech Support', comment: 'Ergonomic upgrade' },
        { productName: 'Dell KB216', serialNumber: 'DL-KB216-003', pcName: 'FIN-PC-001', pcUsername: 'Michael Chen', department: 'Finance', date: '2024-10-22', time: '14:15', servicedBy: 'Tech Support', comment: 'Replacement' },
        { productName: 'HP K2500 Wireless', serialNumber: 'HP-K2500-004', pcName: 'SALES-PC-001', pcUsername: 'David Miller', department: 'Sales', date: '2024-10-23', time: '11:15', servicedBy: 'Tech Support', comment: 'Keyboard malfunction - replaced' },
        { productName: 'Logitech MK270', serialNumber: 'LG-MK270-005', pcName: 'IT-PC-002', pcUsername: 'Emily Brown', department: 'IT', date: '2024-10-24', time: '15:45', servicedBy: 'Tech Support', comment: 'New setup' },
        { productName: 'A4TECH KR-85', serialNumber: 'A4T-KR85-006', pcName: '', pcUsername: '', department: '', date: '2024-10-25', time: '09:15', servicedBy: 'Admin', comment: 'Stock replenishment' },
        { productName: 'A4TECH KR-85', serialNumber: 'A4T-KR85-007', pcName: '', pcUsername: '', department: '', date: '2024-10-25', time: '09:15', servicedBy: 'Admin', comment: 'Stock replenishment' },
        { productName: 'A4TECH KR-85', serialNumber: 'A4T-KR85-008', pcName: '', pcUsername: '', department: '', date: '2024-10-25', time: '09:15', servicedBy: 'Admin', comment: 'Stock replenishment' },
        { productName: 'Logitech K400 Plus', serialNumber: 'LG-K400-009', pcName: 'MKT-PC-001', pcUsername: 'Jessica Taylor', department: 'Marketing', date: '2024-10-26', time: '10:45', servicedBy: 'Tech Support', comment: 'Wireless keyboard' },
        { productName: 'Microsoft Wired Keyboard 600', serialNumber: 'MS-WK600-010', pcName: 'HR-PC-002', pcUsername: 'Lisa Martinez', department: 'HR', date: '2024-10-26', time: '13:15', servicedBy: 'Tech Support', comment: 'Standard replacement' },
        { productName: 'Dell KB216', serialNumber: 'DL-KB216-011', pcName: '', pcUsername: '', department: '', date: '2024-10-27', time: '09:15', servicedBy: 'Admin', comment: 'New stock' },
        { productName: 'Dell KB216', serialNumber: 'DL-KB216-012', pcName: '', pcUsername: '', department: '', date: '2024-10-27', time: '09:15', servicedBy: 'Admin', comment: 'New stock' },
        { productName: 'HP 225 Wireless Keyboard', serialNumber: 'HP-225W-013', pcName: 'FIN-PC-002', pcUsername: 'James Thompson', department: 'Finance', date: '2024-10-27', time: '11:45', servicedBy: 'Tech Support', comment: 'Wireless upgrade' },
        { productName: 'Logitech K360', serialNumber: 'LG-K360-014', pcName: 'OPS-PC-001', pcUsername: 'Maria Garcia', department: 'Operations', date: '2024-10-27', time: '14:15', servicedBy: 'Tech Support', comment: 'New assignment' },
        { productName: 'Microsoft Surface Keyboard', serialNumber: 'MS-SURF-KB-015', pcName: 'SALES-PC-002', pcUsername: 'Jennifer White', department: 'Sales', date: '2024-10-27', time: '16:15', servicedBy: 'Tech Support', comment: 'Premium keyboard' }
    ],

    // SSD Logs - 12 entries
    ssdLogs: [
        { productName: 'Samsung 980 Pro 1TB', serialNumber: 'SAMS-980P-001', pcName: 'IT-PC-001', pcUsername: 'John Doe', department: 'IT', date: '2024-10-15', time: '10:00', servicedBy: 'Tech Support', comment: 'Storage upgrade' },
        { productName: 'WD Blue SN570 500GB', serialNumber: 'WD-SN570-002', pcName: 'HR-PC-001', pcUsername: 'Sarah Wilson', department: 'HR', date: '2024-10-16', time: '11:00', servicedBy: 'Tech Support', comment: 'SSD replacement' },
        { productName: 'Crucial MX500 1TB', serialNumber: 'CRU-MX500-003', pcName: 'FIN-PC-001', pcUsername: 'Michael Chen', department: 'Finance', date: '2024-10-17', time: '09:30', servicedBy: 'Tech Support', comment: 'Upgrade to SSD' },
        { productName: 'Samsung 870 EVO 500GB', serialNumber: 'SAMS-870E-004', pcName: 'SALES-PC-001', pcUsername: 'David Miller', department: 'Sales', date: '2024-10-18', time: '14:00', servicedBy: 'Tech Support', comment: 'HDD to SSD migration' },
        { productName: 'Kingston A2000 1TB', serialNumber: 'KING-A2K-005', pcName: '', pcUsername: '', department: '', date: '2024-10-20', time: '09:00', servicedBy: 'Admin', comment: 'New stock' },
        { productName: 'Kingston A2000 1TB', serialNumber: 'KING-A2K-006', pcName: '', pcUsername: '', department: '', date: '2024-10-20', time: '09:00', servicedBy: 'Admin', comment: 'New stock' },
        { productName: 'Samsung 980 500GB', serialNumber: 'SAMS-980-007', pcName: 'IT-PC-002', pcUsername: 'Emily Brown', department: 'IT', date: '2024-10-22', time: '10:30', servicedBy: 'Tech Support', comment: 'Performance upgrade' },
        { productName: 'WD Black SN850 1TB', serialNumber: 'WD-SN850-008', pcName: 'IT-PC-003', pcUsername: 'Robert Anderson', department: 'IT', date: '2024-10-23', time: '15:00', servicedBy: 'Tech Support', comment: 'High-performance SSD' },
        { productName: 'Crucial P5 Plus 2TB', serialNumber: 'CRU-P5P-009', pcName: 'IT-PC-004', pcUsername: 'William Lee', department: 'IT', date: '2024-10-24', time: '11:00', servicedBy: 'Tech Support', comment: 'Storage expansion' },
        { productName: 'Samsung 870 QVO 2TB', serialNumber: 'SAMS-870Q-010', pcName: 'FIN-PC-002', pcUsername: 'James Thompson', department: 'Finance', date: '2024-10-25', time: '13:30', servicedBy: 'Tech Support', comment: 'Large capacity upgrade' },
        { productName: 'Kingston NV2 500GB', serialNumber: 'KING-NV2-011', pcName: '', pcUsername: '', department: '', date: '2024-10-26', time: '09:00', servicedBy: 'Admin', comment: 'Stock replenishment' },
        { productName: 'Kingston NV2 500GB', serialNumber: 'KING-NV2-012', pcName: '', pcUsername: '', department: '', date: '2024-10-26', time: '09:00', servicedBy: 'Admin', comment: 'Stock replenishment' }
    ],

    // Headphone Logs - 10 entries
    headphoneLogs: [
        { productName: 'Sony WH-1000XM5', serialNumber: 'SONY-XM5-001', pcName: 'IT-PC-001', pcUsername: 'John Doe', department: 'IT', date: '2024-10-18', time: '10:00', servicedBy: 'Tech Support', comment: 'Premium headphones for video calls' },
        { productName: 'Logitech H390', serialNumber: 'LG-H390-002', pcName: 'HR-PC-001', pcUsername: 'Sarah Wilson', department: 'HR', date: '2024-10-19', time: '11:00', servicedBy: 'Tech Support', comment: 'USB headset for HR interviews' },
        { productName: 'Jabra Evolve 40', serialNumber: 'JABR-EV40-003', pcName: 'SALES-PC-001', pcUsername: 'David Miller', department: 'Sales', date: '2024-10-20', time: '14:30', servicedBy: 'Tech Support', comment: 'Professional headset' },
        { productName: 'Microsoft LifeChat LX-3000', serialNumber: 'MS-LX3K-004', pcName: '', pcUsername: '', department: '', date: '2024-10-22', time: '09:00', servicedBy: 'Admin', comment: 'New stock' },
        { productName: 'Microsoft LifeChat LX-3000', serialNumber: 'MS-LX3K-005', pcName: '', pcUsername: '', department: '', date: '2024-10-22', time: '09:00', servicedBy: 'Admin', comment: 'New stock' },
        { productName: 'Logitech H540', serialNumber: 'LG-H540-006', pcName: 'MKT-PC-001', pcUsername: 'Jessica Taylor', department: 'Marketing', date: '2024-10-23', time: '10:30', servicedBy: 'Tech Support', comment: 'Wireless headset' },
        { productName: 'Sony WH-CH520', serialNumber: 'SONY-CH520-007', pcName: 'FIN-PC-001', pcUsername: 'Michael Chen', department: 'Finance', date: '2024-10-24', time: '15:00', servicedBy: 'Tech Support', comment: 'Wireless headphones' },
        { productName: 'HyperX Cloud Stinger', serialNumber: 'HPRX-CS-008', pcName: 'IT-PC-002', pcUsername: 'Emily Brown', department: 'IT', date: '2024-10-25', time: '11:30', servicedBy: 'Tech Support', comment: 'Gaming headset for testing' },
        { productName: 'Jabra Evolve 20', serialNumber: 'JABR-EV20-009', pcName: 'HR-PC-002', pcUsername: 'Lisa Martinez', department: 'HR', date: '2024-10-26', time: '13:00', servicedBy: 'Tech Support', comment: 'Standard headset' },
        { productName: 'Logitech H111', serialNumber: 'LG-H111-010', pcName: '', pcUsername: '', department: '', date: '2024-10-27', time: '09:00', servicedBy: 'Admin', comment: 'Budget stock' }
    ],

    // Portable HDD Logs - 10 entries
    portableHDDLogs: [
        { productName: 'Seagate Backup Plus 2TB', serialNumber: 'SEGT-BP2T-001', pcName: 'IT-PC-001', pcUsername: 'John Doe', department: 'IT', date: '2024-10-15', time: '09:00', servicedBy: 'Tech Support', comment: 'Backup drive for IT' },
        { productName: 'WD My Passport 4TB', serialNumber: 'WD-MP4T-002', pcName: 'FIN-PC-001', pcUsername: 'Michael Chen', department: 'Finance', date: '2024-10-16', time: '10:30', servicedBy: 'Tech Support', comment: 'Financial data backup' },
        { productName: 'Toshiba Canvio 1TB', serialNumber: 'TOSH-CV1T-003', pcName: 'HR-PC-001', pcUsername: 'Sarah Wilson', department: 'HR', date: '2024-10-17', time: '14:00', servicedBy: 'Tech Support', comment: 'HR records backup' },
        { productName: 'Seagate Portable 5TB', serialNumber: 'SEGT-P5T-004', pcName: '', pcUsername: '', department: '', date: '2024-10-20', time: '09:00', servicedBy: 'Admin', comment: 'New stock' },
        { productName: 'Seagate Portable 5TB', serialNumber: 'SEGT-P5T-005', pcName: '', pcUsername: '', department: '', date: '2024-10-20', time: '09:00', servicedBy: 'Admin', comment: 'New stock' },
        { productName: 'WD Elements 2TB', serialNumber: 'WD-ELEM2T-006', pcName: 'MKT-PC-001', pcUsername: 'Jessica Taylor', department: 'Marketing', date: '2024-10-22', time: '11:00', servicedBy: 'Tech Support', comment: 'Marketing assets backup' },
        { productName: 'Samsung T7 Portable SSD 1TB', serialNumber: 'SAMS-T7-007', pcName: 'IT-PC-003', pcUsername: 'Robert Anderson', department: 'IT', date: '2024-10-23', time: '15:30', servicedBy: 'Tech Support', comment: 'Fast portable storage' },
        { productName: 'Seagate Backup Plus 4TB', serialNumber: 'SEGT-BP4T-008', pcName: 'FIN-PC-002', pcUsername: 'James Thompson', department: 'Finance', date: '2024-10-24', time: '13:00', servicedBy: 'Tech Support', comment: 'Large capacity backup' },
        { productName: 'WD My Passport 1TB', serialNumber: 'WD-MP1T-009', pcName: 'SALES-PC-001', pcUsername: 'David Miller', department: 'Sales', date: '2024-10-25', time: '10:00', servicedBy: 'Tech Support', comment: 'Sales data backup' },
        { productName: 'Toshiba Canvio Basics 2TB', serialNumber: 'TOSH-CB2T-010', pcName: '', pcUsername: '', department: '', date: '2024-10-26', time: '09:00', servicedBy: 'Admin', comment: 'Budget backup drives' }
    ]
};

async function seedDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('🌱 Starting database seeding...\n');

        // Seed PCs
        console.log('📦 Seeding PC Information...');
        for (const pc of seedData.pcs) {
            await client.query(`
                INSERT INTO pcs (id, ip, "pcName", username, department, motherboard, cpu, ram, storage, monitor, os, status, floor)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (id) DO NOTHING
            `, [
                generateId(), pc.ip, pc.pcName, pc.username, pc.department, pc.motherboard, 
                pc.cpu, pc.ram, pc.storage, pc.monitor, pc.os, pc.status, pc.floor
            ]);
        }
        console.log(`✅ Added ${seedData.pcs.length} PCs\n`);

        // Seed Laptops
        console.log('💻 Seeding Laptop Information...');
        for (const laptop of seedData.laptops) {
            await client.query(`
                INSERT INTO laptops (id, "pcName", username, brand, model, cpu, "serialNumber", ram, storage, "userStatus", department, date, "hardwareStatus")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (id) DO NOTHING
            `, [
                generateId(), laptop.pcName, laptop.username, laptop.brand, laptop.model, laptop.cpu,
                laptop.serialNumber, laptop.ram, laptop.storage, laptop.userStatus, laptop.department,
                laptop.date, laptop.hardwareStatus
            ]);
        }
        console.log(`✅ Added ${seedData.laptops.length} Laptops\n`);

        // Seed Servers
        console.log('🖥️ Seeding Server Information...');
        for (const server of seedData.servers) {
            await client.query(`
                INSERT INTO servers (id, "serverID", brand, model, cpu, "totalCores", ram, storage, raid, status, department)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (id) DO NOTHING
            `, [
                generateId(), server.serverID, server.brand, server.model, server.cpu, server.totalCores,
                server.ram, server.storage, server.raid, server.status, server.department
            ]);
        }
        console.log(`✅ Added ${seedData.servers.length} Servers\n`);

        // Seed Mouse Logs
        console.log('🖱️ Seeding Mouse Logs...');
        for (const log of seedData.mouseLogs) {
            await client.query(`
                INSERT INTO "mouseLogs" (id, "productName", "serialNumber", "pcName", "pcUsername", department, date, time, "servicedBy", comment)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO NOTHING
            `, [
                generateId(), log.productName, log.serialNumber, log.pcName, log.pcUsername,
                log.department, log.date, log.time, log.servicedBy, log.comment
            ]);
        }
        console.log(`✅ Added ${seedData.mouseLogs.length} Mouse Logs\n`);

        // Seed Keyboard Logs
        console.log('⌨️ Seeding Keyboard Logs...');
        for (const log of seedData.keyboardLogs) {
            await client.query(`
                INSERT INTO "keyboardLogs" (id, "productName", "serialNumber", "pcName", "pcUsername", department, date, time, "servicedBy", comment)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO NOTHING
            `, [
                generateId(), log.productName, log.serialNumber, log.pcName, log.pcUsername,
                log.department, log.date, log.time, log.servicedBy, log.comment
            ]);
        }
        console.log(`✅ Added ${seedData.keyboardLogs.length} Keyboard Logs\n`);

        // Seed SSD Logs
        console.log('💾 Seeding SSD Logs...');
        for (const log of seedData.ssdLogs) {
            await client.query(`
                INSERT INTO "ssdLogs" (id, "productName", "serialNumber", "pcName", "pcUsername", department, date, time, "servicedBy", comment)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO NOTHING
            `, [
                generateId(), log.productName, log.serialNumber, log.pcName, log.pcUsername,
                log.department, log.date, log.time, log.servicedBy, log.comment
            ]);
        }
        console.log(`✅ Added ${seedData.ssdLogs.length} SSD Logs\n`);

        // Seed Headphone Logs
        console.log('🎧 Seeding Headphone Logs...');
        for (const log of seedData.headphoneLogs) {
            await client.query(`
                INSERT INTO "headphoneLogs" (id, "productName", "serialNumber", "pcName", "pcUsername", department, date, time, "servicedBy", comment)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO NOTHING
            `, [
                generateId(), log.productName, log.serialNumber, log.pcName, log.pcUsername,
                log.department, log.date, log.time, log.servicedBy, log.comment
            ]);
        }
        console.log(`✅ Added ${seedData.headphoneLogs.length} Headphone Logs\n`);

        // Seed Portable HDD Logs
        console.log('💿 Seeding Portable HDD Logs...');
        for (const log of seedData.portableHDDLogs) {
            await client.query(`
                INSERT INTO "portableHDDLogs" (id, "productName", "serialNumber", "pcName", "pcUsername", department, date, time, "servicedBy", comment)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO NOTHING
            `, [
                generateId(), log.productName, log.serialNumber, log.pcName, log.pcUsername,
                log.department, log.date, log.time, log.servicedBy, log.comment
            ]);
        }
        console.log(`✅ Added ${seedData.portableHDDLogs.length} Portable HDD Logs\n`);

        console.log('🎉 Database seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - PCs: ${seedData.pcs.length}`);
        console.log(`   - Laptops: ${seedData.laptops.length}`);
        console.log(`   - Servers: ${seedData.servers.length}`);
        console.log(`   - Mouse Logs: ${seedData.mouseLogs.length}`);
        console.log(`   - Keyboard Logs: ${seedData.keyboardLogs.length}`);
        console.log(`   - SSD Logs: ${seedData.ssdLogs.length}`);
        console.log(`   - Headphone Logs: ${seedData.headphoneLogs.length}`);
        console.log(`   - Portable HDD Logs: ${seedData.portableHDDLogs.length}`);
        console.log(`\n   Total: ${seedData.pcs.length + seedData.laptops.length + seedData.servers.length + seedData.mouseLogs.length + seedData.keyboardLogs.length + seedData.ssdLogs.length + seedData.headphoneLogs.length + seedData.portableHDDLogs.length} entries`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the seed function
seedDatabase()
    .then(() => {
        console.log('\n✅ Seeding process completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seeding process failed:', error);
        process.exit(1);
    });

