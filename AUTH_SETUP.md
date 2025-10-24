# 🔐 Authentication System Setup Guide

## Overview

A professional multi-user authentication system has been added to the TDS IT Inventory application with:
- ✅ Secure login with JWT tokens
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (Admin & User)
- ✅ User management (admin only)
- ✅ Protected routes
- ✅ Session persistence

---

## Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the default admin password immediately after first login!

---

## Features

### 1. **Login System**
- Beautiful modern login page
- Secure JWT authentication
- 24-hour session validity
- Remember me functionality

### 2. **User Roles**
- **Admin**: Full access + user management
- **User**: Standard inventory access

### 3. **User Management (Admin Only)**
- Create new users
- Edit user details
- Delete users
- View user activity (last login)
- Assign roles and departments

### 4. **Security Features**
- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens with expiration
- HTTP-only cookies
- CORS protection
- Protected API endpoints

---

## Environment Variables

### Required for Vercel Deployment:

1. **`JWT_SECRET`** (CRITICAL!)
   - Description: Secret key for JWT token signing
   - Example: `your-super-secret-jwt-key-change-this-in-production`
   - How to generate: `openssl rand -base64 32`

2. **`DATABASE_URL`** (Already configured)
   - Your PostgreSQL connection string

3. **`POSTGRES_URL`** (Already configured)
   - Your PostgreSQL connection string (backup)

4. **`NODE_ENV`**
   - Set to: `production`

---

## Setup Instructions

### Local Development:

1. **Install Dependencies:**
```bash
npm install
```

2. **Create `.env` file:**
```env
DATABASE_URL=your_postgresql_connection_string
POSTGRES_URL=your_postgresql_connection_string
NODE_ENV=development
JWT_SECRET=your-local-jwt-secret
```

3. **Run the application:**
```bash
npm run dev
```

4. **Login:**
   - Navigate to: `http://localhost:5173/login`
   - Use admin credentials above

---

### Vercel Deployment:

#### Step 1: Add Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project: `tds-inventory-sqlite-update`
3. Click: **Settings** → **Environment Variables**

#### Step 2: Add These Variables:

**Required:**
```
JWT_SECRET=your-production-jwt-secret-key
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_VWYJCfilwL47@ep-lively-cloud-a1lfo3j0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
POSTGRES_URL=postgresql://neondb_owner:npg_VWYJCfilwL47@ep-lively-cloud-a1lfo3j0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### Step 3: Generate a Secure JWT_SECRET

**Option A - Using OpenSSL (Recommended):**
```bash
openssl rand -base64 32
```

**Option B - Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C - Using Online Generator:**
Visit: https://www.grc.com/passwords.htm

#### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

---

## Usage Guide

### For Admins:

1. **Login** with admin credentials
2. **Navigate to "User Management"** in the sidebar
3. **Create new users:**
   - Click "Add New User"
   - Fill in details
   - Assign role (User or Admin)
   - Set department
4. **Manage existing users:**
   - Edit user details
   - Change roles
   - Delete users (cannot delete yourself or last admin)

### For Users:

1. **Login** with your credentials
2. **Access all inventory modules**
3. **Perform CRUD operations**
4. **View reports and summaries**

---

## Security Best Practices

### 1. Change Default Password

**Immediately after first login:**
- (Will be added in Settings page)
- Currently, admins can create a new admin user and delete the default one

### 2. JWT Secret

- **Never commit JWT_SECRET to Git**
- Use a strong, random 32+ character secret
- Different secrets for dev and production
- Rotate periodically (every 90 days)

### 3. User Management

- Only grant admin access to trusted personnel
- Review user accounts regularly
- Delete inactive users
- Use strong passwords (8+ chars, mixed case, numbers, symbols)

### 4. Database Security

- Already using SSL for PostgreSQL
- Connection string includes `sslmode=require`
- Passwords are hashed, never stored in plain text

---

## API Endpoints

### Authentication:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | No | User login |
| `/api/auth/logout` | POST | Yes | User logout |
| `/api/auth/verify` | GET | Yes | Verify token |
| `/api/auth/register` | POST | Admin | Create user |
| `/api/auth/change-password` | POST | Yes | Change password |

### User Management:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/users` | GET | Admin | List all users |
| `/api/users/:id` | PUT | Admin | Update user |
| `/api/users/:id` | DELETE | Admin | Delete user |

---

## Database Schema

### Users Table:

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    department TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

---

## Troubleshooting

### Issue: "Authentication required" error

**Solution:**
- Clear cookies and localStorage
- Login again
- Check if JWT_SECRET is set in Vercel

### Issue: Cannot login with admin credentials

**Solution:**
- Verify database connection
- Check if users table exists
- Ensure default admin was created (check server logs)

### Issue: "Invalid token" after deployment

**Solution:**
- Ensure JWT_SECRET is set in Vercel environment variables
- Clear browser cookies
- Login again

### Issue: User Management page shows "Access Denied"

**Solution:**
- Ensure logged-in user has 'admin' role
- Check database: `SELECT role FROM users WHERE username = 'your_username'`

---

## Future Enhancements

Planned features:
- ✅ Password change functionality (API ready, UI pending)
- 📧 Email notifications
- 🔑 Password reset via email
- 📊 User activity logs
- 🔒 2FA (Two-Factor Authentication)
- 👥 Team/group management
- 📱 Mobile app support

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs in Vercel
3. Contact: Imam Chowdhury

---

**Last Updated**: October 24, 2025  
**Version**: 1.0.0

