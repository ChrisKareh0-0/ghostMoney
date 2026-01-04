# GhostMoney 👻💰

A comprehensive desktop and web application for managing gaming lounge operations, including client management, product sales, PC reservations, and payment tracking. Built with a modern tech stack featuring React, Express, and dual deployment modes (Electron desktop app or standalone web server).

## 🌟 Features

### Core Functionality
- **Client Management**: Track gaming lounge clients with contact information, balance tracking, and transaction history
- **Product Management**: Manage bundles, snacks, drinks, and other products with customizable categories
- **Point of Sale (POS)**: Quick checkout interface for processing sales and charges
- **Transaction Tracking**: Complete audit trail of all charges added to client accounts
- **Payment Recording**: Record payments with multiple payment methods (Cash, Card, Transfer, etc.)
- **PC/Station Management**: Track gaming PCs and consoles with availability status
- **Reservation System**: Calendar-based booking system for gaming stations
- **User Management**: Role-based access control with admin and worker roles
- **Dashboard**: Real-time overview with key metrics, revenue tracking, and alerts
- **Reports & Export**: Export data to Excel and PDF formats
- **Alert System**: Automated notifications for overdue payments and system events

### Technical Features
- **Dual Deployment Modes**: Run as Electron desktop app OR standalone web application
- **Offline Support**: Fully functional without internet using local SQLite database
- **Real-time Updates**: Live data synchronization across all views
- **Responsive Design**: Modern, dark-themed UI with green terminal aesthetics
- **Cross-platform**: Works on Windows, macOS, and Linux

## 🏗️ Architecture

GhostMoney uses a **dual-mode architecture** that allows it to run either as a desktop application or as a web application:

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     GhostMoney Application                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │  Electron Mode  │              │   Web Mode      │       │
│  │  (Desktop App)  │              │  (Browser)      │       │
│  └────────┬────────┘              └────────┬────────┘       │
│           │                                 │                │
│           ▼                                 ▼                │
│  ┌──────────────────────────────────────────────────┐       │
│  │         React Frontend (Vite)                    │       │
│  │  ┌────────────────────────────────────────────┐  │       │
│  │  │  Pages: Dashboard, Clients, POS, Products │  │       │
│  │  │  Calendar, Users, Reports, Login          │  │       │
│  │  └────────────────────────────────────────────┘  │       │
│  │  ┌────────────────────────────────────────────┐  │       │
│  │  │  Components: Navbar, Modals, Forms        │  │       │
│  │  └────────────────────────────────────────────┘  │       │
│  │  ┌────────────────────────────────────────────┐  │       │
│  │  │  Context: DataProvider (State Management) │  │       │
│  │  └────────────────────────────────────────────┘  │       │
│  └──────────────────────────────────────────────────┘       │
│           │                                 │                │
│           ▼                                 ▼                │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │  Electron IPC   │              │  Express REST   │       │
│  │   (preload.js)  │              │      API        │       │
│  └────────┬────────┘              └────────┬────────┘       │
│           │                                 │                │
│           ▼                                 ▼                │
│  ┌──────────────────────────────────────────────────┐       │
│  │           SQLite Database Layer                  │       │
│  │  ┌────────────────────────────────────────────┐  │       │
│  │  │  better-sqlite3  │  sql.js (in-memory)    │  │       │
│  │  │  (Electron)      │  (Web Server)          │  │       │
│  │  └────────────────────────────────────────────┘  │       │
│  └──────────────────────────────────────────────────┘       │
│                          │                                   │
│                          ▼                                   │
│              ┌─────────────────────┐                         │
│              │  ghostmoney.db      │                         │
│              │  (SQLite Database)  │                         │
│              └─────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Mode 1: Electron Desktop Application

**How it works:**
1. Electron main process (`electron/main.js`) creates a native window
2. Loads React app from Vite dev server (development) or built files (production)
3. Uses IPC (Inter-Process Communication) for secure frontend-backend communication
4. Database operations handled via `better-sqlite3` (native SQLite binding)
5. Data stored in OS-specific user data directory

**Communication Flow:**
```
React Component → window.electronAPI → IPC → Electron Main → Database Service → SQLite
```

**Key Files:**
- `electron/main.js` - Electron main process, window management
- `electron/preload.js` - Secure IPC bridge between renderer and main process
- `electron/database/db.js` - Database service layer using better-sqlite3
- `electron/ipc/handlers.js` - IPC request handlers
- `electron/services/` - Export and notification services

### Mode 2: Standalone Web Server

**How it works:**
1. Express server (`server/index.js`) serves the React app and provides REST API
2. Uses `sql.js` (SQLite compiled to WebAssembly) for database operations
3. Database file stored in project root as `ghostmoney.db`
4. Frontend communicates via standard HTTP/REST API calls
5. Mock Electron API (`src/mockElectronAPI.js`) provides browser compatibility

**Communication Flow:**
```
React Component → fetch/axios → Express REST API → DBWrapper → sql.js → SQLite
```

**Key Files:**
- `server/index.js` - Express server with REST API and database wrapper
- `src/mockElectronAPI.js` - Browser-compatible mock of Electron API
- `start-browser.ps1` - PowerShell script to launch web server

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library with hooks and functional components
- **React Router 6** - Client-side routing and navigation
- **Vite 5** - Fast build tool and development server with HMR
- **React Big Calendar** - Calendar component for reservations
- **date-fns / moment** - Date manipulation and formatting

### Backend (Electron Mode)
- **Electron 28** - Cross-platform desktop application framework
- **better-sqlite3** - Fast, synchronous SQLite3 bindings for Node.js
- **ExcelJS** - Excel file generation for reports
- **PDFKit** - PDF document generation

### Backend (Web Mode)
- **Express 5** - Web server and REST API framework
- **sql.js** - SQLite compiled to JavaScript/WebAssembly
- **CORS** - Cross-origin resource sharing middleware

### Database
- **SQLite 3** - Embedded relational database
- **Schema**: 9 tables (users, clients, products, categories, transactions, payments, pcs, reservations, alerts)

### Build Tools
- **Vite** - Frontend bundler and dev server
- **Electron Builder** - Package and build Electron apps
- **Concurrently** - Run multiple npm scripts simultaneously

## 📦 Installation

### Prerequisites

- **Node.js** v16 or higher
- **npm** or **yarn** package manager
- **Windows/macOS/Linux** operating system

### Setup Steps

1. **Clone or download the repository:**
   ```bash
   cd ghostMoney-master
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Choose your deployment mode:**

   **Option A: Electron Desktop App (Recommended)**
   ```bash
   npm run dev
   ```
   This starts both Vite dev server and Electron app with hot reload.

   **Option B: Web Server Mode**
   ```bash
   # Build the React app first
   npm run build
   
   # Start the Express server
   node server/index.js
   
   # Or use the PowerShell launcher (Windows)
   .\start-browser.ps1
   ```
   Server runs on `http://localhost:3001`

## 🚀 Running the Application

### Development Mode (Electron)

```bash
npm run dev
```

This command:
- Starts Vite dev server on `http://localhost:5173`
- Launches Electron app pointing to dev server
- Enables hot module replacement (HMR)
- Opens DevTools automatically

### Production Build (Electron)

```bash
# Build React frontend
npm run build

# Build Windows executable
npm run build:electron

# Or build for specific platform
npm run build:win
```

Built application will be in `dist-electron/` directory.

### Web Server Mode

```bash
# Build frontend
npm run build

# Start Express server
node server/index.js
```

Or use the PowerShell script (Windows):
```powershell
.\start-browser.ps1
```

The server will:
- Start on port 3001
- Serve static files from `dist/`
- Provide REST API endpoints
- Auto-open browser to `http://localhost:3001`

## 🗄️ Database Schema

The application uses SQLite with the following tables:

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,           -- 'admin' or 'worker'
    name TEXT
);
```

### Clients Table
```sql
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    balance REAL DEFAULT 0,  -- Negative = owes money
    created_at TEXT
);
```

### Categories Table
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    color TEXT              -- Hex color code
);
```

### Products Table
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category_id INTEGER,
    price REAL,
    stock INTEGER
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    total_amount REAL,
    items TEXT,             -- JSON array of items
    date TEXT
);
```

### Payments Table
```sql
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    amount REAL,
    payment_method TEXT,    -- 'Cash', 'Card', 'Transfer', etc.
    date TEXT
);
```

### PCs Table
```sql
CREATE TABLE pcs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    status TEXT,            -- 'available', 'occupied', 'maintenance'
    type TEXT               -- 'PC', 'PS5', 'Xbox', etc.
);
```

### Reservations Table
```sql
CREATE TABLE reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    pc_id INTEGER,
    start_time TEXT,
    end_time TEXT,
    status TEXT             -- 'pending', 'active', 'completed', 'cancelled'
);
```

### Alerts Table
```sql
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    type TEXT,              -- 'overdue', 'system', 'warning'
    resolved INTEGER DEFAULT 0,
    created_at TEXT
);
```

## 📁 Project Structure

```
ghostMoney-master/
├── electron/                    # Electron desktop app files
│   ├── main.js                  # Main process entry point
│   ├── preload.js               # IPC bridge (secure context)
│   ├── database/
│   │   ├── db.js                # Database service (better-sqlite3)
│   │   └── schema.sql           # Database schema definitions
│   ├── ipc/
│   │   └── handlers.js          # IPC request handlers
│   └── services/
│       ├── exportService.js     # Excel/PDF export functionality
│       └── notificationService.js # Payment alert notifications
│
├── server/                      # Web server mode files
│   └── index.js                 # Express server + REST API + sql.js wrapper
│
├── src/                         # React frontend source
│   ├── App.jsx                  # Main app component with routing
│   ├── main.jsx                 # React entry point
│   ├── index.css                # Global styles (dark theme)
│   ├── mockElectronAPI.js       # Browser-compatible Electron API mock
│   │
│   ├── context/
│   │   └── DataContext.jsx      # Global state management
│   │
│   ├── pages/                   # Main application pages
│   │   ├── Login.jsx            # Authentication page
│   │   ├── Dashboard.jsx        # Overview with stats and metrics
│   │   ├── Clients.jsx          # Client management
│   │   ├── POS.jsx              # Point of sale interface
│   │   ├── Products.jsx         # Product and category management
│   │   ├── Calendar.jsx         # PC reservation calendar
│   │   ├── Users.jsx            # User management (admin only)
│   │   └── Reports.jsx          # Export and reporting
│   │
│   └── components/              # Reusable UI components
│       ├── Navbar.jsx           # Navigation bar
│       ├── Modal.jsx            # Generic modal wrapper
│       ├── SearchBar.jsx        # Search input component
│       ├── ClientForm.jsx       # Add/edit client form
│       ├── AddChargeModal.jsx   # Add transaction modal
│       ├── RecordPaymentModal.jsx # Record payment modal
│       ├── ProductForm.jsx      # Add/edit product form
│       ├── CategoryManager.jsx  # Category CRUD interface
│       └── UserForm.jsx         # Add/edit user form
│
├── dist/                        # Built React app (after npm run build)
├── dist-electron/               # Built Electron app (after build:electron)
│
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Vite configuration
├── index.html                   # HTML entry point
├── start-browser.ps1            # PowerShell script for web mode
├── Launch GhostMoney.bat        # Windows batch file launcher
├── START HERE.bat               # Setup and launch script
└── ghostmoney.db                # SQLite database file (web mode)
```

## 🔐 Default Credentials

On first launch, the application creates a default admin account:

- **Username**: `admin`
- **Password**: `admin123`

> ⚠️ **IMPORTANT**: Change this password immediately after first login for security!

## 📖 Usage Guide

### 1. Dashboard
- View total clients, active clients, and total revenue
- Monitor today's revenue and current month earnings
- Track total outstanding balances
- View active PCs and overdue alerts
- See recent transactions at a glance

### 2. Client Management
1. **Add New Client**: Click "Add Client" and fill in name, phone, email, and notes
2. **Add Charges**: Select client → "Add Charge" → Select products → Confirm
3. **Record Payment**: Select client → "Record Payment" → Enter amount and method
4. **View History**: Click on any client to see complete transaction and payment history
5. **Edit/Delete**: Use action buttons to modify or remove clients

### 3. Point of Sale (POS)
- Quick checkout interface for walk-in customers
- Select products and add to cart
- Process payment or add to client account
- Print receipts (Electron mode)

### 4. Product Management
1. **Create Categories**: Use Category Manager to add product categories with colors
2. **Add Products**: Click "Add Product" → Fill in name, category, price, and stock
3. **Search/Filter**: Use search bar and category filter to find products
4. **Update Stock**: Edit products to adjust inventory levels

### 5. Calendar & Reservations
- View all PC/station bookings in calendar view
- Create new reservations by clicking on time slots
- Assign clients to specific PCs
- Track reservation status (pending, active, completed, cancelled)

### 6. User Management (Admin Only)
- Create worker and admin accounts
- Manage user permissions and roles
- Update passwords
- Delete users (except yourself)

### 7. Reports & Export
- Export clients, products, transactions, or payments
- Choose Excel (.xlsx) or PDF format
- View summary statistics
- Filter by date range

## 🎨 Design & Theming

### Color Scheme
- **Primary Background**: `#0a0a0a` (Deep Black)
- **Secondary Background**: `#1a1a1a` (Dark Gray)
- **Accent Color**: `#00ff41` (Terminal Green)
- **Hover/Active**: `#00cc33` (Darker Green)
- **Text**: `#ffffff` (White) and `#a0a0a0` (Light Gray)

### Design Philosophy
- **Dark Theme**: Reduces eye strain during extended use
- **Terminal Aesthetic**: Green accents inspired by classic terminal interfaces
- **Modern UI**: Clean, minimalist design with smooth transitions
- **Responsive**: Works on various screen sizes

## 🔧 Configuration

### Vite Configuration (`vite.config.js`)
```javascript
{
  base: './',              // Relative paths for Electron
  build: {
    outDir: 'dist',        // Output directory
    emptyOutDir: true
  },
  server: {
    port: 5173             // Dev server port
  }
}
```

### Electron Builder Configuration (`package.json`)
```json
{
  "build": {
    "appId": "com.ghostmoney.app",
    "productName": "GhostMoney",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "package.json"
    ]
  }
}
```

## 📍 Data Storage Locations

### Electron Mode
- **Windows**: `%APPDATA%\GhostMoney\database.db`
- **macOS**: `~/Library/Application Support/GhostMoney/database.db`
- **Linux**: `~/.config/GhostMoney/database.db`

### Web Server Mode
- **Database**: `./ghostmoney.db` (project root directory)

## 🐛 Troubleshooting

### Application Won't Start

**Electron Mode:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild native modules
npm run electron-rebuild
```

**Web Server Mode:**
```bash
# Ensure build exists
npm run build

# Check if port 3001 is available
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # macOS/Linux
```

### Database Errors

**Corrupted Database:**
1. Locate database file (see Data Storage Locations)
2. Backup the file if needed
3. Delete the database file
4. Restart the application (new database will be created)

**Permission Errors:**
- Ensure the application has write permissions to the data directory
- Run as administrator (Windows) if necessary

### Build Errors

**Vite Build Fails:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

**Electron Build Fails:**
```bash
# Clear electron-builder cache
rm -rf dist-electron
npm run build:electron
```

### Export Not Working

**Excel/PDF Export Issues:**
- Ensure ExcelJS and PDFKit are installed: `npm install exceljs pdfkit`
- Check write permissions to Documents folder
- Verify disk space is available

### Port Already in Use

**Web Server Mode:**
```bash
# Change port in server/index.js
const PORT = 3002;  // Use different port
```

**Vite Dev Server:**
```bash
# Change port in vite.config.js
server: {
  port: 5174  // Use different port
}
```

## 🔄 API Endpoints (Web Mode)

### Authentication
- `POST /api/login` - User login

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

### Clients
- `GET /api/clients` - Get all clients (with optional search)
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/:id/transactions` - Get client transactions
- `GET /api/clients/:id/payments` - Get client payments

### Products
- `GET /api/products` - Get all products (with filters)
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Transactions
- `GET /api/transactions` - Get recent transactions
- `POST /api/transactions` - Create new transaction

### Payments
- `GET /api/payments` - Get recent payments
- `POST /api/payments` - Record new payment

### PCs
- `GET /api/pcs` - Get all PCs
- `GET /api/pcs/active` - Get available PCs
- `POST /api/pcs` - Add new PC
- `PUT /api/pcs/:id` - Update PC
- `DELETE /api/pcs/:id` - Delete PC

### Reservations
- `GET /api/reservations` - Get all reservations
- `POST /api/reservations` - Create new reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Delete reservation

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/overdue` - Get unresolved alerts
- `POST /api/alerts` - Create new alert

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🚀 Deployment

### Desktop Application (Electron)

**Build for Windows:**
```bash
npm run build
npm run build:electron
```

**Build for macOS:**
```bash
npm run build
electron-builder --mac
```

**Build for Linux:**
```bash
npm run build
electron-builder --linux
```

### Web Application

**Deploy to Server:**
1. Build the React app: `npm run build`
2. Copy `dist/`, `server/`, and `package.json` to server
3. Install production dependencies: `npm install --production`
4. Start server: `node server/index.js`
5. Use PM2 or similar for process management

**Using PM2:**
```bash
npm install -g pm2
pm2 start server/index.js --name ghostmoney
pm2 save
pm2 startup
```

## 🤝 Contributing

This is a private project for gaming lounge management. For feature requests or bug reports, contact the system administrator.

## 📄 License

MIT License - See LICENSE file for details

## 👥 Support

For issues, questions, or feature requests:
- Contact your system administrator
- Check the troubleshooting section above
- Review the project documentation

## 🔮 Future Enhancements

Potential features for future versions:
- Multi-language support
- Advanced reporting with charts and graphs
- Inventory management with low-stock alerts
- Customer loyalty program
- SMS/Email notifications
- Online booking portal for clients
- Integration with payment gateways
- Time tracking for gaming sessions
- Tournament management
- Membership tiers and pricing

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Built with** ❤️ **for gaming lounges**
