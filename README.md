# TDS IT Inventory Management System

A comprehensive IT Inventory Management System built with React, Express.js, and SQLite. This application helps organizations track and manage their IT assets including PCs, laptops, servers, and peripheral devices.

## 🚀 Features

### Asset Management
- **PC Information**: Track desktop computers with details like IP, motherboard, CPU, RAM, storage, and status
- **Laptop Information**: Manage laptop inventory with brand, model, serial numbers, and hardware status
- **Server Information**: Monitor server infrastructure with CPU cores, RAID configuration, and operational status
- **Peripheral Logs**: Track mouse, keyboard, and SSD distribution and deployment

### Analytics & Reporting
- **Dashboard**: Overview of all IT assets with visual charts and statistics
- **Department Summary**: Asset distribution across departments with detailed breakdowns
- **Product Inventory**: Stock management for peripherals with availability tracking
- **Export Functionality**: Export data to CSV for reporting

### Data Management
- **Import/Export**: Bulk import via CSV files
- **Custom Fields**: Add custom metadata to assets
- **Search & Filter**: Advanced filtering and sorting capabilities
- **Real-time Updates**: Live data synchronization

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling (via CDN)
- **Vite** - Build tool and dev server

### Backend
- **Express.js** - REST API server
- **PostgreSQL** - Primary database (production)
- **SQLite3** - Alternative database (local development)
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

## 🚀 Installation & Setup

### Local Development (PostgreSQL)

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tds-it-inventory.git
   cd tds-it-inventory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   - Install PostgreSQL on your machine (https://www.postgresql.org/download/)
   - Create a database:
     ```sql
     CREATE DATABASE inventory_db;
     ```
   - Copy `env.template` to `.env` and update the `DATABASE_URL`:
     ```
     DATABASE_URL=postgresql://your_username:your_password@localhost:5432/inventory_db
     ```

4. **Run the application**
   ```bash
   npm run dev
   ```

   This command will start both:
   - Frontend (Vite dev server) on `http://localhost:3000`
   - Backend (Express API server) on `http://localhost:3001`

5. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`

### Alternative: Local Development with SQLite

If you prefer to use SQLite for local development:

```bash
# Use the SQLite server
npm run dev:server:sqlite

# In another terminal
npm run dev:client
```

## 📁 Project Structure

```
tds-it-inventory/
├── components/          # React components
│   ├── BarChartCard.tsx
│   ├── Modal.tsx
│   ├── Sidebar.tsx
│   └── ...
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── PCInfo.tsx
│   ├── LaptopInfo.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useLocalStorage.ts
│   ├── useSort.ts
│   └── ...
├── utils/              # Utility functions
│   ├── export.ts
│   └── firebase.ts
├── data/               # Data files
│   └── dummyData.ts
├── server.cjs          # Express server
├── database.db         # SQLite database (created automatically)
├── App.tsx             # Main App component
├── index.tsx           # Entry point
└── package.json        # Dependencies
```

## 🔌 API Endpoints

### PCs
- `GET /api/pcs` - Get all PCs
- `POST /api/pcs` - Create new PC
- `PUT /api/pcs/:id` - Update PC
- `DELETE /api/pcs/:id` - Delete PC

### Laptops
- `GET /api/laptops` - Get all laptops
- `POST /api/laptops` - Create new laptop
- `PUT /api/laptops/:id` - Update laptop
- `DELETE /api/laptops/:id` - Delete laptop

### Servers
- `GET /api/servers` - Get all servers
- `POST /api/servers` - Create new server
- `PUT /api/servers/:id` - Update server
- `DELETE /api/servers/:id` - Delete server

### Peripheral Logs
- `GET /api/mouselogs` - Get mouse distribution logs
- `POST /api/mouselogs` - Create mouse log
- `PUT /api/mouselogs/:id` - Update mouse log
- `DELETE /api/mouselogs/:id` - Delete mouse log

Similar endpoints exist for `/api/keyboardlogs` and `/api/ssdlogs`

## ☁️ Deployment to Vercel

### Step 1: Create a Vercel Account
1. Go to [vercel.com](https://vercel.com) and sign up/login with GitHub

### Step 2: Set Up PostgreSQL Database
1. In your Vercel dashboard, go to **Storage** tab
2. Click **Create Database** and select **Postgres**
3. Follow the setup wizard and note your database credentials
4. Alternatively, use any PostgreSQL provider (Supabase, Railway, Neon, etc.)

### Step 3: Deploy to Vercel
1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import Project to Vercel**:
   - Go to your Vercel dashboard
   - Click **Add New** → **Project**
   - Import your GitHub repository
   - Configure the project:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run vercel-build`
     - **Output Directory**: `dist`

3. **Add Environment Variables**:
   In Vercel project settings → Environment Variables, add:
   ```
   DATABASE_URL=your_postgresql_connection_string
   POSTGRES_URL=your_postgresql_connection_string
   NODE_ENV=production
   ```

4. **Deploy**:
   - Click **Deploy**
   - Vercel will build and deploy your app
   - You'll get a URL like `https://your-project.vercel.app`

### Step 4: Verify Deployment
- Visit your deployed URL
- Check that all pages load correctly
- Test database operations (add/edit/delete entries)

### Updating Your Deployment
```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push origin main

# Vercel will automatically redeploy!
```

## 📝 Scripts

```bash
# Run development servers (frontend + backend with PostgreSQL)
npm run dev

# Run development with SQLite
npm run dev:server:sqlite & npm run dev:client

# Run only frontend (Vite)
npm run dev:client

# Run only backend (Express with PostgreSQL)
npm run dev:server

# Start production server
npm start

# Build for production
npm run build

# Vercel build
npm run vercel-build

# Preview production build
npm run preview
```

## 🗄️ Database

The application supports two database options:

### PostgreSQL (Production - Recommended)
- Used in production and Vercel deployments
- Better scalability and concurrent access
- Automatic table creation on first connection
- Configure via `DATABASE_URL` or `POSTGRES_URL` environment variable

### SQLite (Local Development)
- Lightweight option for local development
- Database file (`database.db`) created automatically
- No setup required

### Database Tables
- `pcs` - Desktop computer information
- `laptops` - Laptop information (includes username field)
- `servers` - Server information
- `mouseLogs` - Mouse distribution logs
- `keyboardLogs` - Keyboard distribution logs
- `ssdLogs` - SSD distribution logs

**Note**: Database files are excluded from Git (via `.gitignore`) to prevent committing sensitive data.

## 🔒 Security Notes

- Never commit `.env` files or database files to version control
- Change default credentials before deployment
- Use environment variables for sensitive configuration
- Consider implementing authentication for production use

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Built with React and Express.js
- Charts powered by Recharts
- Database management with SQLite3

## 📖 Documentation

### 📚 Complete Documentation Suite

**For comprehensive information, we have three main documentation files:**

#### 1. [⚡ QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Start Here!
Quick lookup guide for developers, IDEs, and LLMs:
- File structure overview
- All features at a glance
- API endpoints quick reference
- Common tasks and troubleshooting
- Quick start commands

#### 2. [📚 FULL_APPLICATION_DOCUMENTATION.md](./FULL_APPLICATION_DOCUMENTATION.md) - Complete Guide
Comprehensive documentation (27,000+ lines):
- Complete feature catalog
- Technical architecture details
- Database schema and API endpoints
- Development and deployment guides
- Feature management instructions (how to add/remove features)
- Best practices and conventions
- Security implementation
- Performance optimization

#### 3. [📝 FEATURES_CHANGELOG.md](./FEATURES_CHANGELOG.md) - Change Tracking
Track all features added and removed:
- Current features list (32+)
- Feature history by version
- Planned features roadmap
- Feature request template
- Maintenance checklist

**For quick lookups:** Use QUICK_REFERENCE.md  
**For comprehensive details:** Use FULL_APPLICATION_DOCUMENTATION.md  
**For feature tracking:** Use FEATURES_CHANGELOG.md

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

---

**Note**: This is a demo application. For production use, implement proper authentication, authorization, and security measures.
