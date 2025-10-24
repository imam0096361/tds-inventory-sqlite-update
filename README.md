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
- **SQLite3** - Database
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tds-it-inventory.git
   cd tds-it-inventory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm run dev
   ```

   This command will start both:
   - Frontend (Vite dev server) on `http://localhost:3000`
   - Backend (Express API server) on `http://localhost:3001`

4. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`

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

## 📝 Scripts

```bash
# Run development servers (frontend + backend)
npm run dev

# Run only frontend (Vite)
npm run dev:client

# Run only backend (Express)
npm run dev:server

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🗄️ Database

The application uses SQLite for data storage. The database file (`database.db`) is created automatically on first run with the following tables:

- `pcs` - Desktop computer information
- `laptops` - Laptop information
- `servers` - Server information
- `mouseLogs` - Mouse distribution logs
- `keyboardLogs` - Keyboard distribution logs
- `ssdLogs` - SSD distribution logs

**Note**: The database file is excluded from Git (via `.gitignore`) to prevent committing sensitive data.

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

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

---

**Note**: This is a demo application. For production use, implement proper authentication, authorization, and security measures.
